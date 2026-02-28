#!/bin/bash
awslocal dynamodb create-table \
  --table-name spike-land-kv \
  --attribute-definitions AttributeName=pk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

awslocal s3 mb s3://spike-land-storage
echo "LocalStack init complete"
