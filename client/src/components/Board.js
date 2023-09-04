import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Button, Typography } from "@mui/material";

function Board({board, boardDisabled, playRound}) {

	const theme = useTheme();

	const hasValue = (i, j) => {
		if (board && board[i][j] !== "") return true;
		return false;
	};

	return board.map((row, i) => (
		<Box
			key={i}
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				// justifyContent: "space-between",
			}}
		>
			{row.map((col, j) => (
				<Button
					key={j}
					sx={{
						display: "flex",
						position: "relative",
						margin: "1px",
						cursor: "pointer",
						color: theme.palette.action.active,
						width: "5em",
						height: "5em",
					}}
					variant={"contained"}
					disabled={hasValue(i, j) ? true : boardDisabled}
					onClick={() => playRound(i, j)}
				>
					<Typography variant="bigText">{board[i][j]}</Typography>
				</Button>
			))}
		</Box>
	));
}

export default Board;
