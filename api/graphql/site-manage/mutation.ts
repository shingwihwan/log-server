import { arg, extendType, list, nonNull, stringArg } from "nexus";
import { errors, throwError } from "../../utils/error";
import { processFileUpdateInputs, uploadEditorStringToS3 } from "../../utils/file-manage";

export const mutation_site_manage = extendType({
    type: "Mutation",
    definition(t) {
        t.field("updateSiteInformationByAdmin", {
            type: nonNull("Boolean"),
            args: {
                siteInformationId: nonNull(stringArg()),
                content: stringArg({
                    description: "id가 HTML_ , URL_ , TEXT_ 로 시작하는 경우 필수\n URL_인 경우 http(s)로 시작하지 않으면 알아서 http를 붙입니다.",
                }),
                titleContentData: list(nonNull(arg({
                    type: "SiteInformationTitleContentDataInput",
                    description: "id가 TC_ 로 시작하는 경우 필수",
                }))),
                files: list(nonNull(arg({
                    type: "FileUpdateInput",
                    description: "id가 FILE_ 혹은 FILES_ 로 시작하는 경우 필수 \n  FILE_ 인 경우에는 첫 번째 파일만 반영됩니다.",
                }))),
            },
            resolve: async (src, args, ctx, info) => {
                try {
                    const siteInformation = await ctx.prisma.siteInformation.findUnique({ where: { id: args.siteInformationId } });
                    if (!siteInformation) throw errors.etc("해당 설정이 없습니다.");
                    const id = siteInformation.id;
                    if (/^(URL_|TEXT_)/.test(id)) {
                        if (typeof args.content !== 'string') throw errors.etc("내용을 입력해주세요.");
                        let content = args.content;
                        if (/^(URL_)/.test(id)) {
                            if (/https?:\/\/[-\w.]+(:\d+)?(\/([\w/_.]*(\?\S+)?)?)?/.test(content)) { }
                            else if (/[-\w.]+(:\d+)?(\/([\w/_.]*(\?\S+)?)?)?/.test(content)) {
                                content = "http://" + content.replace(/^\/+/, "");
                            }
                            else {
                                content = "";
                            }
                        }
                        await ctx.prisma.siteInformation.update({
                            where: { id }, data: { content }
                        });
                    }
                    else if (/^(HTML_)/.test(id)) {
                        if (typeof args.content !== 'string') throw errors.etc("내용을 입력해주세요.");
                        const content = await uploadEditorStringToS3({
                            content: args.content,
                            path: ["site_info"],
                            fileNameExcludeExtension: id.toLowerCase(),
                        });
                        await ctx.prisma.siteInformation.update({
                            where: { id }, data: { content }
                        });
                    }
                    else if (/^(TC_)/.test(id)) {
                        if (!args.titleContentData) throw errors.etc("내용을 입력해주세요.");
                        const data = args.titleContentData.map(v => ([v.title, v.content]));
                        await ctx.prisma.siteInformation.update({
                            where: { id }, data: { content: JSON.stringify(data) }
                        });
                    }
                    else if (/^(FILE_)/.test(id)) {
                        if (!args.files) throw errors.etc("파일을 첨부하세요.");
                        if (args.files.length === 0) throw errors.etc("파일을 첨부하세요.");
                        const uploadResult = await processFileUpdateInputs({
                            files: args.files,
                            option: { path: ["site_info", id.toLowerCase()] },
                        })
                        await ctx.prisma.siteInformation.update({
                            where: { id }, data: { content: uploadResult[0] }
                        });
                    }
                    else if (/^(FILES_)/.test(id)) {
                        if (!args.files) throw errors.etc("파일을 첨부하세요.");
                        const files: string[] = await processFileUpdateInputs({
                            files: args.files,
                            option: { path: ["site_info", id.toLowerCase()] },
                        });
                        await ctx.prisma.siteInformation.update({
                            where: { id }, data: { content: JSON.stringify(files) }
                        });
                    }
                    return true;
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        })
    }
});