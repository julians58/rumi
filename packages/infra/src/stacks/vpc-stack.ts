import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  /** Shared security group for Lambda functions (API + Migration) */
  public readonly lambdaSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // For MVP, use a simple VPC with 2 AZs to keep costs low
    this.vpc = new ec2.Vpc(this, 'RumiVpc', {
      maxAzs: 2,
      natGateways: 1, // Single NAT gateway for cost savings in MVP
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Lambda security group — created here so both Database and API stacks
    // can reference it without creating cross-stack circular dependencies.
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      description: 'Security group for Rumi Lambda functions',
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `${id}-vpc-id`,
    });
  }
}
