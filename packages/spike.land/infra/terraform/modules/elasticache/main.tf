###############################################################################
# ElastiCache Module
# Creates a Redis replication group with optional Global Datastore for
# cross-region replication. Uses encryption in transit and at rest,
# automatic failover, and Multi-AZ deployment.
###############################################################################

locals {
  common_tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- Subnet Group ---

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-spike-land-redis"
  subnet_ids = var.private_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.environment}-redis-subnet-group"
  })
}

# --- Security Group ---

resource "aws_security_group" "redis" {
  name_prefix = "${var.environment}-redis-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "Redis access from ECS tasks only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-redis-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# --- Parameter Group ---

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.environment}-spike-land-redis71"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = local.common_tags
}

# --- Global Datastore (for multi-region) ---

resource "aws_elasticache_global_replication_group" "main" {
  count = var.create_global_datastore ? 1 : 0

  global_replication_group_id_suffix   = "${var.environment}-spike-land"
  primary_replication_group_id         = aws_elasticache_replication_group.primary.id
  global_replication_group_description = "Global datastore for spike.land ${var.environment}"
}

# --- Primary Replication Group ---

resource "aws_elasticache_replication_group" "primary" {
  replication_group_id = "${var.environment}-spike-land"
  description          = "Redis for spike.land ${var.environment}"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_clusters   = var.primary_num_cache_clusters
  parameter_group_name = aws_elasticache_parameter_group.main.name

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = true
  multi_az_enabled           = true

  transit_encryption_enabled = true
  at_rest_encryption_enabled = true

  port = 6379

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "mon:05:00-mon:07:00"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-redis"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# --- Secondary Replication Group (for global datastore) ---

resource "aws_elasticache_replication_group" "secondary" {
  count = var.create_secondary_replication_group ? 1 : 0

  provider = aws.secondary

  replication_group_id        = "${var.environment}-spike-land-secondary"
  description                 = "Redis secondary for spike.land ${var.environment}"
  global_replication_group_id = aws_elasticache_global_replication_group.main[0].global_replication_group_id

  num_cache_clusters = var.secondary_num_cache_clusters

  subnet_group_name  = var.secondary_subnet_group_name
  security_group_ids = var.secondary_security_group_ids

  automatic_failover_enabled = true
  multi_az_enabled           = false

  port = 6379

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-redis-secondary"
  })

  lifecycle {
    prevent_destroy = true
  }
}
