import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MailProviderFactory } from './adapters/mail-provider.factory';
import {
  BulkModifyThreadsDto,
  ModifyThreadActionDto,
  WriteActionType,
} from './dto/outbox-write.dto';
import { v7 as uuidv7 } from 'uuid';

export interface OperationResult {
  operationId: string;
  idempotencyKey: string;
  targetId: string;
  action: WriteActionType;
  status: 'confirmed' | 'failed' | 'pending';
  inverseAction: string;
  eTag?: string;
  errorMessage?: string;
  confirmedAt?: string;
}

@Injectable()
export class OutboxWriteService {
  private readonly logger = new Logger(OutboxWriteService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly providerFactory: MailProviderFactory,
  ) {}

  /**
   * Compute inverse action for undo support
   */
  getInverseAction(action: WriteActionType): string {
    switch (action) {
      case WriteActionType.MARK_READ:
        return WriteActionType.MARK_UNREAD;
      case WriteActionType.MARK_UNREAD:
        return WriteActionType.MARK_READ;
      case WriteActionType.STAR:
        return WriteActionType.UNSTAR;
      case WriteActionType.UNSTAR:
        return WriteActionType.STAR;
      case WriteActionType.ARCHIVE:
        return 'unarchive'; // move back to inbox
      case WriteActionType.TRASH:
        return 'untrash'; // restore from trash
      case WriteActionType.APPLY_LABEL:
        return WriteActionType.REMOVE_LABEL;
      case WriteActionType.REMOVE_LABEL:
        return WriteActionType.APPLY_LABEL;
      default:
        return 'noop';
    }
  }

  /**
   * Execute thread mutation idempotently with provider confirmation and ETag validation
   */
  async executeWrite(
    userId: string,
    threadId: string,
    idempotencyKey: string,
    dto: ModifyThreadActionDto,
  ): Promise<OperationResult> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is strictly required');
    }

    // 1. Check if this idempotency key was already executed (Idempotent deduplication)
    const existingOp = await this.db.query(
      `SELECT id, idempotency_key, action_type, target_id, status, error_message, payload, created_at, updated_at
       FROM outbox_operations
       WHERE user_id = $1 AND idempotency_key = $2;`,
      [userId, idempotencyKey],
      userId,
    );

    if (existingOp.rows.length > 0) {
      const op = existingOp.rows[0];
      this.logger.debug(`Idempotent write deduplicated: ${idempotencyKey}`);
      return {
        operationId: op.id,
        idempotencyKey: op.idempotency_key,
        targetId: op.target_id,
        action: op.action_type as WriteActionType,
        status: op.status,
        inverseAction:
          op.payload?.inverseAction || this.getInverseAction(op.action_type as WriteActionType),
        errorMessage: op.error_message || undefined,
        confirmedAt: op.status === 'confirmed' ? op.updated_at.toISOString() : undefined,
      };
    }

    // 2. Fetch thread from DB & check optimistic concurrency (ETag)
    const threadRes = await this.db.query(
      `SELECT id, account_id, external_thread_id, is_unread, is_starred, folder, updated_at
       FROM threads
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;`,
      [threadId, userId],
      userId,
    );

    if (!threadRes.rows[0]) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    const thread = threadRes.rows[0];
    const currentETag = thread.updated_at.toISOString();

    if (dto.eTag && dto.eTag !== currentETag) {
      throw new PreconditionFailedException(
        `Optimistic concurrency conflict: thread has changed since version ${dto.eTag} (current: ${currentETag})`,
      );
    }

    const opId = uuidv7();
    const inverseAction = this.getInverseAction(dto.action);

    // 3. Insert pending outbox operation
    await this.db.query(
      `INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending');`,
      [
        opId,
        userId,
        thread.account_id,
        idempotencyKey,
        dto.action,
        threadId,
        JSON.stringify({ inverseAction, labelName: dto.labelName }),
      ],
      userId,
    );

    // 4. Dispatch call to provider
    const provider = await this.providerFactory.getProviderForAccount(userId, thread.account_id);
    const externalId = thread.external_thread_id || thread.id;

    let success = true;
    let errorMessage: string | null = null;

    try {
      switch (dto.action) {
        case WriteActionType.MARK_READ:
          await provider.modifyLabels(externalId, { isRead: true });
          break;
        case WriteActionType.MARK_UNREAD:
          await provider.modifyLabels(externalId, { isRead: false });
          break;
        case WriteActionType.STAR:
          await provider.modifyLabels(externalId, { isStarred: true });
          break;
        case WriteActionType.UNSTAR:
          await provider.modifyLabels(externalId, { isStarred: false });
          break;
        case WriteActionType.ARCHIVE:
          await provider.archive(externalId);
          break;
        case WriteActionType.TRASH:
          await provider.trash(externalId);
          break;
        case WriteActionType.APPLY_LABEL:
          await provider.modifyLabels(externalId, { addLabels: [dto.labelName || ''] });
          break;
        case WriteActionType.REMOVE_LABEL:
          await provider.modifyLabels(externalId, { removeLabels: [dto.labelName || ''] });
          break;
        default:
          throw new Error(`Unsupported action ${dto.action}`);
      }
    } catch (err: any) {
      success = false;
      errorMessage = err.message || 'Provider execution failed';
      this.logger.error(`Provider write failed for thread ${threadId}: ${errorMessage}`);
    }

    // 5. Update DB state ONLY after provider confirms!
    let newETag = currentETag;
    if (success) {
      const updateSets: string[] = ['updated_at = clock_timestamp()'];
      if (dto.action === WriteActionType.MARK_READ) updateSets.push('is_unread = false');
      if (dto.action === WriteActionType.MARK_UNREAD) updateSets.push('is_unread = true');
      if (dto.action === WriteActionType.STAR) updateSets.push('is_starred = true');
      if (dto.action === WriteActionType.UNSTAR) updateSets.push('is_starred = false');
      if (dto.action === WriteActionType.ARCHIVE) updateSets.push("folder = 'archive'");
      if (dto.action === WriteActionType.TRASH) updateSets.push("folder = 'trash'");

      const updateRes = await this.db.query(
        `UPDATE threads SET ${updateSets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING updated_at;`,
        [threadId, userId],
        userId,
      );
      newETag = updateRes.rows[0]?.updated_at?.toISOString() || currentETag;

      // Update outbox operation to confirmed
      await this.db.query(
        `UPDATE outbox_operations SET status = 'confirmed', updated_at = clock_timestamp() WHERE id = $1;`,
        [opId],
        userId,
      );
    } else {
      // Mark outbox operation as failed with error details
      await this.db.query(
        `UPDATE outbox_operations SET status = 'failed', error_message = $2, updated_at = clock_timestamp() WHERE id = $1;`,
        [opId, errorMessage],
        userId,
      );
    }

    return {
      operationId: opId,
      idempotencyKey,
      targetId: threadId,
      action: dto.action,
      status: success ? 'confirmed' : 'failed',
      inverseAction,
      eTag: newETag,
      errorMessage: errorMessage || undefined,
      confirmedAt: success ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Bulk action execution with partial failure handling
   */
  async executeBulkWrite(userId: string, idempotencyKey: string, dto: BulkModifyThreadsDto) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required for bulk actions');
    }

    const itemResults: Array<{ threadId: string; status: 'confirmed' | 'failed'; error?: string }> =
      [];

    for (const [index, tid] of dto.threadIds.entries()) {
      const subKey = `${idempotencyKey}_item_${index}`;
      try {
        const res = await this.executeWrite(userId, tid, subKey, {
          action: dto.action,
          labelName: dto.labelName,
        });
        itemResults.push({
          threadId: tid,
          status: res.status as 'confirmed' | 'failed',
          error: res.errorMessage,
        });
      } catch (err: any) {
        itemResults.push({
          threadId: tid,
          status: 'failed',
          error: err.message,
        });
      }
    }

    const succeeded = itemResults.filter((r) => r.status === 'confirmed').length;
    const failed = itemResults.filter((r) => r.status === 'failed').length;

    return {
      idempotencyKey,
      action: dto.action,
      totalCount: dto.threadIds.length,
      succeededCount: succeeded,
      failedCount: failed,
      items: itemResults,
    };
  }

  /**
   * Poll status of an asynchronous outbox operation
   */
  async getOperationStatus(userId: string, operationId: string) {
    const res = await this.db.query(
      `SELECT id, idempotency_key, action_type, target_id, status, error_message, payload, created_at, updated_at
       FROM outbox_operations
       WHERE id = $1 AND user_id = $2;`,
      [operationId, userId],
      userId,
    );

    if (!res.rows[0]) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    const row = res.rows[0];
    return {
      operationId: row.id,
      idempotencyKey: row.idempotency_key,
      targetId: row.target_id,
      action: row.action_type,
      status: row.status,
      errorMessage: row.error_message || undefined,
      inverseAction: row.payload?.inverseAction,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  /**
   * Undo an operation by executing its inverse action
   */
  async undoOperation(userId: string, operationId: string) {
    const op = await this.getOperationStatus(userId, operationId);

    if (op.status !== 'confirmed') {
      throw new BadRequestException('Cannot undo an operation that was not confirmed');
    }

    const undoKey = `undo_${op.operationId}_${Date.now()}`;
    const inverseAction = op.inverseAction as WriteActionType;

    // Execute inverse mutation
    const undoRes = await this.executeWrite(userId, op.targetId, undoKey, {
      action: inverseAction,
    });

    return {
      undoneOperationId: operationId,
      inverseResult: undoRes,
      message: 'Operation successfully undone',
    };
  }
}
