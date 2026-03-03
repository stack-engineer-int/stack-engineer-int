import type { PRFixture } from '../types.js';

export const infraFixtures: PRFixture[] = [
  {
    id: 'infra-docker',
    name: 'Add Docker configuration',
    category: 'infra',
    expectedScore: 3,
    pr: {
      title: 'feat: add Docker support for local development',
      body: `Adds Docker configuration for consistent development environments.

- Multi-stage build for production
- Development compose with hot reload
- PostgreSQL service included`,
      author: 'developer',
    },
    files: [
      { filename: 'Dockerfile', status: 'added', additions: 45, deletions: 0 },
      { filename: 'docker-compose.yml', status: 'added', additions: 35, deletions: 0 },
      { filename: '.dockerignore', status: 'added', additions: 15, deletions: 0 },
    ],
    diff: `diff --git a/Dockerfile b/Dockerfile
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/Dockerfile
@@ -0,0 +1,35 @@
+FROM node:20-alpine AS builder
+
+RUN corepack enable && corepack prepare pnpm@9 --activate
+
+WORKDIR /app
+
+COPY pnpm-lock.yaml package.json ./
+RUN pnpm install --frozen-lockfile
+
+COPY . .
+RUN pnpm build
+
+FROM node:20-alpine AS production
+
+RUN corepack enable && corepack prepare pnpm@9 --activate
+
+WORKDIR /app
+
+COPY --from=builder /app/build ./build
+COPY --from=builder /app/package.json ./
+COPY --from=builder /app/pnpm-lock.yaml ./
+
+RUN pnpm install --prod --frozen-lockfile
+
+ENV NODE_ENV=production
+ENV PORT=3000
+
+EXPOSE 3000
+
+CMD ["node", "build"]

diff --git a/docker-compose.yml b/docker-compose.yml
new file mode 100644
index 0000000..abcdefg
--- /dev/null
+++ b/docker-compose.yml
@@ -0,0 +1,25 @@
+version: '3.8'
+
+services:
+  app:
+    build: .
+    ports:
+      - '3000:3000'
+    environment:
+      - DATABASE_URL=postgres://postgres:postgres@db:5432/app
+    depends_on:
+      - db
+
+  db:
+    image: postgres:16-alpine
+    environment:
+      POSTGRES_USER: postgres
+      POSTGRES_PASSWORD: postgres
+      POSTGRES_DB: app
+    ports:
+      - '5432:5432'
+    volumes:
+      - postgres_data:/var/lib/postgresql/data
+
+volumes:
+  postgres_data:`,
    expected: {
      affectedAreas: ['infra'],
      keyChanges: ['Docker', 'containerization', 'compose'],
    },
  },
  {
    id: 'infra-kubernetes',
    name: 'Add Kubernetes manifests',
    category: 'infra',
    expectedScore: 5,
    pr: {
      title: 'feat: add Kubernetes deployment manifests',
      body: `Production-ready Kubernetes configuration.

## Included
- Deployment with rolling updates
- Service and Ingress
- HPA for auto-scaling
- ConfigMap and Secrets
- Health checks configured`,
      author: 'devops-engineer',
    },
    files: [
      { filename: 'k8s/deployment.yaml', status: 'added', additions: 65, deletions: 0 },
      { filename: 'k8s/service.yaml', status: 'added', additions: 20, deletions: 0 },
      { filename: 'k8s/ingress.yaml', status: 'added', additions: 25, deletions: 0 },
      { filename: 'k8s/hpa.yaml', status: 'added', additions: 18, deletions: 0 },
    ],
    diff: `diff --git a/k8s/deployment.yaml b/k8s/deployment.yaml
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/k8s/deployment.yaml
@@ -0,0 +1,55 @@
+apiVersion: apps/v1
+kind: Deployment
+metadata:
+  name: app
+  labels:
+    app: app
+spec:
+  replicas: 3
+  selector:
+    matchLabels:
+      app: app
+  strategy:
+    type: RollingUpdate
+    rollingUpdate:
+      maxSurge: 1
+      maxUnavailable: 0
+  template:
+    metadata:
+      labels:
+        app: app
+    spec:
+      containers:
+        - name: app
+          image: app:latest
+          ports:
+            - containerPort: 3000
+          resources:
+            requests:
+              memory: '256Mi'
+              cpu: '100m'
+            limits:
+              memory: '512Mi'
+              cpu: '500m'
+          livenessProbe:
+            httpGet:
+              path: /health
+              port: 3000
+            initialDelaySeconds: 10
+            periodSeconds: 10
+          readinessProbe:
+            httpGet:
+              path: /ready
+              port: 3000
+            initialDelaySeconds: 5
+            periodSeconds: 5
+          envFrom:
+            - configMapRef:
+                name: app-config
+            - secretRef:
+                name: app-secrets`,
    expected: {
      affectedAreas: ['infra', 'kubernetes'],
      keyChanges: ['Kubernetes', 'deployment', 'HPA', 'ingress'],
    },
  },
  {
    id: 'infra-terraform',
    name: 'Add Terraform for cloud resources',
    category: 'infra',
    expectedScore: 5,
    pr: {
      title: 'feat: add Terraform configuration for AWS',
      body: `Infrastructure as code for AWS resources.

## Resources
- VPC with public/private subnets
- RDS PostgreSQL
- ElastiCache Redis
- ALB with SSL termination
- S3 bucket for assets`,
      author: 'devops-engineer',
    },
    files: [
      { filename: 'terraform/main.tf', status: 'added', additions: 120, deletions: 0 },
      { filename: 'terraform/variables.tf', status: 'added', additions: 45, deletions: 0 },
      { filename: 'terraform/outputs.tf', status: 'added', additions: 25, deletions: 0 },
    ],
    diff: `diff --git a/terraform/main.tf b/terraform/main.tf
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/terraform/main.tf
@@ -0,0 +1,80 @@
+terraform {
+  required_providers {
+    aws = {
+      source  = "hashicorp/aws"
+      version = "~> 5.0"
+    }
+  }
+
+  backend "s3" {
+    bucket = "terraform-state"
+    key    = "prod/terraform.tfstate"
+    region = "us-east-1"
+  }
+}
+
+provider "aws" {
+  region = var.aws_region
+}
+
+module "vpc" {
+  source = "terraform-aws-modules/vpc/aws"
+
+  name = "app-vpc"
+  cidr = "10.0.0.0/16"
+
+  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
+  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
+  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
+
+  enable_nat_gateway = true
+  single_nat_gateway = false
+}
+
+resource "aws_db_instance" "postgres" {
+  identifier        = "app-db"
+  engine            = "postgres"
+  engine_version    = "16"
+  instance_class    = "db.t3.medium"
+  allocated_storage = 20
+
+  db_name  = "app"
+  username = var.db_username
+  password = var.db_password
+
+  vpc_security_group_ids = [aws_security_group.db.id]
+  db_subnet_group_name   = aws_db_subnet_group.main.name
+
+  backup_retention_period = 7
+  multi_az               = true
+  deletion_protection    = true
+}`,
    expected: {
      affectedAreas: ['infra', 'cloud'],
      keyChanges: ['Terraform', 'AWS', 'VPC', 'RDS'],
    },
  },
];
