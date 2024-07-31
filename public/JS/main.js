var socket = io();

socketID = "";
socket.on("connect", () => {
   socketID = socket.id;
});

errors = 0;

socket.emit("check");
socket.on("check", function(result) {
  if (result === true) {
    window.location.replace("player.html");
  }
  else {
    document.getElementById("content").removeAttribute("hidden");
  }
});

$("#gobutton").click(function() {
  socket.emit("setupHost", $("#codeinput").val(), $("#gameinput").val(), socketID);
});

socket.on("hostReady", function(valid) {
  if (!valid) {
    errors++;
    $("#statusmessage").css("color", "#ff0000");
    if (errors > 1) {
      $("#statusmessage").html(`Incorrect code or invalid game! Check console. (${errors})`);
    }
    else {
      $("#statusmessage").html("Incorrect code or invalid game! Check console.");
    }
  }
});
