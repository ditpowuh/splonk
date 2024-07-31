var socket = io();

playerID = "";
socket.on("connect", () => {
   playerID = socket.id;
   // TEMP: playerJoin
   socket.emit("playerJoin", playerID);
});

options = [false, false, false, false];
buttons = [$("#red"), $("#blue"), $("#green"), $("#purple")];

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
