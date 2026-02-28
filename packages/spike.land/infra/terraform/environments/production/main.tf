###############################################################################
# Production Environment
# Multi-region deployment: us-east-1 (primary/writer) + eu-west-1 (secondary/reader)
# Full HA setup with Global Accelerator, Aurora Global Database, and
# ElastiCache Global Datastore.
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
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

# --- Providers ---

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

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "spike-land"
      ManagedBy   = "terraform"
    }
  }
}

# --- Data Sources ---

data "aws_availability_zones" "us_east_1" {
  state = "available"
}

data "aws_availability_zones" "eu_west_1" {
  provider = aws.eu_west_1
  state    = "available"
}

data "aws_caller_identity" "current" {}

# --- Locals ---

locals {
  environment = "production"

  us_east_1_azs = slice(data.aws_availability_zones.us_east_1.names, 0, 3)
  eu_west_1_azs = slice(data.aws_availability_zones.eu_west_1.names, 0, 3)
}

###############################################################################
# Primary Region (us-east-1)
###############################################################################

# --- VPC ---

module "vpc_primary" {
  source = "../../modules/vpc"

  region      = "us-east-1"
  environment = local.environment
  vpc_cidr    = "10.0.0.0/16"
  azs         = local.us_east_1_azs
}

# --- ECS ---

module "ecs_primary" {
  source = "../../modules/ecs"

  region             = "us-east-1"
  environment        = local.environment
  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids
  public_subnet_ids  = module.vpc_primary.public_subnet_ids

  workerd_image  = var.workerd_image
  nextjs_image   = var.nextjs_image
  workerd_cpu    = 256
  workerd_memory = 512
  nextjs_cpu     = 1024
  nextjs_memory  = 2048

  redis_url       = module.elasticache.connection_url
  database_url    = module.aurora.connection_url
  certificate_arn = var.primary_certificate_arn

  ssm_auth_secret_arn       = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_SECRET"
  ssm_github_id_arn         = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GITHUB_ID"
  ssm_github_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GITHUB_SECRET"
  ssm_google_id_arn         = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GOOGLE_ID"
  ssm_google_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GOOGLE_SECRET"
  ssm_apple_id_arn          = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_APPLE_ID"
  ssm_apple_secret_arn      = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_APPLE_SECRET"
  ssm_facebook_id_arn       = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_FACEBOOK_ID"
  ssm_facebook_secret_arn   = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_FACEBOOK_SECRET"
  ssm_resend_api_key_arn    = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/RESEND_API_KEY"
  ssm_ga_measurement_id_arn = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GA_MEASUREMENT_ID"
  ssm_ga_api_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GA_API_SECRET"
  registration_open         = "true"
}

# --- Aurora Global Database ---

module "aurora" {
  source = "../../modules/aurora"

  providers = {
    aws           = aws
    aws.secondary = aws.eu_west_1
  }

  environment        = local.environment
  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids

  allowed_security_group_ids = [
    module.ecs_primary.workerd_security_group_id,
    module.ecs_primary.nextjs_security_group_id,
  ]

  engine_version         = "16.4"
  instance_class         = "db.r6g.large"
  primary_instance_count = 2
  master_username        = var.db_master_username
  master_password        = var.db_master_password

  create_global_cluster    = true
  create_secondary_cluster = true
  secondary_instance_count = 1

  # Secondary region resources (created separately below for the DB subnet group)
  secondary_subnet_group_name  = aws_db_subnet_group.aurora_secondary.name
  secondary_security_group_ids = [aws_security_group.aurora_secondary.id]
  secondary_kms_key_arn        = aws_kms_key.aurora_secondary.arn
}

# --- ElastiCache Redis Global Datastore ---

module "elasticache" {
  source = "../../modules/elasticache"

  providers = {
    aws           = aws
    aws.secondary = aws.eu_west_1
  }

  environment        = local.environment
  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids

  allowed_security_group_ids = [
    module.ecs_primary.workerd_security_group_id,
    module.ecs_primary.nextjs_security_group_id,
  ]

  engine_version             = "7.1"
  node_type                  = "cache.r6g.large"
  primary_num_cache_clusters = 2

  create_global_datastore            = true
  create_secondary_replication_group = true
  secondary_num_cache_clusters       = 1
  secondary_subnet_group_name        = aws_elasticache_subnet_group.secondary.name
  secondary_security_group_ids       = [aws_security_group.redis_secondary.id]
}

# --- CloudFront ---

module "cloudfront" {
  source = "../../modules/cloudfront"

  environment     = local.environment
  alb_dns_name    = module.ecs_primary.alb_dns_name
  certificate_arn = var.cloudfront_certificate_arn
  domain_aliases  = var.domain_aliases
}

# --- Global Accelerator ---

module "global_accelerator" {
  source = "../../modules/global-accelerator"

  environment     = local.environment
  primary_region  = "us-east-1"
  primary_nlb_arn = module.ecs_primary.nlb_arn

  secondary_region          = "eu-west-1"
  secondary_nlb_arn         = module.ecs_secondary.nlb_arn
  create_secondary_endpoint = true
}

###############################################################################
# Secondary Region (eu-west-1)
###############################################################################

# --- VPC ---

module "vpc_secondary" {
  source = "../../modules/vpc"

  providers = {
    aws = aws.eu_west_1
  }

  region      = "eu-west-1"
  environment = local.environment
  vpc_cidr    = "10.1.0.0/16"
  azs         = local.eu_west_1_azs
}

# --- ECS ---

module "ecs_secondary" {
  source = "../../modules/ecs"

  providers = {
    aws = aws.eu_west_1
  }

  region             = "eu-west-1"
  environment        = local.environment
  vpc_id             = module.vpc_secondary.vpc_id
  private_subnet_ids = module.vpc_secondary.private_subnet_ids
  public_subnet_ids  = module.vpc_secondary.public_subnet_ids

  workerd_image  = var.workerd_image
  nextjs_image   = var.nextjs_image
  workerd_cpu    = 256
  workerd_memory = 512
  nextjs_cpu     = 1024
  nextjs_memory  = 2048

  # Secondary reads from Aurora reader and local Redis
  redis_url       = module.elasticache.connection_url
  database_url    = module.aurora.connection_url
  certificate_arn = var.secondary_certificate_arn

  # SSM ARNs are read from the primary region (us-east-1)
  ssm_auth_secret_arn       = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_SECRET"
  ssm_github_id_arn         = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GITHUB_ID"
  ssm_github_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GITHUB_SECRET"
  ssm_google_id_arn         = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GOOGLE_ID"
  ssm_google_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GOOGLE_SECRET"
  ssm_apple_id_arn          = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_APPLE_ID"
  ssm_apple_secret_arn      = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_APPLE_SECRET"
  ssm_facebook_id_arn       = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_FACEBOOK_ID"
  ssm_facebook_secret_arn   = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/AUTH_FACEBOOK_SECRET"
  ssm_resend_api_key_arn    = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/RESEND_API_KEY"
  ssm_ga_measurement_id_arn = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GA_MEASUREMENT_ID"
  ssm_ga_api_secret_arn     = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${local.environment}/spike-land/GA_API_SECRET"
  registration_open         = "true"

  # Allow eu-west-1 tasks to read SSM parameters stored in us-east-1
  ssm_region = "us-east-1"
}

###############################################################################
# Secondary Region Support Resources
# These are created directly because they need the secondary provider and are
# passed into modules as variables.
###############################################################################

# --- Aurora secondary resources ---

resource "aws_db_subnet_group" "aurora_secondary" {
  provider = aws.eu_west_1

  name       = "${local.environment}-spike-land-aurora-secondary"
  subnet_ids = module.vpc_secondary.private_subnet_ids

  tags = {
    Name        = "${local.environment}-aurora-secondary-subnet-group"
    Environment = local.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "aurora_secondary" {
  provider = aws.eu_west_1

  name_prefix = "${local.environment}-aurora-secondary-"
  vpc_id      = module.vpc_secondary.vpc_id

  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"
    security_groups = [
      module.ecs_secondary.workerd_security_group_id,
      module.ecs_secondary.nextjs_security_group_id,
    ]
    description = "PostgreSQL access from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.environment}-aurora-secondary-sg"
    Environment = local.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_key" "aurora_secondary" {
  provider = aws.eu_west_1

  description             = "KMS key for Aurora encryption (secondary) - ${local.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${local.environment}-aurora-secondary-kms"
    Environment = local.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- ElastiCache secondary resources ---

resource "aws_elasticache_subnet_group" "secondary" {
  provider = aws.eu_west_1

  name       = "${local.environment}-spike-land-redis-secondary"
  subnet_ids = module.vpc_secondary.private_subnet_ids

  tags = {
    Name        = "${local.environment}-redis-secondary-subnet-group"
    Environment = local.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "redis_secondary" {
  provider = aws.eu_west_1

  name_prefix = "${local.environment}-redis-secondary-"
  vpc_id      = module.vpc_secondary.vpc_id

  ingress {
    from_port = 6379
    to_port   = 6379
    protocol  = "tcp"
    security_groups = [
      module.ecs_secondary.workerd_security_group_id,
      module.ecs_secondary.nextjs_security_group_id,
    ]
    description = "Redis access from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.environment}-redis-secondary-sg"
    Environment = local.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}
