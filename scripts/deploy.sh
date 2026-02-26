#!/bin/bash
set -euo pipefail

###############################################################################
# Rumi - Full Deployment Script
#
# Usage:
#   ./scripts/deploy.sh [stage]   # default: dev
#
# This script handles the complete deployment pipeline:
#   1. Validates AWS credentials and CDK bootstrap
#   2. Builds shared, db (Prisma), and API packages
#   3. Deploys infrastructure stacks (VPC, Auth, Database, Storage, API)
#   4. Reads Cognito outputs from CloudFormation
#   5. Builds the web frontend with Cognito env vars
#   6. Deploys the frontend stack (S3 + CloudFront)
#
# First deploy requires CDK bootstrap:
#   npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
###############################################################################

STAGE="${1:-dev}"
PREFIX="rumi-${STAGE}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================="
echo "  Deploying Rumi (stage: ${STAGE})"
echo "============================================="
echo ""

cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
echo "[1/7] Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo ""
  echo "ERROR: AWS credentials are not configured or expired."
  echo ""
  echo "Configure them with one of:"
  echo "  aws configure                        # Access key + secret"
  echo "  aws sso login --profile <profile>    # SSO"
  echo "  export AWS_PROFILE=<profile>         # Switch profile"
  echo ""
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
echo "  Account: ${ACCOUNT_ID}"
echo "  Region:  ${REGION}"
echo ""

# Check CDK bootstrap
echo "[2/7] Checking CDK bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$REGION" > /dev/null 2>&1; then
  echo "  CDK not bootstrapped. Bootstrapping now..."
  npx cdk bootstrap "aws://${ACCOUNT_ID}/${REGION}"
  echo ""
fi
echo "  CDK bootstrap: OK"
echo ""

# ---------------------------------------------------------------------------
# Build packages
# ---------------------------------------------------------------------------
echo "[3/7] Building packages (shared + db + api)..."
npm run build -w @rumi/shared
npm run generate -w @rumi/db
npm run build -w @rumi/api

# CDK synthesizes ALL stacks (including frontend) even when deploying a subset.
# Create a placeholder web/dist so the frontend stack's Source.asset() doesn't fail.
mkdir -p packages/web/dist
touch packages/web/dist/index.html
echo ""

# ---------------------------------------------------------------------------
# Clean CDK output to prevent stale asset caches
# ---------------------------------------------------------------------------
echo "  Cleaning CDK output (cdk.out) to prevent stale Lambda assets..."
rm -rf packages/infra/cdk.out

# ---------------------------------------------------------------------------
# Deploy infrastructure (everything except frontend)
# ---------------------------------------------------------------------------
echo "[4/7] Deploying infrastructure stacks..."
cd packages/infra
npx cdk deploy \
  "${PREFIX}-vpc" \
  "${PREFIX}-auth" \
  "${PREFIX}-database" \
  "${PREFIX}-storage" \
  "${PREFIX}-api" \
  -c stage="${STAGE}" \
  --require-approval never \
  --outputs-file "${ROOT_DIR}/cdk-outputs.json"
cd "$ROOT_DIR"
echo ""

# ---------------------------------------------------------------------------
# Read Cognito outputs for web build
# ---------------------------------------------------------------------------
echo "[5/7] Reading Cognito configuration from deployed stacks..."

COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "${PREFIX}-auth" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text --region "$REGION")

COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name "${PREFIX}-auth" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
  --output text --region "$REGION")

echo "  User Pool ID: ${COGNITO_USER_POOL_ID}"
echo "  Client ID:    ${COGNITO_CLIENT_ID}"
echo ""

if [ -z "$COGNITO_USER_POOL_ID" ] || [ "$COGNITO_USER_POOL_ID" = "None" ]; then
  echo "ERROR: Could not read Cognito User Pool ID from stack outputs."
  exit 1
fi

# ---------------------------------------------------------------------------
# Build web frontend with Cognito env vars
# ---------------------------------------------------------------------------
echo "[6/7] Building web frontend..."
VITE_STAGE="${STAGE}" \
VITE_COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID}" \
VITE_COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID}" \
VITE_API_URL="" \
npm run build -w @rumi/web
echo ""

# ---------------------------------------------------------------------------
# Deploy frontend
# ---------------------------------------------------------------------------
echo "[7/7] Deploying frontend stack..."
cd packages/infra
npx cdk deploy "${PREFIX}-frontend" \
  -c stage="${STAGE}" \
  --require-approval never \
  --outputs-file "${ROOT_DIR}/cdk-outputs.json"
cd "$ROOT_DIR"
echo ""

# ---------------------------------------------------------------------------
# Print results
# ---------------------------------------------------------------------------
echo "============================================="
echo "  Deployment complete!"
echo "============================================="
echo ""

WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "${PREFIX}-frontend" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
  --output text --region "$REGION" 2>/dev/null || echo "")

API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "${PREFIX}-api" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text --region "$REGION" 2>/dev/null || echo "")

echo "  Website:  ${WEBSITE_URL}"
echo "  API:      ${API_ENDPOINT}"
echo "  Cognito:  ${COGNITO_USER_POOL_ID}"
echo ""
echo "  Stage:    ${STAGE}"
echo "  Region:   ${REGION}"
echo "  Account:  ${ACCOUNT_ID}"
echo ""
