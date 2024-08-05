require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PLAYERLIMIT = 100;

hostEntered = false;
hostCode = "";
hostID = "";
loadedGame = null;
for (let i = 0; i < 6; i++) {
  hostCode = hostCode + crypto.randomInt(0, 9).toString();
}
console.log(`Host Code: ${hostCode}\n`);

playerAnswers = {};
playerNames = {};
playerPoints = {};
playerTimes = {};
currentQuestion = 1;
timer = 0;
timerInterval = null;

process.on("uncaughtException", function(exception) {
  console.log(exception);
});

function verifyHost(socketID) {
  return hostID == socketID;
}

function validifyName(name) {
  if (name == "") {
    return {"validity": false, "message": "Please input a name!"};
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
  Object.keys(playerAnswers).forEach(function(key) {
    let playerResponse = [];
    let allNull = true;

    for (let i = 0; i < loadedGame.questions[currentQuestion - 1].answers[i].length; i++) {
      if (loadedGame.questions[currentQuestion - 1].answers[i] !== null) {
        allNull = false;
      }
    }
    if (allNull) {
      let correctResponse = true;
      for (let i = 0; i < playerAnswers[key].length; i++) {
        if (playerAnswers[key][i] === true) {
          correctResponse = false;
        }
      }
      if (key in playerTimes && correctResponse) {
        playerPoints[key] = playerPoints + Math.round(1000 * (playerTimes[key] / loadedGame.questions[currentQuestion - 1].time));
      }
      return;
    }

    for (let i = 0; i < playerAnswers[key].length; i++) {
      if (playerAnswers[key][i] === true) {
        playerResponse.push(loadedGame.questions[currentQuestion - 1].options[i]);
      }
    }
    let correctResponse = (playerResponse.toString() == loadedGame.questions[currentQuestion - 1].answers.toString());
    if (key in playerTimes && correctResponse) {
      playerPoints[key] = playerPoints + Math.round(1000 * (playerTimes[key] / loadedGame.questions[currentQuestion - 1].time));
    }
  });
}

function newQuestion() {
  Object.keys(playerAnswers).forEach(function(key) {
    playerAnswers[key] = [false, false, false, false];
  });
  playerTimes = {};
  currentQuestion = currentQuestion + 1;
}

app.use(express.static("public"));

app.get("*", function(request, response) {
  response.sendFile(__dirname + "/public/404.html");
});

io.on("connection", function(socket) {
  console.log(`User connected! (Socket ID: ${socket.id})`);
  socket.on("disconnect", function() {
    console.log(`User disconnected! (Socket ID: ${socket.id})`);
    if (socket.id == hostID) {
      console.log("\nALERT: Host has left!\n");
    }
  });
  socket.on("check", function() {
    socket.emit("check", hostEntered);
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
        io.sockets.emit("hostReady", false, null);
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
        io.sockets.emit("hostReady", false, null);
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
      io.sockets.emit("hostReady", false, null);
    }
  });
  socket.on("hostSkip", function(socketID) {

  });
  socket.on("playerJoin", function(playerID, playerName) {
    if (validifyName(playerName).validity === false) {
      socket.emit("namemessage", validifyName(playerName).message, false);
      return;
    }
    let alreadyExists = false;
    Object.values(playerNames).forEach(function(value) {
      if (value == playerName) {
        alreadyExists = true;
      }
    });
    if (alreadyExists) {
      socket.emit("namemessage", "Player name already eixsts!", false);
      return;
    }
    playerNames[playerID] = playerName;
    playerAnswers[playerID] = [false, false, false, false];
    socket.emit("namemessage", playerName, true);
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
    playerTimes[playerID] = timer;
    socket.emit("playerAnswer", playerAnswers[playerID]);
  });
});

http.listen(PORT, function() {
  console.log(`Listening at specified port...\nGo to http://localhost:${PORT}`);
});
