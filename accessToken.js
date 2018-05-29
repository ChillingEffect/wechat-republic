const APPID = 'wx6659b57a4d19c996';
const SECRET = '6c61755bbad19cbb3cb7fbcccef40c2a';
const http = require('http');
const https = require('https');

function getAccessToken() {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  https.get(url, (res) => {
    const { statusCode } = res;
    if (statusCode === 200) {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(rawData);
          const accessToken = json['access_token'];
          console.log(`accessToken: ${accessToken}`);
          return accessToken;
        } catch (e) {
          console.error(e.message);
          return;
        }
      });
    }
  }).on('error', (e) => {
    console.error(e);
    return;
  });
}

var accessToken = getAccessToken();

function getIPList () {
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

function getMedia (mediaId) {
  // const mediaId = '06TTrnlfSRWWVnYkQU0PLm65EC6JUu84Mgm6BSB7Ld5Y8rmW0MUjR2HVtwfSeYhn';
  const url = `http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
  http.get(url, (res) => {
    const { statusCode } = res;
    if (statusCode === 200) {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        // console.log(rawData);
        console.log(`Get Media ${mediaId} OK!`);
      });
    }
  });
}

module.exports = {
  accessToken,
  getAccessToken,
  getIPList,
  getMedia
}
