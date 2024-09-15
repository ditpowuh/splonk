const socket = io();

const popAudio = new Audio("/Audio/Pop.mp3");

var timerInterval = null;
var timerNumber = 0;

function startTimer(duration, taskAfter) {
  timerNumber = duration;
  $("#beforecounter").html(timerNumber);
  timerInterval = setInterval(() => {
    timerNumber = timerNumber - 1;
    $("#beforecounter").html(timerNumber);
    if (timerNumber <= 0) {
      if (taskAfter !== undefined && typeof taskAfter == "function") {
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
      element.html(text);
    }, i * 25);
  }
  setTimeout(function() {
    element.html(points.toString());
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
      $("#startcontent").css("display", "block");
    }
  });

  socket.on("hostReady", function(valid, returningID, data) {
    if (!valid) {
      if (hostID == returningID) {
        errors++;
        $("#statusmessage").css("color", "#ff0000");
        if (errors > 1) {
          $("#statusmessage").html(`Incorrect code or invalid game! Check console. (${errors})`);
        }
        else {
          $("#statusmessage").html("Incorrect code or invalid game! Check console.");
        }
      }
    }
    else {
      if (hostID == returningID) {
        $(window).on("beforeunload", function(e) {
          return e;
        });
        $("#topbar").css("display", "block");
        $("#gamename").html("<i>" + data + "</i>");
        $("#pregame").css("display", "block");
        $("#startcontent").css("display", "none");
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
      playSound(popAudio)
    }
    $("#playerlist").empty();
    for (let i = 0; i < playerNames.length; i++) {
      let div = $(`<div>${playerNames[i]}</div>`);
      div.click(function() {
        socket.emit("playerKick", playerNames[i], hostID);
      });
      $("#playerlist").append(div);
      if (i !== playerNames.length - 1) {
        $("#playerlist").append(" ");
      }
    }
  });

  socket.on("leaderboard", function(progressValue, topPlayers) {
    $("#progress").val(progressValue);
    $("#leaderboard ul li").each(function(index) {
      if (index < topPlayers.length) {
        $(this).css("display", "block");
        $(this).find(".player").html(topPlayers[index][1]["name"]);
        showPoints($(this).find(".right"), topPlayers[index][1]["points"], index);
      }
      else {
        $(this).css("display", "none");
      }
    });
  });

  socket.on("newQuestion", function(questionData) {
    $("#gamecontent").css("display", "block");
    $("#question").html(questionData.question);
    let numberOfOptions = questionData.options.length;
    $("#options .option").each(function(index) {
      $(this).find("span").html(questionData.options[index]);
      $(this).css("border", "5px #ffffff solid");
      $(this).css("filter", "none");
      if (index < numberOfOptions) {
        $(this).css("display", "inline-block");
      }
      else {
        $(this).css("display", "none");
      }
    });
    if (questionData.answers.length > 1) {
      $("#questiontype").find("h2").html("MULTIPLE SELECT");
    }
    else {
      $("#questiontype").find("h2").html("SINGLE SELECT");
    }

    $("#nextbutton").html("End Question Early");
    endedQuestion = false;

    $("#beforecounter").css("display", "inline-block");
    $("#counter").css("display", "none");
    $("#options").css("display", "none");
    $("#nextbutton").css("display", "none");
    $("#leaderboard").css("display", "none");
    socket.emit("showingQuestion", hostID);
    startTimer(5, function() {
      $("#beforecounter").css("display", "none");
      $("#counter").css("display", "block");
      $("#options").css("display", "block");
      $("#nextbutton").css("display", "inline");
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
    $("#counter").html(time.toString());
  });

  socket.on("answerReveal", function(answer) {
    endedQuestion = true;
    clearInterval(requestTimer);
    requestTimer = null;
    $("#nextbutton").html("To The Leaderboard");
    $("#counter").css("display", "none");
    $("#options .option").each(function() {
      if (answer.includes($(this).find("span").html())) {
        $(this).css("border", "5px #999999 solid");
      }
      else {
        $(this).css("border", "5px #ffffff solid");
        $(this).css("filter", "grayscale(0.5)");
      }
    });
  });

  $("#musictoggle").click(function() {
    toggleMusic();
    if (AUDIO_SETTINGS.music) {
      $("#musictoggle").css("filter", "grayscale(0.75)");
    }
    else {
      $("#musictoggle").css("filter", "grayscale(1)");
    }
  });

  $("#soundtoggle").click(function() {
    toggleSounds();
    if (AUDIO_SETTINGS.sounds) {
      $("#soundtoggle").css("filter", "grayscale(0.75)");
    }
    else {
      $("#soundtoggle").css("filter", "grayscale(1)");
    }
  });

  $("#gobutton").click(function() {
    socket.emit("hostSetup", $("#codeinput").val(), $("#gameinput").val(), hostID);
  });

  $("#startbutton").click(function() {
    $("#pregame").css("display", "none");
    socket.emit("startGame", hostID);
    gameStarted = true;
  });

  $("#nextbutton").click(function() {
    if (!endedQuestion) {
      socket.emit("endQuestion", hostID);
    }
    else {
      $("#gamecontent").css("display", "none");
      $("#leaderboard").css("display", "block");
      socket.emit("leaderboard", hostID);
    }
  });

  $("#nextquestionbutton").click(function() {
    socket.emit("newQuestion", hostID);
  });

});
