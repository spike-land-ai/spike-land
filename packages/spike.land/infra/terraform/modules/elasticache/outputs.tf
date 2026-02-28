output "primary_endpoint" {
  description = "Primary endpoint of the Redis replication group"
  value       = aws_elasticache_replication_group.primary.primary_endpoint_address
}

output "reader_endpoint" {
  description = "Reader endpoint of the Redis replication group"
  value       = aws_elasticache_replication_group.primary.reader_endpoint_address
}

output "replication_group_id" {
  description = "ID of the primary replication group"
  value       = aws_elasticache_replication_group.primary.id
}

output "security_group_id" {
  description = "Security group ID for the Redis cluster"
  value       = aws_security_group.redis.id
}

output "connection_url" {
  description = "Redis connection URL (TLS enabled)"
  value       = "rediss://${aws_elasticache_replication_group.primary.primary_endpoint_address}:6379"
  sensitive   = true
}

output "global_datastore_id" {
  description = "ID of the global datastore (if created)"
  value       = var.create_global_datastore ? aws_elasticache_global_replication_group.main[0].id : null
}
