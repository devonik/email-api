// sum.test.js
import { expect, expectTypeOf, test, vi } from "vitest"
import { ERROR_MESSAGE_MISSING_DESTINATIONS, ERROR_MESSAGE_MISSING_EMAIL_META_DATA, ERROR_MESSAGE_MISSING_TEMPLATING_DATA, handler } from "../src/email/handlers/post/consumer"
import { Context } from "aws-lambda";
import { EmailApiPayload } from "../src/types"
import { contextMock } from "./mocks";
import * as service from '../src/email/service/index.js'

const spyEmail = vi.spyOn(service, 'sendEmail')
const spyBulkEmail = vi.spyOn(service, 'sendBulkEmail')

vi.stubEnv('STAGE', 'DEV')

test("consumer.handler expects correct parameter", () => {
    expectTypeOf(handler).toBeFunction()
    expectTypeOf(handler).parameter(0).toMatchTypeOf<EmailApiPayload>()
    expectTypeOf(handler).parameter(1).toMatchTypeOf<Context>()
})

test("consumer.handler throw error message when destinationAddress is missing but destinations is not undefined", () => {
    let payload = { destinations: [], heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address", emailTemplate: "template", templateData: {"a": "b"}} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_DESTINATIONS))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test("consumer.handler throw error message when destinations is missing and destinationAddress is undefined", () => {
    let payload = { destinationAddress: "", heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address", emailTemplate: "template", templateData: {"a": "b"}} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_DESTINATIONS))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test("consumer.handler throw error message when destinations is empty", () => {
    let payload = { destinations: [], heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address", emailTemplate: "template", templateData: {"a": "b"}} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_DESTINATIONS))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test("consumer.handler throw error message when emailTemplate is missing but templateData is not undefined", () => {;
    let payload = { templateData: {"a": "b"}, destinationAddress: "destination@address.de", heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address"} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_TEMPLATING_DATA))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test("consumer.handler throw error message when templateData is missing but emailTemplate is not undefined", () => {
    let payload = { emailTemplate: "template", destinationAddress: "destination@address.de", heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address"} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_TEMPLATING_DATA))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test('consumer.handler throw error message when subject is missing but text and html is not undefined', () => {
    let payload = { text: "text", html: "html", destinationAddress: "destination@address.de", heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address"} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_EMAIL_META_DATA))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test('consumer.handler throw error message when text and html is missing', () => {
    let payload = { subject: "subject", destinationAddress: "destination@address.de", heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address"} as EmailApiPayload;
    expect(() => handler(payload, contextMock)).rejects.toThrow(new Error(ERROR_MESSAGE_MISSING_EMAIL_META_DATA))

    expect(spyEmail).toHaveBeenCalledTimes(0)
    expect(spyBulkEmail).toHaveBeenCalledTimes(0)
})

test('consumer.handler check if sendEmail() is called at least once', () => {
    let payload = { templateData: {"a": "b"}, emailTemplate: "template", destinationAddress: "destination@address.de", heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address"} as EmailApiPayload;
    handler(payload, contextMock)

    expect(spyEmail).toHaveBeenCalled()
})

test('consumer.handler check if sendBulkEmail() is called at least once', () => {
    let payload = { templateData: {"a": "b"}, emailTemplate: "template", destinations: [""], heilandTraceId: "ab-cd-ef", sendingEmailAddress: "sending@email.address"} as EmailApiPayload;
    handler(payload, contextMock)

    expect(spyBulkEmail).toHaveBeenCalled()
})
