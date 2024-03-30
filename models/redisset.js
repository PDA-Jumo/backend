const redisClient = require("./redis")

const set_cache = async (key, value) => {
    try {
      await redisClient.set(key, JSON.stringify(value));
      console.log("Redis에 데이터 설정 완료:", key);
    } catch (err) {
      console.error("Redis에 데이터 설정 중 에러 발생:", err);
    }
};

module.exports = set_cache;
  
