import { FileUpload } from "graphql-upload";
import { checkFileExistAtS3, IUploadFileToS3CommonArgs, uploadFileToS3 } from "./s3";


interface IFileUpdateInput {
    existingFile?: string | null;
    newFile?: FileUpload | null;
}

interface IProcessFileUpdateInputsArgs {
    /** `FileUpdateInput` 타입 배열 */
    files: IFileUpdateInput[];
    /** 파일 업로드 옵션 */
    option: IUploadFileToS3CommonArgs;
    /** `existingFile` 이 제공된 경우 중복 검사를 수행할 것인지 여부
     * - (기본값) `DELETE` 또는 undefined : 결과 배열에서 해당 key 제거
     * - `ERROR` : 에러를 throw
     * - `PRESERVE` : 해당 키값을 그냥 유지
    */
    checkExistingFileIsExist?: "DELETE" | "ERROR" | "PRESERVE";
}



/**
 * FileUpdateInput arg를 처리해주는 함수
 * @returns S3 Key의 배열
*/
export const processFileUpdateInputs = async (args: IProcessFileUpdateInputsArgs) => {
    if (args.checkExistingFileIsExist === undefined) args.checkExistingFileIsExist = 'DELETE';
    const keys: string[] = [];
    if (args.files.some(v => !v.newFile && !v.existingFile)) {
        throw new Error("입력된 파일 데이터의 유효성이 올바르지 않습니다(새 파일 혹은 기존 파일 경로 중 하나는 필수입니다).");
    }
    if (args.checkExistingFileIsExist !== 'PRESERVE') {
        for (const key of args.files) {
            if (key.existingFile && !key.newFile) {
                if (!await checkFileExistAtS3({ key: key.existingFile })) {
                    if (args.checkExistingFileIsExist === 'ERROR') {
                        throw new Error("제공된 기존 파일 중 실제 없는 파일이 있습니다.");
                    }
                    else {
                        key.existingFile = undefined;
                    }
                }
            }
        }
    }
    for (const file of args.files) {
        if (file.newFile) {
            keys.push(await uploadFileToS3({
                ...args.option,
                file: file.newFile,
            }));
        }
        else if (file.existingFile) {
            keys.push(file.existingFile!);
        }
    }
    return keys;
}


/**
 * 입력된 파일이 이미지파일인지 체크하는 함수
 * 업로드 전에 해당 함수를 호출
 */
export const checkImageFile = (file: ArrayOrObject<FileUpload>) => {
    if (Array.isArray(file)) {
        return file.every(v => ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(v.mimetype));
    }
    return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.mimetype);
};
