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
var leaderboard = {};

var loadedGame = null;
var gameStart = false;
var questionInProgress = false;
var currentQuestion = 0;
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
    return {"validity": false, "message": "Invalid characters has been entered!"};
  }
  if (name.length > 16) {
    return {"validity": false, "message": "Too long!"};
  }
  return {"validity": true, "message": "Sucess!"};
}

function setTimer(amount, taskAfter) {
  timer = amount;
  timerInterval = setInterval(() => {
    timer = timer - 0.05;
    if (timer <= 0) {
      if (taskAfter !== undefined && typeof taskAfter == "function") {
        taskAfter();
      }
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

function completeQuestion(socket) {
  var multiplier = loadedGame.questions[currentQuestion - 1].pointMultiplier || 1;
  var time = loadedGame.questions[currentQuestion - 1].time || 15;

  var allNull = true;
  for (let i = 0; i < loadedGame.questions[currentQuestion - 1].answers.length; i++) {
    if (loadedGame.questions[currentQuestion - 1].answers[i] !== null) {
      allNull = false;
    }
  }
  Object.keys(playerData).forEach(function(key) {
    let playerResponse = [];

    if (allNull) {
      let correctResponse = true;
      for (let i = 0; i < playerData[key]["answer"].length; i++) {
        if (playerData[key]["answer"][i] === true) {
          correctResponse = false;
        }
      }
      if (correctResponse) {
        playerData[key]["correct"] = true;
        if (playerData[key]["time"] === undefined) {
          playerData[key]["points"] = playerData[key]["points"] + Math.round(1000 * multiplier);
        }
        else {
          playerData[key]["points"] = playerData[key]["points"] + Math.round(1000 * (playerData[key]["time"] / time) * multiplier);
        }
      }
      else {
        playerData[key]["correct"] = false;
      }
    }
    else {
      for (let i = 0; i < playerData[key]["answer"].length; i++) {
        if (playerData[key]["answer"][i] === true) {
          playerResponse.push(loadedGame.questions[currentQuestion - 1].options[i]);
        }
      }
      let correctResponse = (playerResponse.toString() == loadedGame.questions[currentQuestion - 1].answers.toString());
      if (playerData[key]["time"] !== undefined && correctResponse) {
        playerData[key]["correct"] = true;
        playerData[key]["points"] = playerData[key]["points"] + Math.round(1000 * (playerData[key]["time"] / time) * multiplier);
      }
      else {
        playerData[key]["correct"] = false;
      }
    }
  });

  leaderboard = Object.entries(playerData).sort((a, b) => {
    return b[1].points - a[1].points;
  });

  socket.emit("answerReveal", loadedGame.questions[currentQuestion - 1].answers);
}

function newQuestion(socket) {
  Object.keys(playerData).forEach(function(playerID) {
    playerData[playerID]["answer"] = [false, false, false, false];
    delete playerData[playerID]["time"];
    delete playerData[playerID]["correct"];
  });
  currentQuestion = currentQuestion + 1;
  socket.emit("newQuestion", loadedGame.questions[currentQuestion - 1])
}

app.use(express.static("public", {
  extensions: ["html"]
}));

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
    newQuestion(socket);
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
      socket.emit("namemessage", "A player with that name already exists!", false);
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
    if (optionChange < 1 || optionChange > 4 || !questionInProgress) {
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
  socket.on("startQuestion", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    questionInProgress = true;
    let time = loadedGame.questions[currentQuestion - 1].time || 15;
    setTimer(time, function() {
      questionInProgress = false;
      completeQuestion(socket);
      io.sockets.emit("finishedQuestion", playerData, leaderboard);
    });
    io.sockets.emit("startQuestion", loadedGame.questions[currentQuestion - 1].options.length);
  });
  socket.on("endQuestion", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    clearTimer();
    questionInProgress = false;
    completeQuestion(socket);
    io.sockets.emit("finishedQuestion", playerData, leaderboard);
  });
  socket.on("leaderboard", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    socket.emit("leaderboard", currentQuestion / loadedGame.questions.length, leaderboard.slice(0, 5));
  });
  socket.on("newQuestion", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    if (currentQuestion === loadedGame.questions.length) {
      console.log("Done!");
      return;
    }
    newQuestion(socket);
  });
  socket.on("showingQuestion", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    io.sockets.emit("waiting");
  });
  socket.on("questionTimer", function(socketID) {
    if (!verifyHost(socketID)) {
      return;
    }
    socket.emit("questionTimer", Math.ceil(timer));
  });
});

http.listen(PORT, function() {
  console.log(`Listening at specified port...\nGo to http://localhost:${PORT} to start.`);
});
