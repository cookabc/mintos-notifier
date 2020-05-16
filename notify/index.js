const axios = require('axios');
const FormData = require('form-data');

const buildFormData1 = (pageNum) => {
  const formData = new FormData();
  formData.append('min_premium', -30);
  formData.append('max_premium', -5);
  formData.append('lender_groups[]:', 11);
  formData.append('lender_groups[]:', 80);
  formData.append('lender_groups[]:', 72);
  formData.append('lender_groups[]:', 2);
  formData.append('currencies[]:', 978);
  formData.append('ratings[]:', 1);
  formData.append('ratings[]:', 2);
  formData.append('ratings[]:', 3);
  formData.append('ratings[]:', 4);
  formData.append('ratings[]:', 5);
  formData.append('ratings[]:', 6);
  formData.append('with_buyback', 1);
  formData.append('schedule_extendable', 0);
  formData.append('max_results', 300);
  formData.append('sort_field', 'available_for_investment_cached');
  formData.append('sort_order', 'DESC');
  formData.append('page', pageNum);
  formData.append('format', 'json');
  return formData;
};

const buildFormData2 = (pageNum) => {
  const formData = new FormData();
  formData.append('min_ytm', 20);
  formData.append('statuses[]', 2048);
  formData.append('countries[]', 69);
  formData.append('lender_groups[]:', 72);
  formData.append('currencies[]:', 978);
  formData.append('max_results', 300);
  formData.append('sort_field', 'available_for_investment_cached');
  formData.append('sort_order', 'DESC');
  formData.append('page', pageNum);
  formData.append('format', 'json');
  return formData;
};

const buildFormData3 = (pageNum) => {
  const formData = new FormData();
  formData.append('min_premium', -30);
  formData.append('max_premium', -6);
  formData.append('lender_groups[]:', 25);
  formData.append('currencies[]:', 978);
  formData.append('ratings[]:', 1);
  formData.append('ratings[]:', 2);
  formData.append('ratings[]:', 3);
  formData.append('ratings[]:', 4);
  formData.append('ratings[]:', 5);
  formData.append('ratings[]:', 6);
  formData.append('with_buyback', 1);
  formData.append('schedule_extendable', 0);
  formData.append('max_results', 300);
  formData.append('sort_field', 'available_for_investment_cached');
  formData.append('sort_order', 'DESC');
  formData.append('page', pageNum);
  formData.append('format', 'json');
  return formData;
};

const getSinglePageList = async (pageNum, configIndex) => {
  try {
    let formData;
    if (configIndex === 1) formData = buildFormData1(pageNum);
    if (configIndex === 2) formData = buildFormData2(pageNum);
    if (configIndex === 3) formData = buildFormData3(pageNum);
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getList = async (pageNum, configIndex) => {
  try {
    const results = await getSinglePageList(pageNum, configIndex);
    if (results.pagination && results.pagination.has_next_page) {
      await wait(3000);
      return results.list.concat(await getList(pageNum + 1, configIndex));
    } else {
      return results.list;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const groupBy = (loanList, loanOriginator) => {
  return loanList.reduce((groupedObj, loanItem) => {
    (groupedObj[loanItem[loanOriginator]] = groupedObj[loanItem[loanOriginator]] || []).push(loanItem);
    return groupedObj;
  }, {});
};

const getSum = (arr, key) => {
  return arr.reduce((a, b) => a + (parseFloat(b[key]) || 0), 0).toFixed(2);
};

const calcResult = async (configIndex) => {
  const globalLoanList = await getList(1, configIndex);
  const groupedObj = globalLoanList.length ? groupBy(globalLoanList, 'lender_group_name') : {};
  const msgList = [];
  Object.entries(groupedObj).forEach(([originator, loanList]) => {
    const msg = {
      1: `${originator}: Discount <= -5%, loans available amount: ${getSum(loanList, 'price')} EUR`,
      2: `${originator} DPD31+: YTM >= 20%, loans available amount: ${getSum(loanList, 'price')} EUR`,
      3: `${originator}: Discount <= -6%, loans available amount: ${getSum(loanList, 'price')} EUR`,
    }[configIndex];
    msgList.push(msg);
  });

  return msgList;
};

const getNotifyMsg = async () => {
  const msgList1 = await calcResult(1);
  await wait(3000);
  const msgList2 = await calcResult(2);
  await wait(3000);
  const msgList3 = await calcResult(3);
  const msgList = [...msgList1, ...msgList2, ...msgList3];
  return msgList;
};

module.exports.getNotifyMsg = getNotifyMsg;
