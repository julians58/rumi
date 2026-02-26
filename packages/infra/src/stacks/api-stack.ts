import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  stage: string;
  vpc: ec2.IVpc;
  lambdaSecurityGroup: ec2.ISecurityGroup;
  database: rds.IDatabaseInstance;
  databaseSecret: rds.DatabaseSecret;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
  imagesBucket: s3.IBucket;
}

export class ApiStack extends cdk.Stack {
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const databaseUrl = buildDatabaseUrl(props.databaseSecret, props.database);

    // Shared Lambda environment variables
    const lambdaEnvironment: Record<string, string> = {
      NODE_ENV: 'production',
      STAGE: props.stage,
      DATABASE_URL: databaseUrl,
      COGNITO_USER_POOL_ID: props.userPool.userPoolId,
      COGNITO_CLIENT_ID: props.userPoolClient.userPoolClientId,
      AWS_COGNITO_REGION: this.region,
      IMAGES_BUCKET: props.imagesBucket.bucketName,
      CORS_ORIGIN: '*', // Will tighten after first deploy with CloudFront domain
    };

    // --- API Lambda Function ---
    const apiFunction = new lambda.Function(this, 'RumiApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../api/dist', {
        // Force GLOB mode to prevent CDK from using parent .gitignore
        // which could exclude dist/node_modules/ (needed for @prisma/client)
        ignoreMode: cdk.IgnoreMode.GLOB,
      }),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.lambdaSecurityGroup],
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // Grant Lambda access to the database secret
    props.databaseSecret.grantRead(apiFunction);

    // Grant Lambda access to the images bucket
    props.imagesBucket.grantReadWrite(apiFunction);

    // --- Migration Lambda Function ---
    const migrateFunction = new lambda.Function(this, 'RumiMigrateFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'migrate.handler',
      code: lambda.Code.fromAsset('../api/dist', {
        ignoreMode: cdk.IgnoreMode.GLOB,
      }),
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.lambdaSecurityGroup],
      environment: {
        DATABASE_URL: databaseUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant migration Lambda access to the database secret
    props.databaseSecret.grantRead(migrateFunction);

    // Custom Resource: Run migrations on every deployment
    const migrateProvider = new cr.Provider(this, 'MigrateProvider', {
      onEventHandler: migrateFunction,
    });

    new cdk.CustomResource(this, 'RunMigrations', {
      serviceToken: migrateProvider.serviceToken,
      properties: {
        // Change this value to force re-execution on every deploy
        timestamp: Date.now().toString(),
      },
    });

    // --- HTTP API Gateway v2 ---
    this.httpApi = new apigwv2.HttpApi(this, 'RumiHttpApi', {
      apiName: `rumi-${props.stage}-api`,
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'], // Tighten in production
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Proxy all routes to the Lambda function
    const lambdaIntegration = new apigwv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiFunction,
    );

    this.httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      exportName: `${id}-endpoint`,
    });

    new cdk.CfnOutput(this, 'ApiFunctionName', {
      value: apiFunction.functionName,
      exportName: `${id}-function-name`,
    });

    new cdk.CfnOutput(this, 'MigrateFunctionName', {
      value: migrateFunction.functionName,
      exportName: `${id}-migrate-function-name`,
    });
  }
}

/**
 * Build a DATABASE_URL placeholder from the secret and instance.
 * The Lambda resolves actual credentials from Secrets Manager at runtime.
 * Format: SECRET_ARN:<arn>:HOST:<host>
 */
function buildDatabaseUrl(secret: rds.DatabaseSecret, instance: rds.IDatabaseInstance): string {
  return `SECRET_ARN:${secret.secretArn}:HOST:${instance.dbInstanceEndpointAddress}`;
}
