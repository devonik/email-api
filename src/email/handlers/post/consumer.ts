/* eslint-disable import/no-import-module-exports */
import { Logger } from "@heiland/lambda-lib-helper";
import { StagedEnv } from "@heiland/lambda-lib-aws";
import { sendEmail, sendBulkEmail } from "../../service";
import { Context } from "aws-lambda"
import { EmailApiPayload } from "../../../types";

export const ERROR_MESSAGE_MISSING_PAYLOAD = "Event must contain a payload!";
export const ERROR_MESSAGE_MISSING_DESTINATIONS = "Missing parameter destinationAddress (for single mail) or destinations (for aws bulk mail)";
export const ERROR_MESSAGE_MISSING_TEMPLATING_DATA = "If you want to use templating then you have to provide 'emailTemplate' and 'templateData' within body";
export const ERROR_MESSAGE_MISSING_EMAIL_META_DATA = "If you don't want to use templating then you have to provide 'subject' and 'text' or 'html' within body";

function breakUp(message: string) {
  throw new Error(message);
}

export const handler = (async (event: EmailApiPayload, context: Context) => {
  const sEnv = new StagedEnv(context);
  const traceId = event.heilandTraceId
      ? event.heilandTraceId
      : undefined;
  const heiLogger = new Logger({
      stage: sEnv.getStage(),
      lambdaContext: context,
      traceId,
  });
  const logger = heiLogger.getLogger();

  process.removeAllListeners("uncaughtException");
  process.on("uncaughtException", (error) => {
    logger.error("uncaughtException from lambda entrypoint", {
      stack: error,
    });
  });

  if (!event.destinationAddress && (!event.destinations || event.destinations.length === 0))
    breakUp(
      ERROR_MESSAGE_MISSING_DESTINATIONS,
    );

  const isTemplateEmail = event.emailTemplate || event.templateData;
  if (isTemplateEmail) {
    // If email should be template validate body with requirements
    if (
      (event.emailTemplate && !event.templateData) ||
      (!event.emailTemplate && event.templateData)
    )
      breakUp(
        ERROR_MESSAGE_MISSING_TEMPLATING_DATA,
      );
    // Do not log templateData plane because it can contain big data
    logger.info("Starting lambda with event:", {
      details: {
        emailTemplate: event.emailTemplate,
        templateData: !!event.templateData,
      },
    });
  } else {
    // If email should not be template validate body with requirements
    if (!event.subject || (!event.text && !event.html))
      breakUp(
        ERROR_MESSAGE_MISSING_EMAIL_META_DATA,
      );
    logger.info("Starting lambda with event:", {
      details: {
        subject: event.subject,
        text: event.text,
        html: event.html,
      },
    });
  }

  let responseBody;
  try {
    if (event.destinationAddress)
      responseBody = await sendEmail({
        logger,
        requestBody: event,
      });
    else if (event.destinations)
      responseBody = await sendBulkEmail({
        logger,
        requestBody: event,
      });
  } catch (error: any) {
    logger.error("Could not send mail via aws ses", error);
    breakUp(error.message);
  }

  const responseDto = {
    statusCode: 200,
    body: JSON.stringify(responseBody),
  };

  // All log statements are written to CloudWatch
  logger.info(
    `response statusCode: ${responseDto.statusCode} body: ${responseDto.body}`,
  );

  return responseDto;
});