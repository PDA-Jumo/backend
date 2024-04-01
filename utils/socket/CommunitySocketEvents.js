const communityQueries = require("../../models/queries/communityQueries");
const pool = require("../../models/dbConnect");

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    console.log("===============");

    // Event : joinRoom - 종목 커뮤니티 방 입장 시 이전 대화 내용 로드
    socket.on("joinRoom", ({ stock_code, user_id }) => {
      socket.join(stock_code);
      console.log(
        `${socket.id} : ${user_id}유저가 ${stock_code} 방에 입장했습니다.`
      );

      const ROW_LIMIT = 30;
      pool.getConnection((err, conn) => {
        conn.query(
          communityQueries.getAllChatsByStockcodeLIMIT,
          [stock_code, ROW_LIMIT],
          (error, rows) => {
            conn.release();

            // 이전 대화 내용 emit
            socket.emit("loadPreviousMessages", rows);

            if (error) throw error;
          }
        );
      });
    });

    socket.on("sendMessage", (data) => {
      const {
        user_id,
        stock_code,
        stock_name,
        nickname,
        message: content,
        created_at,
      } = data;
      console.log(user_id, stock_name, nickname, content, created_at);
      pool.getConnection((err, conn) => {
        conn.query(
          communityQueries.insertChat,
          [
            parseInt(user_id),
            nickname,
            stock_code,
            stock_name,
            content,
            created_at,
          ],

          (error, rows) => {
            console.log(`메시지 DB 저장 :: ${content}`);
            conn.release();

            // 방에 있는 사용자에게 메시지 전송
            io.to(stock_code).emit("message", {
              user_id,
              stock_name,
              content,
              nickname,
              created_at,
            });
            if (error) throw error;
          }
        );
      });
    });

    socket.on("leaveRoom", ({ stock_code, user_id }) => {
      socket.leave(stock_code);
      console.log(
        `${socket.id} : ${user_id}유저가 ${stock_code} 방에서 퇴장했습니다.`
      );
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
