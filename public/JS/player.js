const socket = io();

let options = [false, false, false, false];
const buttons = [
  document.querySelector("#options .red"),
  document.querySelector("#options .blue"),
  document.querySelector("#options .green"),
  document.querySelector("#options .purple")
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
    buttons[i].querySelector(":scope img").classList.remove("bounce");
    if (options[i] === true) {
      buttons[i].querySelector(":scope img").classList.add("bounce");
      buttons[i].style.border = "5px #999999 solid";
    }
    else {
      buttons[i].style.border = "5px #ffffff solid";
    }
  }
}

function answerReveal(playerAnswer, isCorrect, placing) {
  document.querySelector("#options").style.display = "none";
  document.querySelector("#answerreveal").style.display = "inline";
  if (isCorrect) {
    document.querySelector("#answerstatus").innerHTML = "Correct!";
    document.querySelector("#answerimage").setAttribute("src", "/Images/Tick.svg");
    document.querySelector("#answermessage").innerHTML = "<i>" + getRandomItem(rightMessages) + "</i>";
  }
  else {
    document.querySelector("#answerstatus").innerHTML = "Incorrect!";
    document.querySelector("#answerimage").setAttribute("src", "/Images/Cross.svg");
    document.querySelector("#answermessage").innerHTML = "<i>" + getRandomItem(wrongMessages) + "</i>";
  }
  document.querySelectorAll("#youranswer div").forEach(function(element, index) {
    if (playerAnswer[index] === true) {
      element.style.border = "5px #999999 solid";
    }
    else {
      element.style.border = "5px #ffffff solid";
    }
  });
  document.querySelectorAll(".placement").forEach(function(element, index) {
    element.innerHTML = "You're " + givePlacing(placing) + " place!";
  });
}

socket.on("connect", () => {
  const playerID = socket.id;
  let playerJoined = false;

  socket.on("namemessage", function(data, validity) {
    if (validity === true) {
      document.querySelector("#topbar").style.display = "block";
      document.querySelector("#name").innerHTML = data;
      document.querySelector("#playerenter").style.display = "none";
      document.querySelector("#waiting").style.display = "block";
      window.addEventListener("beforeunload", beforeUnload);
      playerJoined = true;
    }
    else {
      document.querySelector("#statusmessage").innerHTML = data;
      document.querySelector("#statusmessage").style.color = "#ff0000";
    }
  });

  socket.on("startQuestion", function(numberOfOptions) {
    if (!playerJoined) {
      return;
    }
    options = [false, false, false, false];
    updateButtons();

    document.querySelectorAll("#youranswer div").forEach(function(element, index) {
      if (index < numberOfOptions) {
        element.style.display = "inline-block";
      }
      else {
        element.style.display = "none";
      }
    });
    if (numberOfOptions > 2) {
      document.querySelector("#youranswer").style.paddingTop = "20px";
    }
    else {
      document.querySelector("#youranswer").style.paddingTop = "55px";
    }
    document.querySelectorAll("#options div").forEach(function(element, index) {
      if (index < numberOfOptions) {
        element.style.display = "flex";
      }
      else {
        element.style.display = "none";
      }
    });

    document.querySelector("#options").style.display = "grid";
    document.querySelector("#answerreveal").style.display = "none";
    document.querySelector("#waiting").style.display = "none";
  });

  socket.on("finishedQuestion", function(playerData, leaderboard) {
    if (!playerJoined) {
      return;
    }
    let placing = leaderboard.findIndex(([key, value]) => key === playerID) + 1;
    answerReveal(options, playerData[playerID]["correct"], placing);
    document.querySelector("#points").innerHTML = playerData[playerID]["points"];
    document.querySelector("#waiting").style.display = "none";
    document.querySelector("#streak h2").innerHTML = playerData[playerID]["streak"];
  });

  socket.on("playerAnswer", function(optionsData) {
    if (!playerJoined) {
      return;
    }
    options = optionsData;
    updateButtons();
  });

  socket.on("playerKicked", function(socketID) {
    if (playerID === socketID) {
      window.removeEventListener("beforeunload", beforeUnload);
      location.reload();
    }
  });

  socket.on("waiting", function() {
    if (!playerJoined) {
      return;
    }
    document.querySelector("#waiting").style.display = "block";
    document.querySelector("#options").style.display = "none";
    document.querySelector("#answerreveal").style.display = "none";
  });

  document.querySelector("#gobutton").addEventListener("click", function() {
    if (document.querySelector("#nameinput").value === "") {
      document.querySelector("#statusmessage").innerHTML = "Cannot be left blank!";
      document.querySelector("#statusmessage").style.color = "#ff0000";
      return;
    }
    socket.emit("playerJoin", playerID, document.querySelector("#nameinput").value);
  });

  socket.on("completeGame", function(playerData, totalQuestions) {
    document.querySelector("#finale").style.display = "block";
    document.querySelector("#answerreveal").style.display = "none";
    document.querySelector("#correct").innerHTML = playerData[playerID]["score"] + "/" + totalQuestions;
    document.querySelector("#finalscore").innerHTML = playerData[playerID]["points"];
    generateConfetti(500, 300);
  });

  buttons[0].addEventListener("click", function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 1);
    }
  });
  buttons[1].addEventListener("click", function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 2);
    }
  });
  buttons[2].addEventListener("click", function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 3);
    }
  });
  buttons[3].addEventListener("click", function() {
    if (playerJoined) {
      socket.emit("playerAnswer", playerID, 4);
    }
  });
});
