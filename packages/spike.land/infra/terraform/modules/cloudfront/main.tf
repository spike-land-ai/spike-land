###############################################################################
# CloudFront Module
# CDN distribution with two origins:
#   1. ALB (Next.js) - default origin for SSR pages and API routes
#   2. S3 bucket - for immutable static assets (/_next/static/*)
# Uses HTTP/2+3, price class 100 (US/Canada/Europe), and managed cache policies.
###############################################################################

locals {
  common_tags = {
    Environment = var.environment
    Project     = "spike-land"
    ManagedBy   = "terraform"
  }

  alb_origin_id = "alb-nextjs"
  s3_origin_id  = "s3-static-assets"
}

# --- S3 Bucket for static assets ---

resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.environment}-spike-land-static-assets"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-static-assets"
  })
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    id     = "cleanup-old-static-assets"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}

# --- Origin Access Control for S3 ---

resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.environment}-spike-land-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy to allow CloudFront access via OAC
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.static_assets.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
        }
      }
    }]
  })
}

# --- CloudFront Distribution ---

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  price_class         = "PriceClass_100"
  comment             = "spike.land ${var.environment} CDN"
  default_root_object = ""
  aliases             = var.domain_aliases

  # ALB origin (Next.js SSR)
  origin {
    domain_name = var.alb_dns_name
    origin_id   = local.alb_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # S3 origin (static assets)
  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  # Default behavior: proxy to ALB (no caching for SSR)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.alb_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # CachingDisabled managed policy
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    # AllViewerExceptHostHeader managed origin request policy
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  # Static assets: long-lived cache (immutable Next.js build output)
  # Served from S3 to avoid 503s during deploys/SPOT interruptions.
  # Deploy pipeline syncs .next/static/ to S3 before ECS deploy.
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # CachingOptimized managed policy
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    min_ttl     = 0
    default_ttl = 31536000 # 1 year
    max_ttl     = 31536000
  }

  # API routes: no caching, forward all
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.alb_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # CachingDisabled managed policy
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    # AllViewerExceptHostHeader managed origin request policy
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # WAF placeholder - uncomment when WAF is set up
  # web_acl_id = var.waf_acl_arn

  tags = merge(local.common_tags, {
    Name = "${var.environment}-spike-land-cdn"
  })
}
