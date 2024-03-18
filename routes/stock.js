var express = require("express")
var router = express.Router();

const searchstockQueries = require("../models/queries/stock/searchstockQueries")
const pool = require("../models/dbConnect")

//종목 검색
router.get("/search", function(req, res, next){
    pool.getConnection((err,conn)=>{
        if(err){
            console.error("DB Disconnected:",err);
            return;
        }

        conn.query(searchstockQueries.searchstockQueries, [req.query.stock_name], (err,results)=>{
            conn.release();
            
            if(err){
                console.log("Query Error:",err)
                return
            }
            res.json(results)
        })

    })
  
})

 

module.exports = router
