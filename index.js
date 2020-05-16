const axios = require('axios');
const dateFormat = require('dateformat');
const schedule = require('node-schedule');
const { getNotifyMsg } = require('./notify');

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
  const logMsgList = (await getNotifyMsg()) || [];
  if (logMsgList.length === 0) {
    console.log('No available loans');
    await postSlackMsg('No available loans');
  } else {
    logMsgList.forEach(async (msg) => {
      console.log(msg);
      await postSlackMsg(msg);
    });
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
