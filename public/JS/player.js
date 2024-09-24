const socket = io();

var options = [false, false, false, false];
const buttons = [
  $("#options").find(".red"),
  $("#options").find(".blue"),
  $("#options").find(".green"),
  $("#options").find(".purple")
];

const rightMessages = [
  "good work!!",
  "yippee",
  "yayyy"
];
const wrongMessages = [
  "womp womp..",
  "oh nooo",
  "hell naw"
];

function updateButtons() {
  for (let i = 0; i < 4; i++) {
    buttons[i].find("img").removeClass("bounce");
    if (options[i] === true) {
      buttons[i].find("img").addClass("bounce");
      buttons[i].css("border", "5px #999999 solid");
    }
    else {
      buttons[i].css("border", "5px #ffffff solid");
    }
  }
}

function answerReveal(playerAnswer, isCorrect, placing) {
  $("#options").css("display", "none");
  $("#answerreveal").css("display", "inline");
  if (isCorrect) {
    $("#answerstatus").html("Correct!");
    $("#answerimage").attr("src", "/Images/Tick.svg");
    $("#answermessage").html("<i>" + getRandomItem(rightMessages) + "</i>");
  }
  else {
    $("#answerstatus").html("Incorrect!");
    $("#answerimage").attr("src", "/Images/Cross.svg");
    $("#answermessage").html("<i>" + getRandomItem(wrongMessages) + "</i>");
  }
  $("#youranswer").find("div").each(function(index, element) {
    if (playerAnswer[index] === true) {
      $(element).css("border", "5px #999999 solid");
    }
    else {
      $(element).css("border", "5px #ffffff solid");
    }
  });
  $(".placement").html(`You're ${givePlacing(placing)} place!`);
}

socket.on("connect", () => {
  const playerID = socket.id;
  var playerJoined = false;

  socket.on("namemessage", function(data, validity) {
    if (validity === true) {
      $("#topbar").css("display", "block");
      $("#name").html(data);
      $("#playerenter").css("display", "none");
      $("#waiting").css("display", "block");
      $(window).on("beforeunload", function(e) {
        return e;
      });
      playerJoined = true;
    }
    else {
      $("#statusmessage").html(data);
      $("#statusmessage").css("color", "#ff0000");
    }
  });

  socket.on("startQuestion", function(numberOfOptions) {
    if (!playerJoined) {
      return;
    }
    options = [false, false, false, false];
    updateButtons();

    $("#youranswer").find("div").each(function(index, element) {
      if (index < numberOfOptions) {
        $(element).css("display", "inline-block");
      }
      else {
        $(element).css("display", "none");
      }
    });
    if (numberOfOptions > 2) {
      $("#youranswer").css("padding-top", "20px");
    }
    else {
      $("#youranswer").css("padding-top", "55px");
    }
    $("#options").find("div").each(function(index, element) {
      if (index < numberOfOptions) {
        $(element).css("display", "flex");
      }
      else {
        $(element).css("display", "none");
      }
    });

    $("#options").css("display", "grid");
    $("#answerreveal").css("display", "none");
    $("#waiting").css("display", "none");
  });

  socket.on("finishedQuestion", function(playerData, leaderboard) {
    if (!playerJoined) {
      return;
    }
    let placing = leaderboard.findIndex(([key, value]) => key == playerID) + 1;
    answerReveal(options, playerData[playerID]["correct"], placing);
    $("#points").html(playerData[playerID]["points"]);
    $("#waiting").css("display", "none");
    $("#streak").find("h2").html(playerData[playerID]["streak"]);
  });

  socket.on("playerAnswer", function(optionsData) {
    if (!playerJoined) {
      return;
    }
    options = optionsData;
    updateButtons();
  });

  socket.on("playerKicked", function(socketID) {
    if (playerID == socketID) {
      $(window).off("beforeunload");
      location.reload();
    }
  });

  socket.on("waiting", function() {
    if (!playerJoined) {
      return;
    }
    $("#waiting").css("display", "block");
    $("#options").css("display", "none");
    $("#answerreveal").css("display", "none");
  });

  $("#gobutton").click(function() {
    if ($("#nameinput").val() == "") {
      $("#statusmessage").html("Cannot be left blank!");
      $("#statusmessage").css("color", "#ff0000");
      return;
    }
    socket.emit("playerJoin", playerID, $("#nameinput").val());
  });

  socket.on("completeGame", function(playerData, totalQuestions) {
    $("#finale").css("display", "block");
    $("#answerreveal").css("display", "none");
    $("#correct").html(`${playerData[playerID]["score"]}/${totalQuestions}`);
    $("#finalscore").html(playerData[playerID]["points"]);
    generateConfetti(500, 300);
  });

  buttons[0].click(function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 1);
    }
  });
  buttons[1].click(function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 2);
    }
  });
  buttons[2].click(function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 3);
    }
  });
  buttons[3].click(function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 4);
    }
  });
});
