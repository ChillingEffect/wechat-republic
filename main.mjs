import url from 'url';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { spawn } from 'child_process';
import getAccessToken from './accessToken.mjs';

const PORT = 3333;     // 服务端口
const WX_TOKEN = 'adele'; // 微信公众平台服务器配置中的 Token
const ROKID_SN = "0001121743000214";
const ROKID_WEBHOOK = "rJTmCO9k7";

/**
 *  对字符串进行sha1加密
 * @param  {string} str 需要加密的字符串
 * @return {string}     加密后的字符串
 **/
function sha1(str) {
    var sha1sum = crypto.createHash('sha1');
    sha1sum.update(str);
    str = sha1sum.digest('hex');
    return str;
}

/**
 * 验证服务器的有效性
 * @param  {object} req http 请求
 * @param  {object} res http 响应
 * @return {object}     验证结果
 * 整个验证步骤分为三步
 *    1. 将token、timestamp、nonce三个参数进行字典序排序
 *    2. 将三个参数字符串拼接成一个字符串进行sha1加密
 *    3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
 **/
function checkSignature(req, res) {
    const query = url.parse(req.url, true).query;
    console.log('Request URL: ', req.url);
    const signature = query.signature;
    const timestamp = query.timestamp;
    const nonce = query.nonce;
    const echostr = query.echostr;
    // 将 token/timestamp/nonce 三个参数进行字典序排序
    const tmpArr = [WX_TOKEN, timestamp, nonce];
    const tmpStr = sha1(tmpArr.sort().join(''));
    // 验证排序并加密后的字符串与 signature 是否相等
    if (tmpStr === signature) {
        if (req.method === 'GET') {    //Wechat Service 验证
            res.end(echostr);
            console.log('Signature Check Success');
        } else {                       // handle message push
            republic(req, res);
        }
    } else {
        res.end('signature check failed');
        console.log('Signature Check Failed');
    }
}

// Rokid 文本消息处理
function rokidTTS(text) {
    //执行若琪播放文字
    const body = {
        type: "tts",
        devices: {
            sn: ROKID_SN
        },
        data: {
            text
        }
    };
    const options = {
        hostname: 'homebase.rokid.com',
        port: 443,
        path: `/trigger/with/${ROKID_WEBHOOK}`,
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    var req = https.request(options, (res) => {
        var responseString = '';
        res.on('data', (data) => {
            responseString += data;
        });
        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
            console.log(`[Rokid TTS] ${resultObject.message}`)
        });
        req.on('error', (e) => {
            console.error(e);
        });
    });
    req.write(JSON.stringify(body));
    req.end();
}

function republic(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
    });
    req.on('end', function () {
        const r_ToUserName = body.match(/<ToUserName><\!\[CDATA\[(.*)\]\]><\/ToUserName>/)[1];
        const r_FromUserName = body.match(/<FromUserName><\!\[CDATA\[(.*)\]\]><\/FromUserName>/)[1];
        const r_MsgType = body.match(/<MsgType><\!\[CDATA\[(.*)\]\]><\/MsgType>/)[1];
        const r_CreateTime = body.match(/<CreateTime>(.*)<\/CreateTime>/)[1];
        const s_ToUserName = r_FromUserName;
        const s_FromUserName = r_ToUserName;
        const s_MsgType = 'text';
        const s_CreateTime = parseInt(Date.now() / 1000);
        var s_Content = '';
        var cmd = spawn('fortune');

        switch (r_MsgType) {
            case 'text':
                var r_MsgId = body.match(/<MsgId>(.*)<\/MsgId>/)[1];
                var r_Content = body.match(/<Content><\!\[CDATA\[([\s\S]*)\]\]><\/Content>/)[1];
                if (/^[a-zA-Z0-9 .,]+$/.test(r_Content)) {
                    cmd = spawn('trans', ['-b', ':zh', r_Content]);
                } else {
                    cmd = spawn('trans', ['-b', ':en', r_Content]);
                }
                console.log(`[recive ${r_MsgType}] ${r_Content} (from ${r_FromUserName} at ${r_CreateTime})`);
                break;
            case 'image':
                var r_MsgId = body.match(/<MsgId>(.*)<\/MsgId>/)[1];
                var r_PicUrl = body.match(/<PicUrl><\!\[CDATA\[(.*)\]\]><\/PicUrl>/)[1];
                var r_MediaId = body.match(/<MediaId><\!\[CDATA\[(.*)\]\]><\/MediaId>/)[1];
                console.log(`[recive ${r_MsgType}] ${r_PicUrl} ${r_MediaId} (from ${r_FromUserName} at ${r_CreateTime})`);
                break;
            case 'video':
                var r_MsgId = body.match(/<MsgId>(.*)<\/MsgId>/)[1];
                var r_ThumbMediaId = body.match(/<ThumbMediaId><\!\[CDATA\[(.*)\]\]><\/ThumbMediaId>/)[1];
                var r_MediaId = body.match(/<MediaId><\!\[CDATA\[(.*)\]\]><\/MediaId>/)[1];
                console.log(`[recive ${r_MsgType}] ${r_ThumbMediaId} ${r_MediaId} (from ${r_FromUserName} at ${r_CreateTime})`);
                break;
            case 'voice':
                var r_MsgId = body.match(/<MsgId>(.*)<\/MsgId>/)[1];
                var r_Format = body.match(/<Format><\!\[CDATA\[(.*)\]\]><\/Format>/)[1];
                var r_MediaId = body.match(/<MediaId><\!\[CDATA\[(.*)\]\]><\/MediaId>/)[1];
                var r_Recognition = body.match(/<Recognition><\!\[CDATA\[(.*)\]\]><\/Recognition>/)[1];
                cmd = spawn('trans', ['-b', ':en', r_Recognition]);
                console.log(`[recive ${r_MsgType}] ${r_Recognition} ${r_Format} ${r_MediaId} (from ${r_FromUserName} at ${r_CreateTime})`);
                break;
            case 'link':
                var r_Title = body.match(/<Title><\!\[CDATA\[(.*)\]\]><\/Title>/)[1];
                var r_Description = body.match(/<Description><\!\[CDATA\[(.*)\]\]><\/Description>/)[1];
                var r_Url =body.match(/<Url><\!\[CDATA\[(.*)\]\]><\/Url>/)[1];
                console.log(`[recive ${r_MsgType}] ${r_Title} ${r_Url} (from ${r_FromUserName} at ${r_CreateTime})`);
            case 'event':
                var r_Event = body.match(/<Event><\!\[CDATA\[(.*)\]\]><\/Event>/)[1];
                var r_EventKey = body.match(/<EventKey><\!\[CDATA\[(.*)\]\]><\/EventKey>/)[1];
                console.log(`[recive ${r_MsgType}] ${r_Event} ${r_EventKey} (from ${r_FromUserName} at ${r_CreateTime})`);
                break;
            default:
                console.log(`[recive ${r_MsgType}] (from ${r_FromUserName} at ${r_CreateTime})`);
                console.log(`[origin msg body] ${body}`);
        }

        cmd.stdout.on('data', (data) => {
            s_Content += data;
        });
        cmd.on('close', (code) => {
            s_Content = s_Content.replace(/\n$/, '');
            if(!s_Content) {
                s_Content = "Sorry I can not translate it.";
            }
            console.log(`[send text] ${s_Content}`);
            
            if (r_Content) {
                rokidTTS(`<speak>${r_Content}<break time="1s"/>${s_Content}</speak>`);
            } else if (r_Recognition) {
                rokidTTS(`<speak>${r_Recognition}<break time="1s"/>${s_Content}</speak>`);
            } else if (r_Title) {
                rokidTTS(`<speak>${r_Title}<break time="1s"/> ${r_Description}</speak>`);
            } else {
                rokidTTS(s_Content);
            }
            
            var msg = `
                <xml>
                    <ToUserName><![CDATA[${s_ToUserName}]]></ToUserName>
                    <FromUserName><![CDATA[${s_FromUserName}]]></FromUserName>
                    <CreateTime>${s_CreateTime}</CreateTime>
                    <MsgType><![CDATA[${s_MsgType}]]></MsgType>
                    <Content><![CDATA[${s_Content}]]></Content>
                </xml>`;
            res.end(msg);
        });
    });
}

const server = http.createServer(checkSignature);
server.listen(PORT, () => {
    console.log(`Server is runnig ar port ${PORT}`);
});

getAccessToken().then(token => console.log(`access_token: ${token}`));
