// 한국투자증권 API: 30분 분봉 데이터
const axios = require("axios");
require("dotenv").config();

async function getMinutesOhlcv(code = "005930") {
  const URL =
    "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice";
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: process.env.Authorization,
    appKey: "PSnHBne627AvUrSw6mywZRjaAcnshgVuE5j5",
    appSecret:
      "UAah0d8aJP/Q0TD4GIgn34FY5D5KP0Nt3JnFzFQaSSvyLzKyc4v8NgRFUC1SeqTz5kYePnRkEhndmKsxVamBA0hhtEScdOpPB59ssljsEwHHxbf0TCsL5JGEgwO6ndTUwaO4rOLq93nBQzYSH3PBrRJs2/FrthwL56aha4yh6HsZ5+A1cbo=",
    tr_id: "FHKST03010200",
  };
  const params = {
    fid_cond_mrkt_div_code: "J",
    fid_input_iscd: code,
    fid_input_hour_1: "1400",
    FID_ETC_CLS_CODE: "",
    FID_PW_DATA_INCU_YN: "Y",
  };

  try {
    const response = await axios.get(URL, { headers, params });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

getMinutesOhlcv();
