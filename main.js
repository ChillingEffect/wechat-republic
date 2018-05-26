/**
 * 整个验证步骤分为三步
 *    1. 将token、timestamp、nonce三个参数进行字典序排序
 *    2. 将三个参数字符串拼接成一个字符串进行sha1加密
 *    3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
 **/


const http = require('http');
const url = require('url');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Web 服务器端口
const port = 3333;
// 微信公众平台服务器配置中的 Token
const token = 'adele';


/**
 *  对字符串进行sha1加密
 * @param  {string} str 需要加密的字符串
 * @return {string}     加密后的字符串
 */
function sha1(str) {
  const md5sum = crypto.createHash('sha1');
  md5sum.update(str);
  const ciphertext = md5sum.digest('hex');
  return ciphertext;
}

/**
 * 验证服务器的有效性
 * @param  {object} req http 请求
 * @param  {object} res http 响应
 * @return {object}     验证结果
 */
function checkSignature(req, res) {
  const query = url.parse(req.url, true).query;
  console.log('Request URL: ', req.url);
  const signature = query.signature;
  const timestamp = query.timestamp;
  const nonce = query.nonce;
  const echostr = query.echostr;
  // 将 token/timestamp/nonce 三个参数进行字典序排序
  const tmpArr = [token, timestamp, nonce];
  const tmpStr = sha1(tmpArr.sort().join(''));
  // 验证排序并加密后的字符串与 signature 是否相等
  if (tmpStr === signature) {
    wxmsg(req, res);
  } else {
    res.end('signature check failed');
    console.log('Signature Check Failed');
  }
}

function wxmsg(req, res) {
  if (req.method == 'POST') {
    var body = '';
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      const r_ToUserName = body.match(/<ToUserName><\!\[CDATA\[(.*)\]\]><\/ToUserName>/)[1];
      const r_FromUserName = body.match(/<FromUserName><\!\[CDATA\[(.*)\]\]><\/FromUserName>/)[1];
      const r_Content = body.match(/<Content><\!\[CDATA\[(.*)\]\]><\/Content>/)[1];
      const r_CreateTime = body.match(/<CreateTime><\!\[CDATA\[(.*)\]\]><\/CreateTime>/)[1];

      console.log(`[recive text] ${r_Content} (from ${r_FromUserName} at ${r_CreateTime})`);

      const s_ToUserName = r_FromUserName;
      const s_FromUserName = r_ToUserName;
      const s_CreateTime = parseInt(Date.now()/1000);
      var s_Content = '';
      
      const fortune = spawn('fortune');
      fortune.stdout.on('data', (data) => {
        s_Content += data;
      });
      fortune.on('close', (code) => {
        console.log(`[send text] ${s_Content}`);
        var msg = `
          <xml>
            <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
            <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
            <CreateTime>${CreateTime}</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[${Content}]]></Content>
          </xml>`;
        res.end(msg);
      });
    });
  }
}

const server = http.createServer(checkSignature)
server.listen(port, () => {
  console.log(`Server is runnig ar port ${port}`);
});
