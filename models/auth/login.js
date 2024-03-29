const bcrypt = require("bcrypt");

const userQueries = require("../queries/userQueries");
const pool = require("../dbConnect");

// MySQL 연결을 위한 Promise 기반 helper 함수
function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) reject(err);
      else resolve(connection);
    });
  });
}

module.exports = {
  login: async (email, password) => {
    try {
      const conn = await getConnection(); // MySQL 연결
      const [user] = await new Promise((resolve, reject) => {
        conn.query(userQueries.findUserByEmailQuery, email, (err, results) => {
          conn.release(); // 연결 반납
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (!user) {
        throw Error("해당 이메일을 가진 사용자를 찾을 수 없습니다.");
      }

      // 입력 받은 비밀번호와 MySQL 비밀번호를 비교
      const auth = await bcrypt.compare(password, user.password);
      if (!auth) {
        throw Error("비밀번호 틀림");
      }

      return user; // 검증된 사용자 반환
    } catch (err) {
      console.error(err.message);
      throw err; // 에러를 상위 호출자로 전파
    }
  },
};

// module.exports = {
//   // 로그인 검증
//   login: async (email, password) => {
//     // MySQL 쿼리 실행
//     pool.getConnection((err, conn) => {
//       if (err) {
//         console.error("MySQL 연결 에러:", err);
//         return;
//       }

//       conn.query(userQueries.findUserByEmailQuery, email, async (err, user) => {
//         conn.release(); // 연결 반납

//         if (err) {
//           console.error("MySQL DB 쿼리 에러:", err);
//           res.status(500).send("서버 에러");
//           return;
//         }

//         // 결과가 없는 경우
//         if (user === undefined) {
//           res.status(404).send("해당 이메일을 가진 사용자를 찾을 수 없습니다.");
//           return;
//         }

//         // 결과를 클라이언트에게 전송
//         if (user) {
//           const auth = await bcrypt.compare(password, user.password);
//           if (auth) {
//             return user;
//           }
//           throw Error("incorrect password");
//         }
//         throw Error("incorrect email");
//       });
//     });
//   },
// };
