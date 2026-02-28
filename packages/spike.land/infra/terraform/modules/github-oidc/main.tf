data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]

  tags = var.tags
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [for ref in var.allowed_refs : "repo:${var.github_repo}:ref:refs/heads/${ref}"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "deploy_permissions" {
  # ECR: auth token (account-level, must use wildcard resource)
  statement {
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  # ECR: create repositories on first deploy (idempotent describe||create pattern)
  statement {
    effect = "Allow"
    actions = [
      "ecr:CreateRepository",
      "ecr:DescribeRepositories",
    ]
    resources = ["*"]
  }

  # ECR: push/pull images to managed repositories
  statement {
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
    ]
    resources = var.ecr_repository_arns
  }

  # ECS: deploy services
  statement {
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
      "ecs:UpdateService",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:DeregisterTaskDefinition",
      "ecs:ListTasks",
      "ecs:DescribeTasks",
    ]
    resources = ["*"]
  }

  # ECS: wait for service stability
  statement {
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
    ]
    resources = ["*"]
  }

  # IAM: pass role to ECS tasks
  statement {
    effect = "Allow"
    actions = [
      "iam:PassRole",
    ]
    resources = var.ecs_task_role_arns
  }

  # S3: sync static assets to CDN bucket during deploy
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [for name in var.s3_static_asset_bucket_names : "arn:aws:s3:::${name}"]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = [for name in var.s3_static_asset_bucket_names : "arn:aws:s3:::${name}/*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "${var.role_name}-deploy-policy"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}
