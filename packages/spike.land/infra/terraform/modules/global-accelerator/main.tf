###############################################################################
# Global Accelerator Module
# Provides anycast IP addresses that route traffic to the nearest healthy
# regional NLB endpoint. Both regions get equal weight so traffic goes to
# whichever is geographically closest to the client.
###############################################################################

locals {
  common_tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }
}

resource "aws_globalaccelerator_accelerator" "main" {
  name            = "${var.environment}-spike-land"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled = false
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-ga"
  })
}

resource "aws_globalaccelerator_listener" "main" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 443
    to_port   = 443
  }
}

# --- Primary Region Endpoint Group (us-east-1) ---

resource "aws_globalaccelerator_endpoint_group" "primary" {
  listener_arn            = aws_globalaccelerator_listener.main.id
  endpoint_group_region   = var.primary_region
  traffic_dial_percentage = 100

  health_check_port             = 443
  health_check_protocol         = "TCP"
  health_check_interval_seconds = 30
  threshold_count               = 3

  endpoint_configuration {
    endpoint_id                    = var.primary_nlb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}

# --- Secondary Region Endpoint Group (eu-west-1) ---

resource "aws_globalaccelerator_endpoint_group" "secondary" {
  count = var.create_secondary_endpoint ? 1 : 0

  listener_arn            = aws_globalaccelerator_listener.main.id
  endpoint_group_region   = var.secondary_region
  traffic_dial_percentage = 100

  health_check_port             = 443
  health_check_protocol         = "TCP"
  health_check_interval_seconds = 30
  threshold_count               = 3

  endpoint_configuration {
    endpoint_id                    = var.secondary_nlb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}
