const socket = io();

const popAudio = new Audio("/Audio/Pop.mp3");

var timerInterval = null;
var timerNumber = 0;

function startTimer(duration, taskAfter) {
  timerNumber = duration;
  document.querySelector("#beforecounter").innerHTML = timerNumber;
  timerInterval = setInterval(() => {
    timerNumber = timerNumber - 1;
    document.querySelector("#beforecounter").innerHTML = timerNumber;
    if (timerNumber <= 0) {
      if (taskAfter !== undefined && typeof taskAfter === "function") {
        taskAfter();
      }
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function showPoints(element, points, order) {
  let digits = points.toString().length;
  for (let i = 0; i < 25 + order * 20; i++) {
    setTimeout(function() {
      let text = "";
      for (let i = 0; i < digits; i++) {
        text = text + Math.floor(Math.random() * 10).toString();
      }
      element.innerHTML = text;
    }, i * 25);
  }
  setTimeout(function() {
    element.innerHTML = points.toString();
  }, (25 + order * 20) * 25);
}

socket.on("connect", () => {
  const hostID = socket.id;

  var errors = 0;
  var gameStarted = false;
  var endedQuestion = false;
  var requestTimer = null;

  socket.emit("check");
  socket.on("check", function(result) {
    if (result === true) {
      window.location.replace("/player");
    }
    else {
      document.querySelector("#startcontent").style.display = "block";
    }
  });

  socket.on("hostReady", function(valid, returningID, data) {
    if (!valid) {
      if (hostID === returningID) {
        errors++;
        document.querySelector("#statusmessage").style.color = "#ff0000";
        if (errors > 1) {
          document.querySelector("#statusmessage").innerHTML = "Incorrect code or invalid game! Check console. (" + errors + ")";
        }
        else {
          document.querySelector("#statusmessage").innerHTML = "Incorrect code or invalid game! Check console.";
        }
      }
    }
    else {
      if (hostID === returningID) {
        window.addEventListener("beforeunload", beforeUnload);
        document.querySelector("#topbar").style.display = "block";
        document.querySelector("#gamename").innerHTML = "<i>" + data + "</i>";
        document.querySelector("#pregame").style.display = "block";
        document.querySelector("#startcontent").style.display = "none";
      }
      else {
        window.location.replace("/player");
      }
    }
  });

  socket.on("playerUpdate", function(playerNames, correctID) {
    if (correctID != hostID) {
      return;
    }
    if (!gameStarted) {
      playSound(popAudio);
    }
    document.querySelector("#playerlist").replaceChildren();
    for (let i = 0; i < playerNames.length; i++) {
      let div = document.createElement("div");
      div.innerHTML = playerNames[i];

      div.addEventListener("click", function() {
        socket.emit("playerKick", playerNames[i], hostID);
      });
      document.querySelector("#playerlist").append(div);
      if (i !== playerNames.length - 1) {
        document.querySelector("#playerlist").append(" ");
      }
    }
  });

  socket.on("leaderboard", function(progressValue, topPlayers) {
    document.querySelector("#progress").value = progressValue;
    document.querySelectorAll("#leaderboard ul li").forEach(function(element, index) {
      if (index < topPlayers.length) {
        element.style.display = "block";
        element.querySelector(":scope .player").innerHTML = topPlayers[index][1]["name"];
        showPoints(element.querySelector(":scope .right"), topPlayers[index][1]["points"], index);
      }
      else {
        element.style.display = "none";
      }
    });
    if (progressValue === 1) {
      document.querySelector("#nextquestionbutton").innerHTML = "Finish Up";
    }
  });

  socket.on("newQuestion", function(questionData) {
    document.querySelector("#gamecontent").style.display = "block";
    document.querySelector("#question").innerHTML = questionData.question;

    let numberOfOptions = questionData.options.length;

    document.querySelectorAll("#options .option").forEach(function(element, index) {
      element.querySelector(":scope span").innerHTML = questionData.options[index];
      element.style.border = "5px #ffffff solid";
      element.style.filter = "none";
      if (index < numberOfOptions) {
        element.style.display = "inline-block";
      }
      else {
        element.style.display = "none";
      }
    });
    if (questionData.answers.length > 1) {
      document.querySelector("#questiontype h2").innerHTML = "MULTIPLE SELECT";
    }
    else {
      document.querySelector("#questiontype h2").innerHTML = "SINGLE SELECT";
    }

    document.querySelector("#nextbutton").innerHTML = "End Question Early";
    endedQuestion = false;

    document.querySelector("#beforecounter").style.display = "inline-block";
    document.querySelector("#counter").style.display = "none";
    document.querySelector("#options").style.display = "none";
    document.querySelector("#nextbutton").style.display = "none";
    document.querySelector("#leaderboard").style.display = "none";

    socket.emit("showingQuestion", hostID);

    startTimer(5, function() {
      document.querySelector("#beforecounter").style.display = "none";
      document.querySelector("#counter").style.display = "block";
      document.querySelector("#options").style.display = "block";
      document.querySelector("#nextbutton").style.display = "inline";
      socket.emit("startQuestion", hostID);
    });
  });

  socket.on("startQuestion", function() {
    socket.emit("questionTimer", hostID);
    requestTimer = setInterval(function() {
      socket.emit("questionTimer", hostID);
    }, 100);
  });

  socket.on("questionTimer", function(time) {
    document.querySelector("#counter").innerHTML = time;
  });

  socket.on("answerReveal", function(answer) {
    endedQuestion = true;
    clearInterval(requestTimer);
    requestTimer = null;
    document.querySelector("#nextbutton").innerHTML = "To The Leaderboard";
    document.querySelector("#counter").style.display = "none";
    document.querySelectorAll("#options .option").forEach(function(element, index) {
      if (answer.includes(element.querySelector(":scope span").innerHTML)) {
        element.style.border = "5px #999999 solid";
      }
      else {
        element.style.border = "5px #ffffff solid";
        element.style.filter = "grayscale(0.5)";
      }
    });
  });

  socket.on("completeGame", function() {
    document.querySelector("#finaltext").style.display = "inline";
    document.querySelector("#progress").style.display = "none";
    document.querySelector("#nextquestionbutton").style.display = "none";
    generateConfetti(500, 300);
    setTimeout(function() {
      generateConfetti(200, 360, 4, 1);
    }, 1000);
  });

  document.querySelector("#musictoggle").addEventListener("click", function() {
    toggleMusic();
    if (AUDIO_SETTINGS.music) {
      document.querySelector("#musictoggle").style.filter = "grayscale(0.75)";
    }
    else {
      document.querySelector("#musictoggle").style.filter = "grayscale(1)";
    }
  });

  document.querySelector("#soundtoggle").addEventListener("click", function() {
    toggleSounds();
    if (AUDIO_SETTINGS.sounds) {
      document.querySelector("#soundtoggle").style.filter = "grayscale(0.75)";
    }
    else {
      document.querySelector("#soundtoggle").style.filter = "grayscale(1)";
    }
  });

  document.querySelector("#gobutton").addEventListener("click", function() {
    socket.emit("hostSetup", document.querySelector("#codeinput").value, document.querySelector("#gameinput").value, hostID);
  });

  document.querySelector("#startbutton").addEventListener("click", function() {
    document.querySelector("#pregame").style.display = "none";
    socket.emit("startGame", hostID);
    gameStarted = true;
  });

  document.querySelector("#nextbutton").addEventListener("click", function() {
    if (!endedQuestion) {
      socket.emit("endQuestion", hostID);
    }
    else {
      document.querySelector("#gamecontent").style.display = "none";
      document.querySelector("#leaderboard").style.display = "block";
      socket.emit("leaderboard", hostID);
    }
  });

  document.querySelector("#nextquestionbutton").addEventListener("click", function() {
    socket.emit("newQuestion", hostID);
  });

});
