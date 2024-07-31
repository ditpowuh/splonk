const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const crypto = require("crypto");

const port = process.env.port || 3000;

hostEntered = false;
hostCode = "";
hostID = "";
loadedGame = null;
for (let i = 0; i < 6; i++) {
  hostCode = hostCode + crypto.randomInt(0, 9).toString();
}
console.log(`Host Code: ${hostCode}`);

playerAnswers = {};
currentQuestion = 1;

process.on("uncaughtException", function(exception) {
  console.log(exception);
});

app.use(express.static("public"));

app.get("*", function(request, response) {
  response.sendFile(__dirname + "/public/404.html");
});

io.on("connection", function(socket) {
  console.log(`User connected! (Socket ID: ${socket.id})`);
  socket.on("disconnect", function() {
    console.log(`User disconnected! (Socket ID: ${socket.id}_`);
    if (socket.id == hostID) {
      console.log("ALERT: Host has left!");
    }
  });
  socket.on("check", function() {
    socket.emit("check", hostEntered);
  });
  socket.on("setupHost", function(code, fileName, socketID) {
    if (hostEntered) {
      return;
    }
    if (fileName.toLowerCase().endsWith(".json")) {
      try {
        loadedGame = require(`./games/${fileName}`);
      }
      catch (err) {
        console.log(`[${socketID}] There was a problem with loading the selected game.`);
        console.log(err);
        io.sockets.emit("hostReady", false);
        return;
      }
    }
    else {
      try {
        loadedGame = require(`./games/${fileName}.json`);
      }
      catch (err) {
        console.log(`[${socketID}] There was a problem with loading the selected game.`);
        console.log(err);
        io.sockets.emit("hostReady", false);
        return;
      }
    }
    if (code == hostCode) {
      hostEntered = true;
      console.log(`[${socketID}] Host has been entered!`);
      hostID = socketID;
      io.sockets.emit("hostReady", true);
    }
    else {
      console.log(`[${socketID}] Incorrect code was entered.`);
      io.sockets.emit("hostReady", false);
    }
  });
  socket.on("playerJoin", function(playerID) {
    playerAnswers[playerID] = [false, false, false, false];
  });
  socket.on("playerAnswer", function(playerID, optionChange) {
    if (optionChange < 1 || optionChange > 4) {
      return;
    }
    if (loadedGame.questions[currentQuestion - 1].answers.length === 1) {
      for (let i = 0; i < 4; i++) {
        if (optionChange === i + 1) {
          continue;
        }
        playerAnswers[playerID][i] = false;
      }
    }
    playerAnswers[playerID][optionChange - 1] = !playerAnswers[playerID][optionChange - 1];
    socket.emit("playerAnswer", playerAnswers[playerID]);
  });
});

http.listen(port, function() {
  console.log(`Listening at specified port...\nGo to http://localhost:${port}`);
});
