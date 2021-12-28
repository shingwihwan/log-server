import { Request as Req, Response as Res } from "express"

export const syslog = (req: Req, res: Res) => {
    try {
        const projectName = req.params['0'] ? req.params['0'] : "unknown";

        const debugInfo = req.body.blocks[0];
        const errorInfo = req.body.blocks[1];
        const resolveInfo = req.body.blocks[2];

        const txtDebugInfo = debugInfo.text.text;
        const txtErrorInfo = errorInfo.text.text;
        const txtResolveInfo = resolveInfo.text.text;

        console.log(debugInfo);
        console.log(errorInfo);
        console.log(resolveInfo);

        // 잔디에 알림보내기
        const data = {
            "body": "프로젝트: " + "**" + projectName + "**" + `${"\n``` \n"}` + txtResolveInfo + "\n" + txtErrorInfo + `${"\n``` \n"}`,
            "connectColor": "#FAC11B",
            "connectInfo": [{
                "title": "디버그 정보",
                "description": txtDebugInfo,
            },
                // {
                //     "title": "에러2",
                //     "description": "",
                // }
            ]
        }

        // 잔디에 알림 보내기
        // await fetch("https://wh.jandi.com/connect-api/webhook/25110651/41643a7ba9566cee942a76060f9b804a", {
        //     method: "post",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Accept": "application/vnd.tosslab.jandi-v2+json"
        //     },
        //     body: JSON.stringify(data)
        // }).catch(error => {
        //     console.log(error);
        //     return 500;
        // });

        // DB에 Error 정보 Insert
        // await prisma.logfiles.create({
        //     data: {
        //         serverName: projectName,
        //         error: JSON.stringify(req.body),
        //         createAt: new Date(),
        //     }
        // });

        return 200;
    } catch (error) {
        console.log(error);
        return 500;
    }
}
