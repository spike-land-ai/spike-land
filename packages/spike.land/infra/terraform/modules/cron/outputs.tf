output "lambda_function_arn" {
  description = "ARN of the cron Lambda function"
  value       = aws_lambda_function.cron.arn
}

output "lambda_function_name" {
  description = "Name of the cron Lambda function"
  value       = aws_lambda_function.cron.function_name
}

output "eventbridge_rule_arns" {
  description = "Map of cron job name to EventBridge rule ARN"
  value       = { for k, v in aws_cloudwatch_event_rule.cron : k => v.arn }
}
