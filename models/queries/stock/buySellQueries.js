var express = require("express");

const buySellQueries = `INSERT INTO Transaction (user_id, stock_code, quantity, transaction_price, transaction_type)
VALUES (?, ?, ?, ?, ?);`;

module.exports = {
  buySellQueries,
};
