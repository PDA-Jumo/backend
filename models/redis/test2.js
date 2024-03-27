const redisClient = require("./redisConnect");
const publisher = redisClient.duplicate();
publisher.connect();
publisher.publish("005930", JSON.stringify({ a: 1, b: 2 }));
