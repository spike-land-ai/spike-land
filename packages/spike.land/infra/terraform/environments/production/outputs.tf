output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "global_accelerator_dns" {
  description = "Global Accelerator DNS name (for workerd WebSocket)"
  value       = module.global_accelerator.accelerator_dns_name
}

output "global_accelerator_ips" {
  description = "Global Accelerator anycast IP addresses"
  value       = module.global_accelerator.accelerator_ip_sets
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name (Next.js)"
  value       = module.ecs_primary.alb_dns_name
}

output "primary_nlb_dns" {
  description = "Primary NLB DNS name (workerd)"
  value       = module.ecs_primary.nlb_dns_name
}

output "secondary_alb_dns" {
  description = "Secondary ALB DNS name (Next.js)"
  value       = module.ecs_secondary.alb_dns_name
}

output "secondary_nlb_dns" {
  description = "Secondary NLB DNS name (workerd)"
  value       = module.ecs_secondary.nlb_dns_name
}

output "aurora_primary_endpoint" {
  description = "Aurora primary writer endpoint"
  value       = module.aurora.cluster_endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora primary reader endpoint"
  value       = module.aurora.cluster_reader_endpoint
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = module.elasticache.primary_endpoint
}

output "static_assets_bucket" {
  description = "S3 bucket name for static assets (upload /_next/static/* here)"
  value       = module.cloudfront.static_assets_bucket_name
}
