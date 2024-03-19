module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    console.log("===============");

    socket.on("joinRoom", (data) => {
      socket.join(data.stockCode);
      console.log(
        `${socket.id} : ${data.nickname}유저가 ${data.stockCode} 방에 입장했습니다.`
      );
    });

    socket.on("sendMessage", (data) => {
      const { stockCode, stockName, userId, nickname, content } = data;
      // 여기서는 userId 대신 socket.id를 사용하지만, 사용자의 고유 ID를 사용하는 것이 더 좋을 수 있습니다.
      io.to(stockCode).emit("message", {
        stock_code: stockCode,
        stock_name: stockName,
        user_id: userId,
        nickname,
        content,
      });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
