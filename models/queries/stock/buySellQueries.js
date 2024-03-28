var express = require("express");

const buySellQueries = `INSERT INTO Transaction (user_id, stock_code, quantity, transaction_price, transaction_type)
VALUES (?, ?, ?, ?, ?);`;

const getSellQuantity = `SELECT 
(U.quantity - IFNULL((SELECT SUM(T.quantity)
                      FROM Transaction AS T
                      WHERE T.user_id = U.user_id 
                      AND T.stock_code = U.stock_code
                      AND T.transaction_type = '매도'), 0)) AS available_quantity
FROM 
MyStock AS U
WHERE 
U.user_id = ? AND U.stock_code = ?;
`;

const getUserCash = `SELECT cash FROM User WHERE user_id = ?`;
const updateUserCash = `UPDATE User SET cash = cash - ? WHERE user_id = ?`;

module.exports = {
  buySellQueries,
  getSellQuantity,
  getUserCash,
  updateUserCash,
};
