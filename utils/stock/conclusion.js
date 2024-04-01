const buySellQueries = require("../../models/queries/stock/buySellQueries");
const pool = require("../../models/dbConnect_promise");

// stock_code와 price는 함수를 호출할 때 인자로 제공되어야 합니다.
// stock_code: 종목 코드, price: 현재가
async function buyTransaction(stock_code, price) {
  if (stock_code === "005930") {
    console.log("호출됨", stock_code, price);
  }
  let conn;
  try {
    conn = await pool.getConnection();
    // 1. Transaction 테이블에서 stock_code와 price를 통해 매수인 행들을 가져옴
    const [results] = await conn.query(buySellQueries.conclusionBuy, [
      stock_code,
      price,
    ]);

    for (const transaction of results) {
      console.log("반복", transaction);
      const [userResults] = await conn.query(buySellQueries.conclusionBuyUser, [
        transaction.quantity,
        transaction.transaction_price,
        transaction.user_id,
      ]);
      console.log("cash 감소", userResults);
      console.log(`User ${transaction.user_id}의 cash가 감소했습니다.`);

      const [stockData] = await conn.query(
        buySellQueries.conclusionGetStockData,
        [transaction.stock_code]
      );
      console.log(stockData);
      console.log(`${transaction.stock_code}가 조회 되었습니다.`);

      const [myStockResults] = await conn.query(
        buySellQueries.conclusionGetMyStockWithUserIdANdStockCode,
        [transaction.user_id, transaction.stock_code]
      );
      console.log(myStockResults);

      if (myStockResults.length === 0) {
        const [addMyStockResults] = await conn.query(
          buySellQueries.conclusionAddMyStock,
          [
            transaction.user_id,
            transaction.stock_code,
            stockData[0].stock_name,
            transaction.quantity,
            transaction.transaction_price,
            stockData[0].market_type,
            stockData[0].market_location,
          ]
        );
        console.log("MyStock 추가 완료");
      } else {
        const [updateMyStockResults] = await conn.query(
          buySellQueries.conclusionUpdateMyStock,
          [
            transaction.quantity,
            transaction.transaction_price,
            transaction.quantity,
            transaction.quantity,
            transaction.user_id,
            transaction.stock_code,
          ]
        );
        console.log("MyStock 업데이트 완료");
      }
      // 해당 transaction 행을 삭제
      const [deleteTransactionResult] = await conn.query(
        buySellQueries.conclusionDeleteTransaction,
        [transaction.transaction_id]
      );
      console.log(
        `Transaction ${transaction.transaction_id}가 삭제되었습니다.`
      );
    }
  } catch (error) {
    console.error("에러 발생:", error);
  } finally {
    if (conn) conn.release();
  }
}

// stock_code와 price는 함수를 호출할 때 인자로 제공되어야 합니다.
// stock_code: 종목 코드, price: 현재가
async function sellTransaction(stock_code, price) {
  let conn;
  try {
    conn = await pool.getConnection();
    // 1. Transaction 테이블에서 stock_code와 price를 통해 매수인 행들을 가져옴
    const [results] = await conn.query(buySellQueries.conclusionSell, [
      stock_code,
      price,
    ]);
    // myStockResults 배열이 비어 있는 경우 함수 종료
    if (results.length === 0) {
      console.log("results가 비어 있습니다. 함수를 종료합니다.");
      return; // 함수 실행 종료
    }

    for (const transaction of results) {
      console.log("반복", results);
      console.log("반복", transaction);
      const [userResults] = await conn.query(
        buySellQueries.conclusionSellUser,
        [
          transaction.quantity,
          transaction.transaction_price,
          transaction.user_id,
        ]
      );
      console.log("cash 증가", userResults);
      console.log(`User ${transaction.user_id}의 cash가 증가했습니다.`);

      const [myStockResults] = await conn.query(
        buySellQueries.conclusionGetMyStockWithUserIdANdStockCode,
        [transaction.user_id, transaction.stock_code]
      );
      // myStockResults 배열이 비어 있는 경우 함수 종료
      if (myStockResults.length === 0) {
        console.log("myStockResults가 비어 있습니다. 함수를 종료합니다.");
        return; // 함수 실행 종료
      }

      const allQuantity = myStockResults[0].quantity - transaction.quantity;

      // ( 내 주식 수량 - 주문 수량 ) 이 0일 경우
      if (allQuantity === 0) {
        const [addMyStockResults] = await conn.query(
          buySellQueries.conclusionDeleteMyStock,
          [transaction.user_id, transaction.stock_code]
        );
        console.log("MyStock 제거 완료");
      } else {
        // ( 내 주식 수량 - 주문 수량 ) 이 0 이 아닐 경우
        const [updateMyStockResults] = await conn.query(
          buySellQueries.conclusionUpdateMyStockQuantity,
          [transaction.quantity, transaction.user_id, transaction.stock_code]
        );
        console.log("MyStock 업데이트 완료");
      }
      // 해당 transaction 행을 삭제
      const [deleteTransactionResult] = await conn.query(
        buySellQueries.conclusionDeleteTransaction,
        [transaction.transaction_id]
      );
      console.log(
        `Transaction ${transaction.transaction_id}가 삭제되었습니다.`
      );
    }
  } catch (error) {
    console.error("에러 발생:", error);
  } finally {
    if (conn) conn.release();
  }
}

async function buyTransactionSuccessfully(
  user_id,
  stock_code,
  quantity,
  transaction_price
) {
  let conn;
  try {
    conn = await pool.getConnection();
    const [userResults] = await conn.query(buySellQueries.conclusionBuyUser, [
      quantity,
      transaction_price,
      user_id,
    ]);
    console.log("cash 감소", userResults);
    console.log(`User ${user_id}의 cash가 감소했습니다.`);

    // stock의 stock_name, market_type, market_location 조회
    const [stockData] = await conn.query(
      buySellQueries.conclusionGetStockData,
      [stock_code]
    );
    console.log(stockData);
    console.log(`${stock_code}가 조회 되었습니다.`);

    const [myStockResults] = await conn.query(
      buySellQueries.conclusionGetMyStockWithUserIdANdStockCode,
      [user_id, stock_code]
    );
    console.log(myStockResults);

    // MyStock에 stock이 없는 경우 추가
    if (myStockResults.length === 0) {
      const [addMyStockResults] = await conn.query(
        buySellQueries.conclusionAddMyStock,
        [
          user_id,
          stock_code,
          stockData[0].stock_name,
          quantity,
          transaction_price,
          stockData[0].market_type,
          stockData[0].market_location,
        ]
      );
      console.log("MyStock 추가 완료");
    } else {
      // MyStock에 stock이 있는 경우 업데이트
      const [updateMyStockResults] = await conn.query(
        buySellQueries.conclusionUpdateMyStock,
        [quantity, transaction_price, quantity, quantity, user_id, stock_code]
      );
      console.log("MyStock 업데이트 완료");
    }
  } catch (error) {
    console.error("에러 발생:", error);
  } finally {
    if (conn) conn.release();
  }
}

// stock_code와 price는 함수를 호출할 때 인자로 제공되어야 합니다.
// stock_code: 종목 코드, price: 현재가
async function sellTransactionSuccessfully(
  user_id,
  stock_code,
  quantity,
  transaction_price
) {
  let conn;
  try {
    conn = await pool.getConnection();
    const [userResults] = await conn.query(buySellQueries.conclusionSellUser, [
      quantity,
      transaction_price,
      user_id,
    ]);
    console.log("cash 증가", userResults);
    console.log(`User ${user_id}의 cash가 증가했습니다.`);

    const [myStockResults] = await conn.query(
      buySellQueries.conclusionGetMyStockWithUserIdANdStockCode,
      [user_id, stock_code]
    );

    // myStockResults 배열이 비어 있는 경우 함수 종료
    if (myStockResults.length === 0) {
      console.log("myStockResults가 비어 있습니다. 함수를 종료합니다.");
      return; // 함수 실행 종료
    }
    const allQuantity = myStockResults[0].quantity - quantity;

    // ( 내 주식 수량 - 주문 수량 ) 이 0일 경우
    if (allQuantity === 0) {
      const [addMyStockResults] = await conn.query(
        buySellQueries.conclusionDeleteMyStock,
        [user_id, stock_code]
      );
      console.log("MyStock 제거 완료");
    } else {
      // ( 내 주식 수량 - 주문 수량 ) 이 0 이 아닐 경우
      const [updateMyStockResults] = await conn.query(
        buySellQueries.conclusionUpdateMyStockQuantity,
        [quantity, user_id, stock_code]
      );
      console.log("MyStock 업데이트 완료");
    }
  } catch (error) {
    console.error("에러 발생:", error);
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  buyTransaction,
  sellTransaction,
  buyTransactionSuccessfully,
  sellTransactionSuccessfully,
};
