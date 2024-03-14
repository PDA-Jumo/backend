var express = require("express");

const checkEmailQuery = `SELECT email FROM user`;
const makeUserQuery =
  "INSERT INTO user (nickname,password,profile_img,email) values (?,?,?,?)";
const checkUserQuery = `SELECT * From user`;

module.exports = {
  checkEmailQuery,
  makeUserQuery,
  checkUserQuery,
};
