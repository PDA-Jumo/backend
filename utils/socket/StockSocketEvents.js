const axios = require("axios");
require("dotenv").config();

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    console.log("===============");

    socket.on("disconnect", () => {
      console.log("연결이 해제됐어요^^ : ", socket.id);
      console.log("user disconnected");
    });
  });
};
