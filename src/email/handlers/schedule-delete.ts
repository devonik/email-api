import { initializeHandler as initialize } from "@heiland/lambda-lib-helper";
import service from "../service";
import { Context, APIGatewayProxyEvent } from "aws-lambda";

const requiredPathParameter = ["executionArn"];

function serverErrorResponse() {
  return {
    statusCode: 500,
    body: "Could not stop step function execution. Check logs for details",
  };
}

/** @type {import("aws-lambda").Handler} */
exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const { logger, pathParameters, response } = initialize({
    expectedMethod: "DELETE",
    requiredPathParameter,
    handlerEvent: event as APIGatewayProxyEvent,
    context,
  });
  if (response) return response;


  const cause =
    event.queryStringParameters && event.queryStringParameters.cause
      ? event.queryStringParameters.cause
      : "Stopped by lambda email api /email/{executionArn}";

  try {
    await service.stopScheduledEmail({
      executionArn: pathParameters?.executionArn,
      cause,
    });
  } catch (error) {
    logger.error("Could not stopScheduledEmail. Error: ", error);
    return serverErrorResponse();
  }

  const responseDto = {
    statusCode: 200,
    body: "OK",
  };

  // All log statements are written to CloudWatch
  logger.info(
    `response from: ${event.path} statusCode: ${responseDto.statusCode} body: ${responseDto.body}`,
  );
  return responseDto;
};
