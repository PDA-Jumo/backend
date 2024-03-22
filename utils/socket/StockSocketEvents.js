require("dotenv").config();
const { connect, disconnect, socketEmitter } = require("./koreainvest"); // connect.js 파일에서 export한 함수와 객체를 import
module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    socket.on("joinRoom", ({ stock_code, user_id }) => {
      socket.join(stock_code);
      connect(stock_code); // 한국투자증권 웹소켓 연결

      // 방마다 이벤트 리스너 등록
      const onStockData = (data) => {
        io.to(stock_code).emit("currentStockData", data);
      };
      socketEmitter.on("currentStockData", onStockData);

      console.log(
        `${socket.id} : ${user_id}유저가 ${stock_code} 방에 입장했습니다.`
      );

      // 방을 나갈 때 이벤트 리스너 제거
      socket.on("leaveRoom", ({ stock_code, user_id }) => {
        socketEmitter.off("currentStockData", onStockData); // 해당 방의 리스너만 제거
        // disconnect();
        socket.leave(stock_code);
        console.log(`${user_id}님이 ${stock_code}방에서 퇴장하셨습니다.`);
      });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
