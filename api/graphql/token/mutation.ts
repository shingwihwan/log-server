import { mutationField } from "nexus";
import { errors, throwError } from "../../utils/error";
import { getAuthorizationInfoFromToken } from "../../utils/local/get-token";

export const mutationTestMutation = mutationField("testMutation", {
    type: "Boolean",
    resolve: async (src, args, ctx, info) => {
        try {
            console.log("mutationToken, ", ctx);
            const token = getAuthorizationInfoFromToken(args.authorizationToken);
            if (token) {
                ctx.token = token;
                console.log(ctx.token);
            }
        } catch (e) {
            return throwError(e, ctx);
        }
    }
})