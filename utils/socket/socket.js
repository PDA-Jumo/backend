const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
  },
});

require("./CommunitySocketEvents")(io);
require("./StockSocketEvents")(io);

module.exports = io;
