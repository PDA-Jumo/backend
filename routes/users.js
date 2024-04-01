var express = require("express");
var router = express.Router();

const userQueries = require("../models/queries/userQueries");
const pool = require("../models/dbConnect");
const { createToken, authenticate } = require("../utils/auth/auth");

const { signup } = require("../models/auth/signup");
const { login } = require("../models/auth/login");
const axios = require("axios");

// authToken 키
const authTokenKey = process.env.AUTH_TOKEN_KEY || "authToken";

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

// 로그인
router.post("/login", async (req, res) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { email, password } = req.body;
    // 2. login 로직에서 email, password 검증
    const user = await login(email, password);
    const tokenMaxAge = 60 * 60 * 24 * 3;
    const token = createToken(user, tokenMaxAge);

    // 3. cookie에 담을지, user의 body에 담을지 고민
    user.token = token;

    res.cookie(authTokenKey, token, {
      httpOnly: true,
      maxAge: tokenMaxAge * 1000,
    });

    const userData = {
      user_id: user.user_id,
      nickname: user.nickname,
      profile_img: user.profile_img,
      cash: user.cash,
      total_assets: user.total_assets,
      level: user.level,
      type: user.type,
      level_name: user.level_name,
    };
    res.status(201).json(userData);
  } catch (err) {
    console.error(err);
    res.status(400);
    next(err);
  }
});

// 로그아웃
// 쿠키를 사용할 때 maxAge 옵션은 쿠키의 수명을 결정
// maxAge의 값은 밀리초 단위로 설정되며, 이 값이 얼마나 되느냐에 따라 브라우저가 쿠키를 얼마나 오래 보관할지 결정
// maxAge를 0으로 설정하면, 쿠키의 수명이 0밀리초로 설정된다.
// 즉, 쿠키가 생성되자마자 만료된다.
// 브라우저는 만료된 쿠키를 즉시 삭제하거나 다음 요청 때 무시하는 방식으로 처리함.
// 따라서, maxAge: 0을 설정하면, 해당 쿠키는 클라이언트에 저장되자마자 바로 삭제되는 효과를 가짐.

// httpOnly: true 옵션은 해당 쿠키가 HTTP(S) 요청에만 포함되어야 하며, 클라이언트 측 스크립트(예: JavaScript)에서 접근할 수 없다는 것을 나타냅니다.
// 이 옵션은 쿠키의 보안을 강화하기 위해 사용되지만, 쿠키의 수명이나 삭제 여부에는 직접적인 영향을 주지 않습니다.

router.all("/logout", authenticate, async (req, res, next) => {
  try {
    // authToken을 키값으로 가지는 token을 ""로 변경한 후 보낸다. 그러면
    res.cookie(authTokenKey, "", {
      httpOnly: true,
      maxAge: 0,
    });

    res.status(204).json({
      message: "logout 완료",
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    next(err);
  }
});

router.put("/quiz", authenticate, async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, level } = req.body;

    let value;
    console.log(level);

    // 레벨에 따른 지급할 캐시 설정 로직
    switch (level) {
      case 0:
      case 1:
      case 2:
      case 3:
        value = 1000;
        break;
      case 4:
        value = 5000;
        break;
      case 5:
        value = 10000;
        break;
      case 6:
      case 7:
      case 8:
        value = 50000;
        break;
      default:
        value = 0; // level이 0~8 범위 밖일 경우 처리
    }

    const user = [value, value, user_id];
    console.log(user);

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(
        userQueries.updateUserCashAndTotalAssets,
        user,
        (err, results) => {
          // 5. pool 연결 반납
          conn.release();

          if (err) {
            console.error("MySQL DB 데이터 업데이트 에러:", err);
            res.status(500).send("서버 에러");
            return;
          }

          console.log("캐시 업데이트 성공");
          const result = { result: "성공", value: value };
          res.send(result);
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

router.put("/levelUp", authenticate, async (req, res, next) => {
  try {
    const { bonus, user_id, level_name } = req.body;

    const user = [bonus, bonus, level_name, user_id];
    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(userQueries.updateUserLevel, user, (err, results) => {
        // 5. pool 연결 반납
        conn.release();

        if (err) {
          console.error("MySQL DB 데이터 업데이트 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("레벨업 성공");
        res.send("성공");
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

router.put("/test", authenticate, async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, type } = req.body;

    const user = [type, user_id];
    console.log(user);

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(userQueries.updateUserType, user, (err, results) => {
        // 5. pool 연결 반납
        conn.release();

        if (err) {
          console.error("MySQL DB 데이터 업데이트 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("Type 업데이트 성공");
        res.send("성공");
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

router.put("/work", authenticate, async (req, res, next) => {
  try {
    // 1. 사용자에게 email, password 받음
    const { user_id, cash } = req.body;

    const user = [cash, cash, user_id];
    console.log(user);

    // 3. pool 연결 후 쿼리 실행
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        return;
      }

      // 4. MySQL에 데이터 삽입
      conn.query(userQueries.updateUserCashByWork, user, (err, results) => {
        // 5. pool 연결 반납
        conn.release();

        if (err) {
          console.error("MySQL DB 데이터 업데이트 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("노동으로 Cash 업데이트 성공");
        res.send("성공");
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send("실패");
    next(err);
  }
});

router.get("/rankUsers", async (req, res, next) => {
  try {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        res.status(500).send("데이터베이스 연결 실패");
        return;
      }

      conn.query(userQueries.rankUserQuery, (err, results) => {
        conn.release();

        if (err) {
          console.error("MySQL DB 쿼리 실행 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("유저들의 정보를 total_assets 순으로 내림차순 정렬 성공");
        res.json(results);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400).send("실패");
    next(err);
  }
});

router.get("/updateUsers/:user_id", async (req, res, next) => {
  try {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("MySQL 연결 에러:", err);
        res.status(500).send("데이터베이스 연결 실패");
        return;
      }

      const user = [req.params.user_id];
      console.log(user);

      conn.query(userQueries.findUserByUserIDQuery, user, (err, results) => {
        conn.release();

        if (err) {
          console.error("MySQL DB 쿼리 실행 에러:", err);
          res.status(500).send("서버 에러");
          return;
        }

        console.log("유저의 data 업데이트 성공");
        res.json(results);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400).send("실패");
    next(err);
  }
});

// router.get("/home", authenticate, async (req, res, next) => {
//   try {
//     // 1. 사용자에게 email, password 받음
//     const { user_id } = req.body;

//     const user = [user_id];
//     console.log(user);

//     // 3. pool 연결 후 쿼리 실행
//     pool.getConnection((err, conn) => {
//       if (err) {
//         console.error("MySQL 연결 에러:", err);
//         return;
//       }

//       // 4. MySQL에 데이터 삽입
//       conn.query(userQueries.findUserByUserIDQuery, user, (err, results) => {
//         // 5. pool 연결 반납
//         conn.release();

//         if (err) {
//           console.error("MySQL DB 데이터 업데이트 에러:", err);
//           res.status(500).send("서버 에러");
//           return;
//         }

//         console.log("유저 가져오기 성공");
//         res.send("유저 가져오기 성공");
//       });
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(400);
//     next(err);
//   }
// });

module.exports = router;

// async function getMarket() {
//   let config = {
//     method: "get",
//     maxBodyLength: Infinity,
//     url: "https://gapi.shinhaninvest.com:8443/openapi/v1.0/strategy/market-issue",
//     headers: {
//       apiKey: "l7xxR7Fe0dP3i8KPZaPKpknI2vWrMeJfwDpk",
//       "Access-Control-Allow-Origin": "*",
//     },
//   };

//   axios
//     .request(config)
//     .then((response) => {
//       console.log(response.data.dataBody.list);
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// }

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
