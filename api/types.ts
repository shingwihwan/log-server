import { PrismaClient } from '@prisma/client'
import { PubSub } from 'apollo-server-express'
import { Request, Response } from 'express'
import { DocumentNode, GraphQLSchema } from 'graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { IncomingMessage } from 'http'

export { FileUpload } from "graphql-upload";


declare global {
    type MaybePromise<T> = PromiseLike<T> | T;
    type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
    type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
    type Nullable<T> = T | null;
    type Maybe<T> = T | null | undefined;
    type ArrayOrObject<T> = T | Array<T>;
}

interface ExecutionParams<TContext = any> {
    query: string | DocumentNode;
    variables: {
        [key: string]: any;
    };
    operationName: string;
    context: TContext;
    formatResponse?: Function;
    formatError?: Function;
    callback?: Function;
    schema?: GraphQLSchema;
}


export interface ITokenExpirationInfo {
    isExpired?: boolean;
    isBanned?: boolean;
    isWithdrawed?: boolean;
}
export interface Context {
    prisma: PrismaClient;
    req: Request;
    connection?: ExecutionParams;
    res: Response;
    pubsub: PubSub;
    token: Token | null;
    tokenString: string | null;
}

export interface IJWTTokenBase {
    isRefresh?: boolean;
    iat: number;
    exp: number;
    //aud: string;
}

export type Token =
    IUserTokenInfo &
    IAdminTokenInfo &
    IJWTTokenBase;



type IUserTokenInfo = XOR<{
    userId?: undefined;
}, {
    userId: number;
}>

type IAdminTokenInfo = XOR<{
    adminId?: undefined;
}, {
    adminId: number;
}>
