// ---------- GAME CONFIGURATION & STATE ----------
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let winMessage = '';

// Game options & Preferences (loaded from localStorage or defaults)
let gameMode = localStorage.getItem('ttt_mode') || 'pvp'; // 'pvp' or 'pve'
let aiDifficulty = localStorage.getItem('ttt_difficulty') || 'easy'; // 'easy' or 'hard' (unbeatable)
let activeTheme = localStorage.getItem('ttt_theme') || 'sakura';
let sfxEnabled = (localStorage.getItem('ttt_sfx') !== 'false');

// Score tracking
let scoreX = parseInt(localStorage.getItem('ttt_score_x')) || 0;
let scoreO = parseInt(localStorage.getItem('ttt_score_o')) || 0;
let scoreDraw = parseInt(localStorage.getItem('ttt_score_draw')) || 0;

// Match history array
let matchHistory = JSON.parse(localStorage.getItem('ttt_history')) || [];

// DOM Elements
const boardContainer = document.getElementById('board');
const turnTextSpan = document.getElementById('turnText');
const statusTextSpan = document.getElementById('statusText');
const scoreXSpan = document.getElementById('scoreX');
const scoreOSpan = document.getElementById('scoreO');
const scoreDrawSpan = document.getElementById('scoreDraw');
const turnIconLeft = document.getElementById('turnIconLeft');
const turnIconRight = document.getElementById('turnIconRight');

// Settings Elements
const modeSelectButtons = document.querySelectorAll('#modeSelect .toggle-btn');
const difficultyGroup = document.getElementById('difficultyGroup');
const diffSelectButtons = document.querySelectorAll('#diffSelect .toggle-btn');
const themeButtons = document.querySelectorAll('.theme-btn');
const sfxToggleButton = document.getElementById('sfxToggle');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Celebration/Overlay Modal Elements
const celebrationOverlay = document.getElementById('celebrationOverlay');
const celebrationTitle = document.getElementById('celebrationTitle');
const celebrationSubtitle = document.getElementById('celebrationSubtitle');
const playAgainBtn = document.getElementById('playAgainBtn');

// Audio Context Variable
let audioCtx = null;

// Win patterns
const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

// ---------- WEB AUDIO SFX SYNTHESIZER ----------
function playSound(type) {
    if (!sfxEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        if (type === 'clickX') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.1);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'clickO') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'win') {
            // Cute triumphant little arpeggio
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
            
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
            freqs.forEach((f, idx) => {
                osc.frequency.setValueAtTime(f, now + idx * 0.1);
            });
            osc.start(now);
            osc.stop(now + 0.55);
        } else if (type === 'loss') {
            // Retro slide down
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.45);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'draw') {
            // Neutral double beep
            osc.type = 'square';
            osc.frequency.setValueAtTime(330, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            
            osc.frequency.setValueAtTime(220, now + 0.18);
            gain.gain.setValueAtTime(0.08, now + 0.18);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.33);
            
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'reset') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(550, now);
            osc.frequency.exponentialRampToValueAtTime(350, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {
        console.warn("Web Audio API failure: ", e);
    }
}

// ---------- DECORATIVE PARTICLES BACKGROUND ----------
function initBackgroundParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';
    
    let emojis = ['🌸', '🍃', '💖', '✨'];
    if (activeTheme === 'forest') {
        emojis = ['🍃', '🍄', '🌱', '☘️', '🌼'];
    } else if (activeTheme === 'cyber') {
        emojis = ['⚡', '👾', '✨', '🪐', '💿'];
    }
    
    const count = 15;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.fontSize = `${Math.random() * 20 + 20}px`;
        particle.style.animationDelay = `${Math.random() * 10}s`;
        particle.style.animationDuration = `${Math.random() * 8 + 8}s`;
        
        container.appendChild(particle);
    }
}

// ---------- UI UPDATE HELPERS ----------
function updateScoreUI() {
    scoreXSpan.innerText = scoreX;
    scoreOSpan.innerText = scoreO;
    scoreDrawSpan.innerText = scoreDraw;
    
    // Save to localStorage
    localStorage.setItem('ttt_score_x', scoreX);
    localStorage.setItem('ttt_score_o', scoreO);
    localStorage.setItem('ttt_score_draw', scoreDraw);
}

function updateTurnDisplay() {
    // Icons updating based on theme
    let leftIconSrc = "image/rose-flower-cartoon-cute-pink-cartoon-flower-with-adorable-expression-kuNzw8k8_t-removebg-preview.png";
    let rightIconSrc = "image/rose-flower-cartoon-cute-cartoon-rose-with-cheerful-expression-qFPyqk1g_t-removebg-preview.png";
    
    if (turnIconRight) {
        turnIconRight.src = rightIconSrc;
        turnIconRight.style.borderRadius = "";
        turnIconRight.style.objectFit = "";
        turnIconRight.style.border = "";
    }
    
    if (gameActive) {
        if (currentPlayer === 'X') {
            turnTextSpan.innerHTML = "🌸 ninte turn";
            if (turnIconLeft) turnIconLeft.alt = "X turn flower";
            if (turnIconRight) turnIconRight.alt = "X turn decoration";
        } else {
            if (gameMode === 'pve') {
                turnTextSpan.innerHTML = "🤖 AI nte chance!";
            } else {
                turnTextSpan.innerHTML = "🌼 eni njaan 🌼";
            }
            if (turnIconLeft) turnIconLeft.alt = "O turn flower";
            if (turnIconRight) turnIconRight.alt = "O turn decoration";
        }
    } else {
        if (winMessage.includes('X wins') || winMessage.includes('X jeyich')) {
            turnTextSpan.innerHTML = "🏆 X jeyichh! 🏆";
        } else if (winMessage.includes('O wins') || winMessage.includes('O jeyich') || winMessage.includes('AI jeyich')) {
            turnTextSpan.innerHTML = gameMode === 'pve' ? "🤖 AI jeyich! 🤖" : "🏆 O jeyichh! 🏆";
        } else {
            turnTextSpan.innerHTML = "🍬 randaalu jeyichitilla 🍬";
        }
    }
}

// ---------- MATCH HISTORY LOGGING ----------
function logMatch(winner, mode, difficulty) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let label = '';
    let outcome = 'tie';
    
    if (winner === 'X') {
        label = mode === 'pve' ? `🌸 Player won vs AI (${difficulty})` : '🌸 Player X Won';
        outcome = 'win';
    } else if (winner === 'O') {
        label = mode === 'pve' ? `🤖 AI (${difficulty}) won vs Player` : '🌼 Player O Won';
        outcome = mode === 'pve' ? 'loss' : 'win';
    } else {
        label = mode === 'pve' ? `🌈 Tied vs AI (${difficulty})` : '🌈 Tied Match';
        outcome = 'tie';
    }
    
    matchHistory.unshift({ label, outcome, time: timestamp });
    if (matchHistory.length > 10) {
        matchHistory.pop();
    }
    
    localStorage.setItem('ttt_history', JSON.stringify(matchHistory));
    renderHistory();
}

function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';
    
    if (matchHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No matches played yet</div>';
        return;
    }
    
    matchHistory.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('history-item');
        
        const labelSpan = document.createElement('span');
        labelSpan.innerText = item.label;
        
        const rightContainer = document.createElement('div');
        rightContainer.style.display = 'flex';
        rightContainer.style.alignItems = 'center';
        rightContainer.style.gap = '8px';
        
        const outcomeSpan = document.createElement('span');
        outcomeSpan.classList.add('history-outcome', `outcome-${item.outcome}`);
        outcomeSpan.innerText = item.outcome;
        
        const timeSpan = document.createElement('span');
        timeSpan.style.opacity = '0.5';
        timeSpan.style.fontSize = '0.7rem';
        timeSpan.innerText = item.time;
        
        rightContainer.appendChild(outcomeSpan);
        rightContainer.appendChild(timeSpan);
        
        div.appendChild(labelSpan);
        div.appendChild(rightContainer);
        historyList.appendChild(div);
    });
}

// ---------- CANVAS CONFETTI CELEBRATION ----------
let confettiParticles = [];
let confettiAnimationId = null;

class ConfettiParticle {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2 - 50;
        this.color = ['#ff8da1', '#ffb347', '#a066ff', '#8cd694', '#00f0ff', '#ff007f'][Math.floor(Math.random() * 6)];
        this.radius = Math.random() * 5 + 3;
        this.vx = Math.random() * 12 - 6;
        this.vy = Math.random() * -12 - 5;
        this.gravity = 0.3;
        this.decay = 0.98;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.opacity = 1;
    }
    
    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.decay;
        this.vy *= this.decay;
        this.rotation += this.rotationSpeed;
        this.opacity -= 0.015;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set proper size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    confettiParticles = [];
    for (let i = 0; i < 150; i++) {
        confettiParticles.push(new ConfettiParticle(canvas.width, canvas.height));
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let alive = false;
        confettiParticles.forEach(p => {
            p.update();
            p.draw(ctx);
            if (p.opacity > 0 && p.y < canvas.height) {
                alive = true;
            }
        });
        
        if (alive) {
            confettiAnimationId = requestAnimationFrame(animate);
        }
    }
    
    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animate();
}

function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ---------- CELEBRATION OVERLAY MODAL ----------
function triggerCelebration(message, subtext, outcomeType) {
    if (celebrationOverlay) {
        celebrationTitle.innerText = message;
        celebrationSubtitle.innerText = subtext;
        celebrationOverlay.classList.add('active');
        
        if (outcomeType === 'win') {
            playSound('win');
            startConfetti();
        } else if (outcomeType === 'loss') {
            playSound('loss');
        } else {
            playSound('draw');
        }
    }
}

function closeCelebration() {
    if (celebrationOverlay) {
        celebrationOverlay.classList.remove('active');
    }
    stopConfetti();
}

// ---------- AI GAME ENGINE ----------
// Unbeatable Minimax Algorithm
function checkWinState(b, player) {
    for (let pattern of winPatterns) {
        const [a, c, d] = pattern;
        if (b[a] === player && b[c] === player && b[d] === player) {
            return true;
        }
    }
    return false;
}

function evaluateBoard(b) {
    if (checkWinState(b, 'O')) return 10;
    if (checkWinState(b, 'X')) return -10;
    return 0;
}

function getAvailableMoves(b) {
    const moves = [];
    for (let i = 0; i < b.length; i++) {
        if (b[i] === '') moves.push(i);
    }
    return moves;
}

function minimax(b, depth, isMax) {
    const score = evaluateBoard(b);
    
    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    
    const available = getAvailableMoves(b);
    if (available.length === 0) return 0;
    
    if (isMax) {
        let best = -1000;
        for (let idx of available) {
            b[idx] = 'O';
            best = Math.max(best, minimax(b, depth + 1, false));
            b[idx] = '';
        }
        return best;
    } else {
        let best = 1000;
        for (let idx of available) {
            b[idx] = 'X';
            best = Math.min(best, minimax(b, depth + 1, true));
            b[idx] = '';
        }
        return best;
    }
}

function findBestMove(b) {
    let bestVal = -1000;
    let bestMove = -1;
    const available = getAvailableMoves(b);
    
    // Randomize order of equal moves to make gameplay natural
    available.sort(() => Math.random() - 0.5);
    
    for (let idx of available) {
        b[idx] = 'O';
        let moveVal = minimax(b, 0, false);
        b[idx] = '';
        
        if (moveVal > bestVal) {
            bestVal = moveVal;
            bestMove = idx;
        }
    }
    return bestMove;
}

function executeAIMove() {
    if (!gameActive || currentPlayer !== 'O') return;
    
    const available = getAvailableMoves(board);
    if (available.length === 0) return;
    
    let chosenIndex = -1;
    
    if (aiDifficulty === 'easy') {
        // Choose random available spot
        chosenIndex = available[Math.floor(Math.random() * available.length)];
    } else {
        // Unbeatable minimax
        chosenIndex = findBestMove(board);
    }
    
    if (chosenIndex !== -1) {
        board[chosenIndex] = 'O';
        playSound('clickO');
        renderBoard();
        
        const gameEnded = checkGameStatus();
        if (!gameEnded) {
            currentPlayer = 'X';
            updateTurnDisplay();
            statusTextSpan.innerText = "✨ ninte turn! X is waiting... ✨";
        }
    }
}

// ---------- GAMEPLAY LOGIC ----------
function checkGameStatus() {
    let winner = null;
    let winPatternIndex = null;
    
    for (let i = 0; i < winPatterns.length; i++) {
        const [a, b, c] = winPatterns[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            winner = board[a];
            winPatternIndex = winPatterns[i];
            break;
        }
    }

    if (winner) {
        gameActive = false;
        
        // Highlight winning cells
        if (winPatternIndex) {
            const cells = boardContainer.querySelectorAll('.cell');
            winPatternIndex.forEach(idx => {
                cells[idx].classList.add('win-highlight');
            });
        }
        
        if (winner === 'X') {
            winMessage = '🌸 nee belle show akandaa 🌸';
            scoreX++;
            updateScoreUI();
            statusTextSpan.innerText = winMessage;
            updateTurnDisplay();
            
            triggerCelebration("✨ X jeyich! ✨", "🌸 nee belle show akandaa 🌸", 'win');
            logMatch('X', gameMode, aiDifficulty);
        } else {
            winMessage = gameMode === 'pve' ? '🤖 AI jeyichh, show aakandaa! 🤖' : '🌼 heheheee 🌼';
            scoreO++;
            updateScoreUI();
            statusTextSpan.innerText = winMessage;
            updateTurnDisplay();
            
            triggerCelebration(
                gameMode === 'pve' ? "🤖 AI jeyich! 🤖" : "🍊 hehehe njaan jeyich! 🍊",
                winMessage,
                gameMode === 'pve' ? 'loss' : 'win'
            );
            logMatch('O', gameMode, aiDifficulty);
        }
        return true;
    } else if (!board.includes('')) {
        gameActive = false;
        winMessage = 'draw aahn show aakanda! 🌈 onnode kalikaan indaa?';
        scoreDraw++;
        updateScoreUI();
        statusTextSpan.innerText = winMessage;
        updateTurnDisplay();
        
        triggerCelebration("🤝 tie aan! 🤝", "draw aahn show aakanda! 🌈", 'draw');
        logMatch('Tie', gameMode, aiDifficulty);
        return true;
    }
    return false;
}

function handleCellClick(index) {
    if (!gameActive) {
        statusTextSpan.innerText = "onnode kalikanenki new game touch cheyy";
        return;
    }
    
    // Prevent clicking O's slot or clicking during AI turn
    if (gameMode === 'pve' && currentPlayer === 'O') return;
    
    if (board[index] !== '') {
        statusTextSpan.innerText = "vere ethenkilu edk";
        setTimeout(() => {
            if (gameActive) {
                statusTextSpan.innerText = `Chance: ${currentPlayer === 'X' ? '🌸 X' : '🌼 O'}`;
            } else {
                statusTextSpan.innerText = winMessage;
            }
        }, 900);
        return;
    }

    // Process move
    board[index] = currentPlayer;
    playSound(currentPlayer === 'X' ? 'clickX' : 'clickO');
    renderBoard();

    const gameEnded = checkGameStatus();
    if (!gameEnded) {
        currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        updateTurnDisplay();
        
        if (gameMode === 'pve' && currentPlayer === 'O') {
            statusTextSpan.innerText = "🤖 AI thinking...";
            setTimeout(executeAIMove, 600);
        } else {
            statusTextSpan.innerText = `✨ ${currentPlayer === 'X' ? '🌸 X' : '🌼 O'} nte chance! ✨`;
        }
    }
}

// ---------- BOARD RENDERING ----------
function renderBoard() {
    boardContainer.innerHTML = '';
    for (let i = 0; i < board.length; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        
        if (board[i] === 'X') {
            cell.classList.add('X');
            cell.innerText = 'X';
        } else if (board[i] === 'O') {
            cell.classList.add('O');
            cell.innerText = 'O';
        }
        
        cell.addEventListener('click', () => handleCellClick(i));
        boardContainer.appendChild(cell);
    }
}

// ---------- GAME CONTROLS & INITIALIZATION ----------
function resetGame() {
    closeCelebration();
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    winMessage = '';
    playSound('reset');
    renderBoard();
    updateTurnDisplay();
    statusTextSpan.innerText = "✨ aadyam muthale thodangeetta ✨";
}

function fullReset() {
    scoreX = 0;
    scoreO = 0;
    scoreDraw = 0;
    updateScoreUI();
    resetGame();
    statusTextSpan.innerText = "🌸 athyam muthale started, ok? 🌸";
}

function initSettings() {
    // Mode toggling
    modeSelectButtons.forEach(btn => {
        if (btn.getAttribute('data-value') === gameMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        btn.addEventListener('click', () => {
            modeSelectButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameMode = btn.getAttribute('data-value');
            localStorage.setItem('ttt_mode', gameMode);
            
            // Toggle difficulty display
            if (gameMode === 'pve') {
                difficultyGroup.classList.remove('hidden');
            } else {
                difficultyGroup.classList.add('hidden');
            }
            resetGame();
        });
    });

    // Difficulty display setup
    if (gameMode === 'pve') {
        difficultyGroup.classList.remove('hidden');
    } else {
        difficultyGroup.classList.add('hidden');
    }

    // Difficulty toggling
    diffSelectButtons.forEach(btn => {
        if (btn.getAttribute('data-value') === aiDifficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        btn.addEventListener('click', () => {
            diffSelectButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aiDifficulty = btn.getAttribute('data-value');
            localStorage.setItem('ttt_difficulty', aiDifficulty);
            resetGame();
        });
    });

    // Theme Picker Setup
    document.documentElement.setAttribute('data-theme', activeTheme);
    themeButtons.forEach(btn => {
        if (btn.getAttribute('data-theme') === activeTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        btn.addEventListener('click', () => {
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTheme = btn.getAttribute('data-theme');
            localStorage.setItem('ttt_theme', activeTheme);
            document.documentElement.setAttribute('data-theme', activeTheme);
            initBackgroundParticles();
        });
    });

    // SFX toggle button
    function updateSfxBtnUI() {
        if (sfxEnabled) {
            sfxToggleButton.classList.add('active');
            sfxToggleButton.innerText = "🔊 Sound On";
        } else {
            sfxToggleButton.classList.remove('active');
            sfxToggleButton.innerText = "🔇 Muted";
        }
    }
    
    updateSfxBtnUI();
    sfxToggleButton.addEventListener('click', () => {
        sfxEnabled = !sfxEnabled;
        localStorage.setItem('ttt_sfx', sfxEnabled);
        updateSfxBtnUI();
    });

    // Clear history action
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            matchHistory = [];
            localStorage.removeItem('ttt_history');
            renderHistory();
        });
    }
}

// Start the game when page loads
function init() {
    initSettings();
    initBackgroundParticles();
    renderBoard();
    updateTurnDisplay();
    updateScoreUI();
    renderHistory();
    
    statusTextSpan.innerText = "ethenkilm onn touch cheyy poothe 🌸";
    
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('fullResetBtn').addEventListener('click', fullReset);
    if (playAgainBtn) playAgainBtn.addEventListener('click', resetGame);
    
    // Close overlay modal when clicked outside card content
    if (celebrationOverlay) {
        celebrationOverlay.addEventListener('click', (e) => {
            if (e.target === celebrationOverlay) {
                closeCelebration();
            }
        });
    }
}

// Window resize updates for canvas size
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas && confettiAnimationId) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

init();

// ---------- PWA ENHANCEMENTS: TOASTS, INSTALLATION & UPDATES ----------

// Toast Notification System
const toastContainer = document.getElementById('toastContainer');

function showToast(message, actionLabel = null, actionCallback = null, duration = 5000) {
    if (!toastContainer) return null;
    
    const toast = document.createElement('div');
    toast.classList.add('toast');
    
    const textSpan = document.createElement('span');
    textSpan.innerHTML = message;
    toast.appendChild(textSpan);
    
    if (actionLabel && actionCallback) {
        const btn = document.createElement('button');
        btn.classList.add('toast-btn');
        btn.innerText = actionLabel;
        btn.addEventListener('click', () => {
            actionCallback();
            removeToast(toast);
        });
        toast.appendChild(btn);
    }
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after duration (if duration > 0)
    let timeoutId = null;
    if (duration > 0) {
        timeoutId = setTimeout(() => removeToast(toast), duration);
    }
    
    function removeToast(el) {
        if (timeoutId) clearTimeout(timeoutId);
        el.classList.add('removing');
        el.addEventListener('transitionend', () => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }
    
    return {
        element: toast,
        close: () => removeToast(toast)
    };
}

// Custom App Installation Flow
let deferredPrompt = null;
const installGroup = document.getElementById('installGroup');
const installBtn = document.getElementById('installBtn');

// Hide install UI if already running in standalone mode (installed PWA)
if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installGroup) {
        installGroup.classList.add('hidden');
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can install the PWA
    if (installGroup) {
        installGroup.classList.remove('hidden');
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again
        deferredPrompt = null;
        // Hide the install button
        if (installGroup) {
            installGroup.classList.add('hidden');
        }
    });
}

window.addEventListener('appinstalled', (event) => {
    // Hide the install button
    if (installGroup) {
        installGroup.classList.add('hidden');
    }
    // Clear the deferredPrompt
    deferredPrompt = null;
    showToast("🎉 Tic Tac Toe is successfully installed! 🌸");
});

// Network Status Observers
window.addEventListener('offline', () => {
    showToast("🌸 You are offline, but Tic Tac Toe is fully playable! 🎮", null, null, 6000);
});

window.addEventListener('online', () => {
    showToast("🌈 Connected back to the server!", null, null, 4000);
});

// Register Service Worker with active update check and controller reload
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('PWA Service Worker registered:', reg.scope);
                
                // Check if there's a waiting service worker already on page load
                if (reg.waiting) {
                    promptUserToUpdate(reg.waiting);
                }
                
                // Monitor for updates (new service worker found)
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            promptUserToUpdate(newWorker);
                        }
                    });
                });
            })
            .catch(err => console.error('PWA Service Worker registration failed:', err));
    });

    // Reload the page once the new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}

function promptUserToUpdate(worker) {
    showToast(
        "🔄 New app update available!",
        "Update",
        () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
        },
        0 // persistent toast (doesn't auto-dismiss)
    );
}