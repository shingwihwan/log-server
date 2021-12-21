import { nexusPrisma } from 'nexus-plugin-prisma'
import { makeSchema } from 'nexus'
import * as modelTypes from './graphql'
import { join } from 'path'

const extension = __filename.endsWith('ts') ? 'ts' : 'js';

const schema = makeSchema({
    types: [modelTypes],
    sourceTypes: {
        modules: [{ module: join(__dirname, `types.${extension}`), alias: "upload" }],
        headers: [
            'import { FileUpload } from "./types"',
        ],
    },
    outputs: {
        typegen: extension === 'ts' ? join(__dirname, `typegen.${extension}`) : false,
        schema: join(__dirname, 'schema.graphql'),
    },
    contextType: { module: join(__dirname, `types.${extension}`), export: "Context" },
    plugins: [
        nexusPrisma({
            shouldGenerateArtifacts: true,
            paginationStrategy: 'prisma',
            experimentalCRUD: true,
        })
    ],
});


export default schema;