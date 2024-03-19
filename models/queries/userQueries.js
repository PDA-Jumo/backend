var express = require("express");

const checkEmailQuery = `SELECT email FROM user`;
const makeUserQuery =
  "INSERT INTO User (nickname,email,password,profile_img) values (?,?,?,?)";
const checkUserQuery = `SELECT * From user`;
const findUserByEmailQuery = `SELECT * FROM User WHERE email = ?`;
const updateUserCashAndTotalAssets = `UPDATE User
SET cash = cash + ?,
    total_assets = total_assets + ?
WHERE user_id = ?;
`;

// user의 level에 따라 total_assets, cash 업데이트

module.exports = {
  checkEmailQuery,
  makeUserQuery,
  checkUserQuery,
  findUserByEmailQuery,
  updateUserCashAndTotalAssets,
};
