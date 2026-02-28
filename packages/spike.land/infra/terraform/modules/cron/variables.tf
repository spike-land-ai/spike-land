variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB to send cron requests to"
  type        = string
}

variable "cron_secret" {
  description = "Secret header value for authenticating cron requests"
  type        = string
  sensitive   = true
}

variable "vpc_id" {
  description = "ID of the VPC for the Lambda function (optional)"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "Subnet IDs for the Lambda function (optional, private subnets)"
  type        = list(string)
  default     = []
}

variable "security_group_id" {
  description = "Security group ID for the Lambda function (optional)"
  type        = string
  default     = null
}

variable "cron_jobs" {
  description = "List of cron jobs to schedule"
  type = list(object({
    name     = string
    path     = string
    schedule = string
  }))
}
