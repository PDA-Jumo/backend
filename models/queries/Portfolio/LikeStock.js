var express = require("express")

const LikeStockQueries = `SELECT *FROM LikedStock Where user_id = ?`
const ClickLikeStock = `INSERT INTO LikedStock (user_id, stock_code, stock_name) VALUES (?, ?, ?)`;
const CheckLikeStock = 'SELECT *FROM LikedStock Where stock_code =? AND user_id =?'
module.exports ={
    LikeStockQueries,
    ClickLikeStock,
    CheckLikeStock
}


