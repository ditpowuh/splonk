function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function givePlacing(number) {
  if (number >= 10 && number <= 20) {
    return `${number}th`;
  }
  switch (number % 10) {
    case 1:
      return `${number}st`;
    case 2:
      return `${number}nd`;
    case 3:
      return `${number}rd`;
    default:
      return `${number}th`;
  }
}

function generateConfetti(amount, spread, bursts = 1, delay = 0) {
  for (let i = 0; i < bursts; i++) {
    setTimeout(function() {
      confetti({
        angle: 45,
        particleCount: amount || 200,
        spread: spread || 360,
        origin: {
          x: 0.0,
          y: 0.2
        }
      });
      confetti({
        angle: 135,
        particleCount: amount || 200,
        spread: spread || 360,
        origin: {
          x: 1.0,
          y: 0.2
        }
      });
    }, i * delay * 1000)
  }
}
