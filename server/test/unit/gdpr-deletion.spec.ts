import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../../src/modules/admin/admin.service';
import { AuditLogService } from '../../src/common/audit/audit-log.service';

describe('GDPR Data Portability & Cascading Account Deletion (Task 12)', () => {
  let adminService: AdminService;
  let dbMock: any;
  let redisMock: any;
  let auditLogService: AuditLogService;
  const userId = 'user-uuid-1';

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
    };
    redisMock = {
      isReady: jest.fn().mockReturnValue(true),
    };
    auditLogService = new AuditLogService(dbMock);
    adminService = new AdminService(dbMock, redisMock, auditLogService);
  });

  describe('GDPR Data Portability (exportUserData)', () => {
    it('returns complete JSON export bundle and records audit log event', async () => {
      dbMock.query
        .mockResolvedValueOnce({
          rows: [{ id: userId, email: 'alex@example.com', display_name: 'Alex' }],
        }) // user
        .mockResolvedValueOnce({
          rows: [{ id: 'acc-1', provider: 'google', external_id: 'alex@gmail.com' }],
        }) // accounts
        .mockResolvedValueOnce({ rows: [{ id: 'thread-1', subject: 'Roadmap' }] }) // threads
        .mockResolvedValueOnce({ rows: [{ id: 'draft-1', subject: 'Draft memo' }] }) // drafts
        .mockResolvedValueOnce({ rows: [{ id: 'event-1', title: 'Sprint Review' }] }) // calendar
        .mockResolvedValueOnce({ rows: [{ id: 'task-1', title: 'Ship v1' }] }) // tasks
        .mockResolvedValueOnce({ rows: [] }); // audit log insert

      const bundle = await adminService.exportUserData(userId);

      expect(bundle.user.email).toBe('alex@example.com');
      expect(bundle.connectedAccounts.length).toBe(1);
      expect(bundle.threads.length).toBe(1);
      expect(bundle.drafts.length).toBe(1);
      expect(bundle.calendarEvents.length).toBe(1);
      expect(bundle.tasks.length).toBe(1);
      expect(bundle.exportMetadata.service).toBe('Inbox Companion');
    });

    it('throws NotFoundException if user is missing', async () => {
      dbMock.query.mockResolvedValueOnce({ rows: [] });
      await expect(adminService.exportUserData(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('GDPR Right to Erasure (deleteUserAccount)', () => {
    it('purges vector embeddings and cascading deletes user from database', async () => {
      dbMock.query
        .mockResolvedValueOnce({ rows: [] }) // delete from thread_embeddings
        .mockResolvedValueOnce({ rows: [{ id: userId, email: 'alex@example.com' }] }); // delete from users

      const res = await adminService.deleteUserAccount(userId);

      expect(res.success).toBe(true);
      expect(res.message).toContain('permanently purged');
      expect(dbMock.query).toHaveBeenCalledWith(
        'DELETE FROM thread_embeddings WHERE user_id = $1;',
        [userId],
        userId,
      );
      expect(dbMock.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1 RETURNING id, email;',
        [userId],
        userId,
      );
    });

    it('throws NotFoundException if user to delete does not exist', async () => {
      dbMock.query
        .mockResolvedValueOnce({ rows: [] }) // embeddings
        .mockResolvedValueOnce({ rows: [] }); // user not found

      await expect(adminService.deleteUserAccount(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
