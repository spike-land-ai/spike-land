output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "workerd_service_name" {
  description = "Name of the workerd ECS service"
  value       = aws_ecs_service.workerd.name
}

output "nextjs_service_name" {
  description = "Name of the Next.js ECS service"
  value       = aws_ecs_service.nextjs.name
}

output "nlb_dns_name" {
  description = "DNS name of the Network Load Balancer (workerd)"
  value       = aws_lb.nlb.dns_name
}

output "nlb_arn" {
  description = "ARN of the Network Load Balancer"
  value       = aws_lb.nlb.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer (Next.js)"
  value       = aws_lb.alb.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.alb.arn
}

output "workerd_security_group_id" {
  description = "Security group ID for workerd tasks"
  value       = aws_security_group.workerd.id
}

output "nextjs_security_group_id" {
  description = "Security group ID for Next.js tasks"
  value       = aws_security_group.nextjs.id
}
