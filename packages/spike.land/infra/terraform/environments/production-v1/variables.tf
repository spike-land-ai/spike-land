variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "spike.land"
}

variable "workerd_image" {
  description = "Docker image URI for the workerd container"
  type        = string
}

variable "nextjs_image" {
  description = "Docker image URI for the Next.js container"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate in us-east-1 for ALB/NLB"
  type        = string
}

variable "cloudfront_certificate_arn" {
  description = "ARN of the ACM certificate in us-east-1 for CloudFront (must be us-east-1)"
  type        = string
}

variable "domain_aliases" {
  description = "Domain aliases for the CloudFront distribution"
  type        = list(string)
  default     = ["spike.land", "www.spike.land"]
}

variable "cron_secret" {
  description = "Secret header value for authenticating cron requests"
  type        = string
  sensitive   = true
}
