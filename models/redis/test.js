const redisClient = require("./redisConnect");
const subscriber = redisClient.duplicate();

subscriber.connect();

async function setupSubscriptions() {
  try {
    const stockCode = "005930"; // 예시로 삼성전자 주식 코드를 사용합니다.
    const channelName = `${stockCode}`;

    subscriber.on("message", (channel, message) => {
      console.log(`Message from channel ${channel}: ${message}`);
      const data = JSON.parse(message);
      console.log(`[${channel}] Stock data updated:`, data);
    });

    subscriber.subscribe(channelName, (msg) => {
      console.log(msg, "is subscribed data");
    });

    console.log(`Subscribed to channel: ${channelName}`);
  } catch (error) {
    console.error("구독 설정 중 에러 발생:", error);
  }
}

async function fetchStockData() {
  try {
    const stockData = await redisClient.get("005930");

    if (stockData) {
      console.log("Stock Data:", stockData);
    } else {
      console.log("데이터가 존재하지 않습니다.");
    }
  } catch (err) {
    console.error("Error fetching stock data:", err);
  }
}

setupSubscriptions();
