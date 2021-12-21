import { decorateType, extendType, inputObjectType, objectType, scalarType } from 'nexus'
import { errors, throwError } from '../utils/error'
import { GraphQLUpload } from 'graphql-upload'
import { getModifierString } from '../utils/helpers'
import { DateTimeResolver } from 'graphql-scalars'
import { checkThumbnailExistAndCreateAtS3, fullUriPathToS3Key, s3KeyToFullUriPath, thumbnailPresetConfig, thumbnailPresetSize } from '../utils/file-manage'

export * from './auth'
export * from './enum'
export * from './site-manage'

export const Upload = decorateType(GraphQLUpload, {
    sourceType: "FileUpload",
    asNexusMethod: "upload",
});
export const DateTime = decorateType(DateTimeResolver, {
    sourceType: "Date",
    asNexusMethod: "date",
});

export const query_etc = extendType({
    type: "Query",
    definition(t) {
        t.field("whoami", {
            type: "String",
            resolve: async (src, args, ctx, info) => {
                try {
                    return getModifierString(ctx.token);
                } catch (error) {
                    return throwError(error, ctx);
                }
            }
        });
    }
});


export const t_FileUri = scalarType({
    name: "FileUri",
    asNexusMethod: "fileUri",
    description: "string과 똑같습니다(S3상 파일 URI 표기용 스칼라).",
    sourceType: "string",
    // arg로 전달될 데이터를 선 변환
    parseValue: (value) => fullUriPathToS3Key(value),
    // 실어 보낼 때 리턴할 값
    serialize: (value) => s3KeyToFullUriPath(value),
});

export const t_FileUpdateInput = inputObjectType({
    name: "FileUpdateInput",
    description: "newFile 있는 경우 newFile 우선",
    definition(t) {
        t.fileUri("existingFile");
        t.upload("newFile");
    },
});


export const tImage = objectType({
    name: "Image",
    description: "original 제외하고는 없으면 썸네일 만드는 구조이므로 필요 시에만 필드에 포함해주세요.",
    definition(t) {
        t.nonNull.fileUri("original", {
            description: "원본 이미지",
        });
        for (const preset of thumbnailPresetSize) {
            t.nonNull.fileUri(preset, {
                description: `원본이미지 크기 기준 - ${preset} : 1/${thumbnailPresetConfig[preset].dividedBy}로 썸네일 생성됩니다.`,
                resolve: async (src, args, ctx, info) => {
                    try {
                        const originalImage = src.original;
                        const thumbnailImage = await checkThumbnailExistAndCreateAtS3({ key: originalImage, thumbnailSize: preset });
                        if (!thumbnailImage) throw errors.etc("썸네일 이미지 키가 존재하지 않습니다.");
                        return thumbnailImage;
                    } catch (e) {
                        console.log("error on Image not found : ", e);
                        return src.original;
                    }
                }
            });
        }
    }
});