import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export class CphStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webBucket = new s3.Bucket(this, "WebBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const docsBucket = new s3.Bucket(this, "DocsBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{ expiration: Duration.days(180) }],
      removalPolicy: RemovalPolicy.RETAIN
    });

    const exportsBucket = new s3.Bucket(this, "ExportsBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{ expiration: Duration.days(90) }],
      removalPolicy: RemovalPolicy.RETAIN
    });

    const mainTable = new dynamodb.Table(this, "CphMain", {
      tableName: "cph_main",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    mainTable.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING }
    });

    const anonymousTable = new dynamodb.Table(this, "AnonymousFeedback", {
      tableName: "cph_anonymous_feedback",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: false } }
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true }
    });

    const apiFn = new lambda.Function(this, "ApiLambda", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "app.main.handler",
      code: lambda.Code.fromAsset("../../apps/api"),
      timeout: Duration.seconds(29),
      memorySize: 512,
      environment: {
        MAIN_TABLE: mainTable.tableName,
        ANON_TABLE: anonymousTable.tableName,
        DOCS_BUCKET: docsBucket.bucketName,
        EXPORTS_BUCKET: exportsBucket.bucketName
      }
    });

    mainTable.grantReadWriteData(apiFn);
    anonymousTable.grantReadWriteData(apiFn);
    docsBucket.grantReadWrite(apiFn);
    exportsBucket.grantReadWrite(apiFn);

    const httpApi = new apigwv2.HttpApi(this, "HttpApi");
    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration("ApiIntegration", apiFn)
    });

    const notificationQueue = new sqs.Queue(this, "NotificationQueue", {
      visibilityTimeout: Duration.seconds(60)
    });

    new events.Rule(this, "ReminderSchedule", {
      schedule: events.Schedule.rate(Duration.days(1)),
      targets: [new targets.SqsQueue(notificationQueue)]
    });

    new cloudfront.Distribution(this, "WebDistribution", {
      defaultBehavior: { origin: new origins.S3Origin(webBucket) },
      additionalBehaviors: {
        "api/*": {
          origin: new origins.HttpOrigin(`${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`),
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED
        }
      }
    });

    void userPoolClient;
  }
}
