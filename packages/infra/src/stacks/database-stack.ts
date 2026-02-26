import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import type { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  lambdaSecurityGroup: ec2.ISecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.IDatabaseInstance;
  public readonly secret: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Database credentials
    const secret = new rds.DatabaseSecret(this, 'RumiDbSecret', {
      username: 'rumi_admin',
    });
    this.secret = secret;

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'RumiDbSg', {
      vpc: props.vpc,
      description: 'Security group for Rumi RDS instance',
      allowAllOutbound: false,
    });

    // Allow Lambda → RDS connectivity (both SGs are in the VPC/Database stacks — no cycle)
    dbSecurityGroup.addIngressRule(
      props.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Lambda to RDS',
    );

    // PostgreSQL RDS instance — MVP: t4g.micro for cost savings (~$12/month)
    const database = new rds.DatabaseInstance(this, 'RumiDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(secret),
      databaseName: 'rumi',
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      multiAz: false, // Single AZ for MVP cost savings
      storageEncrypted: true,
    });

    this.database = database;

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      exportName: `${id}-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: secret.secretArn,
      exportName: `${id}-secret-arn`,
    });
  }
}
