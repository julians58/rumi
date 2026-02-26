#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../src/stacks/vpc-stack';
import { AuthStack } from '../src/stacks/auth-stack';
import { DatabaseStack } from '../src/stacks/database-stack';
import { StorageStack } from '../src/stacks/storage-stack';
import { ApiStack } from '../src/stacks/api-stack';
import { FrontendStack } from '../src/stacks/frontend-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const stage = app.node.tryGetContext('stage') ?? 'dev';
const prefix = `rumi-${stage}`;

// 1. Networking (includes shared Lambda security group)
const vpcStack = new VpcStack(app, `${prefix}-vpc`, { env });

// 2. Authentication
const authStack = new AuthStack(app, `${prefix}-auth`, { env, stage });

// 3. Database (receives Lambda SG to set up ingress rule)
const databaseStack = new DatabaseStack(app, `${prefix}-database`, {
  env,
  vpc: vpcStack.vpc,
  lambdaSecurityGroup: vpcStack.lambdaSecurityGroup,
});

// 4. Storage (S3 for images)
const storageStack = new StorageStack(app, `${prefix}-storage`, { env, stage });

// 5. API (Lambda + API Gateway)
const apiStack = new ApiStack(app, `${prefix}-api`, {
  env,
  stage,
  vpc: vpcStack.vpc,
  lambdaSecurityGroup: vpcStack.lambdaSecurityGroup,
  database: databaseStack.database,
  databaseSecret: databaseStack.secret,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  imagesBucket: storageStack.imagesBucket,
});

// 6. Frontend (S3 + CloudFront)
const frontendStack = new FrontendStack(app, `${prefix}-frontend`, {
  env,
  apiGateway: apiStack.httpApi,
});

// Ensure proper ordering
databaseStack.addDependency(vpcStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(authStack);
apiStack.addDependency(storageStack);
frontendStack.addDependency(apiStack);
