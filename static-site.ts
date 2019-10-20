#!/usr/bin/env node
import cloudfront = require("@aws-cdk/aws-cloudfront");
import route53 = require("@aws-cdk/aws-route53");
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");
import acm = require("@aws-cdk/aws-certificatemanager");
import cdk = require("@aws-cdk/core");
import targets = require("@aws-cdk/aws-route53-targets/lib");
import { Construct } from "@aws-cdk/core";

export interface StaticSiteProps {
  domainName: string;
  siteSubDomain: string;
  directory: string;
}

export class StaticSite extends Construct {
  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name);
    const zone =
      route53.HostedZone.fromLookup(this, "Zone", {
        domainName: props.domainName
      }) ||
      new route53.PublicHostedZone(this, "HostedZone", {
        zoneName: props.domainName
      });

    const siteDomain = props.siteSubDomain + "." + props.domainName;
    new cdk.CfnOutput(this, "Site", { value: "https://" + siteDomain });
    const siteBucket =
      s3.Bucket.fromBucketName(this, "SiteBucket", siteDomain) ||
      new s3.Bucket(this, "SiteBucket", {
        bucketName: siteDomain,
        websiteIndexDocument: "index.html",
        websiteErrorDocument: "error.html",
        publicReadAccess: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY // NOT recommended for production code
      });
    new cdk.CfnOutput(this, "Bucket", { value: siteBucket.bucketName });

    // TLS certificate
    const certificateArn = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: siteDomain,
        hostedZone: zone
      }
    ).certificateArn;
    new cdk.CfnOutput(this, "Certificate", { value: certificateArn });

    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        aliasConfiguration: {
          acmCertRef: certificateArn,
          names: [siteDomain],
          sslMethod: cloudfront.SSLMethod.SNI,
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016
        },
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket
            },
            behaviors: [{ isDefaultBehavior: true }]
          }
        ]
      }
    );
    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId
    });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: siteDomain,
      target: route53.AddressRecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset("./" + props.directory)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"]
    });
  }
}
