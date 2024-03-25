var express = require("express");

const searchstockQueries = `SELECT * FROM Stock WHERE stock_name LIKE ?`;
const searchstocknameQueries = `SELECT * FROM Stock WHERE stock_code = ?`;

module.exports = {
    searchstockQueries,
    searchstocknameQueries
};


