
import aws from "@aws-sdk/client-ses";

const { SESClient, GetTemplateCommand, SendBulkTemplatedEmailCommand, SES } =
  aws;

const sesClient = new SESClient();
import {
  SFNClient,
  StartExecutionCommand,
  StopExecutionCommand,
} from "@aws-sdk/client-sfn";

const sfnClient = new SFNClient();
import { defaultProvider } from "@aws-sdk/credential-provider-node";

import ics from "ics";
import moment from "moment"
import handlebars from "handlebars"
import nodemailer from "nodemailer"
import json2csv from "json2csv"

import {
  Logger as WinstonLogger,
} from "winston";

const ses = new SES({
  apiVersion: "2010-12-01",
  defaultProvider,
});

interface IcsRequest {
  startDate: string;
  duration: {
    hours: number;
    minutes: number;
  };
  title: string;
  description?: string;
  location?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
    rsvp: boolean;
    partstat: string;
    role: string;
  }>; 
}
interface SendMailRequest {
  sendingEmailAddress: string;
  destinationAddress?: string;
  destinations?: Array<string>;
  emailTemplate?: string;
  html?: string;
  messageTag?: Record<string, string>;
  subject?: string;
  templateData?: Record<string, string>;
  text?: string;
  replyTo?: string;
  icsEvent?: IcsRequest;
  attachment: {
    filename?: string;
    format: string;
    data: unknown;
    options?: unknown;
  }
}
interface SendBulkMailRequest {
  sendingEmailAddress: string;
  destinations: Array<{
    Destination: {
      ToAddresses: Array<string>;
    };
    ReplacementTemplateData: string;
  }>;
  emailTemplate: string;
  messageTag?: Record<string, string>;
  templateData?: Record<string, string>;
}
interface ScheduleEmailRequest {
  executionDate: string;
  httpMethod: string;
}

async function createIcs(reqBodyEvent: IcsRequest) {
  if (reqBodyEvent === undefined) return null;

  if (!moment(reqBodyEvent.startDate, "YYYY-MM-DDTHH:mm:ss", true).isValid()) {
    throw new Error(
      "StartDate for ICS Event creation is not a valid. Format must be YYYY-MM-DDTHH:mm:ss",
    );
  }

  if (!reqBodyEvent.duration) {
    throw new Error(
      "The Duration for ICS Event creation is not defined.",
    );
  } else {
    if (typeof reqBodyEvent.duration !== "object") {
      throw new Error(
        "The Duration for ICS Event creation is not valid. Must be a JSON Object ~ like {hours: 1, minutes: 15}",
      );
    }

    if (
      reqBodyEvent.duration.hours === undefined ||
      reqBodyEvent.duration.hours < 0
    ) {
      throw new Error("Duration.hours is not set.");
    }
    if (!reqBodyEvent.duration.minutes) {
      throw new Error("Duration.minutes is not set.");
    }
  }

  if (!reqBodyEvent.title) {
    throw new Error(
      "The Title for ICS Event creation is not defined.",
    );
  }

  if (reqBodyEvent.organizer && typeof reqBodyEvent.organizer !== "object") {
    throw new Error(
      "The organizer for ICS Event creation is not valid. Must be a Object ~ like {name: 'Adam Gibbons', email: 'adam@example.com'}",
    );
  }

  if (reqBodyEvent.attendees && Array.isArray(reqBodyEvent.attendees)) {
    reqBodyEvent.attendees.forEach(() => {
      if (typeof reqBodyEvent.attendees !== "object") {
        throw new Error(
          "One attendee for ICS Event creation is not valid. Must be a Object ~ like { name: 'Adam Gibbons', email: 'adam@example.com', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }",
        );
      }
    });
  }

  const startDate = moment(reqBodyEvent.startDate);
  const event = {
    ...reqBodyEvent,
    startDate: undefined,
    start: [
      startDate.year(),
      startDate.month() + 1,
      startDate.date(),
      startDate.hours(),
      startDate.minutes(),
    ],
    startOutputType: "local",
  };

  const icsEvent = ics.createEvent(event);

  if (icsEvent.error) {
    throw new Error(
      `ICS Event creation failed: ${JSON.stringify(icsEvent.error.errors)}`,
    );
  }

  return icsEvent.value;
}

function buildAttachments({ logger, requestBody }: { logger: WinstonLogger; requestBody: SendMailRequest }) {
  const attachments = [];
  if (requestBody.attachment) {
    logger.info("...requestBody.attachment is set. Will build attachment");
    if (!requestBody.attachment.data)
      throw {
        message:
          "requestBody.attachment was given but cannot read requestBody.attachment.data",
        metadata: {
          attachment: requestBody.attachment,
        },
      };
    switch (requestBody.attachment.format) {
      case "csv":
        {
          logger.info(
            `...requestBody.attachment.format is set: [${requestBody.attachment.format}]. Will build attachment via json2csvParser`,
          );
          if (typeof requestBody.attachment.data !== "object")
            throw {
              message:
                "Cannot read requestBody.attachment.data. Has to be an object",
              metadata: {
                attachment: requestBody.attachment,
              },
            };
          let options;
          if (requestBody.attachment.options) {
            logger.info(
              "...requestBody.attachment.options is set. Will parse attachment data with options",
              {
                metadata: {
                  options: requestBody.attachment.options,
                },
              },
            );
            if (typeof requestBody.attachment.options !== "object")
              throw {
                message:
                  "Cannot read requestBody.attachment.options. Has to be an object",
                metadata: {
                  attachment: requestBody.attachment.options,
                },
              };
            options = requestBody.attachment.options;
          }

          let content;
          try {
            if (options)
              content = json2csv.parse(requestBody.attachment.data, options);
            else content = json2csv.parse(requestBody.attachment.data);

            logger.info("successfully parsed csv attachment");
          } catch (err) {
            throw {
              message:
                "Cannot json2csvParser.parse requestBody.attachment.data",
              stack: err,
              metadata: {
                ...requestBody.attachment,
                data: "Won't log data cause it's to big",
              },
            };
          }
          let filename = "list.csv";
          if (
            requestBody.attachment.filename &&
            requestBody.attachment.filename.includes(".")
          )
            filename = requestBody.attachment.filename;
          else if (requestBody.attachment.filename)
            filename = `${requestBody.attachment.filename}.${requestBody.attachment.format}`;

          attachments.push({
            filename,
            content,
          });
        }
        break;
      default:
        logger.warn(
          "Cannot read requestBody.attachment.format. Unknown format",
          {
            metadata: {
              attachment: requestBody.attachment,
            },
          },
        );
    }
  }
  return attachments;
}

const senderEmailLabel = process.env.SENDER_EMAIL_LABEL;

  /**
   *
   * @param logger
   * @param requestBody
   * @returns {Promise<*>}
   * Example:
   *        Attatchement CSV
   *        "attachment": {
                "filename": "list.csv",
                "format": "csv",
                 "data": {
                    "Column1": "test",
                    "Column2": "test1"
                 }
            },
   */
  export async function sendEmail({ logger, requestBody }: { logger: WinstonLogger; requestBody: SendMailRequest }) {
    // create Nodemailer SES transporter
    const transporter = nodemailer.createTransport({
      SES: { ses, aws },
    });

    let bccAddress = "mail@heiland.com";
    let messageTags = { "email-api-tracking": "email-api" };
    if (requestBody.messageTag) {
      if(requestBody.messageTag) messageTags = { ...messageTags, ...requestBody.messageTag};
      if (messageTags["email-api-tracking"]) {
        const suffix = messageTags["email-api-tracking"].split("-")[0];
        if (suffix) bccAddress = `mail+${suffix}@heiland.com`;
      }
    }

    let from = `${senderEmailLabel}<mail@heiland.com>`;
    if (requestBody.sendingEmailAddress) {
      from = `${senderEmailLabel}<${requestBody.sendingEmailAddress}>`;
      bccAddress = requestBody.sendingEmailAddress;
    }

    const mailConfig = {
      from,
      to: requestBody.destinationAddress,
      bcc: bccAddress,
      ses: {
        Tags: messageTags,
      },
      subject: "",
      html: "",
      text: "",
      replyTo: "",
      icalEvent: {},
      attachments: buildAttachments({ logger, requestBody }),
    };

    // If the email is templated then get template informations and fill it with handlebars
    if (requestBody.emailTemplate) {
      const tempResp = await sesClient.send(
        new GetTemplateCommand({ TemplateName: requestBody.emailTemplate }),
      );
      if(tempResp && tempResp.Template) {
        const subjectTemplate = handlebars.compile(tempResp.Template.SubjectPart);
        const bodyTemplate = handlebars.compile(tempResp.Template.HtmlPart);

        mailConfig.subject = subjectTemplate(requestBody.templateData);
        mailConfig.html = bodyTemplate(requestBody.templateData);
      }
      
    } else if (requestBody.html) mailConfig.html = requestBody.html;

    if (requestBody.subject) mailConfig.subject = requestBody.subject;
    if (requestBody.text) mailConfig.text = requestBody.text;

    // Add replyTo - default is clinicMail if given
    if (requestBody.replyTo) mailConfig.replyTo = requestBody.replyTo;
    else if (requestBody.templateData && requestBody.templateData.clinicMail)
      mailConfig.replyTo = requestBody.templateData.clinicMail;

    // Add ICS event if it's in request
    let icsEvent;
    if (requestBody.icsEvent) {
      icsEvent = await createIcs(requestBody.icsEvent);
    }
    if (icsEvent) {
      // termin-tierarztpraxis-staging-23-05-2022-a09-15.ics
      const clinicName = requestBody.templateData?.clinicName.replace(
        /\s/g,
        "-",
      );
      const date = requestBody.templateData?.appointmentStartDate.replace(
        /\./g,
        "-",
      );
      const time = requestBody.templateData?.appointmentStartTime.replace(
        /:/g,
        "-",
      );
      const filename = `termin-${clinicName?.toLowerCase()}-${date}-a-${time}.ics`;
      mailConfig.icalEvent = {
        filename,
        method: "PUBLISH",
        content: icsEvent,
      };
    }

    const response = await transporter.sendMail(mailConfig);

    if (!response || !response.messageId) {
      logger.error("Error occured for sending E-Mail", response);
      throw new Error(`Sending E-Mail is rejected because of <${response}>`);
    }

    return response.messageId;
  }
  export async function sendBulkEmail({ logger, requestBody }: { logger: WinstonLogger; requestBody: SendBulkMailRequest }) {
    let messageTags = { "email-api-tracking": "email-api" };
    if (requestBody.messageTag) messageTags = {...requestBody.messageTag, ...messageTags};
    
    const sentEmails = [];
    const sesResponses = [];

    let source = `${senderEmailLabel}<mail@heiland.com>`;
    if (requestBody.sendingEmailAddress) {
      source = `${senderEmailLabel}<${requestBody.sendingEmailAddress}>`;
    }

    logger.info(`we will send up to ${requestBody.destinations.length} emails`);

    while (sentEmails.length <= requestBody.destinations.length) {
      // there is a limit of 50 destinations by AWS SES.
      const destinations = requestBody.destinations.splice(0, 50);

      const params = {
        Template: requestBody.emailTemplate,
        DefaultTemplateData: JSON.stringify(requestBody.templateData),
        DefaultTags: messageTags,
        Destinations: destinations,
        Source: source,
      };

      const command = new SendBulkTemplatedEmailCommand(params);
      // eslint-disable-next-line no-await-in-loop
      sesResponses.push(await sesClient.send(command));

      logger.info(`... ${destinations.length} emails send`);

      // push destinations into sendEmails collection, otherwise we will end up in an endless loop...
      sentEmails.push(destinations);
    }

    return sesResponses;
  }

  export async function scheduleEmail({ requestBody } : { requestBody: ScheduleEmailRequest }) {
    // This ARN is defined by template.yml
    const stateMachineArn = process.env.STATE_MACHINE_ARN;
    if (!stateMachineArn)
      throw new Error(
        "Could not read ENV variable STATE_MACHINE_ARN. Be sure it's defined in template.yml",
      );
    const params = {
      stateMachineArn,
      input: JSON.stringify({
        executionDate: requestBody.executionDate,
        httpMethod: "POST",
        path: "/",
        body: requestBody,
      }),
    };
    const command = new StartExecutionCommand(params);
    return sfnClient.send(command);
  }
  export async function stopScheduledEmail({ executionArn, cause = "Stopped by email-api" }) {
    // This ARN is defined by template.yml
    const stateMachineArn = process.env.STATE_MACHINE_ARN;
    if (!stateMachineArn)
      throw new Error(
        "Could not read ENV variable STATE_MACHINE_ARN. Be sure it's defined in template.yml",
      );
    const params = {
      cause,
      executionArn,
    };
    const command = new StopExecutionCommand(params);
    return sfnClient.send(command);
  }

