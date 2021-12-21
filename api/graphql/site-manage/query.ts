import { extendType, nonNull, stringArg } from "nexus";
import { errors, throwError } from "../../utils/error";

export const query_site_manage = extendType({
    type: "Query",
    definition(t) {
        t.crud.siteInformations({
            alias: "selectSiteInformationsByEveryone",
            filtering: true,
            ordering: true,
            pagination: true,
        })
        t.field("selectSiteInformationByEveryone", {
            type: nonNull("SiteInformation"),
            args: {
                id: nonNull(stringArg()),
            },
            resolve: async (src, args, ctx, info) => {
                try {
                    const info = await ctx.prisma.siteInformation.findUnique({ where: { id: args.id } });
                    if (!info) throw errors.etc("해당 데이터가 없습니다.");
                    return info;
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        })
    }
});