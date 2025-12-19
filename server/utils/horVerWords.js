function extractWords(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const words = [];

  // Extrahera horisontella ord
  for (let i = 0; i < rows; i++) {
    let word = '';
    for (let j = 0; j < cols; j++) {
      word += matrix[i][j];
    }
    words.push(word);
  }

  // Extrahera vertikala ord
  for (let j = 0; j < cols; j++) {
    let word = '';
    for (let i = 0; i < rows; i++) {
      word += matrix[i][j];
    }
    words.push(word);
  }

  return words;
}

// Exempel på en 5x5 bokstavs-matris
// const matrix = [
//   ['A', 'B', 'C', 'D', 'E'],
//   ['F', 'G', 'H', 'I', 'J'],
//   ['K', 'L', 'M', 'N', 'O'],
//   ['P', 'Q', 'R', 'S', 'T'],
//   ['U', 'V', 'W', 'X', 'Y']
// ];

module.exports = extractWords;