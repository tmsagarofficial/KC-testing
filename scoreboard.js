let chongScore = 0;
let hongScore = 0;
let chongGamJeom = 0;
let hongGamJeom = 0;
let currentRound = 1;
const totalRounds = 3;
let chongRoundsWon = 0;
let hongRoundsWon = 0;
let timerInterval = null;
let timerTime = 0;
let isTimerRunning = false;
let matchWinnerDeclared = false;
let currentRoomId = null;

// ========== ROOM CREATION ==========
function generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function createRoom() {
    const roomId = generateRoomId();
    currentRoomId = roomId;

    const initialData = {
      teamA: { score: 0, gamJeoms: 0 },
      teamB: { score: 0, gamJeoms: 0 },
      timer: { minutes: 0, seconds: 0, running: false },
      round: 1
  };
  

    db.ref(`rooms/${roomId}`).set(initialData).then(() => {
        alert(`Room created: ${roomId}`);
        listenToRoom(roomId);
    });
}

function listenToRoom(roomId) {

    db.ref(`rooms/${roomId}`).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          chongScore = data.teamA?.score || 0;
          hongScore = data.teamB?.score || 0;
          chongGamJeom = data.teamA?.gamJeoms || 0;
          hongGamJeom = data.teamB?.gamJeoms || 0;
          
            chongRoundsWon = data.chongRoundsWon;
            hongRoundsWon = data.hongRoundsWon;
            currentRound = data.round || 1;

            updateDisplay();
            timerTime = (data.timer?.minutes || 0) * 60 + (data.timer?.seconds || 0);
isTimerRunning = data.timer?.running || false;

        }
    });
    console.log("Syncing to Firebase:", {
      chongScore, hongScore,
      chongGamJeom, hongGamJeom,
      currentRound, timerTime, isTimerRunning
    });
    
}

// ========== DISPLAY ==========
function updateDisplay() {
    document.querySelectorAll('.side-controls')[0].querySelector('div').textContent = `Gam-Jeom: ${chongGamJeom}`;
    document.querySelectorAll('.side-controls')[1].querySelector('div').textContent = `Gam-Jeom: ${hongGamJeom}`;
    document.querySelector('.header').textContent = `Chung Hong (Round ${currentRound} of ${totalRounds})`;
    console.log("Syncing to Firebase:", {
      chongScore, hongScore,
      chongGamJeom, hongGamJeom,
      currentRound, timerTime, isTimerRunning
    });
    
    if (currentRoomId) {
      db.ref(`rooms/${currentRoomId}`).update({
          teamA: {
              score: chongScore,
              gamJeoms: chongGamJeom
          },
          teamB: {
              score: hongScore,
              gamJeoms: hongGamJeom
          },
          timer: {
              minutes: Math.floor(timerTime / 60),
              seconds: timerTime % 60,
              running: isTimerRunning
          },
          round: currentRound
      });
  }
  
}

// ========== GAM-JEOM ==========
function addGamJeom(team) {
    if (team === 'chong') {
        chongGamJeom++;
        if (chongScore > 0) chongScore--;
        hongScore++;
    } else {
        hongGamJeom++;
        if (hongScore > 0) hongScore--;
        chongScore++;
    }
    checkGamJeomLimit();
    updateDisplay();
}

function subtractGamJeom(team) {
    if (team === 'chong' && chongGamJeom > 0) {
        chongGamJeom--;
        if (hongScore > 0) hongScore--;
    } else if (team === 'hong' && hongGamJeom > 0) {
        hongGamJeom--;
        if (chongScore > 0) chongScore--;
    }
    updateDisplay();
}

function checkGamJeomLimit() {
    if (chongGamJeom >= 5) declareRoundWinner('hong');
    if (hongGamJeom >= 5) declareRoundWinner('chong');
}

// ========== POINT GAP ==========
function checkPointGap() {
    if (chongScore - hongScore >= 12) declareRoundWinner('chong');
    if (hongScore - chongScore >= 12) declareRoundWinner('hong');
}

// ========== WINNER ==========
function declareRoundWinner(winner) {
    if (matchWinnerDeclared) return;
    winner === 'chong' ? chongRoundsWon++ : hongRoundsWon++;

    if (chongRoundsWon === 2 || hongRoundsWon === 2) {
        matchWinnerDeclared = true;
        alert(`${winner.toUpperCase()} wins the match!`);
    } else {
        currentRound++;
        resetRound();
    }

    updateDisplay();
}

function resetRound() {
    chongScore = 0;
    hongScore = 0;
    chongGamJeom = 0;
    hongGamJeom = 0;
}

// ========== TIMER ==========
function setTimer(min, sec) {
    timerTime = min * 60 + sec;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.querySelector('.timer-display');
    const minutes = Math.floor(timerTime / 60).toString().padStart(2, '0');
    const seconds = (timerTime % 60).toString().padStart(2, '0');
    display.textContent = `Timer: ${minutes}:${seconds}`;
}

function toggleTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
    } else {
        timerInterval = setInterval(() => {
            if (timerTime > 0) {
                timerTime--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                alert("Time's up!");
            }
        }, 1000);
        isTimerRunning = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerTime = 0;
    isTimerRunning = false;
    updateTimerDisplay();
}

// ========== BINDING ==========
window.onload = function () {
    const [left, right] = document.querySelectorAll('.side-controls');
    left.children[0].onclick = () => addGamJeom('chong');
    left.children[2].onclick = () => subtractGamJeom('chong');
    right.children[0].onclick = () => addGamJeom('hong');
    right.children[2].onclick = () => subtractGamJeom('hong');

    document.querySelector('.top-right button').onclick = createRoom;

    const timerBtn = document.querySelector('.timer-btn');
    timerBtn.onclick = toggleTimer;

    const setBtn = document.querySelectorAll('.center-panel button')[1];
    setBtn.onclick = () => {
        const mins = parseInt(document.querySelectorAll('input')[0].value) || 0;
        const secs = parseInt(document.querySelectorAll('input')[1].value) || 0;
        setTimer(mins, secs);
    };

    document.querySelectorAll('.center-panel button')[2].onclick = resetTimer;
    document.querySelectorAll('.center-panel button')[3].onclick = () => {
        chongScore++;
        checkPointGap();
        updateDisplay();
    };
    document.querySelectorAll('.center-panel button')[4].onclick = () => {
        if (chongScore > 0) chongScore--;
        updateDisplay();
    };

    document.querySelectorAll('.center-panel button')[5].onclick = () => {
        const winner = chongScore > hongScore ? 'chong' : 'hong';
        declareRoundWinner(winner);
    };

    document.querySelectorAll('.center-panel button')[6].onclick = () => {
        resetRound();
        chongRoundsWon = 0;
        hongRoundsWon = 0;
        currentRound = 1;
        matchWinnerDeclared = false;
        updateDisplay();
    };

    document.querySelectorAll('.center-panel button')[7].onclick = () => {
        resetRound();
        updateDisplay();
    };

    updateDisplay();
};
