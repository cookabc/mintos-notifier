const { Wechaty, Friendship } = require('wechaty');
const dateFormat = require('dateformat');
const schedule = require('./schedule');
const { getNotifyMsg } = require('./notify');

const SENDDATE = '20 30 * * * *';

// 延时函数，防止检测出类似机器人行为操作
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//  二维码生成
function onScan(qrcode, status) {
  // 在console端显示二维码
  require('qrcode-terminal').generate(qrcode);
  const qrcodeImageUrl = ['https://api.qrserver.com/v1/create-qr-code/?data=', encodeURIComponent(qrcode)].join('');
  console.log(qrcodeImageUrl);
}

// 登录
async function onLogin(user) {
  console.log(`${user}登录了`);
  // 登陆后创建定时任务
  await initDay();
}

// 登出
function onLogout(user) {
  console.log(`${user} 已经登出`);
}

// 监听对话
async function onMessage(msg) {
  // 发消息人
  const contact = msg.from();
  // 消息内容
  const content = msg.text().trim();
  // 是否是群消息
  const room = msg.room();
  // 发消息人备注
  const alias = await contact.alias();
  // 消息是否是文字
  const isText = msg.type() === bot.Message.Type.Text;
  if (msg.self()) {
    return;
  }
  if (room && isText) {
    // 如果是群消息 目前只处理文字消息
    const topic = await room.topic();
    console.log(`群名: ${topic}; 发消息人: ${contact.name()}; 内容: ${content}`);
  } else if (isText) {
    // 如果非群消息 目前只处理文字消息
    console.log(`发消息人: ${alias}; 消息内容: ${content}`);
  }
}

// 创建微信每日说定时任务
async function initDay() {
  console.log(`已经设定每日说任务`);
  schedule.setSchedule(SENDDATE, async () => {
    try {
      const room = await bot.Room.find({ topic: '天秤基金' });
      const taskStartMsg = `${dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')}, 任务开始执行:`;
      console.log(taskStartMsg);
      await room.say(taskStartMsg);
      const logMsgList = (await getNotifyMsg()) || [];
      logMsgList.forEach(async (msg) => {
        await delay(2000);
        await room.say(msg);
      });
    } catch (e) {
      console.error(e.message);
    }
  });
}

const bot = new Wechaty({ name: 'MintosNotifier' });

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on('message', onMessage);

bot
  .start()
  .then(() => console.log('开始登陆微信'))
  .catch((e) => console.error(e));
