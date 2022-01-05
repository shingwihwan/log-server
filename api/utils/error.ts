import { ApolloError, AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express'
import { verify } from 'jsonwebtoken';
import fetch from 'node-fetch';
import * as util from 'util';
import { Context, Token } from '../types';
import { APP_SECRET } from './constants';

async function errorToLogServer(e: Object, debugInfo: any, resolveInfo: any) {
    // if (!process.env.DEBUG_SLACK_URL || !process.env.DEBUG_SLACK_SERVER_NAME) return;
    const data = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": util.inspect(debugInfo, { maxStringLength: 1000 })
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": util.inspect(e, { maxStringLength: 2000 })
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": util.inspect(resolveInfo, { maxStringLength: 1000 })
                }
            }
        ]
    }

    let serverName = process.env.CUSTOM_ENDPOINT?.split("/")[0];
    if (!serverName) {
        serverName = process.env.DATABASE_URL?.split("/").pop();
    }

    await fetch("http://localhost:3000/logger/" + serverName, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => {
        if (res.status >= 200 && res.status <= 299 || res.ok) {
            return res.status;
        } else {
            throw new Error('Network response was not ok.');
        }
    }).catch((err) => {
        console.log(err);
    });
}


export function getDebugInfo(ctx: Context) {
    const body = ctx.req?.body;
    const tokenInfo = ctx.token;
    const token = ctx.req?.headers?.authorization?.replace("Bearer ", "");
    const query = JSON.stringify(ctx.req?.body.query)
    let verifiedToken: Token | null = null;
    if (token) {
        verifiedToken = verify(token, APP_SECRET) as Token;
    }
    const variables = JSON.stringify(ctx.req?.body.variables)
    return { body, tokenInfo, token, variables, query, verifiedToken }
}

export function getResolveInfo(info: any) {
    const fieldName = info.fieldName;
    const typeName = info.path.typename;
    const returnType = info.returnType;
    const infoPath = info.path;
    return { fieldName, typeName, returnType }
}

export const throwError = (error: any, ctx: Context | null, info: any) => {

    // password 부분 마스킹 정규식
    // const masking: string = ctx?.req.body.query;
    // const indexPass = masking.indexOf("password");
    // const regex = /password: "/g
    // // console.log(regex.exec(masking));
    // console.log(indexPass);

    const eMessage: string = error.message.trim();
    if (ctx) {
        const infoPath = info.path;
        if (error instanceof MatchPasswordError) {
            console.log({ error, timestamp: new Date().toString(), infoPath });
        } else {
            const debugInfo = getDebugInfo(ctx);
            console.log({ error, debugInfo, timestamp: new Date().toString(), infoPath });
        }
    }
    if (error instanceof ApolloError) {
        const eName: string = error.name.trim();
        const eNameMessage = eName + ": " + eMessage;
        const eExtensionsCode = error.extensions;
        const errorData = {
            "eNameMessage": eNameMessage,
            "eExtensionCode": eExtensionsCode,
        }
        errorToLogServer(errorData, ctx ? getDebugInfo(ctx) : null, getResolveInfo(info));
    }
    throw error;
}

export class CustomError extends ApolloError {
    constructor(message: string, code: string) {
        super(message, code);

        Object.defineProperty(this, 'name', { value: 'CustomError' });
    }
}

export class AuthenticationExpiredError extends ApolloError {
    constructor(message: string) {
        super(message, 'TOKEN_EXPIRED');

        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}

export class InvalidUserInputError extends ApolloError {
    constructor(message: string) {
        super(message, 'INVALID_USER_INPUT');

        Object.defineProperty(this, 'name', { value: 'InvalidError' });
    }
}

export class MatchPasswordError extends ApolloError {
    constructor(message: string) {
        super(message, 'NOT_MATCH_PASSWORD');

        Object.defineProperty(this, 'name', { value: 'MatchPasswordError' });
    }
}


export const errors = {
    etc: (msg: string, code?: string) => new CustomError(msg, code ?? "BAD_USER_INPUT"),
    notAuthenticated: new AuthenticationError('인증이 필요합니다.'),
    notAuthenticatedExpired: new AuthenticationExpiredError('인증이 만료되었습니다.'),
    forbidden: new ForbiddenError('접근이 거부되었습니다.'),
    noSuchData: new UserInputError('요청한 데이터가 존재하지 않습니다.'),
    invalidUser: new UserInputError('존재하지 않는 아이디이거나 비밀번호가 틀렸습니다.'),
    notMatchPassword: new MatchPasswordError('비밀번호가 일치하지 않습니다. 다시 한번 확인해주세요.'),
}
