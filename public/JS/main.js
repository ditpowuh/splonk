const socket = io();

socket.on("connect", () => {
  const hostID = socket.id;

  errors = 0;

  socket.emit("check");
  socket.on("check", function(result) {
    if (result === true) {
      window.location.replace("player.html");
    }
    else {
      $("#startcontent").css("display", "block");
    }
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
        $("#pregame").css("display", "block");
        $("#startcontent").css("display", "none");
        // remove host code and put area before start
      }
      else {
        window.location.replace("player.html");
      }
    }
  });

  $("#gobutton").click(function() {
    socket.emit("hostSetup", $("#codeinput").val(), $("#gameinput").val(), hostID);
  });
});
