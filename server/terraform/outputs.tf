output "postgres_endpoint" {
  description = "Connection endpoint for managed RDS PostgreSQL"
  value       = aws_db_instance.postgres.address
}

output "redis_endpoint" {
  description = "Connection endpoint for managed ElastiCache Redis"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "kms_key_arn" {
  description = "KMS master Key Encryption Key ARN"
  value       = aws_kms_key.inbox_companion_kek.arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.cluster.name
}
