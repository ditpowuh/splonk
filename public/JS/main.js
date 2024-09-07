const socket = io();

const popAudio = new Audio("/Audio/Pop.mp3");

var timerInterval = null;
var timerNumber = 0;

function startTimer(duration, taskAfterTimer) {
  timerNumber = duration;
  $("#beforecounter").html(timerNumber);
  $("#counter").html(timerNumber);
  timerInterval = setInterval(() => {
    timerNumber = timerNumber - 1;
    $("#beforecounter").html(timerNumber);
    $("#counter").html(timerNumber);
    if (timerNumber === 0 || timerNumber < 0) {
      if (taskAfter !== undefined && typeof taskAfter == "function") {
        taskAfterTimer();
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

socket.on("connect", () => {
  const hostID = socket.id;

  var errors = 0;

  socket.emit("check");
  socket.on("check", function(result) {
    if (result === true) {
      window.location.replace("/player");
    }
    else {
      $("#startcontent").css("display", "block");
    }
  });

  socket.on("hostReady", function(valid, returningID) {
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
    playSound(popAudio);
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

  socket.on("leaderboard", function() {
    $("#progress").val(/*insert percentage value here*/);
  });

  socket.on("newQuestion", function() {
    $("#gamecontent").css("display", "block");

    $("#beforecounter").css("display", "inline-block");
    $("#counter").css("display", "none");
    $("#options").css("display", "none");
    $("#nextbutton").css("display", "none");
    startTimer(5, function() {
      $("#beforecounter").css("display", "none");
      $("#counter").css("display", "block");
      $("#options").css("display", "block");
      $("#nextbutton").css("display", "block");
    });
  });

  $("#gobutton").click(function() {
    socket.emit("hostSetup", $("#codeinput").val(), $("#gameinput").val(), hostID);
  });

  $("#startbutton").click(function() {
    $("#")
    socket.emit("startGame", hostID);
  });
});
