import { verify } from "jsonwebtoken";
import { Token } from "../../types";
import { APP_SECRET } from "../constants";


export function getAuthorizationInfoFromToken(tokenString: string | null | undefined) {
    if (!tokenString) return null;
    let token: Token | null = null;
    let verifiedToken: any;
    verifiedToken = verify(tokenString, APP_SECRET) as Token;
    if (!verifiedToken.customerId && !verifiedToken.companyId && !verifiedToken.adminId) {
        token = null;
    }
    else if (verifiedToken.customerId) {
        token = verifiedToken;
    }
    else if (verifiedToken.companyId) {
        token = verifiedToken;
    }
    else {
        token = verifiedToken
    }
    return token;
}