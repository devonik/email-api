import  { initializeHandler as initialize } from "@heiland/lambda-lib-helper"
import  moment from "moment";
import service from "../service"
import { Context, APIGatewayProxyEvent } from "aws-lambda";

const requiredBodyParameter = [
  "executionDate",
  "emailTemplate",
  "templateData",
  "destinationAddress",
];
function serverErrorResponse() {
  return {
    statusCode: 500,
    body: "Could not post email reminder schedule. Check logs for details",
  };
}

/** @type {import("aws-lambda").Handler} */
exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const { logger, parsedRequestBody, response } = initialize({
    expectedMethod: "POST",
    requiredBodyParameter,
    handlerEvent: event,
    context,
  });
  if (response) return response;

  if (
    !moment(
      parsedRequestBody.executionDate,
      "YYYY-MM-DDTHH:mm:ssZ",
      true,
    ).isValid()
  ) {
    return {
      statusCode: 400,
      body: `Path param executionDate is not a valid Date. Format must be YYYY-MM-DDTHH:mm:ssZ`,
    };
  }

  let responseBody;
  try {
    responseBody = await service.scheduleEmail({
      requestBody: parsedRequestBody,
    });
    if (!responseBody) {
      // 500 = Internal Server Error
      return serverErrorResponse();
    }
  } catch (error) {
    logger.error("Could not schedule mail", error);
    return serverErrorResponse();
  }

  const responseDto = {
    statusCode: 200,
    body: JSON.stringify(responseBody),
  };

  // All log statements are written to CloudWatch
  logger.info(
    `response from: ${event.path} statusCode: ${responseDto.statusCode} body: ${responseDto.body}`,
  );
  return responseDto;
};
