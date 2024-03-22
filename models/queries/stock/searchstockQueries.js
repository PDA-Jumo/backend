var express = require("express");

const searchstockQueries = `SELECT * FROM Stock WHERE stock_name LIKE ?`;

module.exports = {
    searchstockQueries,
};
