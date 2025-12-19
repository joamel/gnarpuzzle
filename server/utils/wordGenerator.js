function generateWords(inputString) {
  const input = [];
  // Lägg till alla möjliga delsträngar från inputString till listan 'input'
  for (let i = 0; i < inputString.length; i++) {
    for (let j = i + 2; j <= inputString.length; j++) {
      input.push(inputString.substring(i, j));
    }
  }

  const pairs = [];

  // Loopa igenom alla strängar i input
  for (let i = 0; i < input.length; i++) {
    for (let j = i + 1; j < input.length; j++) {
      const str1 = input[i];
      const str2 = input[j];
      let hasCommonLetter = false;

      // Loopa igenom bokstäverna i de två strängarna
      for (let k = 0; k < str1.length; k++) {
        if (str2.includes(str1[k])) {
          hasCommonLetter = true;
          break;
        }
      }

      // Om de inte har någon gemensam bokstav, lägg till paret
      if (!hasCommonLetter) {
        pairs.push([str1, str2]);
      }
    }
  }

  // Lägg till alla strängar individuellt om de inte redan finns bland paren
  for (let i = 0; i < input.length; i++) {
    const str = input[i];
    if (!pairs.some(pair => pair.includes(str))) {
      pairs.push([str]);
    }
  }

  return pairs;
}

// const inputString = 'ABCDE';
// const result = generateWords(inputString);
// console.log(result);


module.exports = generateWords;