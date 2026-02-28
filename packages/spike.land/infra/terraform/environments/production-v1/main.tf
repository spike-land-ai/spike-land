###############################################################################
# Production V1 Environment
# Single-region deployment in us-east-1 with minimal sizing.
# Uses external Neon (Postgres) and Upstash (Redis) — no Aurora/ElastiCache.
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
    key            = "production-v1/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

# --- Provider ---

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "spike-land"
      ManagedBy   = "terraform"
    }
  }
}

# --- Data Sources ---

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# --- SSM Parameter Store references for secrets ---

data "aws_ssm_parameter" "openai_api_key" {
  name = "/${var.environment}/spike-land/OPENAI_API_KEY"
}

data "aws_ssm_parameter" "claude_code_oauth_token" {
  name = "/${var.environment}/spike-land/CLAUDE_CODE_OAUTH_TOKEN"
}

data "aws_ssm_parameter" "jwt_secret" {
  name = "/${var.environment}/spike-land/JWT_SECRET"
}

data "aws_ssm_parameter" "auth_secret" {
  name = "/${var.environment}/spike-land/AUTH_SECRET"
}

# External service URLs (Neon Postgres, Upstash Redis)
data "aws_ssm_parameter" "database_url" {
  name = "/${var.environment}/spike-land/DATABASE_URL"
}

data "aws_ssm_parameter" "redis_url" {
  name = "/${var.environment}/spike-land/REDIS_URL"
}

# --- Locals ---

locals {
  environment = var.environment
  region      = data.aws_region.current.name
  account_id  = data.aws_caller_identity.current.account_id
  azs         = slice(data.aws_availability_zones.available.names, 0, 3)
}

###############################################################################
# ECR Repositories — managed outside Terraform (already exist)
# spike-land-workerd and spike-land-nextjs repos created manually.
###############################################################################

###############################################################################
# VPC — 1 NAT gateway, no interface endpoints (saves ~$87/mo)
###############################################################################

module "vpc" {
  source = "../../modules/vpc"

  region      = local.region
  environment = local.environment
  vpc_cidr    = "10.20.0.0/16"
  azs         = local.azs

  nat_gateway_count          = 1
  enable_interface_endpoints = false
}

###############################################################################
# ECS — minimal sizing (1 task each, SPOT-heavy)
###############################################################################

module "ecs" {
  source = "../../modules/ecs"

  region             = local.region
  environment        = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  workerd_image  = var.workerd_image
  nextjs_image   = var.nextjs_image
  workerd_cpu    = 256
  workerd_memory = 512
  nextjs_cpu     = 512
  nextjs_memory  = 1024

  # External services (Neon + Upstash)
  database_url    = data.aws_ssm_parameter.database_url.value
  redis_url       = data.aws_ssm_parameter.redis_url.value
  certificate_arn = var.certificate_arn

  # Scaling — minimal for cost savings
  workerd_desired_count = 1
  nextjs_desired_count  = 1
  workerd_min_capacity  = 1
  nextjs_min_capacity   = 1
  fargate_base          = 0

  # Application env vars
  app_env     = local.environment
  app_url     = "https://${var.domain_name}"
  cron_secret = var.cron_secret

  # SSM secrets for ECS task definitions
  ssm_openai_api_key_arn          = data.aws_ssm_parameter.openai_api_key.arn
  ssm_claude_code_oauth_token_arn = data.aws_ssm_parameter.claude_code_oauth_token.arn
  ssm_jwt_secret_arn              = data.aws_ssm_parameter.jwt_secret.arn
  ssm_auth_secret_arn             = data.aws_ssm_parameter.auth_secret.arn
  ssm_sentry_dsn_arn              = ""  # Sentry removed — passing empty string

  # New GA Secrets
  ssm_ga_measurement_id_arn = "arn:aws:ssm:${local.region}:${local.account_id}:parameter/${local.environment}/spike-land/GA_MEASUREMENT_ID"
  ssm_ga_api_secret_arn     = "arn:aws:ssm:${local.region}:${local.account_id}:parameter/${local.environment}/spike-land/GA_API_SECRET"
}

###############################################################################
# CloudFront
###############################################################################

module "cloudfront" {
  source = "../../modules/cloudfront"

  environment     = local.environment
  alb_dns_name    = module.ecs.alb_dns_name
  certificate_arn = var.cloudfront_certificate_arn
  domain_aliases  = var.domain_aliases
}

###############################################################################
# Cron (EventBridge + Lambda) — no VPC needed (calls public ALB)
###############################################################################

module "cron" {
  source = "../../modules/cron"

  environment  = local.environment
  alb_dns_name = module.ecs.alb_dns_name
  cron_secret  = var.cron_secret

  cron_jobs = [
    {
      name     = "publish-scheduled-posts"
      path     = "/api/cron/publish-scheduled-posts"
      schedule = "rate(1 minute)"
    },
    {
      name     = "pulse-metrics"
      path     = "/api/cron/pulse-metrics"
      schedule = "rate(15 minutes)"
    },
    {
      name     = "cleanup-jobs"
      path     = "/api/cron/cleanup-jobs"
      schedule = "rate(15 minutes)"
    },
    {
      name     = "marketing-sync"
      path     = "/api/cron/marketing-sync"
      schedule = "rate(1 hour)"
    },
    {
      name     = "allocator-autopilot"
      path     = "/api/cron/allocator-autopilot"
      schedule = "rate(15 minutes)"
    },
    {
      name     = "create-agent-alert"
      path     = "/api/cron/create-agent-alert"
      schedule = "rate(1 hour)"
    },
    {
      name     = "cleanup-tracking"
      path     = "/api/cron/cleanup-tracking"
      schedule = "cron(0 3 * * ? *)"
    },
    {
      name     = "cleanup-errors"
      path     = "/api/cron/cleanup-errors"
      schedule = "cron(0 4 * * ? *)"
    },
    {
      name     = "cleanup-bin"
      path     = "/api/cron/cleanup-bin"
      schedule = "cron(0 2 * * ? *)"
    },
    {
      name     = "cleanup-sandboxes"
      path     = "/api/cron/cleanup-sandboxes"
      schedule = "rate(15 minutes)"
    },
    {
      name     = "reset-workspace-credits"
      path     = "/api/cron/reset-workspace-credits"
      schedule = "cron(0 0 * * ? *)"
    },
  ]
}

# No Global Accelerator in production-v1 (single region)
