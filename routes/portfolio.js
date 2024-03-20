var express = require("express")
var router = express.Router();
const PortfolioQueries = require("../models/queries/Portfolio/PortfolioQueries")
const pool = require("../models/dbConnect")
const axios = require('axios');

//주식 현재가 가져오기
async function getCurrentPrice(code) {
  const url = "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price";
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "tr_id": "FHKST01010100",
    
    
    
  };
  const params = {
    "fid_cond_mrkt_div_code": "J",
    "fid_input_iscd": code
  };

  try {
    const response = await axios.get(url, { headers: headers, params: params });
    return response.data.output.stck_prpr;
  } catch (error) {
    console.error("Error:", error);
  }
}

// assets : 총자산, myStock: 내 보유 종목, mystock_percent 종목별 비중
function calculateAssets(resultsWithCurrentPrice) {
    let assets = 0;
    let myStock = [];
    let mystock_percent = [];

    resultsWithCurrentPrice.forEach(stock => {
        // assets 계산
        assets += stock.quantity * parseInt(stock.current_price);
    });

    resultsWithCurrentPrice.forEach(stock => {
        // myStock 배열에 stock_name 추가
        myStock.push(stock.stock_name);

        // mystock_percent 계산
        let stock_assets = Math.round((parseInt(stock.current_price) * stock.quantity / assets) * 1000) / 10;
        mystock_percent.push({
            stock_name: stock.stock_name,
            stock_assets: stock_assets
        });
    });

    return {
        assets: assets,
        myStock: myStock,
        mystock_percent: mystock_percent
    };
}


//포트폴리오 보유종목 들고오기
router.get("/", function(req, res, next){
    pool.getConnection((err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }

        conn.query(PortfolioQueries.PortfolioQueries, [req.query.user_id], async (err,results)=>{
            conn.release();
            
            if(err){
                console.log("Query Error:",err)
                return
            }
            // res.json(results)

            const promises = results.map(async (stock) => {
                const currentPrice = await getCurrentPrice(stock.stock_code);
  

                return {
                    ...stock,
                    current_price: currentPrice,      //현재가격 추가
                };
            });

            //data들고올때까지 기다료
            const resultsWithCurrentPrice = await Promise.all(promises);

            let result = calculateAssets(resultsWithCurrentPrice);
            res.json(result);
            
        })

    })
  
})

 

module.exports = router