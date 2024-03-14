var express = require("express");
var router = express.Router();

const userQueries = require("../models/queries/userQueries");
const pool = require("../models/dbConnect");

const { signup } = require("../models/auth/signup");
// 회원가입
router.post("/signup", async (req, res) => {
  // 1. 클라이언트에게 데이터를 전달 받음
  const { nickname, email, password, profile_img } = req.body;

  // 2. nickname, email, profile_img는 그대로 받고, password는 해시화된 비밀번호를 받음
  const user = await signup(nickname, email, password, profile_img);

  // 3. pool 연결 후 쿼리 실행
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("MySQL 연결 에러:", err);
      return;
    }
    console.log(user);

    // 4. MySQL에 데이터 삽입
    conn.query(userQueries.makeUserQuery, user, (err, results) => {
      // 5. pool 연결 반납
      conn.release();

      if (err) {
        console.error("MySQL DB 데이터 삽입 에러:", err);
        res.status(500).send("서버 에러");
        return;
      }

      console.log("회원가입 성공");
      res.send("회원가입 성공");
    });
  });
});

module.exports = router;

// async function signup(nickname, email, password, profile_img) {
//   // 1. `bcrypt.genSalt()`를 호출하여 salt 객체 생성.
//   // 보안을 위해 사용
//   const salt = bcrypt.genSalt();
//   console.log(salt);
//   try {
//     // 2. `bcrypt.hash()`를 사용하여 입력된 비밀번호를 salt 객체와 함께 해시
//     // 해시화된 비밀번호는 MySQL에 저장하기 위해 변수로 저장
//     const hashedPassword = bcrypt.hash(password, salt);
//     // 3. user로 MySQL에 전달할 데이터들을 배열로 전달
//     // 여기서 비밀번호는 해시화한 비밀번호를 전달
//     const user = [nickname, email, hashedPassword, profile_img];
//     return user;
//   } catch (err) {
//     // 에러 처리
//     throw err;
//   }
// }

// /* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

// // 유저 조회
// router.get("/", (req, res) => {
//   // 1. pool 연결 후 쿼리 실행
//   pool.getConnection((err, conn) => {
//     if (err) {
//       console.error("DB Disconnected:", err);
//       return;
//     }

//     // 사용자 테이블에서 모든 이메일 가져오기
//     conn.query(userQueries.checkUserQuery, (err, results) => {
//       // 3. pool 연결 반납
//       conn.release();

//       if (err) {
//         console.error("Error querying database:", err);
//         res.status(500).send("Internal Server Error");
//         return;
//       }

//       console.log(results);
//       res.send("유저 가져오기 성공");
//     });
//   });
// });

// // 이메일 가져오기 엔드포인트
// router.get("/checkemail/:email", (req, res) => {
//   const { email } = req.params;

//   // 1. pool 연결 후 쿼리 실행
//   pool.getConnection((err, conn) => {
//     if (err) {
//       console.error("DB Disconnected:", err);
//       return;
//     }

//     // 사용자 테이블에서 모든 이메일 가져오기
//     conn.query(userQueries.checkEmailQuery, (err, results) => {
//       // 3. pool 연결 반납
//       conn.release();

//       if (err) {
//         console.error("Error querying database:", err);
//         res.status(500).send("Internal Server Error");
//         return;
//       }

//       // 가져온 이메일 리스트와 비교하여 중복 여부 확인
//       const emailList = results.map((result) => result.email);
//       if (emailList.includes(email)) {
//         res.send("중복");
//       } else {
//         res.send("가능");
//       }
//     });
//   });
// });
