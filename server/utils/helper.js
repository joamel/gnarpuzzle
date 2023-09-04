

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
	const horVerWords = extractWords(board);
	// console.log(horVerWords);
	let possibleWords = [];
	for (words of horVerWords) {
		possibleWords.push(generateWords(words));
	}
	return possibleWords;
};


const swedishDict = require("../files/swedish.json");

const getPoints = (possibleWords) => {

	// possibleWords = [
	// 	[
	// 		["AB", "CD"],
	// 		["AB", "CDE"],
	// 		["AB", "DE"],
	// 		["ABC", "DE"],
	// 		["BC", "DE"],
	// 		["ABCD"],
	// 		["ABCDE"],
	// 		["BCD"],
	// 		["BCDE"]
	// 	],
	// 	[
	// 		["FG", "HI"],
	// 		["FG", "HIJ"],
	// 		["FG", "IJ"],
	// 		["FGH", "IJ"],
	// 		["GH", "IJ"],
	// 		["FGHI"],
	// 		["FGHIJ"],
	// 		["GHI"],
	// 		["GHIJ"]
	// 	],
	// 	[
	// 		["KL", "MN"],
	// 		["KL", "MNO"],
	// 		["KL", "NO"],
	// 		["KLM", "NO"],
	// 		["LM", "NO"],
	// 		["KLMN"],
	// 		["KLMNO"],
	// 		["LMN"],
	// 		["LMNO"]
	// 	],
	// 	[
	// 		["PQ", "RS"],
	// 		["PQ", "RST"],
	// 		["PQ", "ST"],
	// 		["PQR", "ST"],
	// 		["QR", "ST"],
	// 		["PQRS"],
	// 		["PQRST"],
	// 		["QRS"],
	// 		["QRST"]
	// 	],
	// 	[
	// 		["UV", "WX"],
	// 		["UV", "WXY"],
	// 		["UV", "XY"],
	// 		["UVW", "XY"],
	// 		["VW", "XY"],
	// 		["UVWX"],
	// 		["UVWXY"],
	// 		["VWX"],
	// 		["VWXY"]
	// 	],
	// 	[
	// 		["AF", "KP"],
	// 		["AF", "KPU"],
	// 		["AF", "PU"],
	// 		["AFK", "PU"],
	// 		["FK", "PU"],
	// 		["AFKP"],
	// 		["AFKPU"],
	// 		["FKP"],
	// 		["FKPU"]
	// 	],
	// 	[
	// 		["BG", "LQ"],
	// 		["BG", "LQV"],
	// 		["BG", "QV"],
	// 		["BGL", "QV"],
	// 		["GL", "QV"],
	// 		["BGLQ"],
	// 		["BGLQV"],
	// 		["GLQ"],
	// 		["GLQV"]
	// 	],
	// 	[
	// 		["CH", "MR"],
	// 		["CH", "MRW"],
	// 		["CH", "RW"],
	// 		["CHM", "RW"],
	// 		["HM", "RW"],
	// 		["CHMR"],
	// 		["CHMRW"],
	// 		["HMR"],
	// 		["HMRW"]
	// 	],
	// 	[
	// 		["DI", "NS"],
	// 		["DI", "NSX"],
	// 		["DI", "SX"],
	// 		["DIN", "SX"],
	// 		["IN", "SX"],
	// 		["DINS"],
	// 		["DINSX"],
	// 		["INS"],
	// 		["INSX"]
	// 	],
	// 	[
	// 		["EJ", "OT"],
	// 		["EJ", "OTY"],
	// 		["EJ", "TY"],
	// 		["EJO", "TY"],
	// 		["JO", "TY"],
	// 		["EJOT"],
	// 		["EJOTY"],
	// 		["JOT"],
	// 		["JOTY"]
	// 	]
	// ];

	let totalPoints = [];
	let correctWords = [];
  for (let wordGroup of possibleWords) {
    let pointsPerGroup = 0;
    let correctWordsInGroup = [];

    wordGroup.map(wordPair => {
      let pointsPerPair = 0;
      let correctWordsInPair = [];

      wordPair.map(word => {
        swedishDict.map((ord) => {
          if (word.toUpperCase() === ord.toUpperCase()) {
            if (word.length < 5) pointsPerPair += word.length;
            else pointsPerPair = 7;
            correctWordsInPair.push(word);
          } 
        });
      });
      
      if (pointsPerGroup < pointsPerPair) {
        pointsPerGroup = pointsPerPair;
        correctWordsInGroup = correctWordsInPair;
      }
    });

    if (pointsPerGroup > 0) {
      totalPoints.push(pointsPerGroup);
      correctWords.push(correctWordsInGroup);
    }
  }

	return [correctWords, totalPoints];
};


module.exports = { findWords, getPossibleWords, getPoints };