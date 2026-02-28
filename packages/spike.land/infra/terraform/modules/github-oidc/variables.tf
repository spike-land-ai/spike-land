variable "github_repo" {
  description = "GitHub repository in owner/repo format"
  type        = string
  default     = "spike-land-ai/spike-land-nextjs"
}

variable "allowed_refs" {
  description = "Git refs allowed to assume the deploy role"
  type        = list(string)
  default     = ["main"]
}

variable "role_name" {
  description = "Name for the IAM deploy role"
  type        = string
  default     = "github-actions-deploy"
}

variable "ecr_repository_arns" {
  description = "ARNs of ECR repositories the role can push to"
  type        = list(string)
}

variable "ecs_task_role_arns" {
  description = "ARNs of IAM roles that ECS tasks use (needed for iam:PassRole)"
  type        = list(string)
  default     = ["*"]
}

variable "s3_static_asset_bucket_names" {
  description = "S3 bucket names for static asset sync during deploy"
  type        = list(string)
  default = [
    "production-spike-land-static-assets",
    "staging-spike-land-static-assets",
  ]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
