require("dotenv").config();
const subscriber = require("../../models/redis/redisConnect");

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    socket.on("joinRoom", ({ stock_code, user_id }) => {
      // user room에 입장
      socket.join(stock_code);
      subscriber.subscribe(stock_code, (data) => {
        console.log(`message rom ${stock_code} : ${data}`);
      });
    });
    socket.on("leaveRoom", ({ stock_code, user_id }) => {});
    socket.on("disconnect", () => {
      console.log("연결이 해제됐습니다.", socket.id);
      console.log("user disconnected");
    });
  });
};