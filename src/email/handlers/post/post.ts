import { initializeHandler as initialize } from "@heiland/lambda-lib-helper";
import service from "../../service";
import { Context, APIGatewayProxyEvent } from "aws-lambda";
import { StateMashineEvent } from "../../../types";

const requiredBodyParameter: string[] = [];
let startedByStateMachine: boolean = false;

function serverErrorResponse(error: unknown) {
  if (startedByStateMachine) {
    // eslint-disable-next-line no-throw-literal
    throw {
      message: "Could not post email. Check logs for details",
      stack: error,
    };
  }
  return {
    statusCode: 500,
    body: "Could not post email. Check logs for details",
  };
}

/** @type {import("aws-lambda").Handler} */
exports.postHandler = async (event: APIGatewayProxyEvent | StateMashineEvent, context: Context) => {
  const { logger, parsedRequestBody, response } = initialize({
    expectedMethod: "POST",
    requiredBodyParameter,
    handlerEvent: event as APIGatewayProxyEvent,
    context,
    logEvent: false,
  });
  if (response) return response;

  startedByStateMachine = (event as StateMashineEvent).startedByStateMachine || false;

  if (
    !parsedRequestBody.destinationAddress &&
    !parsedRequestBody.destinations
  ) {
    logger.warn("Cannot send email cause bad request", {
      stack:
        "Missing parameter destinationAddress (for single mail) or destinations (for aws bulk mail)",
    });
    return {
      statusCode: 400,
      body: "If you want to use templating then you have to provide 'emailTemplate' and 'templateData' within body",
    };
  }
  const isTemplateEmail =
    parsedRequestBody.emailTemplate || parsedRequestBody.templateData;
  if (isTemplateEmail) {
    // If email should be template validate body with requirements
    if (
      (parsedRequestBody.emailTemplate && !parsedRequestBody.templateData) ||
      (!parsedRequestBody.emailTemplate && parsedRequestBody.templateData)
    ) {
      logger.warn("Cannot send email cause bad request", {
        stack:
          "If you want to use templating then you have to provide 'emailTemplate' and 'templateData' within body",
      });
      return {
        statusCode: 400,
        body: "If you want to use templating then you have to provide 'emailTemplate' and 'templateData' within body",
      };
    }
    // Do not log templateData plane because it can contain big data
    logger.info("Starting lambda with event:", {
      details: {
        emailTemplate: parsedRequestBody.emailTemplate,
        templateData: !!parsedRequestBody.templateData,
      },
    });
  } else {
    // If email should not be template validate body with requirements
    if (
      !parsedRequestBody.subject ||
      (!parsedRequestBody.text && !parsedRequestBody.html)
    ) {
      logger.warn("Cannot send email cause bad request", {
        stack:
          "If you don't want to use templating then you have to provide 'subject' and ('text' or 'html' within body",
      });
      return {
        statusCode: 400,
        body: "If you don't want to use templating then you have to provide 'subject' and ('text' or 'html' within body",
      };
    }
    logger.info("Starting lambda with event:", {
      details: {
        subject: parsedRequestBody.subject,
        text: parsedRequestBody.text,
        html: parsedRequestBody.html,
      },
    });
  }

  let responseBody;
  try {
    if (parsedRequestBody.destinationAddress)
      responseBody = await service.sendEmail({
        logger,
        requestBody: parsedRequestBody,
      });
    else if (parsedRequestBody.destinations)
      responseBody = await service.sendBulkEmail({
        logger,
        requestBody: parsedRequestBody,
      });
  } catch (error) {
    logger.error("Could not send mail via aws ses", error);
    return serverErrorResponse(error);
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
// a comment to generate a new version
// a comment to generate a new version
