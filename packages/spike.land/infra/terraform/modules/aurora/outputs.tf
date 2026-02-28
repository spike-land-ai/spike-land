output "cluster_endpoint" {
  description = "Writer endpoint of the primary Aurora cluster"
  value       = aws_rds_cluster.primary.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint of the primary Aurora cluster"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "cluster_id" {
  description = "ID of the primary Aurora cluster"
  value       = aws_rds_cluster.primary.id
}

output "cluster_arn" {
  description = "ARN of the primary Aurora cluster"
  value       = aws_rds_cluster.primary.arn
}

output "database_name" {
  description = "Name of the database"
  value       = "spike_land"
}

output "security_group_id" {
  description = "Security group ID for the Aurora cluster"
  value       = aws_security_group.aurora.id
}

output "global_cluster_id" {
  description = "ID of the global cluster (if created)"
  value       = var.create_global_cluster ? aws_rds_global_cluster.main[0].id : null
}

output "secondary_cluster_endpoint" {
  description = "Reader endpoint of the secondary Aurora cluster (if created)"
  value       = var.create_secondary_cluster ? aws_rds_cluster.secondary[0].reader_endpoint : null
}

output "connection_url" {
  description = "PostgreSQL connection URL for the primary writer"
  value       = "postgresql://${var.master_username}:${var.master_password}@${aws_rds_cluster.primary.endpoint}:5432/spike_land"
  sensitive   = true
}
