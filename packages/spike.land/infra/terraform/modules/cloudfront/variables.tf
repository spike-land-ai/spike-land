variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB (Next.js)"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate (must be in us-east-1 for CloudFront)"
  type        = string
}

variable "domain_aliases" {
  description = "List of domain aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}
