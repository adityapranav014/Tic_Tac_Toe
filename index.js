// DOM Elements
const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const oScoreElement = document.getElementById('oScore');
const xScoreElement = document.getElementById('xScore');
const oScoreContainer = document.getElementById('oScoreContainer');
const xScoreContainer = document.getElementById('xScoreContainer');
const oTrophy = document.getElementById('oTrophy');
const xTrophy = document.getElementById('xTrophy');
const playWithAIButton = document.getElementById('playWithAIButton'); // New button element

// Game Variables
const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

let options = Array(9).fill(""); // Array to track cell states
let currentPlayer = "⭕"; // Current player symbol
let running = false; // Game state
let oScore = 0; // Player O's score
let xScore = 0; // Player X's score
let isPlayingWithAi = false; // Flag to track if AI mode is enabled
let aiSymbol = ""; // Variable to store AI's symbol

// Initialize the game
initializeGame();

function initializeGame() {
    running = true;
    options.fill(""); // Reset the options array
    cells.forEach((cell, index) => {
        cell.textContent = ""; // Clear cell text
        cell.setAttribute("cellIndex", index);
        cell.addEventListener("click", cellClicked);
    });
    restartBtn.addEventListener("click", restartGame);
    playWithAIButton.addEventListener("click", togglePlayWithAI); // New AI mode button listener
    updateStatusText(`${currentPlayer}'s turn`);
}

// Toggle AI play mode
function togglePlayWithAI() {
    isPlayingWithAi = !isPlayingWithAi;
    playWithAIButton.textContent = isPlayingWithAi ? "🤖 Playing with AI" : "🤖 Play With AI";

    // Apply or remove the border based on AI play mode
    if (isPlayingWithAi) {
        playWithAIButton.style.border = "2px solid #FFC71E"; // Add border when playing with AI
    } else {
        playWithAIButton.style.border = ""; // Remove border when not playing with AI
    }

    // Ensure AI always uses "✖️" or "⭕" consistently
    aiSymbol = "✖️";
    currentPlayer = "⭕";
    updateStatusText(`${currentPlayer}'s turn`);
}


// Update status text with animation
function updateStatusText(text) {
    statusText.textContent = text;
    statusText.classList.remove("statusTextUpdated");
    void statusText.offsetWidth; // Trigger reflow
    statusText.classList.add("statusTextUpdated");
}

// Cell click handler
function cellClicked() {
    if (!isPlayingWithAi) {
        playWithAIButton.disabled = true;
        playWithAIButton.style.opacity = "0.5";     
        playWithAIButton.style.cursor = "not-allowed"; // Change the cursor to indicate it's disabled
        playWithAIButton.style.pointerEvents = "none"; // Disable hover and click events
    }
    const cellIndex = this.getAttribute("cellIndex");
    if (options[cellIndex] !== "" || !running) return;

    updateCell(this, cellIndex);
    this.classList.add("clicked");
    this.addEventListener("animationend", () => {
        this.classList.remove("clicked");
    }, { once: true });

    checkWinner();
    if (isPlayingWithAi && running) { // Ensure game is running before AI moves
        aiMove();
    }
}

// Update cell with current player's symbol
function updateCell(cell, index) {
    const clickSound = new Audio("clicl-sound.mp3");
    clickSound.play();
    options[index] = currentPlayer;
    cell.textContent = currentPlayer;
}

// Change the current player
function changePlayer() {
    currentPlayer = currentPlayer === "✖️" ? "⭕" : "✖️";
    updateStatusText(`${currentPlayer}'s turn`);
}

// Check if there's a winner or a draw
function checkWinner() {
    let roundWon = false;

    for (let [a, b, c] of winConditions) {
        if (options[a] === "" || options[b] === "" || options[c] === "") continue;
        if (options[a] === options[b] && options[b] === options[c]) {
            roundWon = true;
            highlightWinningCells([a, b, c]);
            break;
        }
    }

    if (roundWon) {
        const wonSound = new Audio("won-sound.mp3");
        wonSound.play();
        updateStatusText(`${currentPlayer} wins!`);
        currentPlayer === '⭕' ? oScore++ : xScore++;
        updateScoreboard();
        running = false;
        setTimeout(() => restartBtn.classList.add("bounce"), 900);
    } else if (!options.includes("")) {
        const drawSound = new Audio("draw-sound.mp3");
        drawSound.play();
        updateStatusText(`Draw!`);
        running = false;
        setTimeout(() => restartBtn.classList.add("bounce"), 900);
    } else {
        changePlayer();
    }
}

/// AI Move using enhanced Minimax algorithm with better heuristics
function aiMove() {
    const bestMove = findBestMove(options);
    setTimeout(() => makeMove(bestMove), 100);
}

// Function to find the best move using a modified Minimax algorithm
function findBestMove(board) {
    let bestScore = -Infinity;
    let bestMove = -1;

    // Iterate through all cells to find the best move
    board.forEach((cell, index) => {
        if (cell === "") {
            const boardCopy = [...board];
            boardCopy[index] = aiSymbol; // Simulate the AI's move
            const score = minimax(boardCopy, 0, false);
            if (score > bestScore) {
                bestScore = score;
                bestMove = index;
            }
        }
    });

    return bestMove;
}

// Minimax function with scoring based on potential outcomes
function minimax(newBoard, depth, isMaximizing) {
    const winner = checkForWinner(newBoard);
    if (winner === aiSymbol) return 10 - depth; // AI wins
    if (winner === (aiSymbol === "✖️" ? "⭕" : "✖️")) return depth - 10; // Opponent wins
    if (!newBoard.includes("")) return 0; // Draw

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < newBoard.length; i++) {
            if (newBoard[i] === "") {
                const boardCopy = [...newBoard];
                boardCopy[i] = aiSymbol; // AI's move
                const eval = minimax(boardCopy, depth + 1, false);
                maxEval = Math.max(maxEval, eval);
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < newBoard.length; i++) {
            if (newBoard[i] === "") {
                const boardCopy = [...newBoard];
                boardCopy[i] = (aiSymbol === "✖️" ? "⭕" : "✖️"); // Opponent's move
                const eval = minimax(boardCopy, depth + 1, true);
                minEval = Math.min(minEval, eval);
            }
        }
        return minEval;
    }
}

// Check for a winner in the current board state
function checkForWinner(board) {
    for (let [a, b, c] of winConditions) {
        if (board[a] === "" || board[b] === "" || board[c] === "") continue;
        if (board[a] === board[b] && board[b] === board[c]) {
            return board[a]; // Return the winner
        }
    }
    return null; // No winner
}

// Make the move for the AI
function makeMove(index) {
    const cell = cells[index];
    if (options[index] !== "" || !running) return;

    updateCell(cell, index);
    checkWinner();
}


// Highlight winning cells
function highlightWinningCells(indices) {
    indices.forEach(index => {
        const winningCell = cells[index];
        winningCell.style.backgroundColor = "yellow";
        winningCell.classList.add("zoom");
        setTimeout(() => winningCell.style.backgroundColor = "lightgreen", 400);

        winningCell.addEventListener('animationend', () => {
            winningCell.classList.remove("zoom");
            winningCell.style.backgroundColor = "yellow";
        }, { once: true });
    });
}

// Update the scoreboard
function updateScoreboard() {
    oScoreElement.textContent = oScore;

    if (isPlayingWithAi) {
        xScoreElement.textContent = `${xScore} 🤖`;
    } else {
        xScoreElement.textContent = xScore;
    }

    const currentScoreElement = currentPlayer === '⭕' ? oScoreElement : xScoreElement;
    currentScoreElement.classList.add("score-updated");
    setTimeout(() => currentScoreElement.classList.remove("score-updated"), 600);

    updateScoreHighlight();
}

// Update score highlight based on scores
function updateScoreHighlight() {
    const oScoreValue = parseInt(oScoreElement.innerText);
    const xScoreValue = parseInt(xScoreElement.innerText);

    oScoreContainer.classList.toggle('highlight', oScoreValue > xScoreValue);
    xScoreContainer.classList.toggle('highlight', xScoreValue > oScoreValue);

    oTrophy.style.display = oScoreValue > xScoreValue ? 'inline' : 'none';
    xTrophy.style.display = xScoreValue > oScoreValue ? 'inline' : 'none';
}

// Restart the game and reset states
function restartGame() {
    options.fill("");
    restartBtn.classList.remove("bounce");

    // Keep AI symbol consistent if AI mode is active
    if (!isPlayingWithAi) {
        currentPlayer = currentPlayer === "✖️" ? "⭕" : "✖️";
    } else {
        currentPlayer = aiSymbol === "✖️" ? "⭕" : "✖️";
    }

    updateStatusText(`${currentPlayer}'s turn`);
    cells.forEach(cell => {
        cell.style.backgroundColor = "";
        cell.textContent = "";
    });
    running = true;

    if (isPlayingWithAi && currentPlayer === aiSymbol) {
        aiMove();
    }
}
