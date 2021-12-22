import { config } from 'dotenv'
config()

import { join } from 'path'
import { ApolloServer } from 'apollo-server-express'
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

app.route("/logger/*").post((req, res) => syslog(req, res));

const PORT = process.env.PORT || 3000

// app.get('/', function (req, res) {
//     res.send('Hello World!');
// });

// app.listen(PORT, function () { // port변수를 이용하여 3000번 포트에 node.js 서버를 연결합니다.
//     console.log('server on! http://localhost:' + PORT); //서버가 실행되면 콘솔창에 표시될 메세지입니다.
// });


apollo.applyMiddleware({ app })
apollo.installSubscriptionHandlers(http)

http.listen(PORT, () => {
    console.log(`🚀 GraphQL service ready at http://localhost:${PORT}/graphql`)
})

if (process.env.SCHEDULER_NEEDED) startScheduler();
