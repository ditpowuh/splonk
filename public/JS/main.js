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
    $("#content").css("display", "block");
  }
});

$("#gobutton").click(function() {
  socket.emit("hostSetup", $("#codeinput").val(), $("#gameinput").val(), socketID);
});

socket.on("hostReady", function(valid, verifiedID) {
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
  else {
    if (hostID == verifiedID) {
      $(window).on("beforeunload", function(e) {
        return e;
      });
      // remove host code and put area before start
    }
    else {
      window.location.replace("player.html");
    }
  }
});
