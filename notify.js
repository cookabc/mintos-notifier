const axios = require('axios');
const FormData = require('form-data');

// const headers = {
//   'anti-csrf-token': '51e05479b62d33e3db0d76c24e60b15d5f3bc699245bff66918be8ed8d0f200b2c3f0dcf911a9e7af895fb58640c14a7acd86b040343954d47abf59a05f4748d',
//   'content-type': `multipart/form-data; boundary=${formData._boundary}`,
//   cookie:
//     '__cfduid=deeb513c36ed1191cadf82a22c772c5661587788958; _ga=GA1.2.988020383.1587788963; _gcl_au=1.1.129707040.1587788964; _gaUserTracking=GA1.2.1998457788.1587788964; rdt_uuid=eac3a3d3-f415-4159-93da-79fbe2fa2fc1; __zlcmid=xtj5OGzmLzfs3Y; _fbp=fb.1.1587788969137.480993304; _hjid=e3ad917e-be94-4259-a181-ebc87ed86aa1; cookiesAccepted=true; G_ENABLED_IDPS=google; gaUserId=33742102; _hjUserAttributesHash=7e97173d19b57d9a0ce7ec66ce9ca71a; _gid=GA1.2.778143881.1589073199; _gaUserTracking_gid=GA1.2.1764379400.1589073204; _hjIncludedInSample=1; alive=1; _gat_UA-53926147-5=1; _gat_UA-53926147-7=1; _dc_gtm_UA-53926147-13=1; PHPSESSID=d3e3f1c70ee5d5828a7ef0406594f316; _uetsid=_uet39deeeac-d28d-6f41-92d9-9ffca6281102',
//   referer:
//     'https://www.mintos.com/webapp/en/invest/secondary-market/?min_premium=-30&max_premium=-5&lender_groups%5B%5D=11&lender_groups%5B%5D=80&lender_groups%5B%5D=25&lender_groups%5B%5D=72&lender_groups%5B%5D=2&currencies%5B%5D=978&ratings%5B%5D=1&ratings%5B%5D=2&ratings%5B%5D=3&ratings%5B%5D=4&ratings%5B%5D=5&ratings%5B%5D=6&with_buyback=1&schedule_extendable=0&max_results=300&sort_field=available_for_investment_cached&sort_order=DESC&page=1&referrer=https%3A%2F%2Fwww.mintos.com&hash=',
//   'sec-fetch-dest': 'empty',
//   'sec-fetch-mode': 'cors',
//   'sec-fetch-site': 'same-origin',
//   'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
// };

let results;

const getList = async (pageNum = 1) => {
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
    results = response.data.data;
    // console.log(results);
    if (results.pagination && results.pagination.has_next_page) {
      setTimeout(() => getList(pageNum + 1), 3000);
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
  await getList();

  let groupedObj = {};
  if (results && results.list) {
    groupedObj = groupBy(results.list, 'lender_group_name');
  }

  Object.entries(groupedObj).forEach(([originator, loanList]) => {
    console.log(`${originator}: Discount <= -5%, loans available amount: ${getSum(loanList, 'price')} EUR`);
  });
};

calcResult()