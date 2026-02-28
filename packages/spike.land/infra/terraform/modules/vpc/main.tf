###############################################################################
# VPC Module
# Creates a VPC with public/private subnets across 3 AZs, NAT gateways for
# high availability, VPC endpoints to reduce data transfer costs and latency,
# and flow logs for network auditing.
###############################################################################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.environment}-spike-land-vpc"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- Public Subnets (one per AZ) ---

resource "aws_subnet" "public" {
  count = length(var.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-public-${var.azs[count.index]}"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
    Tier        = "public"
  }
}

# --- Private Subnets (one per AZ) ---

resource "aws_subnet" "private" {
  count = length(var.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.azs))
  availability_zone = var.azs[count.index]

  tags = {
    Name        = "${var.environment}-private-${var.azs[count.index]}"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
    Tier        = "private"
  }
}

# --- Internet Gateway ---

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- NAT Gateways ---

locals {
  nat_count = var.nat_gateway_count > 0 ? var.nat_gateway_count : length(var.azs)
}

resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"

  tags = {
    Name        = "${var.environment}-nat-eip-${var.azs[count.index]}"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_nat_gateway" "main" {
  count = local.nat_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.environment}-nat-${var.azs[count.index]}"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# --- Route Tables ---

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-rt"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_route_table_association" "public" {
  count = length(var.azs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Each private subnet gets its own route table pointing to the AZ-local NAT gateway
resource "aws_route_table" "private" {
  count = length(var.azs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[min(count.index, local.nat_count - 1)].id
  }

  tags = {
    Name        = "${var.environment}-private-rt-${var.azs[count.index]}"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_route_table_association" "private" {
  count = length(var.azs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# --- VPC Endpoints ---
# These reduce data transfer costs and latency for AWS service calls from
# private subnets, and avoid routing traffic through NAT gateways.

resource "aws_security_group" "vpc_endpoints" {
  count       = var.enable_interface_endpoints ? 1 : 0
  name_prefix = "${var.environment}-vpce-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-vpce-sg"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# Interface endpoints (ENI-based) — conditional, saves ~$21/mo when disabled
resource "aws_vpc_endpoint" "ecr_api" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "${var.environment}-ecr-api-vpce"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "${var.environment}-ecr-dkr-vpce"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_vpc_endpoint" "logs" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "${var.environment}-logs-vpce"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# Gateway endpoints (free, route-table-based)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = {
    Name        = "${var.environment}-s3-vpce"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = {
    Name        = "${var.environment}-dynamodb-vpce"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- VPC Flow Logs ---

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/vpc/${var.environment}-spike-land/flow-logs"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role" "flow_logs" {
  name_prefix = "${var.environment}-flow-logs-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "${var.environment}-flow-logs-"
  role        = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "${aws_cloudwatch_log_group.flow_logs.arn}:*"
    }]
  })
}

resource "aws_flow_log" "main" {
  vpc_id                   = aws_vpc.main.id
  traffic_type             = "ALL"
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.flow_logs.arn
  iam_role_arn             = aws_iam_role.flow_logs.arn
  max_aggregation_interval = 60

  tags = {
    Name        = "${var.environment}-vpc-flow-log"
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}
