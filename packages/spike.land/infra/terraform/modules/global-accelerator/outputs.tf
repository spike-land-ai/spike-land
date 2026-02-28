output "accelerator_dns_name" {
  description = "DNS name of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.dns_name
}

output "accelerator_id" {
  description = "ID of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.id
}

output "accelerator_ip_sets" {
  description = "IP address sets of the Global Accelerator (anycast IPs)"
  value       = aws_globalaccelerator_accelerator.main.ip_sets
}

output "listener_arn" {
  description = "ARN of the Global Accelerator listener"
  value       = aws_globalaccelerator_listener.main.id
}
