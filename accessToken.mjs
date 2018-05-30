import http from 'http';
import https from 'https';

const APPID = 'wx6659b57a4d19c996';
const SECRET = '6c61755bbad19cbb3cb7fbcccef40c2a';

export default function getAccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
    https.get(url, (res) => {
        const { statusCode } = res;
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(rawData);
		if (json.access_token) {
                    return json.access_token;
		} else {
                    console.log(`${json.errcode}: ${json.errmsg}`);
		}
            } catch (e) {
                console.error(e.message);
                return;
            }
        });
    }).on('error', (e) => {
        console.error(e);
        return;
    });
}

export function getIPList(accessToken) {
    const url = `https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=${accessToken}`;
    https.get(url, (res) => {
        const { statusCode } = res;
        if (statusCode === 200) {
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(rawData);
                    console.log(`All WeChat Server IP: ${json.ip_list.length}`);
                    console.log(json.ip_list);
                } catch (e) {
                    console.error(e.message);
                }
            });
        }
    });
}

export function getMedia(accessToken, mediaId) {
    const url = `http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
    http.get(url, (res) => {
        const { statusCode } = res;
        if (statusCode === 200) {
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                console.log(url);
                console.log(`Get Media ${mediaId} OK!`);
            });
        }
    });
}
