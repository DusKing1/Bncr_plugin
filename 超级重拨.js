/**作者
 * @author DusKing
 * @name Super Re-connection
 * @origin DusKing
 * @version 1.0.0
 * @description 超级重拨
 * @platform tgBot qq ssh HumanTG wxQianxun wxXyo
 * @rule 超级重拨
 * @admin true
 * @disable false
 */


sysMethod.testModule(['ssh2'], { install: true });
const Client = require('ssh2').Client;
const axios = require('axios');

// SSH参数
const host = '192.dd.2.1';
const port = 22;
const username = 'dd';
const password = 'dddddddd';
const cmd_get_ipv4 = '/ip address print where interface=pppoe-out1';
const cmd_reconnect = '/interface disable pppoe-out1;/interface enable pppoe-out1';
const hass_webhook = 'http://hassip:8123/api/webhook/restartmodem';

let previousIPv4 = '';   // 上一次获取的IPv4地址
let currentIPv4 = '';    // 本次获取到的IPv4地址
let retryCount = 0;      // 重试计数器
let rebootModemFlag = 0;

module.exports = async s => {
    try {
        previousIPv4 = await getIPv4();
        console.log('当前PPPOE拨号获取到的IPv4地址:', previousIPv4);
        await s.reply('当前PPPOE拨号获取到的IPv4地址: ' + previousIPv4);
        previousIPv4 = currentIPv4;

        console.log('现在将尝试进行PPPOE重拨');
        await s.reply('现在将尝试进行PPPOE重拨');
        await reconnectPPP();   // 执行重拨
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒钟
        currentIPv4 = await getIPv4();

        if (currentIPv4 === previousIPv4) {
            // IPv4地址没有变化
            if (retryCount < 3) {
                console.log('重拨未能更换IPv4，尝试再次进行重拨: ', retryCount);
                await s.reply('重拨未能更换IPv4，尝试再次进行重拨: ' + retryCount);
                await reconnectPPP();   // 执行重拨
                await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒钟
                currentIPv4 = await getIPv4();
                retryCount++;
            } else {
                console.log('三次重拨无法更换IP，执行光猫重启');
                await s.reply('三次重拨无法更换IP，执行光猫重启');
                // 光猫重启
                rebootModemFlag = 1;
            }
        } else {
            // IPv4地址有变化，结束脚本
            console.log('新的IPv4: ' + currentIPv4);
            await s.reply('新的IPv4: ' + currentIPv4);
        }
    } catch (error) {
        console.error(error);
        await s.reply(error);
        if (error.startsWith('SSH连接失败')) {
            // 估计是参数设置有误 应当检查SSH设置
            console.log('请检查SSH设置')
            await s.reply('请检查SSH设置')
        } else if (error === '无法获取PPPOE拨号的IPv4地址') {
            // PPPOE拨号之后没有获得到新的ip 应当是olt资源限制，此时应当重启光猫
            console.log('OLT限制，重启光猫')
            await s.reply('OLT限制，重启光猫')
            rebootModemFlag = 1;
        } else if (error.startsWith('获取IPv4地址时发生错误')) {
            console.log('我也不太清楚为啥');
            await s.reply('我也不太清楚为啥');
        } else {
            console.log('未知错误')
            await s.reply('未知错误')
        }

    }

    // 重启光猫
    if (rebootModemFlag === 1) {
        try {
            rebootModemFlag = 0;
            await restartModem(hass_webhook);
        } catch (error) {
            console.error(error);
            await s.reply(error);
        }
    }

}

async function getIPv4() {
    return new Promise((resolve, reject) => {
        conn = new Client();
        conn.on('ready', () => {
            conn.exec(cmd_get_ipv4, (err, stream) => {
                if (err) {
                    reject('SSH连接失败: ' + err);
                    return;
                }
                let output = '';
                stream.on('close', (code, signal) => {
                    conn.end();
                    const lines = output.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.startsWith('0 D ')) {
                            const columns = line.split(/\s+/);
                            if (columns.length >= 2) {
                                const ipv4 = columns[1].replace('/32', '');
                                resolve(ipv4);
                                return;
                            }
                        }
                    }
                    reject('无法获取PPPOE拨号的IPv4地址');
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


async function reconnectPPP() {
    return new Promise((resolve, reject) => {
        conn = new Client();
        conn.on('ready', () => {
            conn.exec(cmd_reconnect, (err, stream) => {
                if (err) {
                    reject('SSH连接失败 ' + err);
                    return;
                }
                stream.on('close', (code, signal) => {
                    conn.end();
                    resolve();
                }).on('data', (data) => {
                    // Do something with the output if needed
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
                    reject('PPPOE重拨失败');
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

async function restartModem(webhookUrl) {
    try {
        const response = await axios.post(webhookUrl);
        if (response.status === 200) {
            console.log('Webhook 触发成功');
        } else {
            console.log('Webhook 触发失败');
        }
    } catch (error) {
        console.error('Webhook触发遇到了错误:', error.message);
    }
}

