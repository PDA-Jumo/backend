// setData.js
const redisClient = require("./redisConnect");

const setData = async () => {
  try {
    // 'a' 키에 '1' 값을 설정합니다.
    await redisClient.set("a", "1");
    console.log("데이터 설정 완료: 키 'a'에 값 '1'을 저장했습니다.");

    // 설정한 값을 확인합니다.
    const value = await redisClient.get("a");
    console.log(`키 'a'의 값: ${value}`);

    // Redis 클라이언트 연결을 종료합니다.
    await redisClient.quit();
  } catch (err) {
    console.error("Redis 작업 중 오류 발생:", err);
  }
};

setData();

// var express = require("express");
// var router = express.Router();

// const stockQueries = require("../queries/stockQueries");

// const pool = require("../dbConnect");

// // console.log(pool);

// pool.getConnection((err, conn) => {
//   conn.query(stockQueries.getKOSPI200, (error, rows) => {
//     conn.release();

//     console.log(rows);

//     if (error) throw error;
//   });
// });
