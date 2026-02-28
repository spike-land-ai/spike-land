###############################################################################
# Global Environment
# Cross-environment shared infrastructure:
#   - ECR repositories for all services
#   - GitHub Actions OIDC deploy role
#
# Apply once; used by all environments (staging, production, etc.)
#
# Usage:
#   cd infra/terraform/environments/global
#   terraform init
#   terraform apply
###############################################################################

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {
    bucket         = "spike-land-terraform-state"
    key            = "global/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "global"
      Project     = "spike-land"
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = "us-east-1"

  ecr_repos = [
    "spike-land-nextjs",
    "spike-land-workerd",
    "spike-land-hono-api",
  ]
}

###############################################################################
# ECR Repositories
###############################################################################

resource "aws_ecr_repository" "services" {
  for_each = toset(local.ecr_repos)

  name                 = each.key
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

###############################################################################
# GitHub Actions OIDC Deploy Role
###############################################################################

module "github_oidc" {
  source = "../../modules/github-oidc"

  github_repo  = "spike-land-ai/spike.land"
  allowed_refs = ["main"]
  role_name    = "github-actions-deploy-role"

  ecr_repository_arns = [
    for repo in aws_ecr_repository.services : repo.arn
  ]

  tags = {
    Environment = "global"
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

###############################################################################
# Outputs
###############################################################################

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "deploy_role_arn" {
  description = "ARN of the GitHub Actions deploy role"
  value       = module.github_oidc.role_arn
}
