import { config } from 'dotenv'
config()

import { join } from 'path'
import { ApolloError, ApolloServer } from 'apollo-server-express'
import express from 'express';
import { permissions } from './utils/rules'
import { isDev } from './utils/constants'
import { createContext } from './utils/context'
import { applyMiddleware } from 'graphql-middleware'
import * as HTTP from 'http'
import { graphqlUploadExpress } from 'graphql-upload'
import { startScheduler } from './scheduler'
import schema from './schema'
import { syslog } from './callback/syslog';
import { CustomError } from './utils/error';



const checkValidEnv = Object.values(process.env).find(v => v !== undefined && /^".*";$/.test(v));
if (checkValidEnv) {
    const keys = Object.keys(process.env).filter(v => process.env[v] !== undefined && /^".*";$/.test(process.env[v]!));
    console.log(`Environment variable [${keys.join(', ')}] ENDS WITH semicolon(;)!`);
    process.exit(0);
}


const apollo = new ApolloServer({
    schema: applyMiddleware(schema, permissions),
    context: createContext,
    playground: isDev() === true ? (process.env.CUSTOM_ENDPOINT ? {
        endpoint: process.env.CUSTOM_ENDPOINT,
        subscriptionEndpoint: process.env.CUSTOM_ENDPOINT
    } : true) : false,
    uploads: false,
    tracing: isDev(),
    debug: isDev(),
})

const app = express();
app.use(graphqlUploadExpress({ maxFieldSize: 100000000, maxFileSize: 100000000, maxFiles: 1000, }));
app.use(express.json({ limit: '100mb' }));
const http = HTTP.createServer(app);
app.use(express.static(join(__dirname, 'static')));

app.route("/logger/*").post(async (req, res) => {
    try {
        const response: number = await syslog(req, res);
        res.sendStatus(response);
    } catch (error) {
        if (error instanceof ApolloError) {
            return res.status(error.status).send({
                error: error.code,
                description: error.message,
            })
        } else {
            console.log(error);
            return res.status(500).send({
                error: 'GENERIC',
                description: 'Something went wrong. Please try again or contact support.',
            })
        }
    }
});

const PORT = process.env.PORT || 3000

apollo.applyMiddleware({ app })
apollo.installSubscriptionHandlers(http)

http.listen(PORT, () => {
    console.log(`🚀 GraphQL service ready at http://localhost:${PORT}/graphql`)
})

if (process.env.SCHEDULER_NEEDED) startScheduler();
