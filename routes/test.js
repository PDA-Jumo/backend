var express = require("express");
var router = express.Router();

const testQueries = require("../models/queries/testQueries");
const pool = require("../models/dbConnect");

router.get("/", function (req, res, next) {
  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(testQueries.testQuery, [10], (error, rows) => {
      // 3. pool 연결 반납
      conn.release();

      if (error) throw error;

      console.log("The solution is: ", rows);
      res.json(rows);
    });
  });
});

module.exports = router;
