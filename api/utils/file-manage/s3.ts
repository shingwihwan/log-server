import { S3 } from 'aws-sdk';
import { FileUpload } from "graphql-upload";
import { AWS_BUCKET, regexPattern } from '../constants';
import { ReadStream } from 'fs';
import { TagSet } from 'aws-sdk/clients/s3';

export const S3ADDRESS = process.env.S3ADDRESS;
export const EXTERNAL_S3_ADDRESS = process.env.EXTERNAL_S3_ADDRESS;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!S3ADDRESS || !EXTERNAL_S3_ADDRESS || !AWS_ACCESS_KEY || !AWS_SECRET_ACCESS_KEY) {
    const undefinedValues: { [key: string]: string | undefined } = {
        S3ADDRESS,
        EXTERNAL_S3_ADDRESS,
        AWS_ACCESS_KEY,
        AWS_SECRET_ACCESS_KEY,
    };
    console.error(`Environmental variable ${Object.keys(undefinedValues).filter(v => undefinedValues[v] === undefined).join(", ")} not set!`);
    process.exit(0);
}

export const s3KeyToFullUriPath = (key: string) => regexPattern.httpUrl.test(key) ? key : `${EXTERNAL_S3_ADDRESS}/${key}`
export const fullUriPathToS3Key = (uri: string) => uri.replace(new RegExp("^" + EXTERNAL_S3_ADDRESS + "/"), "");

export const S3Client = new S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    params: { Bucket: AWS_BUCKET },
    region: 'ap-northeast-2',
    ...(!/s3\..+\.amazonaws.com/.test(S3ADDRESS) ? { // minio용 설정
        endpoint: S3ADDRESS,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
    } : {})
});



/**
 * Canned ACL Type
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl
 */
type CannedAcl =
    "private" |
    "public-read" |
    "public-read-write" |
    "aws-exec-read" |
    "authenticated-read" |
    "bucket-owner-read" |
    "bucket-owner-full-control" |
    "log-delivery-write";

interface IGetS3Args {
    /** S3 Key */
    key: string;
}

interface IPutTaggingAtS3Args {
    /** S3 Key */
    key: string;
    /**
     * tagging: [{ key: , value: }, ... ]
     * 빈 배열 전달 시, mode가 "overwrite"라면 모든 태그 삭제
     */
    tagging: TagSet;
    /**
     * 기존 태그에 추가하는지 여부
     * @default "add"
     */
    mode?: "overwrite" | "add"
}

interface IUploadFileToS3FileArgs {
    /** 업로드할 파일 */
    file: FileUpload;
    /** 업로드할 파일의 파일 확장자를 제외한 파일 이름을 재지정 */
    fileNameWithoutExtension?: string;
}

interface IUploadFileToS3BufferArgs {
    /** 업로드할 버퍼 */
    buffer: Buffer;
    /** 확장자 포함 파일이름 */
    fileName: string;
    /** Content-Type */
    contentType: string;
}


export interface IUploadFileToS3CommonArgs {
    /** S3 key path */
    path?: (string | number)[];
    /** 파일이 이미 있는 경우 덮어씌우는지 여부
     * - 기본값 : false(중복 방지)
     * */
    overwrite?: boolean;

    /**
     * tag 집합
     * @param "key=value&key=value"
     */
    tagging?: string;

    /**
     * ACL 제어
     * @default "public-read"
     */
    acl?: CannedAcl;
}


interface IUploadFilesToS3Args {
    data: IUploadFileToS3Data[];
    option: IUploadFileToS3CommonArgs;
}



type IUploadFileToS3Data = XOR<IUploadFileToS3FileArgs, IUploadFileToS3BufferArgs>;
export type IUploadFileToS3Args = IUploadFileToS3Data & IUploadFileToS3CommonArgs;


interface IGetSignedS3UrlArgs {
    /** S3 Key */
    key: string;
    /** 토큰 만료시간, 단위:초 */
    expires: number;
}



function isItIUploadToS3BufferArgs(args: IUploadFileToS3FileArgs | IUploadFileToS3BufferArgs): args is IUploadFileToS3BufferArgs {
    return (args as IUploadFileToS3BufferArgs).contentType !== undefined;
}


/**
 * S3상에 해당 키가 존재하는지 확인
 * @returns `true` : 파일이 있음, `false` : 파일이 없음
 */
export const checkFileExistAtS3 = async (args: IGetS3Args): Promise<boolean> => {
    return await S3Client.headObject({ Key: args.key, Bucket: AWS_BUCKET, }).promise().then(() => true).catch(() => false);
}

/**
 * S3 원본 이미지 Tag 여부
 * @param Key 원본 이미지 Key
 * @returns [ {key: '', value: ''}] or []
 */
export const checkTaggingAtS3 = async (args: IGetS3Args): Promise<TagSet | null> => {
    return await S3Client.getObjectTagging({ Key: args.key, Bucket: AWS_BUCKET, }).promise().then((v) => v.TagSet).catch((e) => null);
}
/**
 * S3 Object에 Tag 추가
 * @param args key, tagging: Tag[{ key: , value: }, ... ]
 * @returns `true` : 태그 추가 `false` : 태그 추가 실패(해당 Key 없음, 태그 개수 10개 초과시 )
 */
export const putTaggingAtS3 = async (args: IPutTaggingAtS3Args): Promise<boolean> => {
    const mode = args.mode ?? 'add';
    let tagList = args.tagging;
    if (mode === 'add') {
        let existingTagList = await checkTaggingAtS3({ key: args.key });
        if (!existingTagList) return false;
        tagList = existingTagList.concat(...args.tagging);
    }
    if (tagList.length > 10) return false;
    if (tagList.length === 0) {
        return await S3Client.deleteObjectTagging({ Key: args.key, Bucket: AWS_BUCKET }).promise().then(() => true).catch(() => false);
    }
    return await S3Client.putObjectTagging({ Key: args.key, Bucket: AWS_BUCKET, Tagging: { TagSet: tagList } }).promise().then(() => true).catch(() => false);
}

/**
 * S3상에 이미지를 Buffer로 가져옴
 * @returns `Buffer` or `null`
 */
export const getBufferDataFromS3 = async (Key: string) => {
    return await S3Client.getObject({ Key, Bucket: AWS_BUCKET, }).promise().then(res => res.Body as Buffer ?? null).catch(() => null);
}

/**
 * ContentType 가져오는 함수
 * @returns `contentType` 없으면 "" 리턴
 */
export const getContentTypeFromS3 = async (args: IGetS3Args): Promise<string | null> => {
    return await S3Client.headObject({ Key: args.key, Bucket: AWS_BUCKET }).promise().then(v => v.ContentType ?? null).catch(() => null);
}


/**
 * S3상에 존재하는 해당 파일을 삭제
 * @returns `true` : 파일 삭제 성공, `false` : 파일 삭제 실패
 */
export const deleteFromS3 = async (args: IGetS3Args): Promise<boolean> => {
    return await S3Client.deleteObject({ Key: args.key, Bucket: AWS_BUCKET }).promise().then(result => result.$response.error ? false : true).catch(() => false);
}

/**
 * S3의 접근 제한된 파일의 URL 취득
 * @returns `S3 Url
 */
export const getSignedS3Url = async ({ key, expires }: IGetSignedS3UrlArgs) => {
    let result = await S3Client.getSignedUrlPromise("getObject", { Key: key, Bucket: process.env.AWS_BUCKET, Expires: expires });
    if (!/s3\..+\.amazonaws.com/.test(S3ADDRESS)) {
        result = result.replace(S3ADDRESS, EXTERNAL_S3_ADDRESS.replace(`/${EXTERNAL_S3_ADDRESS}`, ""));
    }
    return result;
};

/**
 * 스트림 -> 버퍼
 * @param args CreateReadStream()
 * @returns Buffer
 */
export const getBufferDataFromStream = async (args: ReadStream): Promise<Buffer> => {
    const buffer: Buffer = await new Promise((resolve, reject) => {
        let buffers: any = [];
        args.on("data", function (data) {
            buffers.push(data);
        });
        args.on("end", function () {
            const everything = Buffer.concat(buffers);
            resolve(everything);
        });
        args.on("error", function (e) {
            reject(e);
        });
    });
    return buffer;
}

/**
 * S3로 파일 업로드
 * @returns S3 Key
 */
export const uploadFileToS3 = async (args: IUploadFileToS3Args): Promise<string> => {
    let fileName = "";
    let body: Buffer | ReadStream;
    let contentType: string;
    const path = args.path ? [...args.path] : [];
    if (isItIUploadToS3BufferArgs(args)) {
        body = args.buffer;
        contentType = args.contentType;
        fileName = args.fileName;
    }
    else {
        const { createReadStream, filename, mimetype } = await args.file;
        body = createReadStream();
        contentType = mimetype;
        fileName = args.fileNameWithoutExtension ? args.fileNameWithoutExtension + filename.replace(regexPattern.fileNameAndExtension, ".$2") : filename;
    }

    if (args.overwrite !== true) {
        let tmpnumber = 0;
        while (true) {
            const result = await checkFileExistAtS3({
                key: path.concat(fileName.replace(regexPattern.fileNameAndExtension, `$1${tmpnumber ? (tmpnumber.toString()) : ""}.$2`)).join('/')
            });

            if (!result) break;

            tmpnumber += 1;
        }
        fileName = fileName.replace(regexPattern.fileNameAndExtension, `$1${tmpnumber ? (tmpnumber.toString()) : ""}.$2`);
    }

    path.push(fileName);

    const response = await S3Client.upload({
        Key: path.join("/"),
        ACL: args.acl ?? 'public-read',
        Body: body,
        ContentType: contentType,
        Bucket: AWS_BUCKET,
        Tagging: args.tagging,
    }).promise();

    return response.Key;
}

/**
 * S3로 여러 파일 업로드
 * @returns S3 Key
 */
export const uploadFilesToS3 = async (args: IUploadFilesToS3Args): Promise<string[]> => {
    const keys: string[] = [];
    for (const data of args.data) {
        keys.push(await uploadFileToS3({
            ...args.option,
            ...data
        }))
    }
    return keys;
}