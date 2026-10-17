variable "aws_region" {
  description = "AWS target region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "vpc_id" {
  description = "VPC ID where resources are deployed"
  type        = string
  default     = "vpc-0123456789abcdef0"
}

variable "private_subnet_ids" {
  description = "Subnets for RDS and Redis private deployment"
  type        = list(string)
  default     = ["subnet-01", "subnet-02"]
}

variable "db_instance_class" {
  description = "RDS Postgres instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "inbox_admin"
}

variable "db_password" {
  description = "Database master password (provided via AWS Secrets Manager or TF_VAR)"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.small"
}

variable "container_image" {
  description = "ECR image URI for Inbox Companion Server"
  type        = string
  default     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/inbox-companion:latest"
}
