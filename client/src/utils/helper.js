

//ChatGPT magic

export function findWords(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const maxLength = Math.max(rows, cols);
  let words = [];

  // check all horizontal words
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= cols - 2; j++) {
      let word = [{row: i, col: j}];
      for (let k = j + 1; k < cols; k++) {
        word.push({row: i, col: k});
        words.push({word: word.map(({row, col}) => matrix[row][col]).join(''), indices: [...word]});
      }
    }
  }

  // check all vertical words
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i <= rows - 2; i++) {
      let word = [{row: i, col: j}];
      for (let k = i + 1; k < rows; k++) {
        word.push({row: k, col: j});
        words.push({word: word.map(({row, col}) => matrix[row][col]).join(''), indices: [...word]});
      }
    }
  }

  // // check all diagonal words from top left to bottom right
  // for (let i = 0; i <= rows - 2; i++) {
  //   for (let j = 0; j <= cols - 2; j++) {
  //     let word = [{row: i, col: j}];
  //     let k = 1;
  //     while (i + k < rows && j + k < cols) {
  //       word.push({row: i + k, col: j + k});
  //       words.push({word: word.map(({row, col}) => matrix[row][col]).join(''), indices: [...word]});
  //       k++;
  //     }
  //   }
  // }

  // // check all diagonal words from bottom left to top right
  // for (let i = rows - 1; i >= 1; i--) {
  //   for (let j = 0; j <= cols - 2; j++) {
  //     let word = [{row: i, col: j}];
  //     let k = 1;
  //     while (i - k >= 0 && j + k < cols) {
  //       word.push({row: i - k, col: j + k});
  //       words.push({word: word.map(({row, col}) => matrix[row][col]).join(''), indices: [...word]});
  //       k++;
  //     }
  //   }
  // }

  // filter out words that are too short or too long
  return words.filter(({word}) => word.length >= 2 && word.length <= maxLength);
}