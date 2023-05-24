/**作者
 * @author 薛定谔的大灰机,Heyboi, DusKing
 * @name 493重拨超级魔改版
 * @origin 大灰机
 * @version 1.0.0
 * @description 控制493重新拨号
 * @rule IP 493|ip已被限制|IP 403|此ip已被限制
 * @rule ^(493重拨)(开|关)$
 * @admin false
 * @disable false
 * @priority 9999
 */
/**
 * 
 * Heyboi魔改说明
 * 改成指定监听用户id或者群组id，支持设置插件开关，方便家宽党和女朋友打游戏不掉线
 * 设置插件开关方式二选一：
 * 方式1：管理员发送set Heyboi 493Switch on/off 设置开关（on为启动插件off为关）
 * 方式2：管理员发送493重拨开/关
 *  
 */


/**
 * 
 * DusKing魔改说明
 * 与我的RouterOS重拨插件和超级重拨插件结合，
 * 实现了ros重拨、ros超级重拨、ros混合重拨三种方式
 * 方便灵活设置重拨策略，避免重拨次数过多导致被老婆骂
 * 方式1：管理员发送set DusKing 493Switch rosHybrid/rosSuper/rosOnly/off 设置重拨方式
 * 方式2：管理员发送493重拨 启用ros混合重拨/启用ros超级重拨/启用ros重拨/关闭
 * 
 */


// userId和groupId建议二选一即可
const userId = '5909201174';
const groupId = '';


module.exports = async (s) => {
  const db = new BncrDB('Heyboi');

  if (await s.param(1) === '493重拨') {
    if (!(await s.isAdmin())) {
      return;
    }

    const status = s.param(2);

    if (status === '启用ros混合重拨') {
      if (await db.set('493Switch', 'rosHybrid')) {
        await s.delMsg(s.reply('设置成功，已启用ros混合重拨'), 5);
      } else {
        await s.delMsg(s.reply('设置失败'), 5);
      }
    } else if (status === '启用ros超级重拨') {
      if (await db.set('493Switch', 'rosSuper')) {
        await s.delMsg(s.reply('设置成功，已启用ros超级重拨'), 5);
      } else {
        await s.delMsg(s.reply('设置失败'), 5);
      }
    } else if (status === '启用ros重拨') {
      if (await db.set('493Switch', 'rosOnly')) {
        await s.delMsg(s.reply('设置成功，已启用ros重拨'), 5);
      } else {
        await s.delMsg(s.reply('设置失败'), 5);
      }
    } else if (status === '关闭') {
      if (await db.set('493Switch', 'off')) {
        await s.delMsg(s.reply('设置成功，已关闭493检测'), 5);
      } else {
        await s.delMsg(s.reply('设置失败'), 5);
      }
    }

    return;
  }

  const status = await db.get('493Switch');

  if (status === 'rosHybrid' || status === 'rosSuper' || status === 'rosOnly') {
    if (userId) {
      if (await s.getUserId() !== userId) {
        console.log('id不匹配');
        return;
      }
    } else if (groupId) {
      if (await s.getGroupId() !== groupId) {
        console.log('id不匹配');
        return;
      }
    }
    
    sysMethod.inline(`${key}`);
  }
};
