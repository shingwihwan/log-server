import { PrismaClient } from '@prisma/client'
import { sign, verify } from 'jsonwebtoken'
import { Context, IJWTTokenBase, ITokenExpirationInfo, Token } from '../types'
import { APP_REFRESH_SECRET, APP_SECRET, tokens } from './constants'
import { ExpressContext, PubSub } from 'apollo-server-express';
// import Redis, { RedisOptions } from 'ioredis' // redis 사용시 활성화
// import { RedisPubSub } from 'graphql-redis-subscriptions'; // redis 사용시 활성화


export const issuerType = ["userId", "adminId"] as const;
type IssuerType = typeof issuerType[number];
type IJWTTokenType = IJWTTokenBase & {
    [key in IssuerType]?: number;
} & {
    //JWT 토큰에 추가적으로 들어갈 수 있는 내용을 optional하게 기입
    // isSuperAdmin?: number;
};


export const generateToken = (id: number, type: IssuerType, isRefresh: boolean) => {
    const privateClaim: Omit<IJWTTokenType, "iat" | "exp"> = {}
    if (!isRefresh) {
        privateClaim[type] = id;
        return sign(
            privateClaim,
            APP_SECRET,
            {
                expiresIn: tokens.access.expiry,
            }
        )
    }
    else {
        privateClaim[type] = id;
        privateClaim.isRefresh = true;
        return sign(
            privateClaim,
            APP_REFRESH_SECRET,
            {
                expiresIn: tokens.access.refreshExpiry,
                algorithm: "HS512"
            }
        )
    }
}

export const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
    ],
})

const pubsub = new PubSub();

// const redisOption: RedisOptions = {
//     host: REDIS_HOST,
//     port: +REDIS_PORT,
//     password: REDIS_SECRET,
//     retryStrategy: times => {
//         return Math.min(times * 50, 2000);
//     }
// }
// const pubsub = new RedisPubSub({
//     publisher: new Redis(redisOption),
//     subscriber: new Redis(redisOption),
// });



export const createContext = async (ctx: ExpressContext): Promise<Context> => {
    let token: Token | null = null;
    const tokenExpirationInfo: ITokenExpirationInfo = {};
    let tokenString: string | null = null;
    try {
        let authorization = ''
        try {
            // for queries and mutations
            authorization = ctx.req.get('Authorization') ?? "";
        } catch (e) {
            // specifically for subscriptions as the above will fail
            authorization = ctx.connection?.context?.Authorization ?? "";
        }
        if (!authorization.startsWith("Bearer ")) {
            authorization = "";
        }
        tokenString = authorization !== '' ? authorization.replace('Bearer ', '') : null;
        let verifiedToken: IJWTTokenType | null = null;
        let defaultTokenInfo: IJWTTokenBase | null = null;
        if (tokenString) {
            try {
                verifiedToken = verify(tokenString, APP_SECRET) as IJWTTokenType;
                let someoneCheck = 0;
                for (const type of issuerType) {
                    if (verifiedToken[type]) someoneCheck++;
                }
                if (someoneCheck !== 1) throw new Error("잘못된 토큰입니다.");
                defaultTokenInfo = {
                    iat: verifiedToken.iat,
                    exp: verifiedToken.exp,
                    isRefresh: verifiedToken.isRefresh,
                };
            }
            catch (e) {
                if (e instanceof Error && e.name === 'TokenExpiredError') {
                    tokenExpirationInfo.isExpired = true;
                }
                throw e;
            }

            if (verifiedToken.userId) {
                // 유저가 유효한지 prisma를 통해 검증

                // if (!user || user.state !== 'ACTIVE') {
                //     token = null;
                // }
                // else {
                //     token = {
                //         ...defaultTokenInfo,
                //         userId: verifiedToken.userId,
                //         // user일 때 추가적으로 설정해줄 값 설정
                //     }
                // }



            }
            else if (verifiedToken.adminId) {
                // 관리자가 유효한지 prisma를 통해 검증
                // const admin = await prisma.admin.findUnique({ where: { id: verifiedToken.adminId }, select: { state: true } });
                // if (!admin || admin.state !== 'ACTIVE') {
                //     token = null;
                // }
                // else {
                //     token = {
                //         ...defaultTokenInfo,
                //         adminId: verifiedToken.adminId,
                //         // admin일 때 추가적으로 설정해줄 값 설정
                //     }
                // }
            }
            else {
                token = null;
            }
        }
    } catch (e) {
        token = null;
    }
    return {
        ...ctx,
        prisma,
        pubsub,
        token,
        tokenExpirationInfo,
        tokenString,
    } as Context;
}