require("dotenv").config();
var mysql = require("mysql2");

var DBINFO = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
};

// MySQL 연결 pool 생성
var pool = mysql.createPool(DBINFO);

// pool에서 연결 획득

module.exports = pool;
