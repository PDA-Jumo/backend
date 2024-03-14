var express = require("express");

const checkEmailQuery = `SELECT email FROM user`;
const makeUserQuery =
  "INSERT INTO user (nickname,email,password,profile_img) values (?,?,?,?)";
const checkUserQuery = `SELECT * From user`;

module.exports = {
  checkEmailQuery,
  makeUserQuery,
  checkUserQuery,
};
