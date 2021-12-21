import { EXTERNAL_S3_ADDRESS, uploadFileToS3 } from "./s3";


interface IUploadEditorStringToS3Args {
    /** 이미지가 Base64 인코딩 처리된 HTML String */
    content: string;
    /** S3 key path */
    path: (string | number)[];
    /** HTML 파일 이름(확장자 제외) */
    fileNameExcludeExtension: string;
}


/**
 * 이미지가 Base64 인코딩 처리된 HTML String을 S3상의 HTML 파일로 업로드하는 함수
 * @returns 업로드된 HTML 파일의 S3 Key
 */
export const uploadEditorStringToS3 = async (args: IUploadEditorStringToS3Args) => {
    const result = args.content.match(/<img src="data:(image\/.*?);base64,(.*?)">/g);
    let descriptionContents = args.content;
    if (result) {
        const keyArray = await Promise.all(result.map(async (v, i) => {
            const a = v.replace(/<img src="data:(image\/.*?);base64,(.*?)">/g, "$1*$*~$2").split("*$*~");

            const [mimetype, buffer] = [a[0], Buffer.from(a[1], "base64")];
            return await uploadFileToS3({
                buffer: buffer,
                fileName: `image${i}.${mimetype.slice(mimetype.indexOf("/") + 1, 10)}`,
                contentType: mimetype,
                path: args.path
            });
        }))
        descriptionContents = result.reduce((p, c, i) => p.replace(c, `<img src="${EXTERNAL_S3_ADDRESS}/${keyArray[i]}">`), descriptionContents);
    }
    return await uploadFileToS3({
        buffer: Buffer.from(descriptionContents, "utf8"),
        fileName: `${args.fileNameExcludeExtension}.html`,
        contentType: 'text/html',
        path: args.path,
    });
}
