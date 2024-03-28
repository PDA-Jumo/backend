var express = require("express");
var router = express.Router();
var axios = require("axios");
var cheerio = require("cheerio");
require("dotenv").config();
const searchstockQueries = require("../models/queries/stock/searchstockQueries");
const buySellQueries = require("../models/queries/stock/buySellQueries");
const userQueries = require("../models/queries/userQueries");
const pool = require("../models/dbConnect");
const { get10StockThemes } = require("../utils/stock/stockService");
const crawlnews = require("../models/crawlnews");
const financedata = require("../models/finance");

//종목 검색
router.get("/search", function (req, res, next) {
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }

    let stockName = "%" + req.query.stock_name + "%";

    conn.query(
      searchstockQueries.searchstockQueries,
      [stockName],
      (err, results) => {
        conn.release();

        if (err) {
          console.log("Query Error:", err);
          return;
        }
        res.json(results);
      }
    );
  });
});

router.get("/kospiRanking", async (req, res, next) => {
  try {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("DB Disconnected:", err);
        return;
      }

      conn.query(
        searchstockQueries.searchRandomKospiQueries,
        (err, results) => {
          conn.release();

          if (err) {
            console.log("Query Error:", err);
            return;
          }
          res.json(results);
        }
      );
    });
  } catch (error) {
    console.error("Error", error);
  }
});

// 마켓 이슈 GET
router.get("/issue", async (req, res, next) => {
  try {
    const apiKey = req.headers.apikey;

    const responseFromShinhan = await axios.get(
      "https://gapi.shinhaninvest.com:8443/openapi/v1.0/strategy/market-issue",
      {
        headers: {
          apiKey: apiKey,
        },
      }
    );
    const issueData = responseFromShinhan.data.dataBody.list;

    res.json(issueData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 코스피 코스닥 지수, (개인/외국인/기관) 정보 GET
router.get("/liveSise", async (req, res, next) => {
  try {
    const crawlingLiveSise = async () => {
      const siseData = await axios
        .get("https://finance.naver.com/")
        .then((res) => {
          const $ = cheerio.load(res.data);
          const kospiNum1 = $(".kospi_area").find(".num_quot .num").text();
          const kospiNum2 = $(".kospi_area").find(".num_quot .num2").text();
          const kospiNum3 = $(".kospi_area").find(".num_quot .num3").text();

          const kospiLiveInfo = $(".kospi_area").find(".dl dd");
          const kospiPerson = kospiLiveInfo.eq(0).find("a").text();
          const kospiForeigner = kospiLiveInfo.eq(1).find("a").text();
          const kospiCompany = kospiLiveInfo.eq(2).find("a").text();

          const kosdaqNum1 = $(".kosdaq_area").find(".num_quot .num").text();
          const kosdaqNum2 = $(".kosdaq_area").find(".num_quot .num2").text();
          const kosdaqNum3 = $(".kosdaq_area").find(".num_quot .num3").text();

          const kosdaqLiveInfo = $(".kosdaq_area").find(".dl dd");
          const kosdaqPerson = kosdaqLiveInfo.eq(0).find("a").text();
          const kosdaqForeigner = kosdaqLiveInfo.eq(1).find("a").text();
          const kosdaqCompany = kosdaqLiveInfo.eq(2).find("a").text();

          let kospi = {
            num1: kospiNum1,
            num2: kospiNum2,
            num3: kospiNum3,
            person: kospiPerson,
            foreigner: kospiForeigner,
            company: kospiCompany,
          };

          let kosdaq = {
            num1: kosdaqNum1,
            num2: kosdaqNum2,
            num3: kosdaqNum3,
            person: kosdaqPerson,
            foreigner: kosdaqForeigner,
            company: kosdaqCompany,
          };
          let result = {
            kospi,
            kosdaq,
          };
          return result;
        });

      return siseData;
    };
    const liveSise = await crawlingLiveSise();
    res.json(liveSise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 지금 주목받는 테마
// router.get("/theme", async (req, res, next) => {
//   try {
//     const response = await get10StockThemes(
//       req.query.ordering ? req.query.ordering : "desc"
//     );
//     res.json(response);
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: "fail" });
//     next(err);
//   }
// });

router.get("/theme", async (req, res, next) => {
  try {
    const response = await axios.get(
      "https://api.alphasquare.co.kr/theme/v2/leader-board?limit=10"
    );
    res.json(response.data);
  } catch (err) {
    console.log("error", err);
    console.error(err);
    res.status(400).json({ message: "fail" });
    next(err);
  }
});

// 실시간 종목 순위 GET
router.get("/liveRanking/:type", async (req, res, next) => {
  try {
    const type = req.params.type;
    const apiKey = req.headers.apikey;
    const response = await axios.get(
      `https://gapi.shinhaninvest.com:8443/openapi/v1.0/ranking/issue?query_type=${type}`,
      {
        headers: {
          apiKey: apiKey,
        },
      }
    );
    res.json(response.data.dataBody);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "fail" });
    next(err);
  }
});

router.post("/buy", async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, stock_code, quantity, transaction_price } = req.body;

    const buyData = [user_id, stock_code, quantity, transaction_price, "매수"];
    console.log(buyData);

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(buySellQueries.buySellQueries, buyData, (err, results) => {
        // 5. pool 연결 반납
        conn.release();

        if (err) {
          console.error("MySQL DB 데이터 업데이트 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("매수 주문 성공");
        res.send("성공");
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

router.post("/sell", async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, stock_code, quantity, transaction_price } = req.body;

    const sellData = [user_id, stock_code, quantity, transaction_price, "매도"];
    console.log(sellData);

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(buySellQueries.buySellQueries, sellData, (err, results) => {
        // 5. pool 연결 반납
        conn.release();

        if (err) {
          console.error("MySQL DB 데이터 업데이트 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("매도 주문 성공");
        res.send("성공");
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

// 주식 상세 정보 가져오기
async function getStockDetail(code) {
  const url =
    "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price";
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    tr_id: "FHKST01010100",
    Authorization: process.env.AUTHORIZATION,
    appKey: process.env.APPKEY,
    appSecret: process.env.APPSECRET,
  };
  const params = {
    fid_cond_mrkt_div_code: "J",
    fid_input_iscd: code,
  };

  try {
    const response = await axios.get(url, { headers: headers, params: params });
    return {
      prpr: response.data.output.stck_prpr, //현재시세
      per: response.data.output.per, //per
      pbr: response.data.output.pbr, //pbr
      hts_avls: response.data.output.hts_avls, //시가총액
      hts_frgn_ehrt: response.data.output.hts_frgn_ehrt, //외국인 소진율
    };
  } catch (error) {
    console.error("Error:", error);
  }
}

router.get("/detail/:code/:name", async (req, res, next) => {
  const code = req.params.code;
  try {
    const stockDetail = await getStockDetail(code);
    res.json(stockDetail);
  } catch (error) {
    console.error("Error:", error);
  }
});

router.get("/news/:code", async (req, res, next) => {
  const code = req.params.code;
  try {
    const stockNews = await crawlnews(code);
    res.json(stockNews);
    console.log(stockNews);
  } catch (error) {
    console.error("Error:", error);
  }
});

router.get("/graph/:code", async (req, res, next) => {
  const code = req.params.code;
  try {
    const stockgraph = await financedata(code);
    res.json(stockgraph);
  } catch (error) {
    console.error("Error:", error);
  }
});

router.get("/myStock/:user_id", async (req, res, next) => {
  try {
    const user = [req.params.user_id];
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("DB Disconnected:", err);
        return;
      }

      conn.query(userQueries.findMyStockByUserID, user, (err, results) => {
        conn.release();

        if (err) {
          console.log("Query Error:", err);
          return;
        }
        res.json(results);
      });
    });
  } catch (error) {
    console.error("Error", error);
  }
});

module.exports = router;
