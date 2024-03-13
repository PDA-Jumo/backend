const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
  },
});

require("./socketEvents")(io);

module.exports = io;
