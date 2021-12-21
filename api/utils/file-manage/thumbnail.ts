import sharp from "sharp";
import { getContentTypeFromS3, putTaggingAtS3 } from ".";
import { errors } from "../error";
import { checkFileExistAtS3, checkTaggingAtS3, getBufferDataFromS3, uploadFileToS3 } from "./s3";

/**
 * 썸네일 프리셋
 */
export const thumbnailPresetSize = ["small", "medium", "large"] as const;
export const thumbnailPresetConfig: { [key in Thumbnail]: IThumbnailArgs } = {
    small: { pathPrefix: "thumb/s/", dividedBy: 6 },
    medium: { pathPrefix: "thumb/m/", dividedBy: 4 },
    large: { pathPrefix: "thumb/l/", dividedBy: 2 },
};

// 이미지 사이즈 기준 값 500x500
const defaultImageSize: number = 500;

/**
 * 가능한 썸네일 프리셋 타입
 */
type Thumbnail = typeof thumbnailPresetSize[number];

interface IGetS3AndSizeArgs {
    /** S3 Key */
    key: string;
    /** 가능한 썸네일 프리셋 타입 */
    thumbnailSize: Thumbnail;
}

interface IThumbnailArgs {
    pathPrefix: string;
    dividedBy: number;
}


type ICheckImageSizeArgs = {
    isMakeThumbnail: false;
} | {
    isMakeThumbnail: true;
    size: {
        width: number;
        height: number;
    }
}

// 버퍼를 통해 이미지 사이즈 체크(기준 이하인지)
export const checkImageSize = async (buffer: Buffer): Promise<ICheckImageSizeArgs> => {
    const metadata = await sharp(buffer).metadata();
    if (!metadata) throw errors.etc("buffer 이미지에 metadata가 존재하지 않습니다.");
    if (!metadata.width || !metadata.height) throw errors.etc("buffer 이미지의 width, height가 존재하지 않습니다.");
    const width = metadata.width;
    const height = metadata.height;
    if (width < defaultImageSize && height < defaultImageSize) {
        return ({ isMakeThumbnail: false });
    }
    return ({ isMakeThumbnail: true, size: { width: width, height: height } });
}

/**
 * mimetype 유효성 검사 - "image/jpeg", "image/png", "image/gif", "image/webp" 이외의 파일들은 error
 * @returns 해당 파일의 Content-Type
 */
export const checkImageMimetype = async (key: string): Promise<string> => {
    const contentType = await getContentTypeFromS3({ key: key });
    if (!contentType) throw errors.etc("ContentType이 존재하지 않습니다.");

    const supportImageTypes: string[] =
        ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!supportImageTypes.some((type) => { return type === contentType })) {
        throw errors.etc("jpg, jpeg, png, gif, webp 유형의 타입만 넣어주세요.");
    }

    return contentType;
}

/**
 * @description 썸네일 이미지 S3상에 존재 여부 체크 및 썸네일 생성.
 * 존재 = 썸네일 키 리턴, 존재x = 썸네일 이미지 생성.
 * 원본 이미지에 isMakeThumbnail=false 태그 있을 시 원본 키 리턴
 * @param key 원본 이미지의 S3 key
 * @param thumbnailSize 만들 썸네일
 * @returns thumbnail key or original key
 */

// 필드 리졸버에 쓸 함수
export const checkThumbnailExistAndCreateAtS3 = async (args: IGetS3AndSizeArgs): Promise<string> => {
    const thumbArgs = thumbnailPresetConfig[args.thumbnailSize];

    // 이미지인지 체크
    const contentType = await checkImageMimetype(args.key);

    // 원본 이미지 태그 체크
    const tagList = await checkTaggingAtS3({ key: args.key });
    let isTaggingRequired = false;
    if (!tagList) throw errors.etc("원본 이미지가 존재하지 않습니다.");
    else {
        const thumbnailTag = tagList.find(v => v.Key === 'isMakeThumbnail');
        if (!thumbnailTag) { // 태그 생성 필요
            isTaggingRequired = true;
        }
        else if (thumbnailTag.Value === 'false') return args.key;
    }

    let thumbnailKey: string = `${thumbArgs.pathPrefix}${args.key}`;

    if (!isTaggingRequired) {
        const isExistThumbnailImage = await checkFileExistAtS3({ key: thumbnailKey });

        // if 썸네일 이미지 o => 썸네일 키 리턴
        // else 썸네일 이미지 x => 썸네일 만든 후 썸네일 키 리턴
        if (isExistThumbnailImage) {
            return thumbnailKey;
        }
    }

    // S3의 원본 이미지 너비, 크기 구하기
    const originalImage = await getBufferDataFromS3(args.key);
    if (!originalImage) throw errors.etc("원본 이미지가 존재하지 않습니다.");
    const checkImage: ICheckImageSizeArgs = await checkImageSize(originalImage);

    // 원본 이미지 너비, 크기가 500 미만일때 원본 이미지 키 리턴
    if (!checkImage.isMakeThumbnail) {
        if (isTaggingRequired) {
            await putTaggingAtS3({ key: args.key, tagging: [{ Key: "isMakeThumbnail", Value: "false" }] });
        }
        return args.key;
    };

    // 원본 tag정보 없을 때 tag정보 생성
    if (isTaggingRequired) {
        await putTaggingAtS3({ key: args.key, tagging: [{ Key: "isMakeThumbnail", Value: "true" }] });
    }

    let splitKey = args.key.split('/');
    let splitPath = thumbArgs.pathPrefix.split('/').filter(v => v !== '');
    let fileName = splitKey.pop();

    // checkImage.size! => checkImageSize함수에서 width, height null 체크함
    const thumbBuffer: Buffer = await sharp(originalImage, { failOnError: false })
        .resize({
            width: Math.floor(checkImage.size.width / thumbArgs.dividedBy),
            height: Math.floor(checkImage.size.height / thumbArgs.dividedBy),
            fit: "inside",
        })
        .withMetadata()
        .toBuffer()

    if (!thumbBuffer) throw errors.etc("thumbnail buffer 생성 실패하였습니다.");

    return await uploadFileToS3({
        buffer: thumbBuffer,
        fileName: fileName ?? "",
        contentType: contentType,
        path: [...splitPath, ...splitKey],
        overwrite: false,
    });
}
