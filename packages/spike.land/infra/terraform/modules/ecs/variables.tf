variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets for load balancers"
  type        = list(string)
}

variable "workerd_image" {
  description = "Docker image URI for the workerd container"
  type        = string
}

variable "nextjs_image" {
  description = "Docker image URI for the Next.js container"
  type        = string
}

variable "workerd_cpu" {
  description = "CPU units for workerd task (1 vCPU = 1024)"
  type        = number
  default     = 256
}

variable "workerd_memory" {
  description = "Memory (MiB) for workerd task"
  type        = number
  default     = 512
}

variable "nextjs_cpu" {
  description = "CPU units for Next.js task (1 vCPU = 1024)"
  type        = number
  default     = 1024
}

variable "nextjs_memory" {
  description = "Memory (MiB) for Next.js task"
  type        = number
  default     = 2048
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "PostgreSQL connection URL"
  type        = string
  sensitive   = true
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for TLS termination"
  type        = string
}

# --- Optional env vars / secrets (SSM ARNs) ---

variable "app_env" {
  description = "Application environment label (e.g. production, staging)"
  type        = string
  default     = ""
}

variable "app_url" {
  description = "Public URL of the application (e.g. https://spike.land)"
  type        = string
  default     = ""
}

variable "cron_secret" {
  description = "Secret header value for authenticating cron requests"
  type        = string
  default     = ""
  sensitive   = true
}

variable "dynamodb_table" {
  description = "DynamoDB table name for workerd"
  type        = string
  default     = ""
}

variable "s3_bucket" {
  description = "S3 bucket name for workerd"
  type        = string
  default     = ""
}

variable "ssm_openai_api_key_arn" {
  description = "ARN of SSM parameter for OPENAI_API_KEY"
  type        = string
  default     = ""
}

variable "ssm_claude_code_oauth_token_arn" {
  description = "ARN of SSM parameter for CLAUDE_CODE_OAUTH_TOKEN"
  type        = string
  default     = ""
}

variable "ssm_jwt_secret_arn" {
  description = "ARN of SSM parameter for JWT_SECRET"
  type        = string
  default     = ""
}

variable "ssm_auth_secret_arn" {
  description = "ARN of SSM parameter for AUTH_SECRET"
  type        = string
  default     = ""
}

variable "ssm_github_id_arn" {
  description = "ARN of SSM parameter for GITHUB_ID"
  type        = string
  default     = ""
}

variable "ssm_github_secret_arn" {
  description = "ARN of SSM parameter for GITHUB_SECRET"
  type        = string
  default     = ""
}

variable "ssm_google_id_arn" {
  description = "ARN of SSM parameter for GOOGLE_ID"
  type        = string
  default     = ""
}

variable "ssm_google_secret_arn" {
  description = "ARN of SSM parameter for GOOGLE_SECRET"
  type        = string
  default     = ""
}

variable "ssm_apple_id_arn" {
  description = "ARN of SSM parameter for AUTH_APPLE_ID"
  type        = string
  default     = ""
}

variable "ssm_apple_secret_arn" {
  description = "ARN of SSM parameter for AUTH_APPLE_SECRET"
  type        = string
  default     = ""
}

variable "ssm_facebook_id_arn" {
  description = "ARN of SSM parameter for AUTH_FACEBOOK_ID"
  type        = string
  default     = ""
}

variable "ssm_facebook_secret_arn" {
  description = "ARN of SSM parameter for AUTH_FACEBOOK_SECRET"
  type        = string
  default     = ""
}

variable "ssm_resend_api_key_arn" {
  description = "ARN of SSM parameter for RESEND_API_KEY"
  type        = string
  default     = ""
}

variable "registration_open" {
  description = "Whether new user registration is open (true/false)"
  type        = string
  default     = "true"
}

variable "ssm_sentry_dsn_arn" {
  description = "Deprecated: Sentry has been removed. Kept for backward compatibility."
  type        = string
  default     = ""
}

variable "ssm_ga_measurement_id_arn" {
  description = "ARN of SSM parameter for GA_MEASUREMENT_ID"
  type        = string
  default     = ""
}

variable "ssm_ga_api_secret_arn" {
  description = "ARN of SSM parameter for GA_API_SECRET"
  type        = string
  default     = ""
}

# --- Scaling / Count variables ---

variable "workerd_desired_count" {
  description = "Desired number of workerd tasks"
  type        = number
  default     = 2
}

variable "nextjs_desired_count" {
  description = "Desired number of Next.js tasks"
  type        = number
  default     = 2
}

variable "workerd_min_capacity" {
  description = "Minimum number of workerd tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "nextjs_min_capacity" {
  description = "Minimum number of Next.js tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "fargate_base" {
  description = "Base count for FARGATE capacity provider strategy (cluster default)"
  type        = number
  default     = 2
}

variable "nextjs_fargate_base" {
  description = "Base count for FARGATE capacity provider in Next.js service (no SPOT)"
  type        = number
  default     = 2
}

variable "workerd_fargate_base" {
  description = "Base count for FARGATE capacity provider in workerd service"
  type        = number
  default     = 2
}

variable "ssm_region" {
  description = "Region where SSM parameters are stored (for cross-region access)"
  type        = string
  default     = ""
}

variable "sns_alarm_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarm notifications (optional)"
  type        = string
  default     = ""
}
