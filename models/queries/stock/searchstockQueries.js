var express = require("express");

const searchstockQueries = `SELECT * FROM Stock WHERE stock_name LIKE ?`;
const searchstocknameQueries = `SELECT * FROM Stock WHERE stock_code = ?`;
const kospitop5Queries = `SELECT * FROM CoreStock where market_type = 'KOSPI' ORDER BY market_cap DESC LIMIT 5;`
const kosdaqtop5Queries = `SELECT * FROM CoreStock where market_type = 'KOSDAQ' ORDER BY market_cap DESC LIMIT 5;`

module.exports = {
    searchstockQueries,
    searchstocknameQueries,
    kospitop5Queries,
    kosdaqtop5Queries
};


