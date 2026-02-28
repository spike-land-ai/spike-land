output "role_arn" {
  description = "ARN of the GitHub Actions deploy role (set as AWS_DEPLOY_ROLE_ARN secret)"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
