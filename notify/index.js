const axios = require('axios');
const FormData = require('form-data');

// Helper functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const groupBy = (loanList, originator) => {
  return loanList.reduce((groupedObj, loanItem) => {
    (groupedObj[loanItem[originator]] = groupedObj[loanItem[originator]] || []).push(loanItem);
    return groupedObj;
  }, {});
};
const getSum = (arr, key) => {
  return arr.reduce((a, b) => a + (parseFloat(b[key]) || 0), 0).toFixed(2);
};

// Feature functions
const getFormData = (pageNum, configIndex) => {
  const formData = new FormData();
  formData.append('max_results', 300);
  formData.append('sort_field', 'available_for_investment_cached');
  formData.append('sort_order', 'DESC');
  formData.append('page', pageNum);
  formData.append('format', 'json');
  formData.append('currencies[]:', 978);
  if ([0, 1, 2, 3].includes(configIndex)) {
    formData.append('min_premium', -30);
    formData.append('ratings[]:', 1);
    formData.append('ratings[]:', 2);
    formData.append('ratings[]:', 3);
    formData.append('ratings[]:', 4);
    formData.append('ratings[]:', 5);
    formData.append('ratings[]:', 6);
    formData.append('with_buyback', 1);
    formData.append('schedule_extendable', 0);
  }
  switch (configIndex) {
    case 0:
      formData.append('max_premium', -5);
      formData.append('lender_groups[]:', 11);
      formData.append('lender_groups[]:', 80);
      formData.append('lender_groups[]:', 72);
      formData.append('lender_groups[]:', 2);
      break;
    case 1:
      formData.append('max_premium', -6);
      formData.append('lender_groups[]:', 25);
      break;
    case 2:
      formData.append('max_premium', -5);
      formData.append('lender_groups[]:', 25);
      break;
    case 3:
      formData.append('max_premium', -4);
      formData.append('lender_groups[]:', 25);
      break;
    case 4:
      formData.append('min_ytm', 20);
      formData.append('statuses[]', 2048);
      formData.append('countries[]', 69);
      formData.append('lender_groups[]:', 72);
      break;
    default:
      break;
  }
  return formData;
};
const getConfigMsg = (configIndex, originator, loanList) => {
  return [
    `${originator}: Discount <= -5%, loans available amount: ${getSum(loanList, 'price')} EUR`,
    `${originator}: Discount <= -6%, loans available amount: ${getSum(loanList, 'price')} EUR`,
    `${originator}: Discount <= -5%, loans available amount: ${getSum(loanList, 'price')} EUR`,
    `${originator}: Discount <= -4%, loans available amount: ${getSum(loanList, 'price')} EUR`,
    `${originator} DPD31+: YTM >= 20%, loans available amount: ${getSum(loanList, 'price')} EUR`,
  ][configIndex];
};
const getSinglePageList = async (pageNum, configIndex) => {
  try {
    const formData = getFormData(pageNum, configIndex);
    const response = await axios({
      method: 'post',
      url: 'https://www.mintos.com/en/market/secondary/list',
      data: formData,
      headers: { 'content-type': `multipart/form-data; boundary=${formData._boundary}` },
    });
    return response.data.data;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const getTotalList = async (pageNum, configIndex) => {
  try {
    const results = await getSinglePageList(pageNum, configIndex);
    if (results.pagination && results.pagination.has_next_page) {
      await wait(3000);
      return results.list.concat(await getTotalList(pageNum + 1, configIndex));
    } else {
      return results.list;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const getNotifyMsg = async (configIndex) => {
  const totalLoanList = await getTotalList(1, configIndex);
  const groupedObj = totalLoanList.length ? groupBy(totalLoanList, 'lender_group_name') : {};
  const msgList = [];
  Object.entries(groupedObj).forEach(([originator, loanList]) => {
    const msg = getConfigMsg(configIndex, originator, loanList);
    msgList.push(msg);
  });
  return msgList;
};
const getMsgList = async () => {
  let finalMsgList = [];
  for (let i = 0; i < 5; i++) {
    const msgList = await getNotifyMsg(i);
    finalMsgList = [...msgList, ...finalMsgList];
    if (i < 4) await wait(3000);
  }
  return finalMsgList;
};

module.exports.getMsgList = getMsgList;
