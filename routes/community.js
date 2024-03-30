var express = require("express");
var router = express.Router();

const testQueries = require("../models/queries/testQueries");
const communityQueries = require("../models/queries/communityQueries");
const getroomList = require("../models/queries/communityQueries");

const pool = require("../models/dbConnect");

router.get("/", function (req, res, next) {
  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(communityQueries.getAllCommunityList, (error, rows) => {
      // 3. pool 연결 반납
      conn.release();

      if (error) throw error;

      res.json(rows);
      console.log("커뮤니티 리스트를 불러옵니다");
    });
  });
});

router.get("/hot", function (req, res, next) {
  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(communityQueries.getHotCommunityList, (error, rows) => {
      // 3. pool 연결 반납
      conn.release();

      if (error) throw error;

      res.json(rows);
      console.log("현재 핫한 종목 커뮤니티 리스트를 불러옵니다");
    });
  });
});

router.get("/:stock_code/:limit", function (req, res, next) {
  const stock_code = req.params.stock_code;
  const limit = parseInt(req.params.limit);

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(
      communityQueries.getAllChatsByStockcodeLIMIT,
      [stock_code, limit],
      (error, rows) => {
        // 3. pool 연결 반납
        conn.release();

        if (error) throw error;

        // console.log("All Chats By Stock Code : ", rows);
        res.json(rows);
      }
    );
  });
});

//방 검색
router.get("/search", function (req, res, next) {
  console.log("개피곤");
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    let stockName = "%" + req.query.stock_name + "%";

    conn.query(getroomList.getroomList, [stockName], (err, results) => {
      conn.release();

      if (err) {
        console.log("Query Error:", err);
        return;
      }
      console.log(stockName);
      res.json(results);
    });
  });
});

router.get("/:stock_code", function (req, res, next) {
  const stock_code = req.params.stock_code;

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(
      communityQueries.getAllChatsByStockcode,
      [stock_code],
      (error, rows) => {
        // 3. pool 연결 반납
        conn.release();

        if (error) throw error;

        // console.log("All Chats By Stock Code : ", rows);
        res.json(rows);
      }
    );
  });
});

router.post("/create/:stock_code", function (req, res, next) {
  const stock_code = req.params.stock_code;
  const { user_id, stock_name, content, created_at } = req.body;
  console.log(user_id, stock_name, content);

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(
      communityQueries.insertChat,
      [user_id, stock_code, stock_name, content, created_at],
      (error, rows) => {
        // 3. pool 연결 반납
        conn.release();

        //         if (error) throw error;

        // console.log("All Chats By Stock Code : ", rows);
        res.json(rows);
      }
    );
  });
});

// router.get("/:stock_code", function (req, res, next) {
//   const stock_code = req.params.stock_code;

//   pool.getConnection((err, conn) => {
//     if (err) {
//       console.error("DB Disconnected:", err);
//       return;
//     }

//     // 2. 쿼리 실행
//     conn.query(
//       communityQueries.getAllChatsByStockcode,
//       [stock_code],
//       (error, rows) => {
//         // 3. pool 연결 반납
//         conn.release();

//         if (error) throw error;

//         // console.log("All Chats By Stock Code : ", rows);
//         res.json(rows);
//       }
//     );
//   });
// });

// router.post("/:stock_code", function (req, res, next) {
//   const stock_code = req.params.stock_code;
//   const user_id = parseInt(req.body.user_id);
//   const stock_name = req.body.stock_name;
//   const content = req.body.content;

//   pool.getConnection((err, conn) => {
//     if (err) {
//       console.error("DB Disconnected:", err);
//       return;
//     }

//     // 2. 쿼리 실행
//     conn.query(
//       communityQueries.insertChat,
//       [user_id, stock_code, stock_name, content],
//       (error, rows) => {
//         // 3. pool 연결 반납
//         conn.release();

//         if (error) throw error;

//         res.json(rows);
//       }
//     );
//   });
// });

router.get("/:stock_code/user/:user_id", function (req, res, next) {
  const stock_code = req.params.stock_code;
  const user_id = req.params.user_id;
  // 1. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    // 2. 쿼리 실행
    conn.query(
      communityQueries.getAllChatsByUserid,
      [stock_code, user_id],
      (error, rows) => {
        // 3. pool 연결 반납
        conn.release();

        if (error) throw error;

        // console.log("All Chats By User Id : ", rows);
        res.json(rows);
      }
    );
  });
});

module.exports = router;
