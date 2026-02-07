# AWS Lambda Deployment Guide

This guide explains how to deploy the `get_medical_device_details` Lambda function and configure it with API Gateway and Secrets Manager.

## Prerequisites
1.  An AWS account with access to IAM, Lambda, API Gateway, and Secrets Manager.
2.  The AWS CLI installed and configured on your local machine.
3.  The `zip` command-line tool.

## Step 1: Store the API Key in AWS Secrets Manager

First, you need to securely store the `data.go.kr` API key in AWS Secrets Manager.

1.  Navigate to the **AWS Secrets Manager** console.
2.  Click **"Store a new secret"**.
3.  For **"Secret type"**, choose **"Other type of secret"**.
4.  In the **"Key/value pairs"** section, create one key:
    *   **Key**: `MED_DEVICE_API_KEY`
    *   **Value**: *Paste your actual `data.go.kr` service key here.*
5.  Click **Next**.
6.  For the **"Secret name"**, enter `prod/MedicalDeviceApiKey`. This must match the `secret_name` in the Lambda function code.
7.  Click **Next**, configure rotation if needed (or disable), and then click **"Store"** to save the secret.

## Step 2: Package the Lambda Function

The provided `package_lambda.sh` script automates the process of packaging your Lambda function and its dependencies.

1.  Open your terminal and navigate to the project root directory.
2.  Run the packaging script:
    ```bash
    ./lambda/package_lambda.sh
    ```
3.  This will create a `get_medical_device_details.zip` file inside the `lambda` directory.

## Step 3: Create the IAM Role for the Lambda Function

Your Lambda function needs permission to read secrets from Secrets Manager and write logs to CloudWatch.

1.  Navigate to the **IAM** console.
2.  Go to **Roles** and click **"Create role"**.
3.  For **"Trusted entity type"**, select **"AWS service"**.
4.  For **"Use case"**, choose **"Lambda"** and click **Next**.
5.  On the **"Add permissions"** page, search for and add the following two policies:
    *   `AWSLambdaBasicExecutionRole` (allows writing logs to CloudWatch)
    *   `SecretsManagerReadWrite` (you can create a more restrictive custom policy that only allows reading the specific secret you created).
6.  Click **Next**.
7.  Give the role a name (e.g., `MedicalDeviceLambdaRole`) and click **"Create role"**.

## Step 4: Create the Lambda Function

Now you will create the Lambda function in the AWS console.

1.  Navigate to the **AWS Lambda** console.
2.  Click **"Create function"**.
3.  Select **"Author from scratch"**.
4.  **Basic information**:
    *   **Function name**: `getMedicalDeviceDetails`
    *   **Runtime**: `Python 3.9` (or a later supported version)
    *   **Architecture**: `x86_64`
5.  **Permissions**:
    *   Expand **"Change default execution role"**.
    *   Select **"Use an existing role"**.
    *   Choose the `MedicalDeviceLambdaRole` you created in the previous step.
6.  Click **"Create function"**.
7.  **Upload the code**:
    *   In the **"Code source"** section, click the **"Upload from"** button.
    *   Select **".zip file"**.
    *   Upload the `get_medical_device_details.zip` file created in Step 2.
    *   Click **"Save"**.

## Step 5: Create the API Gateway Trigger

To make the Lambda function accessible via a URL, you need to set up an API Gateway trigger.

1.  In your `getMedicalDeviceDetails` Lambda function's page, click **"Add trigger"**.
2.  Select **"API Gateway"** from the list of services.
3.  Choose **"Create a new API"**.
4.  Select **"HTTP API"** for the API type (it's simpler and cheaper than REST API).
5.  For **"Security"**, select **"Open"**. The function handles CORS.
6.  Click **"Add"**.
7.  After the trigger is created, the API Gateway will have an **"API endpoint"** URL. This is the URL you will use in your frontend application.

## Step 6: Update the Frontend

1.  Copy the **API endpoint URL** from the API Gateway trigger.
2.  Open `product.service.js` in your project.
3.  Update the `fetchProductDetailsFromExternalApi` method to use this new URL. You will need to replace the Firebase Functions logic with a `fetch` call to your new API Gateway endpoint.
