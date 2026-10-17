terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. AWS KMS Master Key for OAuth Refresh Token Envelope Encryption
resource "aws_kms_key" "inbox_companion_kek" {
  description             = "Master Key Encryption Key (KEK) for Inbox Companion credential envelope encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Service     = "inbox-companion"
  }
}

resource "aws_kms_alias" "inbox_companion_kek_alias" {
  name          = "alias/inbox-companion-kek-${var.environment}"
  target_key_id = aws_kms_key.inbox_companion_kek.key_id
}

# 2. Managed PostgreSQL Database (Amazon RDS Aurora / Postgres)
resource "aws_db_instance" "postgres" {
  identifier             = "inbox-companion-postgres-${var.environment}"
  allocated_storage      = 50
  max_allocated_storage  = 500
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = var.db_instance_class
  db_name                = "inbox_companion"
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.postgres16"
  skip_final_snapshot    = var.environment == "dev"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.inbox_companion_kek.arn
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name

  backup_retention_period = 30 # PITR (Point-in-Time Recovery enabled)
}

# 3. Managed ElastiCache Redis Cluster (BullMQ Queue & Throttling)
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "inbox-companion-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name
}

# 4. AWS Secrets Manager for OIDC Client Secrets
resource "aws_secretsmanager_secret" "oidc_secrets" {
  name                    = "inbox-companion/oidc-secrets-${var.environment}"
  kms_key_id              = aws_kms_key.inbox_companion_kek.arn
  recovery_window_in_days = 7
}

# 5. ECS Fargate Cluster & Service (Stateless Container Runtime)
resource "aws_ecs_cluster" "cluster" {
  name = "inbox-companion-cluster-${var.environment}"
}

resource "aws_ecs_task_definition" "api_task" {
  family                   = "inbox-companion-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "inbox-companion-server"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DB_HOST", value = aws_db_instance.postgres.address },
        { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
        { name = "KMS_KEY_ARN", value = aws_kms_key.inbox_companion_kek.arn }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/inbox-companion-${var.environment}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])
}

# Security Groups & Subnets
resource "aws_security_group" "db_sg" {
  name        = "inbox-companion-db-sg"
  description = "Allow inbound postgres from ECS"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api_sg.id]
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "inbox-companion-redis-sg"
  description = "Allow inbound redis from ECS"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.api_sg.id]
  }
}

resource "aws_security_group" "api_sg" {
  name        = "inbox-companion-api-sg"
  description = "Allow inbound traffic from ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "db_subnet" {
  name       = "inbox-companion-db-subnet"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "inbox-companion-redis-subnet"
  subnet_ids = var.private_subnet_ids
}

resource "aws_iam_role" "ecs_execution_role" {
  name = "inbox-companion-ecs-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role" "ecs_task_role" {
  name = "inbox-companion-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}
