import React from "react";
import "./Board.css";

function Board({board, boardDisabled, playRound}) {

	const hasValue = (i, j) => {
		if (board && board[i][j] !== "") return true;
		return false;
	};

	const getCellClass = (i, j) => {
		const baseClass = "board-cell";
		if (hasValue(i, j)) return `${baseClass} filled`;
		if (boardDisabled) return `${baseClass} disabled`;
		return `${baseClass} active`;
	};

	return (
		<div className="board-container">
			{board.map((row, i) => (
				<div key={i} className="board-row">
					{row.map((col, j) => (
						<button
							key={j}
							className={getCellClass(i, j)}
							disabled={hasValue(i, j) ? true : boardDisabled}
							onClick={() => playRound(i, j)}
						>
							<span className="board-cell-letter">{board[i][j]}</span>
						</button>
					))}
				</div>
			))}
		</div>
	);
}

export default Board;
