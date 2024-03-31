var express = require("express")
var router = express.Router();
const PortfolioQueries = require("../models/queries/Portfolio/PortfolioQueries")
const WorldPortfolioQueries = require("../models/queries/Portfolio/PortfolioQueries")
const LikeStockQueries = require("../models/queries/Portfolio/LikeStock")
const ClickLikeStock = require("../models/queries/Portfolio/LikeStock")
const CheckLikeStock = require("../models/queries/Portfolio/LikeStock")
const CancleLikeStock = require("../models/queries/Portfolio/LikeStock")
const redisConnect = require("../models/redis/redisConnect");
const pool = require("../models/dbConnect")
const axios = require('axios');
require("dotenv").config();

//주식 현재가 가져오기
async function getCurrentPrice(code) {
    try {
        const redis_data = await redisConnect.get(code);
        const stock_data = redis_data ? JSON.parse(redis_data) : "불러오는 중..";
        return stock_data.output2.stck_prpr
      } catch (error) {
        console.error(error)
        res.status(400).json({ message: "fail" });
        next(err);
      }
}

// assets : 총자산, myStock: 내 보유 종목, mystock_percent 종목별 비중
function calculateAssets(resultsWithCurrentPrice) {
    let assets = 0;
    let buy_at = 0;
    let yield_rate =0;
    let yield_money = 0;
    let myStock = [];
    let myStockCode= [];
    let mystock_percent = [];

    resultsWithCurrentPrice.forEach(stock => {
        // assets 계산
        assets += stock.quantity * parseInt(stock.current_price);
        buy_at += stock.quantity * stock.average_price
    });

    resultsWithCurrentPrice.forEach(stock => {
        // myStock 배열에 stock_name 추가
        myStock.push(stock.stock_name);
        myStockCode.push(stock.stock_code);

        // mystock_percent 계산
        let stock_assets = Math.round((parseInt(stock.current_price) * stock.quantity / assets) * 1000) / 10;
        mystock_percent.push({
            stock_name: stock.stock_name,
            stock_code : stock.stock_code,
            stock_assets: stock_assets,
            current_price: stock.current_price,
        });
    });

    yield_rate = (assets/buy_at).toFixed(2);
    yield_money = assets-buy_at


    return {
        assets: assets,
        yield_rate: yield_rate,
        yield_money : yield_money,
        myStock: myStock,
        myStockCode : myStockCode,
        mystock_percent: mystock_percent
    };
}


//포트폴리오 국내 보유종목 들고오기
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
                console.log(currentPrice)
                

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

//포트폴리오 해외 보유종목 들고오기
router.get("/2", function(req, res, next){
    pool.getConnection((err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }

        conn.query(WorldPortfolioQueries.WorldPortfolioQueries, [req.query.user_id], async (err,results)=>{
            conn.release();
            
            if(err){
                console.log("Query Error:",err)
                return
            }
            // res.json(results)

            const promises = results.map(async (stock) => {
        
                const currentPrice = await getCurrentPrice(stock.stock_code);
                console.log(currentPrice)
                

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



//관심종목
router.get("/like", async function(req, res, next){
    pool.getConnection(async (err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }
  
        conn.query(LikeStockQueries.LikeStockQueries, [req.query.user_id], async (err,results)=>{
            conn.release();
            
            if(err){
                console.log("Query Error:",err)
                return
            }
            // 각 주식에 대해 추가 정보를 가져옵니다.
            const resultsWithPrice = await Promise.all(results.map(async (item) => {
                try {
                    console.log(item.stock_code)
                    const redis_data = await redisConnect.get(item.stock_code);
                    const stock_data = redis_data ? JSON.parse(redis_data) : "불러오는 중..";
                    item.current_price = stock_data.output2 ? stock_data.output2.stck_prpr : "불러오는 중..";
                } catch (error) {
                    console.error(error);
                    item.current_price = "가격 정보 불러오는 중..";
                }
                return item;
            }));
            res.json(resultsWithPrice);
        })
    })
});


//관심종목 등록
router.post("/like", function(req,res){
    const {user_id, stock_code, stock_name} = req.body;
    pool.getConnection((err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }

        conn.query(ClickLikeStock.ClickLikeStock,[user_id, stock_code, stock_name],(err,results)=>{
            conn.release();

            if(err){
                console.log("Query Error:",err)
                return
            }

            res.status(200).json({ message: "Liked stock added successfully" });
        })
    })

})

//관심종목 해지
router.delete("/like", function(req,res){
    const {user_id, stock_code} = req.body;
    pool.getConnection((err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }

        conn.query(CancleLikeStock.CancleLikeStock,[user_id, stock_code],(err,results)=>{
            conn.release();

            if(err){
                console.log("Query Error:",err)
                return
            }

            res.status(200).json({ message: "Liked stock deleted successfully" });
        })
    })

})



//상세페이지에서 관심종목인지 확인
router.get("/likecheck", function(req,res){

    pool.getConnection((err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }
  
        conn.query(CheckLikeStock.CheckLikeStock, [req.query.stock_code, req.query.user_id], (err,results)=>{
            conn.release();
            
            if(err){
                console.log("Query Error:",err)
                return
            }
            if (results.length === 0) {
                res.send("empty");
            } else {
                res.send("in");
            }
        })
  
    })
})



 

module.exports = router