const https = require('https');

const url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx6659b57a4d19c996&secret=6c61755bbad19cbb3cb7fbcccef40c2a";
https.get(url, (res) => {
  const { statusCode } = res;
  if (statusCode === 200) {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(rawData);
        const accessToken = json['access_token'];
        console.log(accessToken);
        getIPList(accessToken);
        getMedia(accessToken);        
      } catch (e) {
        console.error(e.message);
      }
    });
  }
}).on('error', (e) => {
  console.error(e);
});

function getIPList (accessToken) {
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

function getMedia (accessToken) {
  const mediaId = '06TTrnlfSRWWVnYkQU0PLm65EC6JUu84Mgm6BSB7Ld5Y8rmW0MUjR2HVtwfSeYhn';
  const url = `https://file.api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
  https.get(url, (res) => {
    const { statusCode } = res;
    if (statusCode === 200) {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        console.log(rawData);
      });
    }
  });
}