import { extendType, nonNull, objectType, stringArg } from "nexus";
import { errors, throwError } from "../utils/error";
import { generateToken } from "../utils/context";
import { APP_REFRESH_SECRET, APP_SECRET, regexPattern } from "../utils/constants";
import { verify } from "jsonwebtoken";
import { Token } from "../types";
import { add, differenceInMinutes, isAfter } from "date-fns";
import { getRandomVerificationNumber } from "../utils/local/phone-verification";

export const t_token = objectType({
    name: "SignInType",
    definition(t) {
        t.nonNull.string("accessToken");
        t.nonNull.string("refreshToken");
    }
})

export const mutation_auth = extendType({
    type: "Mutation",
    definition(t) {
        t.field("renewToken", {
            type: "SignInType",
            args: {
                accessToken: nonNull(stringArg()),
                refreshToken: nonNull(stringArg()),
            },
            resolve: async (src, args, ctx, info) => {
                try {
                    let accessToken = "";
                    let refreshToken = "";
                    try {
                        const accessTokenInfo = verify(args.accessToken, APP_SECRET, { ignoreExpiration: true }) as Token;
                        const now = Date.now() / 1000;
                        if (now - accessTokenInfo.exp <= 0) return null;
                        const refreshTokenInfo = verify(args.refreshToken, APP_REFRESH_SECRET, { algorithms: ["HS512"] }) as Token;
                        if (refreshTokenInfo.userId) {
                            if (accessTokenInfo.userId != refreshTokenInfo.userId) throw errors.etc("유효한 토큰이 아닙니다.");
                            const user = await ctx.prisma.user.findUnique({ where: { id: refreshTokenInfo.userId } });
                            if (!user) throw errors.notAuthenticated;
                            accessToken = generateToken(refreshTokenInfo.userId, "userId", false);
                            refreshToken = generateToken(refreshTokenInfo.userId, "userId", true);
                        }
                    }
                    catch (e) {
                        console.log(e);
                        throw errors.etc("유효한 토큰이 아닙니다.");
                    }
                    return { accessToken, refreshToken };
                } catch (error) {
                    return throwError(error, ctx);
                }
            }
        });

        t.field("requestPhoneVerificationByEveryone", {
            type: nonNull("Boolean"),
            args: {
                phoneNumber: nonNull(stringArg())
            },
            resolve: async (src, args, ctx, info) => {
                try {
                    if (!regexPattern.phone.test(args.phoneNumber)) throw errors.etc("휴대폰 번호 형식이 잘못되었습니다.");
                    const phone = args.phoneNumber.replace(regexPattern.phone, "0$1$2$3");
                    const verification = await ctx.prisma.phoneVerification.findFirst({ where: { phone }, orderBy: { expiredAt: "desc" } });
                    if (verification) {
                        if (differenceInMinutes(new Date(), verification.createdAt) < 1) throw errors.etc("잠시 후에 다시 시도해주세요.");
                    }

                    // Toast 없는 경우
                    const verificationNumber = getRandomVerificationNumber();

                    // console.log(`인증 번호 발송) ${phone} : ${verificationNumber}`);

                    // Toast 있는 경우
                    /*
                    const verificationNumber = await sendAuthSms({
                        receiverPhone: phone,
                    });
                    */

                    if (!verificationNumber) throw errors.etc("인증번호 발송에 실패했습니다.");

                    await ctx.prisma.phoneVerification.create({ data: { phone, verificationNumber, expiredAt: add(new Date(), { minutes: 3 }) } });


                    // Toast 있는 경우 주석처리 혹은 삭제
                    throw errors.etc(`인증번호는 [${verificationNumber}] 입니다.\nToast API 정보가 없어서 실제 SMS 발송을 진행할 수 없습니다.`);

                    return true;
                } catch (error) {
                    return throwError(error, ctx);
                }
            }
        });
        t.field("verifyPhoneByEveryone", {
            type: nonNull("Int"),
            args: {
                phoneNumber: nonNull(stringArg()),
                verificationNumber: nonNull(stringArg()),
            },
            resolve: async (src, args, ctx, info) => {
                try {
                    if (!regexPattern.phone.test(args.phoneNumber)) throw errors.etc("휴대폰 번호 형식이 잘못되었습니다.");
                    const phone = args.phoneNumber.replace(regexPattern.phone, "0$1$2$3");
                    const verification = await ctx.prisma.phoneVerification.findFirst({ where: { phone, verificationNumber: args.verificationNumber } });
                    if (!verification) throw errors.etc("인증 정보가 없거나 만료되었습니다. 다시 시도해주세요.");
                    // if (verification.expiredAt === null) throw errors.etc("이미 인증되었습니다.");
                    if (verification.expiredAt && isAfter(new Date(), verification.expiredAt)) {
                        await ctx.prisma.phoneVerification.delete({ where: { id: verification.id } });
                        throw errors.etc("인증 정보가 없거나 만료되었습니다. 다시 시도해주세요.");
                    }
                    await ctx.prisma.phoneVerification.update({ where: { id: verification.id }, data: { expiredAt: null } });
                    return verification.id;
                } catch (error) {
                    return throwError(error, ctx);
                }
            }
        });
    }
})