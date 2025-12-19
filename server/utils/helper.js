

//ChatGPT magic

function findWords(matrix) {
  console.log(matrix);
  const rows = matrix.length;
  const cols = matrix[0].length;
  const maxLength = Math.max(rows, cols);
  const words = [];

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


const extractWords = require("../utils/horVerWords");
const generateWords = require("../utils/wordGenerator");

const getPossibleWords = (board) => {
	const rows = board.length;
	const cols = board[0].length;
	const allWords = [];

	// Find all horizontal words (left to right)
	for (let row = 0; row < rows; row++) {
		for (let startCol = 0; startCol < cols; startCol++) {
			for (let endCol = startCol + 1; endCol < cols; endCol++) {
				let word = '';
				let positions = [];
				for (let col = startCol; col <= endCol; col++) {
					if (board[row][col] === '') break; // Stop if empty cell
					word += board[row][col];
					positions.push([row, col]);
				}
				if (word.length >= 2 && word.length === positions.length) {
					allWords.push(word);
				}
			}
		}
	}

	// Find all vertical words (top to bottom)
	for (let col = 0; col < cols; col++) {
		for (let startRow = 0; startRow < rows; startRow++) {
			for (let endRow = startRow + 1; endRow < rows; endRow++) {
				let word = '';
				let positions = [];
				for (let row = startRow; row <= endRow; row++) {
					if (board[row][col] === '') break; // Stop if empty cell
					word += board[row][col];
					positions.push([row, col]);
				}
				if (word.length >= 2 && word.length === positions.length) {
					allWords.push(word);
				}
			}
		}
	}

	// Remove duplicates and return
	return [...new Set(allWords)];
};


const swedishDict = require("../files/swedish.json");

const getPoints = (possibleWords) => {
	let totalPoints = [];
	let correctWords = [];

	// possibleWords is now just an array of strings like ["AB", "CD", "EF"]
	possibleWords.forEach(word => {
		// Check if word exists in Swedish dictionary
		const foundInDict = swedishDict.some(dictWord => 
			word.toUpperCase() === dictWord.toUpperCase()
		);

		if (foundInDict) {
			correctWords.push(word);
			// Points: word length if < 5, otherwise 7 points
			const points = word.length < 5 ? word.length : 7;
			totalPoints.push(points);
		}
	});

	return [correctWords, totalPoints];
};


module.exports = { findWords, getPossibleWords, getPoints };