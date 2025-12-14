import { Context } from 'aws-lambda'

export const contextMock: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test/collect',
    functionVersion: '1.0.0',
    invokedFunctionArn: 'test',
    memoryLimitInMB: 'test',
    awsRequestId: 'test',
    logGroupName: 'test',
    logStreamName: 'test',

    getRemainingTimeInMillis: () => 1,
    done: () => null,
    fail: () => null,
    succeed: () => null
}