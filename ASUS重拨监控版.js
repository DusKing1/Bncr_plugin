/**作者
 * @author DusKing
 * @name RouterOS
 * @origin 大灰机
 * @version 1.0.0
 * @description ASUS重拨 监控版
 * @platform tgBot qq ssh HumanTG wxQianxun wxXyo
 * @rule asus重拨
 * @admin true
 * @disable false
 */


// 工作原理：
// 1. 获取当前ip，并发送至ip日志群
// 2. 重拨，并在重拨后获取当前ip，并发送至ip日志群





sysMethod.testModule(['ssh2'], { install: true });
const Client = require('ssh2').Client;
// SSH参数
const host = '192.xxxxx.1'
const port = 22
const username = 'xxx'
const password = 'xxxx'
const cmdGetIPv4 = 'nvram get wan0_ipaddr';
const cmdReconnect = 'service restart_wan';
const logGroupId = xxx; // 920962085

let previousIPv4 = '';   // 上一次获取的IPv4地址
let currentIPv4 = '';    // 本次获取到的IPv4地址

module.exports = async s => {
    try {
        console.log('RouterOS重拨启动中，正在获取当前IP');
        await s.reply('RouterOS重拨启动中，正在获取当前IP');
        // 首先获取当前IPv4地址
        previousIPv4 = await getIPv4();
        const maskedPreviousIP = maskIPv4(previousIPv4);
        console.log('当前PPPOE拨号获取到的IPv4地址:', previousIPv4);
        await s.reply('当前PPPOE拨号获取到的IPv4地址: ' + maskedPreviousIP);
        sysMethod.push({
            platform: 'HumanTG',
            groupId: logGroupId,// fixme: 修改为你的群组ID
            msg: '触发RouterOS重拨!\n当前IPv4:\n' + previousIPv4,
            type: 'text',
        });

        console.log('现在将尝试进行PPPOE重拨');
        await s.reply('现在将尝试进行PPPOE重拨');
        // 执行重拨命令
        await reconnectPPP();
        console.log('PPPOE重拨命令执行完毕');

        await new Promise(resolve => setTimeout(resolve, 3500)); // 等待 3.5 秒钟
        console.log('正在获取重拨后的IPv4地址');
        await s.reply('正在获取重拨后的IPv4地址');
        // 获取重拨后的IPv4地址
        currentIPv4 = await getIPv4();
        const maskedCurrentIP = maskIPv4(currentIPv4);
        console.log('重拨后的IPv4地址:', currentIPv4);
        await s.reply('重拨后的IPv4地址: ' + maskedCurrentIP);
        sysMethod.push({
            platform: 'HumanTG',
            groupId: logGroupId,// fixme: 修改为你的群组ID
            msg: 'RouterOS重拨完成!\nIPv4地址:\n' + currentIPv4,
            type: 'text',
        });
    } catch (error) {
        console.error(error);
        if (error.startsWith('SSH连接失败')) {
            // 估计是参数设置有误 应当检查SSH设置
            console.log('请检查SSH设置')
            await s.reply('请检查SSH设置')
        } else if (error.startsWith('无法获取PPPOE拨号的IPv4地址')) {
            // PPPOE拨号之后没有获得到新的ip 应当是olt资源限制，此时应当重启光猫
            console.log('OLT限制，重启光猫')
            await s.reply('OLT限制，重启光猫')
        } else if (error.startsWith('获取IPv4地址时发生错误')) {
            console.log('我也不太清楚为啥');
            await s.reply('我也不太清楚为啥');
        } else {
            console.log('未知错误')
            await s.reply('未知错误')
        }

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
                    const ipv4 = output.trim();
                    if (ipv4) {
                        resolve(ipv4);
                    } else {
                        reject('无法获取 WAN 口的 IPv4 地址');
                    }
                }).on('data', (data) => {
                    output += data.toString();
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
                    reject('获取 IPv4 地址时发生错误: ' + data.toString());
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
            conn.exec(cmdReconnect, (err, stream) => {
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