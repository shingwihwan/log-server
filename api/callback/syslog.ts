import { Request as Req, Response as Res } from "express"
import * as util from 'util';
import fetch from 'node-fetch';

export const syslog = async (req: Req, res: Res) => {

    // console.log(res.json());
    const projectName = req.params['0'];
    const error = req.body.blocks[2];
    const error1 = req.body.blocks[3];

    console.log(req.body.blocks[0].text);

    // const test = JSON.stringify(error1);
    // console.log(test);
    // console.log(test.search("query"));
    // console.log(test.search("mutation"));
    // if (test.search("query") !== -1) {
    //     console.log(test.split("\n"));
    // }

    const test2 = error.text.text;
    const test3 = error1.text.text;
    // console.log(error);
    // console.log(error1);
    // console.log(`${"```\n"}` + test2 + `${"\n```"}`);

    // 잔디에 알림보내기
    const data = {
        "body": projectName + `${"\n``` "}` + "query 문제" + `${"\n```"}`,
        "connectColor": "#FAC11B",
        "connectInfo": [{
            "title": "에러1",
            "description": test2
        },
        {
            "title": "에러2",
            "description": test3
        }]
    }

    console.log(test2);
    console.log(test3);

    // await axios({
    //     method: 'post',
    //     url: 'https://wh.jandi.com/connect-api/webhook/25110651/41643a7ba9566cee942a76060f9b804a',
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Accept": "application/vnd.tosslab.jandi-v2+json"
    //     },
    //     data: data
    // });

    // await fetch("https://wh.jandi.com/connect-api/webhook/25110651/41643a7ba9566cee942a76060f9b804a", {
    //     method: "post",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Accept": "application/vnd.tosslab.jandi-v2+json"
    //     },
    //     body: JSON.stringify(data)
    // }).catch(error => {
    //     console.log(error);
    // });

    // DB에 Error 정보 Insert
    // await prisma.logfiles.create({
    //     data: {
    //         serverName: serverName,
    //         error: JSON.stringify(req.body),
    //         createAt: new Date(),
    //     }
    // });

}