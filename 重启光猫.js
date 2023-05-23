/**作者
 * @author DusKing
 * @name Reboot Modem
 * @origin DusKing
 * @version 1.0.0
 * @description 通过HASS重启光猫
 * @platform tgBot qq ssh HumanTG wxQianxun wxXyo
 * @rule onu重启
 * @admin true
 * @disable false
 */

// 需要把hass_webhook换成你自己的webhook
// 比如 hass地址为 10.0.0.111:8123
// 对应的能使光猫重启的webhook为rebootmodem
// 那么hass_webhook就应该是 http://10.0.0.111:8123/api/webhook/rebootmodem

const axios = require('axios');

const hass_webhook = 'http://hassip:8123/api/webhook/rebootmodem';

module.exports = async s => {
    try {
        await s.reply('光猫重启中...');
        await restartModem(hass_webhook);
    } catch (error) {
        console.error(error);
        await s.reply(error);
    }
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