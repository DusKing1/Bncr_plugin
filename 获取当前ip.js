/**作者
 * @author DusKing
 * @name Get Current IP
 * @origin DusKing
 * @version 1.0.0
 * @description 获取当前IP
 * @platform tgBot qq ssh HumanTG wxQianxun wxXyo
 * @rule 当前ip
 * @admin true
 * @disable false
 */


// 注意：
// 暂时仅适配了MikroTik RouterOS

sysMethod.testModule(['ssh2'], { install: true });
const Client = require('ssh2').Client;

const host = '192.xx.x.x';
const port = 22;
const username = 'ddd';
const password = 'ddd';
const cmdGetIPv4 = '/ip address print where interface=pppoe-out1';

let currentIPv4 = '';

module.exports = async s => {
    try {
        await s.reply('正在获取当前IP');
        currentIPv4 = await getIPv4();
        const maskedIP = maskIPv4(currentIPv4);
        await s.reply({ msg: '当前IP为: ' + maskedIP, dontEdit: false });
    } catch (error) {
        console.error(error);
        await s.reply(error);
    }
}

function maskIPv4(rawIPv4) {
    const ipParts = rawIPv4.split('.'); // 使用点号分隔符将地址部分拆分为四个部分
    let maskedIP = '';
    if (ipParts.length === 4) {
        ipParts[1] = 'x'; // 将第二个部分替换为 'x' 或其他占位符
        maskedIP = ipParts.join('.'); // 重新组合为掩码后的 IPv4 地址
    }
    return maskedIP;
}

async function getIPv4() {
    return new Promise((resolve, reject) => {
        conn = new Client();
        conn.on('ready', () => {
            conn.exec(cmdGetIPv4, (err, stream) => {
                if (err) {
                    reject('SSH连接失败: ' + err);
                    return;
                }
                let output = '';
                stream.on('close', (code, signal) => {
                    conn.end();
                    const lines = output.split('\n');
                    const regex = /\b(?:\d{1,3}\.){3}\d{1,3}(?=\/32\b)/; // 匹配以 /32 结尾的 IPv4 地址部分
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        const match = line.match(regex);
                        if (match) {
                            const ipv4 = match[0];
                            resolve(ipv4);
                            return;
                        }
                    }
                    reject('无法获取PPPOE拨号的IPv4地址' + output);
                }).on('data', (data) => {
                    output += data.toString();
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
                    reject('获取IPv4地址时发生错误: ' + data.toString());
                });
            });
        }).connect({
            host: host,
            port: port,
            username: username,
            password: password
        });
    });
}

