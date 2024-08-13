require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const PLAYER_LIMIT = 100; // Modify this to adjust the player limit
const CONNECTION_LOGGING = true; // Modify this if knowing when players join and leave is desired

const hostCode = Array.from({length: 6}, () => crypto.randomInt(0, 9)).join("");
var hostEntered = false;
var hostID = "";

var playerData = {};

var loadedGame = null;
var gameStart = false;
var currentQuestion = 1;
var timer = 0;
var timerInterval = null;

console.log(`Host Code: ${hostCode}\n`);

process.on("uncaughtException", function(exception) {
  console.log(exception);
});

function verifyHost(socketID) {
  return hostID == socketID;
}

function validifyName(name) {
  if (Object.keys(playerData).length >= PLAYER_LIMIT) {
    return {"validity": false, "message": "Too much players!"};
  }
  if (name == "") {
    return {"validity": false, "message": "Cannot be left blank!"};
  }
  if (hostID == "") {
    return {"validity": false, "message": "Host has not entered yet!"};
  }
  if (/\p{Extended_Pictographic}/u.test(name)) {
    return {"validity": false, "message": "Cannot include emojis!"};
  }
  if (name.length > 16) {
    return {"validity": false, "message": "Too long!"};
  }
  return {"validity": true, "message": "Sucess!"};
}

function setTimer(amount) {
  timer = amount;
  timerInterval = setInterval(() => {
    timer = timer - 0.05;
    if (Math.round(timer) === 0 || timer < 0) {
      clearTimer();
    }
  }, 50);
}

function clearTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function completeQuestion() {
  Object.keys(playerData).forEach(function(key) {
    let playerResponse = [];
    let allNull = true;

    for (let i = 0; i < loadedGame.questions[currentQuestion - 1].answers[i].length; i++) {
      if (loadedGame.questions[currentQuestion - 1].answers[i] !== null) {
        allNull = false;
      }
    }
    if (allNull) {
      let correctResponse = true;
      for (let i = 0; i < playerData[key]["answer"].length; i++) {
        if (playerData[key]["answer"][i] === true) {
          correctResponse = false;
        }
      }
      if (playerData[key]["time"] !== undefined && correctResponse) {
        playerData[key]["points"] = playerData[key]["points"] + Math.round(1000 * (playerData[key]["time"] / loadedGame.questions[currentQuestion - 1].time));
      }
      return;
    }

    for (let i = 0; i < playerData[key]["answer"].length; i++) {
      if (playerData[key]["answer"][i] === true) {
        playerResponse.push(loadedGame.questions[currentQuestion - 1].options[i]);
      }
    }
    let correctResponse = (playerResponse.toString() == loadedGame.questions[currentQuestion - 1].answers.toString());
    if (playerData[key]["time"] !== undefined && correctResponse) {
      playerData[key]["points"] = playerData[key]["points"] + Math.round(1000 * (playerData[key]["time"] / loadedGame.questions[currentQuestion - 1].time));
    }
  });
}

function newQuestion() {
  Object.keys(playerData).forEach(function(key) {
    playerData[key]["answer"] = [false, false, false, false];
    delete playerData[key]["time"];
  });
  currentQuestion = currentQuestion + 1;
}

app.use(express.static("public"));

app.get("*", function(request, response) {
  response.sendFile(__dirname + "/public/404.html");
});

io.on("connection", function(socket) {
  if (CONNECTION_LOGGING) {
    console.log(`User connected! (Socket ID: ${socket.id})`);
  }
  socket.on("disconnect", function() {
    if (CONNECTION_LOGGING) {
      console.log(`User disconnected! (Socket ID: ${socket.id})`);
    }
    if (socket.id == hostID) {
      console.log("\nALERT: Host has left!\n");
    }
    if (socket.id in playerData && !gameStart) {
      delete playerData[socket.id];
      io.sockets.emit("playerUpdate", Object.values(playerData).map(player => player.name), hostID);
    }
  });
  socket.on("check", function() {
    socket.emit("check", hostEntered);
  });
  socket.on("startGame", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    gameStart = true;
  });
  socket.on("hostSetup", function(code, fileName, socketID) {
    if (hostEntered) {
      return;
    }
    if (fileName.toLowerCase().endsWith(".json")) {
      try {
        loadedGame = require(`./games/${fileName}`);
      }
      catch (err) {
        if (err.code == "MODULE_NOT_FOUND") {
          console.log(`[${socketID}] The selected game could not be found.`);
        }
        else {
          console.log(`[${socketID}] There was a problem with loading the selected game.`);
          console.log(err);
        }
        io.sockets.emit("hostReady", false, socketID);
        return;
      }
    }
    else {
      try {
        loadedGame = require(`./games/${fileName}.json`);
      }
      catch (err) {
        if (err.code == "MODULE_NOT_FOUND") {
          console.log(`[${socketID}] The selected game could not be found.`);
        }
        else {
          console.log(`[${socketID}] There was a problem with loading the selected game.`);
          console.log(err);
        }
        io.sockets.emit("hostReady", false, socketID);
        return;
      }
    }
    if (code == hostCode) {
      hostEntered = true;
      console.log(`[${socketID}] Host has been entered!`);
      hostID = socketID;
      io.sockets.emit("hostReady", true, hostID);
    }
    else {
      console.log(`[${socketID}] Incorrect code was entered.`);
      io.sockets.emit("hostReady", false, socketID);
    }
  });
  socket.on("hostEnd", function(socketID) {

  });
  socket.on("playerJoin", function(playerID, playerName) {
    let validityCheck = validifyName(playerName);
    if (validityCheck.validity === false) {
      socket.emit("namemessage", validityCheck.message, false);
      return;
    }
    let alreadyExists = false;
    Object.keys(playerData).forEach(function(key) {
      if (playerData[key]["name"] == playerName) {
        alreadyExists = true;
      }
    });
    if (alreadyExists) {
      socket.emit("namemessage", "Player name already eixsts!", false);
      return;
    }
    playerData[playerID] = {
      "name": playerName,
      "answer": [false, false, false, false],
      "points": 0
    };
    socket.emit("namemessage", playerName, true);
    io.sockets.emit("playerUpdate", Object.values(playerData).map(player => player.name), hostID);
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
        playerData[playerID]["answer"][i] = false;
      }
    }
    playerData[playerID]["answer"][optionChange - 1] = !playerData[playerID]["answer"][optionChange - 1];
    playerData[playerID]["time"] = timer;
    socket.emit("playerAnswer", playerData[playerID]["answer"]);
  });
  socket.on("playerKick", function(playerName, socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    let playerID = Object.keys(playerData).find(key => playerData[key]["name"] == playerName);
    delete playerData[playerID];
    io.sockets.emit("playerKicked", playerID);
    io.sockets.emit("playerUpdate", Object.values(playerData).map(player => player.name), hostID);
  });
});

http.listen(PORT, function() {
  console.log(`Listening at specified port...\nGo to http://localhost:${PORT}`);
});
