var express = require("express");

const checkEmailQuery = `SELECT email FROM user`;
const makeUserQuery =
  "INSERT INTO User (nickname,email,password,profile_img) values (?,?,?,?)";
const checkUserQuery = `SELECT * From user`;
const findUserByEmailQuery = `SELECT * FROM User WHERE email = ?`;

module.exports = {
  checkEmailQuery,
  makeUserQuery,
  checkUserQuery,
  findUserByEmailQuery,
};
