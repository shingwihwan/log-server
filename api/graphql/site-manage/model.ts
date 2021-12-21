import { inputObjectType, list, nonNull, objectType } from "nexus";
import { errors, throwError } from "../../utils/error";

export const t_SiteInformation = objectType({
    name: "SiteInformation",
    definition(t) {
        t.model.id({
            description:
                "시작값(id의 startsWith() 적용으로 판별 가능한) 기준\n" +
                " - `TC_` : 제목-내용 형태의 자료 (titleContentInfo 필드 참조)\n" +
                " - `HTML_` : HTML 형태의 파일 (file 필드 참조)\n" +
                " - `FILE_` : 기타 파일 1개 (file 필드 참조)\n" +
                " - `FILES_` : 기타 파일 0~n개 (files 필드 참조)\n" +
                " - `URL_` : 외부 URL (링크 설정 안 된 경우 null)(url 필드 참조)\n" +
                " - `TEXT_` : 단순 텍스트 (content 필드 참조)",
        });
        t.model.type();
        t.model.description({ description: "해당 필드의 설명" });
        t.model.content({
            resolve: async (src, args, ctx, info, ori) => {
                try {
                    const content = await ori(src, args, ctx, info);
                    if (/^(TEXT_)/.test(src.id)) {
                        return content;
                    }
                    return "";
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        });
        t.list.nonNull.field("titleContentInfo", {
            type: "SiteInformationTitleContentData",
            resolve: async (src, args, ctx, info) => {
                try {
                    if (/^(TC_)/.test(src.id)) {
                        const info = JSON.parse((src as unknown as { content: string }).content) as [string, string][];
                        return info.map(v => ({ title: v[0], content: v[1] }));
                    }
                    return null;
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        });
        t.fileUri("file", {
            resolve: async (src, args, ctx, info) => {
                try {
                    if (/^(HTML_|FILE_)/.test(src.id)) {
                        return (src as unknown as { content: string }).content;
                    }
                    return null;
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        });
        t.list.fileUri("files", {
            resolve: async (src, args, ctx, info) => {
                try {
                    if (/^(FILES_)/.test(src.id)) {
                        return JSON.parse((src as unknown as { content: string }).content) as string[];
                    }
                    return null;
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        });
        t.string("url", {
            description: "URL_ 의 경우, 링크 설정이 안 되어 있으면 null로 리턴합니다.",
            resolve: async (src, args, ctx, info) => {
                try {
                    if (/^(URL_)/.test(src.id)) {
                        return (src as unknown as { content: string }).content;
                    }
                    return null;
                } catch (e) {
                    return throwError(e, ctx);
                }
            }
        })
    }
});

export const t_SiteInformationTitleContentData = objectType({
    name: "SiteInformationTitleContentData",
    definition(t) {
        t.nonNull.string("title");
        t.nonNull.string("content");
    }
});
export const t_InformationTitleContentDataInput = inputObjectType({
    name: "SiteInformationTitleContentDataInput",
    definition(t) {
        t.nonNull.string("title");
        t.nonNull.string("content");
    }
});