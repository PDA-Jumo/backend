var express = require("express")

const LikeStockQueries = `SELECT *FROM LikedStock Where user_id = ?`
module.exports ={
    LikeStockQueries
}