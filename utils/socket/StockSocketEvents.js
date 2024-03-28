require("dotenv").config();
const redisConnect = require("../../models/redis/redisConnect");
const subscriber = redisConnect.duplicate();

// redis에서 key 조회
let channels = [];
(async () => {
  try {
    await subscriber.connect();
    const keys = await subscriber.keys("*");
    channels = keys;
    console.log("CHANNELS : ", channels, channels.length); // 결과 확인
  } catch (err) {
    console.error("Redis 작업 중 오류 발생:", err);
  }
})();

// 각 방마다 subscribe 하도록
channels.map((channel) => {
  subscriber.subscribe(channel);

  subscriber.on("message", (channel, message) => {
    console.log(`Message from channel ${channel}: ${message}`);
    const data = JSON.parse(message);
    console.log(`[${channel}] Stock data updated:`, data);
  });

  subscriber.subscribe(channel, (msg) => {
    console.log(msg, "is subscribed data");
  });
});

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    socket.on("joinRoom", ({ stock_code, user_id }) => {
      // user room에 입장
      socket.join(stock_code);

      subscriber.subscribe(stock_code, (data) => {
        console.log(`message from ${stock_code} : ${data}`);
      });
    });

    socket.on("leaveRoom", ({ stock_code, user_id }) => {});

    socket.on("disconnect", () => {
      console.log("연결이 해제됐습니다.", socket.id);
      console.log("user disconnected");
    });
  });
};