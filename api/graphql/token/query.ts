import { queryField } from "nexus";
import { errors, throwError } from "../../utils/error";

export const queryTokenTest = queryField("tokenTest", {
    type: "Boolean",
    resolve: async (src, args, ctx, info) => {
        try {
            console.log(ctx.token);
            return true
        } catch (e) {
            return throwError(e, ctx);
        }
    }
})