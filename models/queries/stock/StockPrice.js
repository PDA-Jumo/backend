const WebSocket = require("ws");
const axios = require("axios");
const crypto = require("crypto");

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
      console.log(`${menu.padEnd(13)}[${pValue[i]}]`);
      i++;
    }
  }
}

// AES256 복호화 함수
function aes_cbc_base64_dec(key, iv, cipher_text) {
  const crypto = require("crypto");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(cipher_text, "base64", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}
// Approval Key 획득 함수
// Approval Key 획득 함수
function get_approval(key, secret) {
  const request = require("request");
  const url = "https://openapi.koreainvestment.com:9443";
  const body = {
    grant_type: "client_credentials",
    appkey: key,
    secretkey: secret,
  };
  const options = {
    url: `${url}/oauth2/Approval`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  request(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const approval_key = JSON.parse(body).approval_key;
      console.log(`approval_key [${approval_key}]`);
      return approval_key;
    } else {
      console.error("Failed to get approval key:", error);
      return null;
    }
  });
}
// 웹소켓 접속 함수
async function connect(stockcode) {
  // 웹 소켓에 접속.
  const WebSocket = require("ws");
  const axios = require("axios");
  const crypto = require("crypto");
  const g_appkey = "";
  const g_appsceret =
    "";
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
      console.log(`approval_key [${approval_key}]`);
      return approval_key;
    } catch (error) {
      console.error("Failed to get approval key:", error);
      return null;
    }
  };
  const ws = new WebSocket(url);
  ws.on("open", async () => {
    console.log("Connected to server!");
    const approval_key = await get_approval(g_appkey, g_appsceret);
    console.log(`approval_key [${approval_key}]`);
  
    const tr_id = "H0STCNT0"; // 실시간 주식 체결가
    const tr_type = "1"; // 등록
    const senddata = `{"header":{"approval_key":"${approval_key}","custtype":"P","tr_type":"${tr_type}","content-type":"utf-8"},"body":{"input":{"tr_id":"${tr_id}","tr_key":"${stockcode}"}}}`;
  
    console.log("Input Command is :", senddata);
    ws.send(senddata);
  });

  ws.on("message", async (realdata) => {
    const data = Buffer.from(realdata, "hex").toString("utf8");
    console.log("Recev Command is :", data);
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
connect("000120");