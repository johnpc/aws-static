#!/usr/bin/env node
import cdk = require("@aws-cdk/core");
import { StaticSite } from "./static-site";
import { config } from "dotenv";
config();

class AwsStaticStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);
    if (!process.env.SERVICE_NAME) {
      throw new Error("process.env.SERVICE_NAME not specified. Update .env");
    }
    if (!process.env.DOMAIN_NAME)
      throw new Error("Missing DOMAIN_NAME in .env");
    if (!process.env.SUBDOMAIN) throw new Error("Missing DOMAIN_NAME in .env");

    new StaticSite(this, process.env.SERVICE_NAME, {
      domainName: process.env.DOMAIN_NAME,
      siteSubDomain: process.env.SUBDOMAIN,
      directory: "content"
    });
  }
}

const app = new cdk.App();
if (!process.env.SERVICE_NAME) {
  throw new Error("process.env.SERVICE_NAME not specified. Update .env");
}

new AwsStaticStack(app, process.env.SERVICE_NAME, {
  env: {
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1"
  }
});

app.synth();
