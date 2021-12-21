import { sub } from 'date-fns';
import schedule from 'node-schedule';
import { prisma } from '../utils/context';

export const startScheduler = () => {
    // 매시 정각에 만료된 인증정보 삭제
    schedule.scheduleJob("0 0 0 * * *", async () => {
        const lte = sub(new Date(), { minutes: 10 });
        await prisma.phoneVerification.deleteMany({ where: { createdAt: { lte } } });
    })
    console.log("Scheduler Initialized")
}