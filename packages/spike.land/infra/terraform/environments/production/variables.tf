variable "workerd_image" {
  description = "Docker image URI for the workerd container"
  type        = string
  default     = "382539351820.dkr.ecr.us-east-1.amazonaws.com/spike-land-workerd:latest"
}

variable "nextjs_image" {
  description = "Docker image URI for the Next.js container"
  type        = string
  default     = "382539351820.dkr.ecr.us-east-1.amazonaws.com/spike-land-nextjs:latest"
}

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora PostgreSQL"
  type        = string
  sensitive   = true
}

variable "primary_certificate_arn" {
  description = "ARN of the ACM certificate in us-east-1 for ALB/NLB"
  type        = string
}

variable "secondary_certificate_arn" {
  description = "ARN of the ACM certificate in eu-west-1 for ALB/NLB"
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
