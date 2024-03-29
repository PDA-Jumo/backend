var express = require("express");

const searchstockQueries = `SELECT * FROM Stock WHERE stock_name LIKE ?`;
const searchstocknameQueries = `SELECT * FROM Stock WHERE stock_code = ?`;
const searchRandomKospiQueries = `select * from CoreStock where market_location=0 order by RAND() limit 1;`;

module.exports = {
  searchstockQueries,
  searchstocknameQueries,
  searchRandomKospiQueries,
};
