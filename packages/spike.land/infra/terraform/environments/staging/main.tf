###############################################################################
# Staging Environment
# Single-region deployment in us-east-1 with smaller instances and no
# multi-region replication. Cost-optimized for development/testing.
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
    key            = "staging/terraform.tfstate"
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
      Environment = "staging"
      Project     = "spike-land"
      ManagedBy   = "terraform"
    }
  }
}

# --- Data Sources ---

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# --- Locals ---

locals {
  environment = "staging"
  azs         = slice(data.aws_availability_zones.available.names, 0, 3)
}

###############################################################################
# VPC
###############################################################################

module "vpc" {
  source = "../../modules/vpc"

  region      = "us-east-1"
  environment = local.environment
  vpc_cidr    = "10.10.0.0/16"
  azs         = local.azs
}

###############################################################################
# ECS
###############################################################################

module "ecs" {
  source = "../../modules/ecs"

  region             = "us-east-1"
  environment        = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  workerd_image  = var.workerd_image
  nextjs_image   = var.nextjs_image
  workerd_cpu    = 256
  workerd_memory = 512
  nextjs_cpu     = 1024
  nextjs_memory  = 2048

  redis_url       = module.elasticache.connection_url
  database_url    = module.aurora.connection_url
  certificate_arn = var.certificate_arn

  ssm_ga_measurement_id_arn = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GA_MEASUREMENT_ID"
  ssm_ga_api_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GA_API_SECRET"
}

###############################################################################
# Aurora (single-region, no global database)
###############################################################################

module "aurora" {
  source = "../../modules/aurora"

  # Provide a dummy secondary provider since the module declares it.
  # create_secondary_cluster = false ensures it is never used.
  providers = {
    aws           = aws
    aws.secondary = aws
  }

  environment        = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  allowed_security_group_ids = [
    module.ecs.workerd_security_group_id,
    module.ecs.nextjs_security_group_id,
  ]

  engine_version         = "16.4"
  instance_class         = "db.t4g.medium"
  primary_instance_count = 1
  master_username        = var.db_master_username
  master_password        = var.db_master_password

  performance_insights_enabled = false
  create_global_cluster        = false
  create_secondary_cluster     = false
}

###############################################################################
# ElastiCache Redis (single-region, no global datastore)
###############################################################################

module "elasticache" {
  source = "../../modules/elasticache"

  # Same pattern: provide dummy secondary provider
  providers = {
    aws           = aws
    aws.secondary = aws
  }

  environment        = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  allowed_security_group_ids = [
    module.ecs.workerd_security_group_id,
    module.ecs.nextjs_security_group_id,
  ]

  engine_version             = "7.1"
  node_type                  = "cache.t4g.medium"
  primary_num_cache_clusters = 2

  create_global_datastore            = false
  create_secondary_replication_group = false
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

# No Global Accelerator in staging - connect directly to the NLB
