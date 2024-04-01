var express = require("express");

const getKOSPI200 =
  "SELECT stock_code FROM Stock WHERE market_type='KOSPI' ORDER BY updated_at, market_cap DESC LIMIT 200;";

const getKOSDAQ130 =
  "SELECT stock_code FROM Stock WHERE market_type='KOSDAQ'ORDER BY updated_at, market_cap DESC LIMIT 130;";

const getKOSPI =
  "SELECT stock_code FROM Stock WHERE market_type='KOSPI' ORDER BY updated_at, market_cap DESC LIMIT ?;";

const getKOSDAQ =
  "SELECT stock_code FROM Stock WHERE market_type='KOSDAQ'ORDER BY updated_at, market_cap DESC LIMIT ?;";

module.exports = {
  getKOSDAQ130,
  getKOSPI200,
  getKOSPI,
  getKOSDAQ,
};
