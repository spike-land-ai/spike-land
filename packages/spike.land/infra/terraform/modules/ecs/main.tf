###############################################################################
# ECS Module
# Deploys two services on ECS Fargate:
#   1. workerd - JavaScript runtime behind an NLB (Layer 4 for WebSocket)
#   2. Next.js - SSR application behind an ALB (Layer 7)
# Both services auto-scale based on load metrics.
###############################################################################

terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- ECS Cluster ---

resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-spike-land"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-cluster"
  })
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    base              = var.fargate_base
    weight            = 1
  }

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 3
  }
}

# --- IAM Roles ---

resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "${var.environment}-ecs-exec-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow task execution role to read SSM parameters and Secrets Manager for
# sensitive env vars (DATABASE_URL, REDIS_URL, API keys)
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name_prefix = "${var.environment}-ecs-secrets-"
  role        = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameters",
        "ssm:GetParameter",
        "secretsmanager:GetSecretValue",
      ]
      Resource = concat(
        [
          "arn:aws:ssm:${var.region}:*:parameter/${var.environment}/spike-land/*",
          "arn:aws:secretsmanager:${var.region}:*:secret:${var.environment}/spike-land/*",
        ],
        var.ssm_region != "" && var.ssm_region != var.region ? [
          "arn:aws:ssm:${var.ssm_region}:*:parameter/${var.environment}/spike-land/*",
        ] : [],
      )
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name_prefix = "${var.environment}-ecs-task-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# --- CloudWatch Log Groups ---

resource "aws_cloudwatch_log_group" "workerd" {
  name              = "/ecs/${var.environment}/spike-land-workerd"
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "nextjs" {
  name              = "/ecs/${var.environment}/spike-land-nextjs"
  retention_in_days = 30
  tags              = local.common_tags
}

# --- Security Groups ---

resource "aws_security_group" "workerd" {
  name_prefix = "${var.environment}-workerd-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "workerd HTTP from NLB (NLBs do not have security groups)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-workerd-sg"
  })
}

resource "aws_security_group" "nextjs" {
  name_prefix = "${var.environment}-nextjs-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Next.js HTTP from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nextjs-sg"
  })
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet (redirects to HTTPS)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alb-sg"
  })
}

###############################################################################
# workerd Task Definition & Service
###############################################################################

resource "aws_ecs_task_definition" "workerd" {
  family                   = "${var.environment}-spike-land-workerd"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.workerd_cpu
  memory                   = var.workerd_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "spike-land-workerd"
    image     = var.workerd_image
    essential = true

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = concat(
      [
        { name = "REDIS_URL", value = var.redis_url },
        { name = "AWS_REGION", value = var.region },
      ],
      var.dynamodb_table != "" ? [{ name = "DYNAMODB_TABLE", value = var.dynamodb_table }] : [],
      var.s3_bucket != "" ? [{ name = "S3_BUCKET", value = var.s3_bucket }] : [],
    )

    secrets = concat(
      var.ssm_openai_api_key_arn != "" ? [{ name = "OPENAI_API_KEY", valueFrom = var.ssm_openai_api_key_arn }] : [],
      var.ssm_claude_code_oauth_token_arn != "" ? [{ name = "CLAUDE_CODE_OAUTH_TOKEN", valueFrom = var.ssm_claude_code_oauth_token_arn }] : [],
      var.ssm_jwt_secret_arn != "" ? [{ name = "JWT_SECRET", valueFrom = var.ssm_jwt_secret_arn }] : [],
    )

    stopTimeout = 30

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://127.0.0.1:8080/ping || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.workerd.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "workerd"
      }
    }
  }])

  tags = local.common_tags
}

resource "aws_ecs_service" "workerd" {
  name            = "${var.environment}-workerd"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.workerd.arn
  desired_count   = var.workerd_desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    base              = var.workerd_fargate_base
    weight            = 1
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 3
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.workerd.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.workerd.arn
    container_name   = "spike-land-workerd"
    container_port   = 8080
  }

  tags = local.common_tags
}

###############################################################################
# Next.js Task Definition & Service
###############################################################################

resource "aws_ecs_task_definition" "nextjs" {
  family                   = "${var.environment}-spike-land-nextjs"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.nextjs_cpu
  memory                   = var.nextjs_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "spike-land-nextjs"
    image     = var.nextjs_image
    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = concat(
      [
        { name = "DATABASE_URL", value = var.database_url },
        { name = "REDIS_URL", value = var.redis_url },
        { name = "WORKERD_URL", value = "https://${aws_lb.nlb.dns_name}" },
        { name = "AWS_REGION", value = var.region },
      ],
      var.app_env != "" ? [{ name = "APP_ENV", value = var.app_env }] : [],
      [{ name = "REGISTRATION_OPEN", value = var.registration_open }],
      var.app_url != "" ? [
        { name = "NEXT_PUBLIC_APP_URL", value = var.app_url },
        { name = "NEXTAUTH_URL", value = var.app_url },
      ] : [],
      var.cron_secret != "" ? [{ name = "CRON_SECRET", value = var.cron_secret }] : [],
    )

    secrets = concat(
      var.ssm_auth_secret_arn != "" ? [{ name = "AUTH_SECRET", valueFrom = var.ssm_auth_secret_arn }] : [],
      var.ssm_github_id_arn != "" ? [{ name = "GITHUB_ID", valueFrom = var.ssm_github_id_arn }] : [],
      var.ssm_github_secret_arn != "" ? [{ name = "GITHUB_SECRET", valueFrom = var.ssm_github_secret_arn }] : [],
      var.ssm_google_id_arn != "" ? [{ name = "GOOGLE_ID", valueFrom = var.ssm_google_id_arn }] : [],
      var.ssm_google_secret_arn != "" ? [{ name = "GOOGLE_SECRET", valueFrom = var.ssm_google_secret_arn }] : [],
      var.ssm_apple_id_arn != "" ? [{ name = "AUTH_APPLE_ID", valueFrom = var.ssm_apple_id_arn }] : [],
      var.ssm_apple_secret_arn != "" ? [{ name = "AUTH_APPLE_SECRET", valueFrom = var.ssm_apple_secret_arn }] : [],
      var.ssm_facebook_id_arn != "" ? [{ name = "AUTH_FACEBOOK_ID", valueFrom = var.ssm_facebook_id_arn }] : [],
      var.ssm_facebook_secret_arn != "" ? [{ name = "AUTH_FACEBOOK_SECRET", valueFrom = var.ssm_facebook_secret_arn }] : [],
      var.ssm_resend_api_key_arn != "" ? [{ name = "RESEND_API_KEY", valueFrom = var.ssm_resend_api_key_arn }] : [],
      var.ssm_ga_measurement_id_arn != "" ? [{ name = "GA_MEASUREMENT_ID", valueFrom = var.ssm_ga_measurement_id_arn }] : [],
      var.ssm_ga_api_secret_arn != "" ? [{ name = "GA_API_SECRET", valueFrom = var.ssm_ga_api_secret_arn }] : [],
    )

    stopTimeout = 30

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://127.0.0.1:3000/api/health || exit 1"]
      interval    = 15
      timeout     = 15
      retries     = 5
      startPeriod = 45
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.nextjs.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "nextjs"
      }
    }
  }])

  tags = local.common_tags
}

resource "aws_ecs_service" "nextjs" {
  name            = "${var.environment}-nextjs"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.nextjs.arn
  desired_count   = var.nextjs_desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    base              = var.nextjs_fargate_base
    weight            = 1
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.nextjs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nextjs.arn
    container_name   = "spike-land-nextjs"
    container_port   = 3000
  }

  tags = local.common_tags
}

###############################################################################
# NLB for workerd (Layer 4 - preserves WebSocket connections)
###############################################################################

resource "aws_lb" "nlb" {
  name               = "${var.environment}-workerd-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = var.public_subnet_ids

  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-workerd-nlb"
  })
}

resource "aws_lb_target_group" "workerd" {
  name                 = "${var.environment}-workerd-tg"
  port                 = 8080
  protocol             = "TCP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 30

  # Source IP stickiness for WebSocket connection persistence
  stickiness {
    enabled = true
    type    = "source_ip"
  }

  health_check {
    enabled             = true
    protocol            = "TCP"
    port                = "8080"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    interval            = 30
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "workerd_tls" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 443
  protocol          = "TLS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.workerd.arn
  }

  tags = local.common_tags
}

###############################################################################
# ALB for Next.js (Layer 7 - path-based routing, HTTP/2)
###############################################################################

resource "aws_lb" "alb" {
  name               = "${var.environment}-nextjs-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nextjs-alb"
  })
}

resource "aws_lb_target_group" "nextjs" {
  name                 = "${var.environment}-nextjs-tg"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/api/health"
    protocol            = "HTTP"
    port                = "3000"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 15
    timeout             = 5
    matcher             = "200"
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "nextjs_https" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nextjs.arn
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "nextjs_http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = local.common_tags
}

###############################################################################
# Auto-Scaling
###############################################################################

# --- workerd auto-scaling ---

resource "aws_appautoscaling_target" "workerd" {
  max_capacity       = 50
  min_capacity       = var.workerd_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.workerd.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "workerd_cpu" {
  name               = "${var.environment}-workerd-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.workerd.resource_id
  scalable_dimension = aws_appautoscaling_target.workerd.scalable_dimension
  service_namespace  = aws_appautoscaling_target.workerd.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Secondary scaling policy: scale on memory utilization
# (NLBs don't support ALBRequestCountPerTarget; use memory as a proxy for connection load)
resource "aws_appautoscaling_policy" "workerd_memory" {
  name               = "${var.environment}-workerd-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.workerd.resource_id
  scalable_dimension = aws_appautoscaling_target.workerd.scalable_dimension
  service_namespace  = aws_appautoscaling_target.workerd.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# --- Next.js auto-scaling ---

resource "aws_appautoscaling_target" "nextjs" {
  max_capacity       = 20
  min_capacity       = var.nextjs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.nextjs.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "nextjs_requests" {
  name               = "${var.environment}-nextjs-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.nextjs.resource_id
  scalable_dimension = aws_appautoscaling_target.nextjs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.nextjs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.alb.arn_suffix}/${aws_lb_target_group.nextjs.arn_suffix}"
    }
    target_value       = 500.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

###############################################################################
# CloudWatch Alarms
###############################################################################

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.environment}-nextjs-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB returning >10 5xx errors/minute for 2 consecutive minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
  }

  alarm_actions = var.sns_alarm_topic_arn != "" ? [var.sns_alarm_topic_arn] : []
  ok_actions    = var.sns_alarm_topic_arn != "" ? [var.sns_alarm_topic_arn] : []

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "${var.environment}-nextjs-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "At least one unhealthy target in the Next.js target group"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.nextjs.arn_suffix
    LoadBalancer = aws_lb.alb.arn_suffix
  }

  alarm_actions = var.sns_alarm_topic_arn != "" ? [var.sns_alarm_topic_arn] : []
  ok_actions    = var.sns_alarm_topic_arn != "" ? [var.sns_alarm_topic_arn] : []

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "healthy_targets_low" {
  alarm_name          = "${var.environment}-nextjs-healthy-targets-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Minimum"
  threshold           = 2
  alarm_description   = "Fewer than 2 healthy targets in the Next.js target group"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.nextjs.arn_suffix
    LoadBalancer = aws_lb.alb.arn_suffix
  }

  alarm_actions = var.sns_alarm_topic_arn != "" ? [var.sns_alarm_topic_arn] : []
  ok_actions    = var.sns_alarm_topic_arn != "" ? [var.sns_alarm_topic_arn] : []

  tags = local.common_tags
}
