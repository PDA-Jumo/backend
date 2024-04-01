var express = require("express");

const getAllChats = `SELECT chat_id, user_id, nickname, stock_code, content, created_at 
FROM Chat`;

const getAllCommunityList = `SELECT stock_code, stock_name 
FROM Chat 
GROUP BY stock_code, stock_name;`;

const getHotCommunityList = `SELECT stock_code, stock_name, COUNT(*) AS row_count 
FROM Chat GROUP BY stock_code, stock_name 
ORDER BY row_count DESC 
LIMIT 5; `;

const getAllChatsByStockcodeLIMIT = `SELECT chat_id, user_id, nickname, stock_code, content, created_at 
FROM Chat 
WHERE stock_code = ? AND user_id != 0
ORDER BY created_at DESC
LIMIT ?`;

const getAllChatsByStockcode = `SELECT chat_id, user_id, nickname, stock_code, content, created_at 
FROM Chat 
WHERE stock_code = ?
ORDER BY created_at DESC`;

const getAllChatsByUserid = `SELECT chat_id, user_id, nickname, stock_code, content, created_at 
FROM Chat 
WHERE stock_code = ? AND user_id = ?`;

const getAllChatsByChatid = `SELECT chat_id, user_id, nickname, stock_code, content, created_at FROM Chat WHERE chat_id = ?`;

const insertChat = `INSERT INTO Chat (user_id, nickname, stock_code, stock_name, content, created_at) 
VALUES (?,?,?,?,?,?);
`;

const getroomList = `SELECT stock_code, stock_name FROM Chat WHERE stock_name LIKE ? GROUP BY stock_code, stock_name`;

module.exports = {
  getAllCommunityList,
  getHotCommunityList,
  getAllChats,
  getAllChatsByStockcode,
  getAllChatsByStockcodeLIMIT,
  getAllChatsByUserid,
  getAllChatsByChatid,
  insertChat,
  getroomList,
};
