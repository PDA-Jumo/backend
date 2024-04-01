const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "",
  },
});
const community = io.of("/community");
const stock = io.of("/stock");

require("./CommunitySocketEvents")(community);
require("./StockSocketEvents")(stock);

module.exports = io;
