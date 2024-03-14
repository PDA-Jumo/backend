var express = require("express");
var router = express.Router();

const userQueries = require("../models/queries/userQueries");
const pool = require("../models/dbConnect");

// /* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

// 유저 조회
router.get("/", (req, res) => {
  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 사용자 테이블에서 모든 이메일 가져오기
    conn.query(userQueries.checkUserQuery, (err, results) => {
      // 3. pool 연결 반납
      conn.release();

      if (err) {
        console.error("Error querying database:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      console.log(results);
      res.send("유저 가져오기 성공");
    });
  });
});

// 이메일 가져오기 엔드포인트
router.get("/checkemail/:email", (req, res) => {
  const { email } = req.params;

  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 사용자 테이블에서 모든 이메일 가져오기
    conn.query(userQueries.checkEmailQuery, (err, results) => {
      // 3. pool 연결 반납
      conn.release();

      if (err) {
        console.error("Error querying database:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      // 가져온 이메일 리스트와 비교하여 중복 여부 확인
      const emailList = results.map((result) => result.email);
      if (emailList.includes(email)) {
        res.send("중복");
      } else {
        res.send("가능");
      }
    });
  });
});

// 회원가입
router.post("/signup", (req, res) => {
  const { nickname, password, profile_img, email } = req.body;

  // 삽입할 데이터
  const userData = [nickname, password, profile_img, email];

  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // MySQL에 데이터 삽입
    conn.query(userQueries.makeUserQuery, userData, (err, results) => {
      // 3. pool 연결 반납
      conn.release();

      if (err) {
        console.error("Error inserting data into MySQL database:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      console.log("User signed up successfully");
      res.send("User signed up successfully");
    });
  });
});

module.exports = router;
