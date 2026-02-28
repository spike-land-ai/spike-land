variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets for the DB subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to connect to Aurora (e.g. ECS task SGs)"
  type        = list(string)
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "16.4"
}

variable "instance_class" {
  description = "Instance class for Aurora instances"
  type        = string
  default     = "db.r6g.large"
}

variable "primary_instance_count" {
  description = "Number of instances in the primary cluster (writer + readers)"
  type        = number
  default     = 2
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "spike_admin"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

# --- Global / Secondary cluster options ---

variable "create_global_cluster" {
  description = "Whether to create a global cluster (multi-region)"
  type        = bool
  default     = true
}

variable "create_secondary_cluster" {
  description = "Whether to create a secondary cluster in another region"
  type        = bool
  default     = false
}

variable "secondary_instance_count" {
  description = "Number of instances in the secondary cluster"
  type        = number
  default     = 1
}

variable "secondary_subnet_group_name" {
  description = "DB subnet group name in the secondary region"
  type        = string
  default     = ""
}

variable "secondary_security_group_ids" {
  description = "Security group IDs in the secondary region"
  type        = list(string)
  default     = []
}

variable "secondary_kms_key_arn" {
  description = "KMS key ARN for encryption in the secondary region"
  type        = string
  default     = ""
}

variable "performance_insights_enabled" {
  description = "Whether to enable Performance Insights on Aurora instances"
  type        = bool
  default     = true
}
