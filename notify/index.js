const axios = require('axios');
const FormData = require('form-data');

const getSinglePageList = async (pageNum) => {
  try {
    const formData = new FormData();
    formData.append('min_premium', -30);
    formData.append('max_premium', -5);
    formData.append('lender_groups[]:', 11);
    formData.append('lender_groups[]:', 80);
    formData.append('lender_groups[]:', 25);
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

const getList = async (pageNum = 1) => {
  try {
    const results = await getSinglePageList(pageNum);
    if (results.pagination && results.pagination.has_next_page) {
      await wait(3000);
      return results.list.concat(await getList(pageNum + 1));
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

const calcResult = async () => {
  const globalLoanList = await getList();
  const groupedObj = globalLoanList.length ? groupBy(globalLoanList, 'lender_group_name') : {};
  const msgList = [];
  Object.entries(groupedObj).forEach(([originator, loanList]) => {
    const msg = `${originator}: Discount <= -5%, loans available amount: ${getSum(loanList, 'price')} EUR`;
    console.log(msg);
    msgList.push(msg);
  });

  return msgList;
};

module.exports.getNotifyMsg = calcResult;
