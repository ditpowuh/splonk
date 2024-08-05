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
