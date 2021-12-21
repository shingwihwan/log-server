import { config } from 'dotenv'
config()
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { compare, hash, hashSync } from 'bcryptjs'

async function hookFunc() {
}

async function main() {
    return hookFunc();

    const password = hashSync("qwer123$", 10);
    // await prisma.admin.create({ data: { id: "admin@itez.io", password, state: "ACTIVE", permission: "qwer123$" } });

}

main().finally(async () => {
    await prisma.$disconnect()
})
