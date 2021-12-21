import { Context, Token } from '../types'
import { isDev, regexPattern } from './constants';
import { errors, throwError } from './error';

/**
 * Subscription 취소 감지하는 asyncIterator 생성 함수
 * @param asyncIterator 감지할 asyncIterator
 * @param onCancel 취소 시 실행될 함수
 * @returns asyncIterator
 * @author 장원찬
 */
export const withCancel = (asyncIterator: AsyncIterator<any, any, undefined>, onCancel: () => void) => {
    const asyncReturn = asyncIterator.return;
    asyncIterator.return = () => {
        onCancel();
        return asyncReturn ? asyncReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
    };
    return asyncIterator;
};


export const getModifierString = (token: Token | null) => {
    if (token?.userId) return `User ${isDev() ? token.userId : ""}`;
    else if (token?.adminId) return `Admin ${isDev() ? token.adminId : ""}`;
    else return "Unknown";
}

/**
 * 단어의 조사를 검사해서 '을'/'를'을 붙여주는 함수
 * @param targetString 을/를을 붙여야 하는 한글 문자열
 * @returns '을' 또는 '를'이 끝에 붙은 문자열
 * @example '한글' => '한글을'
 * @author 장원찬
 */
export const printStringWithParticle = (targetString: string) => targetString === "" ? "" : (targetString.charCodeAt(targetString.length - 1) - 0xAC00) % 28 === 0 ? targetString + '를' : targetString + '을';

/**
 * 문자열 길이 검사 함수, 통과 시 type이 string으로 맞춰지며, 제한에 걸릴 경우 오류를 throw한다.
 * @param ctx 컨텍스트
 * @param targetString 검사할 문자열
 * @param maxLength 최대 문자열 길이
 * @param description targetString을 설명하는 명사
 * @param allowEmptyString 빈 문자열 허용 여부
 * @author 장원찬
 */
export function validateStringLength(ctx: Context, targetString: string | null | undefined, maxLength: number, description: string, allowEmptyString?: boolean): asserts targetString is string {
    if (!targetString || (!allowEmptyString && targetString.length === 0)) throw throwError(errors.etc(`${printStringWithParticle(description)} 입력하세요.`), ctx);
    if (targetString.length > maxLength) throw throwError(errors.etc(`${printStringWithParticle(description)} ${maxLength}자 이하로 입력하세요.`), ctx);
}


/**
 * `str`을 검사하여 유효한 전화번호 형태이면 하이픈을 붙여서 반환하고, 그렇지 않으면 null을 반환한다.
 * @param str 전화번호를 검사할 문자열
 * @returns 유효한 전화번호면 하이픈 형태의 문자열, 유효하지 않을 경우 null
 * @author 장원찬
 */
export function getHyphenatedTel(str: string): string | null {
    const matchedStr = str.match(regexPattern.tel);
    if (matchedStr) {
        if (matchedStr[2]) return `${matchedStr[2]}-${matchedStr[3]}-${matchedStr[6]}`;
        else if (matchedStr[4]) return `${matchedStr[4]}-${matchedStr[6]}`;
    }
    return null;
}


/**
 * Array.filter의 function으로 사용하며, null 및 undefined를 필터링하는 함수이다.
 * @param v 걸러낼 요소
 * @returns null, undefined가 필터링된 배열
 */
export const validFilter = <T>(v: T): v is Exclude<T, null | undefined> => v !== null && v !== undefined


/**
 * @description 휴대전화번호를 01012341234 형태로 유효성검사 및 반환
 * @author Kuhave
 * @date 2021-09-20
 * @param {string} phone
 * @returns {*}  01012341234 형태로 변환된 휴대폰번호
 */
export function validateAndFormatPhoneNumber(phone: string): string {
    phone = phone.trim();
    if (!regexPattern.phone.test(phone)) throw errors.etc("휴대폰 번호 형식이 잘못되었습니다.");
    return phone.replace(regexPattern.phone, "0$1$2$3");
}