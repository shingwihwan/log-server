import { ApolloError } from 'apollo-server-express'
import deepmerge from 'deepmerge'
import { shield, rule, or, IRules } from 'graphql-shield'
import { IRuleFieldMap, IRuleTypeMap } from 'graphql-shield/dist/types'
import schema from '../schema'
import { Context, ITokenExpirationInfo } from '../types'
import { isDev } from './constants'
import { issuerType } from './context'
import { getDebugInfo } from './error'
import { errors } from './error'

const allow = rule("allow")(() => true);
const deny = rule("deny")(() => false);

type IContextWithInfo = Context & {
    tokenExpirationInfo: ITokenExpirationInfo
};

export const rules = {
    Everyone: allow,
    // User: rule("User", { cache: 'contextual' })(
    //     async (_parent, _args, ctx: IContextWithInfo) => {
    //         try {
    //             if (ctx.token === null) {
    //                 return false;
    //             }
    //             if (ctx.token.isRefresh) return false;
    //             if (!ctx.token.userId) return false;
    //             return true;
    //         } catch (e) {
    //             throw e
    //         }
    //     }
    // ),
    Admin: rule("Admin", { cache: 'contextual' })(
        async (_parent, _args, ctx: IContextWithInfo) => {
            try {
                if (ctx.token === null) {
                    return false;
                }
                if (ctx.token.isRefresh) return false;
                if (!ctx.token.adminId) return false;
                return true;
            } catch (e) {
                throw e
            }
        }
    ),
    Someone: rule("Someone", { cache: 'contextual' })(
        async (_parent, _args, ctx: IContextWithInfo) => {
            try {
                if (ctx.token === null) {
                    return false;
                }
                if (ctx.token.isRefresh) return false;
                let someoneCheck = false;
                for (const type of issuerType) {
                    if (ctx.token[type]) someoneCheck = true;
                }
                return someoneCheck;
            } catch (e) {
                throw e
            }
        }
    ),
}


const shieldRuleBuilder = (): IRules => {
    let [automatedQuery, automatedMutation, automatedSubscription] = [{}, {}, {}] as IRuleFieldMap[];
    const queries = Object.keys(schema.getQueryType()?.getFields() ?? []);
    if (queries.length > 0) {
        automatedQuery = queries.reduce<IRuleFieldMap>((p, c) => {
            const res = /.+By(.+?)$/.exec(c);
            if (res) {
                const applyRule = rules[res[1] as keyof typeof rules];
                if (applyRule) {
                    p[c] = applyRule;
                }
            }
            return p;
        }, {});
    }
    const mutations = Object.keys(schema.getMutationType()?.getFields() ?? []);
    if (mutations.length > 0) {
        automatedMutation = mutations.reduce<IRuleFieldMap>((p, c) => {
            const res = /.+By(.+?)$/.exec(c);
            if (res) {
                const applyRule = rules[res[1] as keyof typeof rules];
                if (applyRule) {
                    p[c] = applyRule;
                }
            }
            return p;
        }, {});
    }
    const subscriptions = Object.keys(schema.getSubscriptionType()?.getFields() ?? []);
    if (subscriptions.length > 0) {
        automatedSubscription = subscriptions.reduce<IRuleFieldMap>((p, c) => {
            const res = /.+By(.+?)$/.exec(c);
            if (res) {
                const applyRule = rules[res[1] as keyof typeof rules];
                if (applyRule) {
                    p[c] = applyRule;
                }
            }
            return p;
        }, {});
    }


    // 추가적인 퍼미션 수행
    const resultRule: IRuleTypeMap = {
        Query: {
            ...automatedQuery,
            // 추가 권한 아래에 기술

        },
        Mutation: {
            ...automatedMutation,
            // 추가 권한 아래에 기술

        },
        Subscription: {
            ...automatedSubscription,
            // 추가 권한 아래에 기술

        },
        // 추가적인 모델에 대한 권한은 아래에 기술
    };

    if (Object.keys(resultRule.Query).length === 0) {
        delete resultRule.Query;
    }
    if (Object.keys(resultRule.Mutation).length === 0) {
        delete resultRule.Mutation;
    }
    if (Object.keys(resultRule.Subscription).length === 0) {
        delete resultRule.Subscription;
    }

    // console.log(
    //     Object.keys(resultRule).map(v => {
    //         const a = resultRule[v as keyof typeof resultRule];
    //         return {
    //             t: v,
    //             v: Object.keys(a).map(v => {
    //                 const aa = a[v as keyof typeof a] as Rule;
    //                 return { f: v, v: aa.name };
    //             }).reduce((p, c) => {
    //                 p[c.f] = c.v;
    //                 return p;
    //             }, {} as any),
    //         };
    //     }).reduce((p, c) => {
    //         p[c.t] = c.v;
    //         return p;
    //     }, {} as any),
    // )

    // const warnInfo = [
    //     { name: "Query", array: queries },
    //     { name: "Mutation", array: mutations },
    //     { name: "Subscription", array: subscriptions },
    // ];
    // warnInfo.forEach(({ name, array }) => {
    //     array.forEach(v => {
    //         if (!(resultRule[name] as IRuleFieldMap)[v]) {
    //             console.log(`${name}.${v} : 설정된 권한이 없습니다.`);
    //         }
    //     })
    // })

    return resultRule;
}

export const permissions = shield(shieldRuleBuilder(), {
    fallbackError: async (thrownThing, parent, args, context, info) => {
        const ctx = context as unknown as IContextWithInfo;
        if (thrownThing instanceof ApolloError) {
            return thrownThing
        } else if (thrownThing instanceof Error) {
            console.error(thrownThing, getDebugInfo(ctx))
            return new ApolloError('Internal server error', 'ERR_INTERNAL_SERVER')
        } else {
            if ((thrownThing !== null || parent !== undefined) && ctx.token !== null) {
                console.warn('The resolver threw something that is not an error.')
                console.warn(thrownThing, getDebugInfo(ctx))
            }
            if (ctx.token === null) {
                if (ctx.tokenExpirationInfo.isExpired) {
                    return errors.notAuthenticatedExpired;
                }
                return errors.notAuthenticated;
            }
            else {
                return errors.forbidden;
            }
        }
    },
    allowExternalErrors: isDev(),
    debug: isDev(),
})
