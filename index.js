// DOM Elements
const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const newTournamentBtn = document.querySelector("#newTournamentBtn");
const humanScoreElement = document.getElementById("oScore");
const aiScoreElement = document.getElementById("xScore");
const humanScoreContainer = document.getElementById("oScoreContainer");
const aiScoreContainer = document.getElementById("xScoreContainer");
const humanTrophy = document.getElementById("oTrophy");
const aiTrophy = document.getElementById("xTrophy");
const gameCountText = document.getElementById("gameCountText");

// Game Config
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

let options = Array(9).fill("");
let currentPlayer = "⭕";
let humanSymbol = "⭕";
let aiSymbol = "✖️";
let running = false;

let humanScore = 0;
let aiScore = 0;
let gamesPlayed = 0;
let totalGames = 6;
let firstPlayerIsUser = true;

// Initialize
document.addEventListener("DOMContentLoaded", initializeGame);

function initializeGame() {
    running = true;
    options.fill("");
    cells.forEach((cell, index) => {
        cell.textContent = "";
        cell.style.backgroundColor = "";
        cell.setAttribute("cellIndex", index);
        cell.removeEventListener("click", cellClicked);
        cell.addEventListener("click", cellClicked);
        cell.style.pointerEvents = "auto";
    });

    restartBtn.removeEventListener("click", restartGame);
    restartBtn.addEventListener("click", restartGame);

    // Determine who should start based on game number
    firstPlayerIsUser = gamesPlayed % 2 === 0;

    // Set symbols based on who goes first
    if (firstPlayerIsUser) {
        humanSymbol = "⭕";
        aiSymbol = "✖️";
        currentPlayer = "⭕"; // Human starts
    } else {
        humanSymbol = "✖️";
        aiSymbol = "⭕";
        currentPlayer = "⭕"; // AI starts
    }

    updateGameCounterUI();
    updateStatusText(getTurnText());

    // If AI should go first, make AI move after a short delay
    if (currentPlayer === aiSymbol) {
        setTimeout(() => aiMove(), 500);
    }
}

function getTurnText() {
    return currentPlayer === aiSymbol ? "AI's turn" : "Human's turn";
}

function updateGameCounterUI() {
    gameCountText.textContent = `Game ${gamesPlayed + 1} of ${totalGames}`;
}

function updateStatusText(text) {
    statusText.textContent = text;
    statusText.classList.remove("statusTextUpdated");
    void statusText.offsetWidth;
    statusText.classList.add("statusTextUpdated");
}

function cellClicked() {
    const index = this.getAttribute("cellIndex");
    if (options[index] !== "" || !running || currentPlayer === aiSymbol) return;

    updateCell(this, index);
    this.classList.add("clicked");
    this.addEventListener("animationend", () => this.classList.remove("clicked"), { once: true });

    checkWinner();
}

function updateCell(cell, index) {
    try {
        const clickSound = new Audio("click-sound.mp3");
        clickSound.play();
    } catch (e) {
        // Ignore audio errors
    }
    options[index] = currentPlayer;
    cell.textContent = currentPlayer;
}

function changePlayer() {
    currentPlayer = currentPlayer === "⭕" ? "✖️" : "⭕";
    updateStatusText(getTurnText());
}

function checkWinner() {
    let winnerFound = false;

    for (let [a, b, c] of winConditions) {
        if (options[a] && options[a] === options[b] && options[b] === options[c]) {
            highlightWinningCells([a, b, c]);
            winnerFound = true;
            break;
        }
    }

    if (winnerFound) {
        try {
            new Audio("won-sound.mp3").play();
        } catch (e) {
            // Ignore audio errors
        }
        const winner = (currentPlayer === aiSymbol) ? "AI" : "Human";
        updateStatusText(`${winner} wins!`);
        updateScore(currentPlayer);
        running = false;
        disableCells();
        setTimeout(() => restartBtn.classList.add("bounce"), 900);
    } else if (!options.includes("")) {
        try {
            new Audio("draw-sound.mp3").play();
        } catch (e) {
            // Ignore audio errors
        }
        updateStatusText("Draw!");
        running = false;
        disableCells();
        setTimeout(() => restartBtn.classList.add("bounce"), 900);
    } else {
        changePlayer();
        // If it's now AI's turn, make AI move
        if (running && currentPlayer === aiSymbol) {
            setTimeout(() => aiMove(), 200);
        }
    }
}

function updateScore(symbol) {
    const isHuman = symbol === humanSymbol;
    if (isHuman) {
        humanScore++;
        humanScoreElement.textContent = humanScore;
    } else {
        aiScore++;
        aiScoreElement.textContent = aiScore;
    }
    updateScoreHighlight();
}

function updateScoreHighlight() {
    const h = humanScore;
    const a = aiScore;

    humanScoreContainer.classList.toggle("highlight", h > a);
    aiScoreContainer.classList.toggle("highlight", a > h);

    humanTrophy.style.display = h > a ? "inline" : "none";
    aiTrophy.style.display = a > h ? "inline" : "none";
}

function highlightWinningCells(indices) {
    indices.forEach(i => {
        const cell = cells[i];
        cell.style.backgroundColor = "yellow";
        cell.classList.add("zoom");
        setTimeout(() => cell.style.backgroundColor = "lightgreen", 400);
        cell.addEventListener("animationend", () => {
            cell.classList.remove("zoom");
            cell.style.backgroundColor = "yellow";
        }, { once: true });
    });
}

function disableCells() {
    cells.forEach(cell => {
        cell.style.pointerEvents = "none";
    });
}

function restartGame() {
    gamesPlayed++;
    if (gamesPlayed >= totalGames) {
        finalizeTournament();
        return;
    }

    restartBtn.classList.remove("bounce");
    initializeGame();
}

function finalizeTournament() {
    running = false;
    const finalText = humanScore > aiScore
        ? `🏁 Tournament Over! Human wins ${humanScore}–${aiScore}! 🏆`
        : aiScore > humanScore
            ? `🏁 Tournament Over! AI wins ${aiScore}–${humanScore}! 🤖`
            : `🏁 Tournament Over! It's a draw!`;

    updateStatusText(finalText);
    restartBtn.classList.remove("bounce");
    setTimeout(() => newTournamentBtn.classList.add("bounce"), 900);
}

function aiMove() {
    if (!running || currentPlayer !== aiSymbol) return;

    const bestMove = findBestMove(options);
    if (bestMove !== -1) {
        makeMove(bestMove);
    }
}

function makeMove(index) {
    if (options[index] !== "" || !running || index === -1) return;
    updateCell(cells[index], index);
    checkWinner();
}

// Pre-compute winning lines
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  // cols
    [0, 4, 8], [2, 4, 6]           // diagonals
];

// Simple cache for board evaluations (transposition table)
const transposition = {};

function findBestMove(board) {
    // Use a key for caching (e.g. comma-separated)
    const key = board.join(',');
    if (transposition[key]) {
        return transposition[key];
    }

    // 1. First move: pick center if empty
    if (board.every(cell => cell === "")) {
        return 4;
    }

    // 2. Win: If AI can win in one move, take it
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = aiSymbol;
            if (checkWinnerStatic(board) === aiSymbol) {
                board[i] = "";  // restore
                transposition[key] = i;
                return i;
            }
            board[i] = "";  // restore
        }
    }

    // 3. Block: If opponent can win in one move, block it
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = humanSymbol;
            if (checkWinnerStatic(board) === humanSymbol) {
                board[i] = "";  // restore
                transposition[key] = i;
                return i;
            }
            board[i] = "";
        }
    }

    // 4. Fork: Create a fork (two threats)
    // Check all empty cells for AI fork
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = aiSymbol;
            let winningMoves = 0;
            // Count how many winning moves this creates
            for (let j = 0; j < board.length; j++) {
                if (board[j] === "") {
                    board[j] = aiSymbol;
                    if (checkWinnerStatic(board) === aiSymbol) winningMoves++;
                    board[j] = "";
                }
            }
            board[i] = "";
            if (winningMoves >= 2) {
                transposition[key] = i;
                return i;
            }
        }
    }

    // 5. Block opponent's fork
    // If the opponent has a fork opportunity, block it.
    // Simplest approach: if there is only one fork, block it.
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = humanSymbol;
            let oppForks = 0;
            for (let j = 0; j < board.length; j++) {
                if (board[j] === "") {
                    board[j] = humanSymbol;
                    if (checkWinnerStatic(board) === humanSymbol) oppForks++;
                    board[j] = "";
                }
            }
            board[i] = "";
            if (oppForks >= 2) {
                // Block this fork by playing here
                transposition[key] = i;
                return i;
            }
        }
    }

    // 6. Take center if free (Rule 5):contentReference[oaicite:11]{index=11}
    if (board[4] === "") {
        transposition[key] = 4;
        return 4;
    }

    // 7. Opposite corner: if opponent is in a corner, play opposite corner:contentReference[oaicite:12]{index=12}
    const corners = [[0, 8], [2, 6], [6, 2], [8, 0]];
    for (let [c, opp] of corners) {
        if (board[opp] === humanSymbol && board[c] === "") {
            transposition[key] = c;
            return c;
        }
    }

    // 8. Empty corner
    const emptyCorners = [0, 2, 6, 8].filter(i => board[i] === "");
    if (emptyCorners.length) {
        const choice = emptyCorners[0];  // pick first available corner
        transposition[key] = choice;
        return choice;
    }

    // 9. Empty side
    const emptySides = [1, 3, 5, 7].filter(i => board[i] === "");
    if (emptySides.length) {
        const choice = emptySides[0];
        transposition[key] = choice;
        return choice;
    }

    // 10. Fallback: use Minimax
    let bestScore = -Infinity, bestMove = -1;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            let tempBoard = [...board];
            tempBoard[i] = aiSymbol;
            let score = minimax(tempBoard, 0, false);
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    transposition[key] = bestMove;
    return bestMove;
}


function minimax(board, depth, isMaximizing) {
    let result = checkWinnerStatic(board);
    if (result === aiSymbol) return 10 - depth;
    if (result === humanSymbol) return depth - 10;
    if (!board.includes("")) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                let newBoard = [...board];
                newBoard[i] = aiSymbol;
                let eval = minimax(newBoard, depth + 1, false);
                maxEval = Math.max(maxEval, eval);
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                let newBoard = [...board];
                newBoard[i] = humanSymbol;
                let eval = minimax(newBoard, depth + 1, true);
                minEval = Math.min(minEval, eval);
            }
        }
        return minEval;
    }
}

function checkWinnerStatic(board) {
    for (let [a, b, c] of winConditions) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    return null;
}
