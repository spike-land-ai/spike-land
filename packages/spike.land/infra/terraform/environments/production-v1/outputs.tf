output "alb_dns" {
  description = "ALB DNS name (Next.js)"
  value       = module.ecs.alb_dns_name
}

output "nlb_dns" {
  description = "NLB DNS name (workerd)"
  value       = module.ecs.nlb_dns_name
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "static_assets_bucket" {
  description = "S3 bucket name for static assets"
  value       = module.cloudfront.static_assets_bucket_name
}

output "ecr_workerd_repo_url" {
  description = "ECR repository URL for workerd"
  value       = "382539351820.dkr.ecr.us-east-1.amazonaws.com/spike-land-workerd"
}

output "ecr_nextjs_repo_url" {
  description = "ECR repository URL for Next.js"
  value       = "382539351820.dkr.ecr.us-east-1.amazonaws.com/spike-land-nextjs"
}

output "cron_lambda_arn" {
  description = "ARN of the cron Lambda function"
  value       = module.cron.lambda_function_arn
}
