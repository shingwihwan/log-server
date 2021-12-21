import { ApolloError, AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express'
import { Context } from '../types'


export function getDebugInfo(ctx: Context) {
    const body = ctx.req?.body;
    const tokenString = ctx.tokenString;
    const token = ctx.token;
    const variables = JSON.stringify(ctx.req?.body.variables)
    const query = JSON.stringify(ctx.req?.body.query)
    return { body, tokenString, token, variables, query }
}

export const throwError = (error: any, ctx: Context | null) => {
    if (ctx) {
        const info = getDebugInfo(ctx);
        console.log({ error, info, timestamp: new Date().toString() })
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


export const errors = {
    etc: (msg: string, code?: string) => new CustomError(msg, code ?? "BAD_USER_INPUT"),
    notAuthenticated: new AuthenticationError('인증이 필요합니다.'),
    notAuthenticatedExpired: new AuthenticationExpiredError('인증이 만료되었습니다.'),
    forbidden: new ForbiddenError('접근이 거부되었습니다.'),
    noSuchData: new UserInputError('요청한 데이터가 존재하지 않습니다.'),
    invalidUser: new UserInputError('존재하지 않는 아이디이거나 비밀번호가 틀렸습니다.'),
}
