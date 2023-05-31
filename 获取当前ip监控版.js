/**作者
 * @author DusKing
 * @name Get Current IP
 * @origin DusKing
 * @version 1.0.0
 * @description 获取当前IP监控版
 * @platform tgBot qq ssh HumanTG wxQianxun wxXyo
 * @rule 当前ip
 * @admin true
 * @disable false
 */


// 注意：
// 暂时仅适配了MikroTik RouterOS
// 使用方法：
// 1. 在bncr插件文件夹中新建一个文件夹，名称随意，如黄昏之主
// 2. 将该文件放置到该文件夹中
// 3. 编辑下方命令参数：
//    3.1. host = 路由器地址
//    3.2. port = SSH端口，默认为22
//    3.3. username = SSH用户名
//    3.4. password = SSH密码
//    3.5. cmdGetIPv4 = 获取IPv4地址的命令，须根据你的路由器系统进行修改
//    3.6. groupId = IP日志群组ID，须根据你的群组ID进行修改
// 4. 保存（可能需要重启bncr，我的不用）
// 5. 在bncr中输入命令：当前ip
// 6. 等待获取结果，模糊化结果会发送在群组中，原始结果会发送在监控群组中
// 注意：别把你的监控群组设置为公开群组或者发给别人，否则你的IP会泄露

sysMethod.testModule(['ssh2'], { install: true });
const Client = require('ssh2').Client;

const host = '192.xx.x.x';
const port = 22;
const username = 'ddd';
const password = 'ddd';
const cmdGetIPv4 = '/ip address print where interface=pppoe-out1';
// 将下面的 xxxxxxx 替换为你的ip监控日志群组ID
const groupId = xxxxxxx;

let currentIPv4 = '';

module.exports = async s => {
    try {
        console.log('正在获取当前IP');
        await s.reply('正在获取当前IP');
        currentIPv4 = await getIPv4();
        const maskedIP = maskIPv4(currentIPv4);
        console.log('当前IP为:', currentIPv4);
        sysMethod.push({
            platform: 'HumanTG',
            groupId: groupId,// fixme: 修改为你的群组ID
            msg: '当前IP为: ' + currentIPv4,
            type: 'text',
        });
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

