var express = require("express");

const PortfolioQueries = `SELECT *FROM MyStock Where user_id = ? AND market_location = 0`;
const WorldPortfolioQueries = `SELECT *FROM MyStock Where user_id = ? AND market_location = 1`
module.exports = {
    PortfolioQueries,
    WorldPortfolioQueries
};
