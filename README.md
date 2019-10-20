# What is this repo:

This repo contains AWS cdk scripts to deploy a static website using CloudFront and S3.

## Prerequisites

1.  Install the AWS sdk

```
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
```

2.  Set up your .env file with contents like this:

```
SERVICE_NAME=EggcentricFoodsFargateService
DOMAIN_NAME=eggcentricfoods.com
SUBDOMAIN=www
```

3.  Install dependencies `npm install`

4.  Set it up with `aws configure`

5.  Manual step - make sure your DOMAIN_NAME from .env has it's DNS set up to point to a Hosted Zone in AWS Route53.

## Okay, I'm ready to run it!

- To deploy infrastructure, run `./deploy.sh`
