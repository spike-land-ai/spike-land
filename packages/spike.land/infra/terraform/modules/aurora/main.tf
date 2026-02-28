###############################################################################
# Aurora Module
# Creates an Aurora Global Database (PostgreSQL-compatible) with a primary
# writer cluster and a secondary read-only cluster for cross-region replication.
# Uses encryption at rest, Performance Insights, and deletion protection.
###############################################################################

locals {
  common_tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- Aurora Global Cluster ---

resource "aws_rds_global_cluster" "main" {
  count = var.create_global_cluster ? 1 : 0

  global_cluster_identifier = "${var.environment}-spike-land-global"
  engine                    = "aurora-postgresql"
  engine_version            = var.engine_version
  database_name             = "spike_land"
  storage_encrypted         = true
  deletion_protection       = true
}

# --- KMS Key for encryption at rest ---

resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora encryption - ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-kms"
  })
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${var.environment}-spike-land-aurora"
  target_key_id = aws_kms_key.aurora.key_id
}

# --- DB Subnet Group ---

resource "aws_db_subnet_group" "aurora" {
  name       = "${var.environment}-spike-land-aurora"
  subnet_ids = var.private_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-subnet-group"
  })
}

# --- Security Group ---

resource "aws_security_group" "aurora" {
  name_prefix = "${var.environment}-aurora-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "PostgreSQL access from ECS tasks only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# --- Parameter Groups ---

resource "aws_rds_cluster_parameter_group" "aurora" {
  name_prefix = "${var.environment}-spike-land-"
  family      = "aurora-postgresql16"

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# --- Primary Aurora Cluster ---

resource "aws_rds_cluster" "primary" {
  cluster_identifier = "${var.environment}-spike-land-primary"

  # Join the global cluster if one was created
  global_cluster_identifier = var.create_global_cluster ? aws_rds_global_cluster.main[0].id : null

  engine         = "aurora-postgresql"
  engine_version = var.engine_version

  # database_name is set at the global cluster level when using global databases
  database_name   = var.create_global_cluster ? null : "spike_land"
  master_username = var.create_global_cluster ? null : var.master_username
  master_password = var.create_global_cluster ? null : var.master_password

  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  backup_retention_period   = 30
  preferred_backup_window   = "03:00-04:00"
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.environment}-spike-land-final-${formatdate("YYYY-MM-DD", timestamp())}"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-primary"
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [final_snapshot_identifier]
  }
}

resource "aws_rds_cluster_instance" "primary" {
  count = var.primary_instance_count

  identifier         = "${var.environment}-spike-land-primary-${count.index}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version

  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_kms_key_id = var.performance_insights_enabled ? aws_kms_key.aurora.arn : null

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-primary-${count.index}"
  })
}

# --- Secondary Aurora Cluster (for global database, created in secondary region) ---

resource "aws_rds_cluster" "secondary" {
  count = var.create_secondary_cluster ? 1 : 0

  provider = aws.secondary

  cluster_identifier        = "${var.environment}-spike-land-secondary"
  global_cluster_identifier = aws_rds_global_cluster.main[0].id

  engine         = "aurora-postgresql"
  engine_version = var.engine_version

  db_subnet_group_name   = var.secondary_subnet_group_name
  vpc_security_group_ids = var.secondary_security_group_ids

  storage_encrypted = true
  kms_key_id        = var.secondary_kms_key_arn

  backup_retention_period = 30
  deletion_protection     = true
  skip_final_snapshot     = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-secondary"
  })

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [aws_rds_cluster.primary]
}

resource "aws_rds_cluster_instance" "secondary" {
  count = var.create_secondary_cluster ? var.secondary_instance_count : 0

  provider = aws.secondary

  identifier         = "${var.environment}-spike-land-secondary-${count.index}"
  cluster_identifier = aws_rds_cluster.secondary[0].id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.secondary[0].engine
  engine_version     = aws_rds_cluster.secondary[0].engine_version

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-secondary-${count.index}"
  })
}
