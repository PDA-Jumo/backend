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

const getBuyQuantity = `SELECT SUM(transaction_price * quantity) AS total_purchase
FROM Transaction
WHERE user_id = ? AND stock_code = ? AND transaction_type = '매수'`;

const getUserCash = `SELECT cash FROM User WHERE user_id = ?`;

const updateUserCash = `UPDATE User SET cash = cash - ? WHERE user_id = ?`;

const conclusionBuy = `SELECT * FROM Transaction WHERE stock_code = ? AND transaction_price >= ? AND transaction_type = "매수"`;
const conclusionSell = `SELECT * FROM Transaction WHERE stock_code = ? AND transaction_price <= ? AND transaction_type = "매도"`;
const conclusionBuyUser = `UPDATE User SET cash = cash - (? * ?) WHERE user_id = ?`;
const conclusionSellUser = `UPDATE User SET cash = cash + (? * ?) WHERE user_id = ?`;
// const conclusionBuyUserMyStock = `
// INSERT INTO MyStock (user_id, stock_code, quantity, average_price)
// VALUES (?, ?, ?, ?)
// ON DUPLICATE KEY UPDATE
//   quantity = quantity + VALUES(quantity),
//   average_price = (quantity * average_price + VALUES(quantity) * VALUES(average_price)) / (quantity + VALUES(quantity));
// `;
const conclusionGetStockData = `SELECT stock_name, market_type, market_location FROM Stock WHERE stock_code = ?`;
const conclusionGetMyStockWithUserIdANdStockCode = `SELECT * FROM MyStock WHERE user_id = ? AND stock_code = ?`;

const conclusionAddMyStock = `INSERT INTO MyStock (user_id, stock_code, stock_name, quantity, average_price, market_type, market_location)
VALUES (?, ?, ?, ?, ?, ?, ?);
`;

const conclusionUpdateMyStock = `UPDATE MyStock
SET average_price = ((quantity * average_price) + (? * ?)) div (quantity + ?),
	quantity  = quantity  + ?
WHERE user_id = ? AND stock_code = ?;`;

const conclusionDeleteMyStock = `DELETE FROM MyStock WHERE user_id = ? AND stock_code = ?;`;

const conclusionUpdateMyStockQuantity = `UPDATE MyStock
SET quantity  = quantity  - ?
WHERE user_id = ? AND stock_code = ?;`;

const conclusionDeleteTransaction = `DELETE FROM Transaction WHERE transaction_id = ?;`;

module.exports = {
  buySellQueries,
  getSellQuantity,
  getUserCash,
  updateUserCash,
  conclusionBuy,
  conclusionSell,
  conclusionBuyUser,
  conclusionSellUser,
  conclusionAddMyStock,
  conclusionDeleteMyStock,
  conclusionGetStockData,
  conclusionGetMyStockWithUserIdANdStockCode,
  conclusionUpdateMyStock,
  conclusionUpdateMyStockQuantity,
  getBuyQuantity,
  conclusionDeleteTransaction,
};
