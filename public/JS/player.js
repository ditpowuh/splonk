var socket = io();

playerID = "";
socket.on("connect", () => {
  playerID = socket.id;
});

options = [false, false, false, false];
buttons = [
  $("#options").find(".red"),
  $("#options").find(".blue"),
  $("#options").find(".green"),
  $("#options").find(".purple")
];

rightMessages = [
  "good work!!",
  "yippee",
  "yayyy"
];
wrongMessages = [
  "womp womp..",
  "oh nooo",
  "hell naw"
];

function updateButtons() {
  for (let i = 0; i < 4; i++) {
    buttons[i].find("img").removeClass("bounce");
    if (options[i] === true) {
      buttons[i].find("img").addClass("bounce");
      buttons[i].css("border", "5px #000000 solid");
    }
    else {
      buttons[i].css("border", "5px #ffffff solid");
    }
  }
}

function answerReveal() {
  $("#options").css("display", "none");
  $("#answerreveal").css("display", "inline");
  if (true) {
    $("#answerstatus").html("Correct!");
    $("#answerimage").attr("src", "Images/Tick.svg");
    $("#answermessage").html(getRandomItem(rightMessages));
  }
  else {
    $("#answerstatus").html("Incorrect!");
    $("#answerimage").attr("src", "Images/Cross.svg");
    $("#answermessage").html(getRandomItem(wrongMessages));
  }
  $("#youranswer").find("div").each(function(index, element) {
    if (obj[i] === true) {
      $(element).css("border", "5px #000000 solid");
    }
  });
  $("#placement").html(`You're ${givePlacing(number)} place!`);
}

function selectOptions() {
  $("#options").css("display", "grid");
  $("#answerreveal").css("display", "none");
}

$("#gobutton").click(function() {
  if ($("#nameinput").val() == "") {
    $("#statusmessage").html("Cannot be left blank!");
    $("#statusmessage").css("color", "#ff0000");
    return;
  }
  socket.emit("playerJoin", playerID, $("#nameinput").val());
});

socket.on("namemessage", function(data, validity) {
  if (validity === true) {
    $("#topbar").css("display", "block");
    $("#name").html(data);
    $("#playerenter").css("display", "none");
    $("#waiting").css("display", "block");
    $(window).on("beforeunload", function(e) {
      return e;
    });
  }
  else {
    $("#statusmessage").html(data);
    $("#statusmessage").css("color", "#ff0000");
  }
});

socket.on("playerAnswer", function(optionsData) {
  options = optionsData;
  updateButtons();
});

buttons[0].click(function() {
  socket.emit("playerAnswer", playerID, 1);
});
buttons[1].click(function() {
  socket.emit("playerAnswer", playerID, 2);
});
buttons[2].click(function() {
  socket.emit("playerAnswer", playerID, 3);
});
buttons[3].click(function() {
  socket.emit("playerAnswer", playerID, 4);
});
