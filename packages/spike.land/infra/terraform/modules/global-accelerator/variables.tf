variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "primary_nlb_arn" {
  description = "ARN of the NLB in the primary region"
  type        = string
}

variable "secondary_nlb_arn" {
  description = "ARN of the NLB in the secondary region"
  type        = string
  default     = ""
}

variable "create_secondary_endpoint" {
  description = "Whether to create the secondary region endpoint group"
  type        = bool
  default     = true
}
