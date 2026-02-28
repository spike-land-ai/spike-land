variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "List of availability zones to use"
  type        = list(string)
}

variable "nat_gateway_count" {
  description = "Number of NAT gateways to create (defaults to one per AZ)"
  type        = number
  default     = 0 # 0 means use length(var.azs) for backwards compat
}

variable "enable_interface_endpoints" {
  description = "Whether to create VPC interface endpoints (ECR, CloudWatch Logs)"
  type        = bool
  default     = true
}
