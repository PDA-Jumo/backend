var express = require("express");

const testQuery = `SELECT * FROM test WHERE id = ?`;

module.exports = {
  testQuery,
};
