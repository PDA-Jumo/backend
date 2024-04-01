var express = require("express");
var router = express.Router();
var axios = require("axios");
var cheerio = require("cheerio");
require("dotenv").config();
const searchstockQueries = require("../models/queries/stock/searchstockQueries");
const buySellQueries = require("../models/queries/stock/buySellQueries");
const userQueries = require("../models/queries/userQueries");
const findtokenQueries = require("../models/queries/stock/token");
const pool = require("../models/dbConnect");
const { get10StockThemes } = require("../utils/stock/stockService");
const crawlnews = require("../models/crawlnews");
const financedata = require("../models/finance");
const redisConnect = require("../models/redis/redisConnect");
const {
  buyTransactionSuccessfully,
  sellTransactionSuccessfully,
} = require("../utils/stock/conclusion");

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

router.get("/recommend", async (req, res, next) => {
  const apiKey = process.env.REACT_APP_SHINHAN_API_KEY;
  try {
    const response = await axios.get(
      "https://gapi.shinhaninvest.com:8443/openapi/v1.0/recommend/portfolio",
      {
        headers: {
          apiKey: apiKey,
        },
      }
    );
    const Data = await Promise.all(
      response.data.dataBody.list.map(async (item) => {
        try {
          // Redis에서 현재 가격 정보 조회
          const price = await redisConnect.get(item.stock_code);
          console.log(price);
          // 가격 정보가 없으면 기본 메시지 설정(json형식으로 변경)
          item.current_price = price
            ? JSON.parse(price).output2.stck_prpr
            : "불러오는 중..";
          return {
            stock_name: item.stbd_name,
            stock_code: item.stock_code,
            current_price: item.current_price,
          };
        } catch (err) {
          console.error(err);
          item.current_price = "가격 정보 불러오는 중..";
          return {
            stock_name: item.stbd_name,
            stock_code: item.stock_code,
            current_price: item.current_price,
          };
        }
      })
    );
    res.json(Data);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "fail" });
    next(err);
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
// const { promisify } = require("util");
// const getAsync = promisify(redisConnect.get).bind(redisConnect);
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
    const liveRankingData = await Promise.all(
      response.data.dataBody.map(async (item) => {
        try {
          // Redis에서 현재 가격 정보 조회
          const price = await redisConnect.get(item.stock_code);
          console.log(price);
          // 가격 정보가 없으면 기본 메시지 설정(json형식으로 변경)
          item.current_price = price
            ? JSON.parse(price).output2.stck_prpr
            : "불러오는 중..";
          return {
            rank: item.rank,
            stock_name: item.stbd_nm,
            stock_code: item.stock_code,
            current_price: item.current_price,
          };
        } catch (err) {
          console.error(err);
          item.current_price = "가격 정보 불러오는 중..";
          return {
            rank: item.rank,
            stock_name: item.stbd_nm,
            stock_code: item.stock_code,
            current_price: item.current_price,
          };
        }
      })
    );
    res.json(liveRankingData);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "fail" });
    next(err);
  }
});

//종목 추천
router.get("/recommend", async (req, res, next) => {
  const apiKey = process.env.SHINHAN_API_KEY;
  try {
    const response = await axios.get(
      "https://gapi.shinhaninvest.com:8443/openapi/v1.0/recommend/portfolio",
      {
        headers: {
          apiKey: apiKey,
        },
      }
    );
    const Data = await Promise.all(
      response.data.dataBody.list.map(async (item) => {
        try {
          // Redis에서 현재 가격 정보 조회
          const price = await redisConnect.get(item.stock_code);
          console.log(price);
          // 가격 정보가 없으면 기본 메시지 설정(json형식으로 변경)
          item.current_price = price
            ? JSON.parse(price).output2.stck_prpr
            : "불러오는 중..";
          return {
            stock_name: item.stbd_name,
            stock_code: item.stock_code,
            current_price: item.current_price,
          };
        } catch (err) {
          console.error(err);
          item.current_price = "가격 정보 불러오는 중..";
          return {
            stock_name: item.stbd_name,
            stock_code: item.stock_code,
            current_price: item.current_price,
          };
        }
      })
    );
    res.json(Data);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "fail" });
    next(err);
  }
});

//// NOTE: 매수, 매도 관련 API
// 1. 매수 주문
router.post("/buy", async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, stock_code, quantity, transaction_price } = req.body;
    const total_price = quantity * transaction_price;

    // 2. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return res.status(500).send("서버 에러");
      }

      // 3. 사용자의 현금 잔액을 확인
      conn.query(buySellQueries.getUserCash, [user_id], (err, results) => {
        // 4. 사용자의 현금이 주문 총 가격보다 크면
        if (results[0].cash >= total_price) {
          // 5. 매수 요청 배열 생성
          const buyData = [
            user_id,
            stock_code,
            quantity,
            transaction_price,
            "매수",
          ];
          // 6. MySQL에 데이터 삽입
          conn.query(buySellQueries.buySellQueries, buyData, (err, results) => {
            console.log("검사", results);
            if (results.affectedRows > 0) {
              res.send("매수 주문 성공");
            }
          });
        }
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

// 2. 매도 주문
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

// 3. 매도 가능 수량 조회
// NOTE: 매도 가능 수량은 '(실제 가지고 있는 종목 갯수*평균가격 - 모든 매도 주문 가격 갯수*각 주문 가격)/현재가`
// 이 API는 (실제 가지고 있는 종목 갯수 * 평균 가격 - 모든 매도 주문 가격 갯수 * 각 주문 가격)까지
// '분할 매도'를 위함
router.get("/sellquantity/:user_id/:stock_code", async (req, res, next) => {
  try {
    const quantityData = [req.params.user_id, req.params.stock_code];

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(
        buySellQueries.getSellQuantity,
        quantityData,
        (err, results) => {
          // 5. pool 연결 반납
          conn.release();

          if (err) {
            console.error("MySQL DB 데이터 업데이트 에러:", err);
            res.status(500).send("서버 에러");
            return;
          }
          console.log(results);

          // 결과가 없거나 매도 가능 수량이 없을 경우 0 반환
          if (results.length === 0) {
            console.log("매도 수량 조회 성공 - 매도 가능 수량 없음");
            res.json(0);
          } else {
            console.log("매도 수량 조회 성공");
            console.log(results[0].available_quantity);
            res.json(results[0].available_quantity);
          }
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

// 4. 매수 가능 수량 조회
// NOTE: 매수 가능 수량은 '(내가 가진 cash - 매수 주문된 전체 가격) / 현재가`
// '분할 매도'를 위함
router.get("/buyquantity/:user_id/:stock_code", async (req, res, next) => {
  try {
    const quantityData = [req.params.user_id, req.params.stock_code];

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(
        buySellQueries.getUserCash,
        [req.params.user_id],
        (err, cash) => {
          if (err) {
            console.error("MySQL DB 데이터 업데이트 에러:", err);
            res.status(500).send("서버 에러");
            return;
          }
          console.log(req.params.user_id, "의 cash는 :", cash[0].cash);

          conn.query(
            buySellQueries.getBuyQuantity,
            quantityData,
            (err, results) => {
              console.log(cash);
              console.log(results);
              console.log(results.length);
              // 결과가 없을 경우 NULL
              if (results[0].total_purchase === null) {
                console.log("주문된 매수 총 가격 조회 성공 - NULL");
                res.json(cash[0].cash);
              } else {
                console.log("주문된 매수 총 가격 조회 성공");
                console.log(results[0].total_purchase);
                res.json(cash[0].cash - results[0].total_purchase);
              }
              // 5. pool 연결 반납
              conn.release();
            }
          );
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

// 5. 주식 초기값 조회
router.get("/initial/:stock_code", async (req, res, next) => {
  try {
    const stock_code = req.params.stock_code;
    const redis_data = await redisConnect.get(stock_code);
    const stock_data = redis_data ? JSON.parse(redis_data) : "불러오는 중..";
    console.log(stock_data);
    res.json(stock_data);
  } catch (error) {
    console.error(err);
    res.status(400).json({ message: "fail" });
    next(err);
  }
});

// 6. 매수 바로 체결
router.post("/buy/successfully", async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, stock_code, quantity, transaction_price } = req.body;
    buyTransactionSuccessfully(
      user_id,
      stock_code,
      quantity,
      transaction_price
    );
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

// 7. 매도 바로 체결
router.post("/sell/successfully", async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, stock_code, quantity, transaction_price } = req.body;
    sellTransactionSuccessfully(
      user_id,
      stock_code,
      quantity,
      transaction_price
    );
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

// 주식 상세 정보 가져오기
async function getStockDetail(code) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) {
        reject(err);
      } else {
        conn.query(findtokenQueries.findtokenQueries, async (err, token) => {
          conn.release();
          if (err) {
            reject(err);
          } else {
            const url =
              "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price";
            const headers = {
              "Content-Type": "application/json; charset=utf-8",
              tr_id: "FHKST01010100",
              Authorization: token[0].token,
              appKey: process.env.APPKEY,
              appSecret: process.env.APPSECRET,
            };

            const params = {
              fid_cond_mrkt_div_code: "J",
              fid_input_iscd: code,
            };

            try {
              const response = await axios.get(url, {
                headers: headers,
                params: params,
              });
              resolve({
                prpr: response.data.output.stck_prpr, //현재시세
                per: response.data.output.per, //per
                pbr: response.data.output.pbr, //pbr
                hts_avls: response.data.output.hts_avls, //시가총액
                hts_frgn_ehrt: response.data.output.hts_frgn_ehrt, //외국인 소진율
              });
            } catch (error) {
              reject(error);
            }
          }
        });
      }
    });
  });
}

router.get("/detail/:code", async (req, res, next) => {
  const code = req.params.code;
  try {
    const stockDetail = await getStockDetail(code);
    console.log("이거야!!!", stockDetail);
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

router.get("/kospitop5", (req, res, next) => {
  try {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("DB Disconnected:", err);
        return;
      }
      conn.query(searchstockQueries.kospitop5Queries, async (err, results) => {
        conn.release();

        if (err) {
          console.log("Query Error:", err);
          return;
        }
        console.log("여기여기", results);
        for (var stock of results) {
          const redis_data = await redisConnect.get(stock.stock_code);
          const stock_data = redis_data
            ? JSON.parse(redis_data)
            : "불러오는 중..";
          console.log(stock_data);

          // 각 종목의 데이터를 results 배열에 추가
          stock.stock_price = stock_data.output2.stck_prpr;
        }
        // 코스피 시총 1~5위 종목을 Redis에서 price 가져오기
        // const redis_data = await redisConnect.get(stock_code);
        // const stock_data = redis_data
        //   ? JSON.parse(redis_data)
        //   : "불러오는 중..";
        // console.log(stock_data);

        console.log(results);
        res.json(results);
      });
    });
  } catch (error) {
    console.error(err);
    res.status(400).json({ message: "fail" });
    next(err);
  }
});

router.get("/kosdaqtop5", function (req, res, next) {
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Disconnected:", err);
      return;
    }
    conn.query(searchstockQueries.kosdaqtop5Queries, async (err, results) => {
      conn.release();

      if (err) {
        console.log("Query Error:", err);
        return;
      }

      console.log("여기여기", results);
      for (var stock of results) {
        const redis_data = await redisConnect.get(stock.stock_code);
        const stock_data = redis_data
          ? JSON.parse(redis_data)
          : "불러오는 중..";
        console.log(stock_data);

        // 각 종목의 데이터를 results 배열에 추가
        stock.stock_price = stock_data.output2.stck_prpr;
      }

      console.log(results);

      res.json(results);
    });
  });
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
