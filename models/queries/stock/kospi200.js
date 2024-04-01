var express = require("express");

const getKOSPI200 =
  "SELECT stock_code FROM Stock WHERE market_type='KOSPI' ORDER BY updated_at, market_cap DESC LIMIT 200;";

const getKOSDAQ130 =
  "SELECT stock_code FROM Stock WHERE market_type='KOSDAQ'ORDER BY updated_at, market_cap DESC LIMIT 130;";

module.exports = {
  getKOSDAQ130,
  getKOSPI200,
};