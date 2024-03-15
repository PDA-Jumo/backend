module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    console.log("===============");

    socket.on("joinRoom", (stockCode) => {
      socket.join(stockCode);
      console.log(`${socket.id}유저가 ${stockName} 방에 입장했습니다.`);
    });

    socket.on("sendMessage", (data) => {
      const { stockCode, stockName, message } = data;
      io.to(stockCode).emit("message", { userId: socket.id, text: message });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
