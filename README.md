# General

This project is build with AWS SAM. The CloudFormation structure is definied in template.yml.

## Get the AWS API Gateway URL

> The URL will be changed if you delete the stack and recreate as example

1. Go to your lambda function https://eu-central-1.console.aws.amazon.com/lambda/...
2. Click on the tab "Configuration"
3. Click on the tab "Triggers"
4. In the list should be an API Gateway. The link behind "API endpoint:" is the current public URL.

## How to test local

> Your have to install Docker because SAM will create containers

### Invoke with an event

You can invoke your function with a predefined event (json format).
How to coming soon...

### Test API local

1. Run `sam build` to compile the code
2. Run `sam local start-api` to run the api
   Now you can test your api (default is localhost:3000) via Postman, Curl etc.

# Authorization

The API Gateway endpoints are protected through an API key

## Get the API key

1. Go to your lambda function https://eu-central-1.console.aws.amazon.com/lambda/...
2. Click on the tab "Configuration"
3. Click on the tab "Triggers"
4. In the list should be an API Gateway. Click on "Details"
5. Copy the "API key: "

# Endpoints

## POST

### Request

| Path | Body                                                                                                                                                                                                 | Success response          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| /    | {</br>emailTemplate: "Name of SES Template",</br> destinationAddress: "E-Mail Address of destination",</br>templateData: {templateKey:templateValue}</br>messageTag:{"email-api-tracking":key}</br>} | 200. E-Mail has been sent |

### Response

| Type         | HTTP status code | Body                                                                                                                                                                                                                    |
| ------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OK           | 200              | E-Mail sent                                                                                                                                                                                                             |
| Bad Request  | 400              | String with explanation                                                                                                                                                                                                 |
| Server Error | 500              | Server error happened. [Check cloudwatch logs](https://eu-central-1.console.aws.amazon.com/cloudwatch/...) |
# email-api
