require("dotenv").config();
const redisConnect = require("../../models/redis/redisConnect");
const subscriber = redisConnect.duplicate();
const pool = require("../../models/dbConnect");
const stockQueries = require("../../models/queries/stockQueries");
const { buyTransaction, sellTransaction } = require("../stock/conclusion");

module.exports = function (io) {
  (async () => {
    try {
      // redis 에서 key 조회
      await subscriber.connect();
      const channels = await subscriber.keys("*");
      console.log("CHANNELS : ", channels, channels.length);

      // stock detail : 각 room마다 subscribe
      channels.forEach((channel) => {
        subscriber.subscribe(channel, async (data) => {
          io.to(channel).emit("stock_update", JSON.parse(data));
          // await buyTransaction(
          //   JSON.parse(data).code,
          //   JSON.parse(data).output2.stck_prpr
          // );
          await sellTransaction(
            JSON.parse(data).code,
            JSON.parse(data).output2.stck_prpr
          );
        });
      });
    } catch (err) {
      console.error("Redis 작업 중 오류 발생:", err);
    }
  })();

  io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    socket.on("joinRoom", ({ stock_code, user_id }) => {
      // user room에 입장
      socket.join(stock_code);
    });

    socket.on("leaveRoom", ({ stock_code, user_id }) => {
      socket.leave(stock_code);
    });

    socket.on("disconnect", () => {
      console.log("연결이 해제됐습니다.", socket.id);
      console.log("user disconnected");
    });
  });
};
