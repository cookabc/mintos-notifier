const axios = require('axios');
const dateFormat = require('dateformat');
const schedule = require('node-schedule');
const { getMsgList } = require('./notify');

async function postSlackMsg(msg) {
  await axios({
    method: 'post',
    url: 'https://hooks.slack.com/services/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',
    data: { text: msg },
    headers: { 'content-type': 'application/json' },
  });
}

async function runTaskLoop() {
  const taskStartMsg = `${dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')}, 执行任务`;
  console.log(taskStartMsg);
  const msgList = (await getMsgList()) || [];
  if (msgList.length === 0) {
    console.log('No available loans');
    await postSlackMsg('No available loans');
  } else {
    concatMsg = '';
    msgList.forEach(async (msg) => {
      concatMsg = concatMsg + msg + '\n\n';
    });
    console.log(concatMsg);
    await postSlackMsg(concatMsg);
  }
}

async function initTask() {
  console.log('设定定时任务');
  const rule = new schedule.RecurrenceRule();
  rule.minute = new schedule.Range(0, 59, 10);
  schedule.scheduleJob(rule, runTaskLoop);
  console.log('定时任务设定成功');
  await runTaskLoop();
}

initTask();
