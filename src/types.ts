export type EmailApiPayload = {
    heilandTraceId: string;
    sendingEmailAddress: string;
    destinationAddress?: string;
    destinations?: Array<string>;
    emailTemplate?: string;
    html?: string;
    messageTag?: Record<string, string>;
    subject?: string;
    templateData?: Record<string, string>;
    text?: string;
};
export interface StateMashineEvent {
  path: string;
  startedByStateMachine: boolean;
  executionArn: string
}