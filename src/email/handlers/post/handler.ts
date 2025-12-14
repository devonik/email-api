import { handler } from "./consumer";
import { Context, APIGatewayProxyEvent } from "aws-lambda";
import { postHandler } from "./post";
import { EmailApiPayload } from "../../../types";

exports.handleRequest = async (event: EmailApiPayload | APIGatewayProxyEvent, context: Context, callback: Function) => {
  const apiEvent = event as APIGatewayProxyEvent
  if (apiEvent.httpMethod) return postHandler(event, context, callback);

  const invocationEvent = event as EmailApiPayload;
  await handler(invocationEvent, context);
  
  return undefined;
};
