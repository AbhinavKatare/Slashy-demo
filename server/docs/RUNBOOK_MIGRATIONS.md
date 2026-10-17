# Staged Database Migration Runbook: Inbox Companion

This runbook describes the zero-downtime, staged migration process for PostgreSQL schema changes in production.

---

## 1. Principles for Zero-Downtime Migrations
1. **Expand and Contract**: Never delete or rename columns in the same release where code stops using them.
2. **Concurrent Indexing**: In production, create indexes using `CREATE INDEX CONCURRENTLY` to avoid table locks.
3. **Additive Schema Changes First**: Run database migrations before rolling out new application container revisions.
4. **Point-in-Time Recovery (PITR)**: Verify an active RDS snapshot or continuous WAL archive exists prior to applying DDL.

---

## 2. Staged Migration Procedure

### Phase 1: Pre-Migration Health Verification
```bash
# Verify database replica lag and active connection count
SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# Ensure backup snapshot is current
aws rds describe-db-snapshots \
  --db-instance-identifier inbox-companion-postgres-prod \
  --query 'reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[0].SnapshotCreateTime'
```

### Phase 2: Apply Additive DDL
Execute migrations via the migration runner:
```bash
# In CI/CD deployment pipeline:
node dist/database/migrate.js
```

### Phase 3: Rolling Application Deployment
Deploy new container images to ECS Fargate:
```bash
aws ecs update-service \
  --cluster inbox-companion-cluster-prod \
  --service inbox-companion-api \
  --force-new-deployment
```

### Phase 4: Verification & Smoke Test
```bash
# Check health probe
curl -f https://api.inboxcompanion.app/v1/health

# Check readiness probe
curl -f https://api.inboxcompanion.app/v1/ready
```

---

## 3. Rollback Procedure
If errors are encountered during deployment:
1. Revert ECS service task definition to previous active revision:
   ```bash
   aws ecs update-service \
     --cluster inbox-companion-cluster-prod \
     --service inbox-companion-api \
     --task-definition inbox-companion-api:PREVIOUS_REVISION
   ```
2. Because schema changes are strictly additive, the older application version remains 100% compatible with the expanded database schema.
3. If structural rollback is required, apply the corresponding down-migration script or restore from PITR timestamp.
