import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

let resolved = false;

/**
 * Resolve DATABASE_URL from AWS Secrets Manager at runtime.
 *
 * The CDK passes `DATABASE_URL=SECRET_ARN:<arn>:HOST:<host>` as a placeholder.
 * This function fetches the actual credentials from Secrets Manager and
 * constructs a proper PostgreSQL connection string.
 *
 * In localdev, DATABASE_URL is already a valid connection string — no-op.
 */
export async function resolveDatabaseUrl(): Promise<void> {
  if (resolved) return;

  const raw = process.env.DATABASE_URL || '';

  // Only resolve if it's a SECRET_ARN placeholder from CDK
  if (!raw.startsWith('SECRET_ARN:')) {
    resolved = true;
    return;
  }

  // Parse the placeholder: SECRET_ARN:<arn>:HOST:<host>
  const parts = raw.split(':');
  // SECRET_ARN:<arn parts...>:HOST:<host>
  const hostIdx = parts.lastIndexOf('HOST');
  const host = parts.slice(hostIdx + 1).join(':');
  const secretArn = parts.slice(1, hostIdx).join(':');

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  });

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error('Database secret is empty');
  }

  const secret = JSON.parse(response.SecretString) as {
    username: string;
    password: string;
    port?: number;
    dbname?: string;
  };

  const port = secret.port || 5432;
  const dbname = secret.dbname || 'rumi';
  const password = encodeURIComponent(secret.password);

  // sslmode=require: encrypt connection to RDS
  // sslaccept=accept_invalid_certs: Prisma-specific param to skip CA verification
  // (RDS uses Amazon root CA which isn't in Lambda's trust store)
  process.env.DATABASE_URL = `postgresql://${secret.username}:${password}@${host}:${port}/${dbname}?schema=public&sslmode=require&sslaccept=accept_invalid_certs`;

  resolved = true;
  console.log('Database URL resolved from Secrets Manager');
}
