var express = require("express");

const PortfolioQueries = `SELECT *FROM MyStock Where user_id = ? AND market_location = 0`;
module.exports = {
    PortfolioQueries,
};
