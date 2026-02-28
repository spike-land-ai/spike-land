variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets for the ElastiCache subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to connect to Redis (e.g. ECS task SGs)"
  type        = list(string)
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "primary_num_cache_clusters" {
  description = "Number of cache clusters in the primary replication group"
  type        = number
  default     = 2
}

# --- Global Datastore / Secondary options ---

variable "create_global_datastore" {
  description = "Whether to create a global datastore (multi-region)"
  type        = bool
  default     = true
}

variable "create_secondary_replication_group" {
  description = "Whether to create a secondary replication group in another region"
  type        = bool
  default     = false
}

variable "secondary_num_cache_clusters" {
  description = "Number of cache clusters in the secondary replication group"
  type        = number
  default     = 1
}

variable "secondary_subnet_group_name" {
  description = "Subnet group name in the secondary region"
  type        = string
  default     = ""
}

variable "secondary_security_group_ids" {
  description = "Security group IDs in the secondary region"
  type        = list(string)
  default     = []
}
