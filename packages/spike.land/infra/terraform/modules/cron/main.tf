###############################################################################
# Cron Module
# Uses EventBridge Scheduler + Lambda to make HTTP GET requests to the Next.js
# ALB on a schedule. Replaces Vercel cron jobs. Lambda runs in the same VPC as
# ECS so it can reach the internal ALB.
###############################################################################

locals {
  common_tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

# --- IAM Role for Lambda ---

resource "aws_iam_role" "cron_lambda" {
  name_prefix = "${var.environment}-cron-lambda-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cron_lambda" {
  name_prefix = "${var.environment}-cron-lambda-"
  role        = aws_iam_role.cron_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [{
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:*:*:*"
      }],
      length(var.subnet_ids) > 0 ? [{
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
        ]
        Resource = "*"
      }] : [],
    )
  })
}

# --- CloudWatch Log Group ---

resource "aws_cloudwatch_log_group" "cron_lambda" {
  name              = "/aws/lambda/${var.environment}-spike-land-cron"
  retention_in_days = 14
  tags              = local.common_tags
}

# --- Lambda Function ---

data "archive_file" "cron_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    content  = <<-PYTHON
import urllib.request
import os
import json

def handler(event, context):
    path = event.get("path", "/")
    url = f"http://{os.environ['ALB_DNS_NAME']}{path}"
    headers = {"X-Cron-Secret": os.environ["CRON_SECRET"]}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode()
            print(f"Cron {path} -> {resp.status}: {body[:500]}")
            return {"statusCode": resp.status, "body": body}
    except Exception as e:
        print(f"Cron {path} -> ERROR: {str(e)}")
        raise
PYTHON
    filename = "index.py"
  }
}

resource "aws_lambda_function" "cron" {
  function_name = "${var.environment}-spike-land-cron"
  role          = aws_iam_role.cron_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 128

  filename         = data.archive_file.cron_lambda.output_path
  source_code_hash = data.archive_file.cron_lambda.output_base64sha256

  dynamic "vpc_config" {
    for_each = length(var.subnet_ids) > 0 ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = [var.security_group_id]
    }
  }

  environment {
    variables = {
      ALB_DNS_NAME = var.alb_dns_name
      CRON_SECRET  = var.cron_secret
    }
  }

  depends_on = [
    aws_iam_role_policy.cron_lambda,
    aws_cloudwatch_log_group.cron_lambda,
  ]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-cron"
  })
}

# --- EventBridge Scheduler Rules ---

resource "aws_cloudwatch_event_rule" "cron" {
  for_each = { for job in var.cron_jobs : job.name => job }

  name                = "${var.environment}-${each.value.name}"
  description         = "Cron: ${each.value.path}"
  schedule_expression = each.value.schedule

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${each.value.name}"
  })
}

resource "aws_cloudwatch_event_target" "cron" {
  for_each = { for job in var.cron_jobs : job.name => job }

  rule = aws_cloudwatch_event_rule.cron[each.key].name
  arn  = aws_lambda_function.cron.arn

  input = jsonencode({
    path = each.value.path
  })
}

resource "aws_lambda_permission" "cron" {
  for_each = { for job in var.cron_jobs : job.name => job }

  statement_id  = "AllowEventBridge-${each.value.name}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cron.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cron[each.key].arn
}
