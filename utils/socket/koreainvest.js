require("dotenv").config();

const EventEmitter = require("events");

const KOREA_APPKEY = process.env.KOREA_APPKEY;
const KOREA_APPSECRET = process.env.KOREA_APPSECRET;

class SocketEmitter extends EventEmitter {}
const socketEmitter = new SocketEmitter();

// 웹소켓 연결을 저장할 객체
const wsConnections = {};
let ws;

// 체결 데이터 출력 함수
function stockspurchase(data_cnt, data) {
  console.log("============================================");
  const menulist =
    "유가증권단축종목코드|주식체결시간|주식현재가|전일대비부호|전일대비|전일대비율|가중평균주식가격|주식시가|주식최고가|주식최저가|매도호가1|매수호가1|체결거래량|누적거래량|누적거래대금|매도체결건수|매수체결건수|순매수체결건수|체결강도|총매도수량|총매수수량|체결구분|매수비율|전일거래량대비등락율|시가시간|시가대비구분|시가대비|최고가시간|고가대비구분|고가대비|최저가시간|저가대비구분|저가대비|영업일자|신장운영구분코드|거래정지여부|매도호가잔량|매수호가잔량|총매도호가잔량|총매수호가잔량|거래량회전율|전일동시간누적거래량|전일동시간누적거래량비율|시간구분코드|임의종료구분코드|정적VI발동기준가";
  const menustr = menulist.split("|");
  const pValue = data.split("^");
  let i = 0;
  for (let cnt = 0; cnt < data_cnt; cnt++) {
    console.log(`### [${cnt + 1} / ${data_cnt}]`);
    for (const menu of menustr) {
      // 현재가 출력
      if (menu === "주식현재가") {
        console.log(`${menu.padEnd(13)}[${pValue[i]}]`);
        socketEmitter.emit("currentStockData", pValue[i]);
      }
      i++;
    }
  }
}

// 웹소켓 접속 함수
async function connect(stockcode) {
  // 웹 소켓에 접속.
  const WebSocket = require("ws");
  const axios = require("axios");

  const custtype = "P";
  const url = "ws://ops.koreainvestment.com:31000";

  const get_approval = async (key, secret) => {
    const url = "https://openapi.koreainvestment.com:9443/oauth2/Approval";
    const body = {
      grant_type: "client_credentials",
      appkey: key,
      secretkey: secret,
    };
    try {
      const response = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
      });
      const approval_key = response.data.approval_key;
      //   console.log(`approval_key [${approval_key}]`);
      return approval_key;
    } catch (error) {
      console.error("Failed to get approval key:", error);
      return null;
    }
  };

  const ws = new WebSocket(url);
  ws.on("open", async () => {
    console.log("Connected to server!");

    const g_approval_key = await get_approval(KOREA_APPKEY, KOREA_APPSECRET);
    console.log(`approval_key [${g_approval_key}]`);

    let tr_id = "H0STCNT0"; // 국내 주식 현재가 코드
    let tr_type = "1"; // 거래 타입 (1:등록, 2:거래래)

    let senddata = `{"header":{"approval_key":"${g_approval_key}","custtype":"${custtype}","tr_type":"${tr_type}","content-type":"utf-8"},"body":{"input":{"tr_id":"${tr_id}","tr_key":"${stockcode}"}}}`;

    // console.log("Input Command is :", senddata);

    ws.send(senddata);
  });

  ws.on("message", async (realdata) => {
    const data = Buffer.from(realdata, "hex").toString("utf8");
    // console.log("Recev Command is :", data);
    console.log(data);
    if (data[0] === "0") {
      const recvstr = data.split("|");
      const trid0 = recvstr[1];
      if (trid0 === "H0STCNT0") {
        console.log("#### 주식체결 ####");
        const data_cnt = parseInt(recvstr[2]);
        stockspurchase(data_cnt, recvstr[3]);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("Connection closed!");
  });
}

// 웹소켓 연결을 종료하는 함수
function disconnect() {
  if (ws) {
    ws.close();
    console.log("웹소켓 연결이 종료되었습니다.");
  } else {
    console.log("웹소켓이 이미 닫혀있거나 초기화되지 않았습니다.");
  }
}

// connect("005930");

module.exports = { connect, disconnect, socketEmitter };
