output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "alb_dns" {
  description = "ALB DNS name (Next.js)"
  value       = module.ecs.alb_dns_name
}

output "nlb_dns" {
  description = "NLB DNS name (workerd) - connect directly in staging"
  value       = module.ecs.nlb_dns_name
}

output "aurora_endpoint" {
  description = "Aurora writer endpoint"
  value       = module.aurora.cluster_endpoint
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.elasticache.primary_endpoint
}

output "static_assets_bucket" {
  description = "S3 bucket name for static assets"
  value       = module.cloudfront.static_assets_bucket_name
}
