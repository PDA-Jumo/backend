var express = require("express");
const findtokenQueries = `SELECT token FROM Token Where token_id = "sub5";`;
module.exports = {
    findtokenQueries
};