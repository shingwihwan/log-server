import { withFilter } from "apollo-server-express";
import { intArg, nonNull, queryField, subscriptionField } from "nexus";
import { Context } from "nexus-plugin-prisma/typegen";
import { ArgsValue } from "nexus/dist/typegenTypeHelpers";
import { errors, throwError } from "../../utils/error";
import { withCancel } from "../../utils/helpers";
import { getAuthorizationInfoFromToken } from "../../utils/local/get-token";

export const queryTokenTest = subscriptionField("subscribeTest", {
    type: "Boolean",
    subscribe: async (root, args, ctx) => {
        try {
            const token = getAuthorizationInfoFromToken(args.authorizationToken);
            if (token) {
                ctx.token = token;
                console.log("토큰입니당", ctx.token)
            }

            console.log("subscribeTest connect : ", `user_1`);
            return withFilter(
                (root, args, ctx) => withCancel(ctx.pubsub.asyncIterator(`company_1`), () => { console.log("subscribeTest disconnect : ", `user_1`); }),
                (payload: Boolean, args: ArgsValue<"Subscription", "subscribeEstimatesByUser">, ctx: Context) => {
                    if (args.estimateId) {
                        return payload === true;
                    }
                    return true;
                }
            )(root, args, ctx);
        }
        catch (e) {
            return throwError(e, ctx);
        }
    },
    resolve: async (payload: Boolean, args, ctx, info) => {
        try {
            const token = getAuthorizationInfoFromToken(args.authorizationToken);
            if (token) {
                ctx.token = token;
                console.log(ctx.token);
            }
            return payload;
        } catch (error) {
            return throwError(error, ctx);
        }
    }
})
