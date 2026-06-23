// ============================================================
// Games Engine — Gamified Dementia Screening
// ============================================================

let activeGameIndex = 1;
let activeGamePhase = 'intro'; // 'intro' | 'practice' | 'actual'
let gameDifficulty = 'normal';

// Global session logs
let gameSessionData = {
  flowerMemory: { maxSeq: 0, score: 0 },
  whackMole: { maxGrid: '3x3', hits: 0 },
  gardenPath: { nodes: 0, time: '0 seconds' },
  clockDrawing: '',
  stroop: { acc: '0%', rt: '0 seconds' },
  delayedRecall: { correct: 0, distractors: 0 }
};

// Memory targets (Step 4)
const MEMORY_TARGETS = [
  { emoji: '🌸', label: 'FLOWER' },
  { emoji: '🐱', label: 'CAT' },
  { emoji: '🔑', label: 'KEY' },
  { emoji: '⛵', label: 'BOAT' },
  { emoji: '🏡', label: 'HOUSE' }
];
const DISTRACTORS = [
  { emoji: '🍎', label: 'APPLE' },
  { emoji: '⏰', label: 'CLOCK' },
  { emoji: '🚲', label: 'BICYCLE' },
  { emoji: '🌻', label: 'SUNFLOWER' },
  { emoji: '🥕', label: 'CARROT' },
  { emoji: '🐝', label: 'BEE' },
  { emoji: '🌳', label: 'TREE' },
  { emoji: '🎒', label: 'BAG' },
  { emoji: '🐠', label: 'FISH' },
  { emoji: '🍪', label: 'COOKIE' },
  { emoji: '🚗', label: 'CAR' },
  { emoji: '👟', label: 'SHOE' }
];

// ── Global timer/interval tracking ───────────────────────────
let activeGameTimeouts = [];
let activeGameIntervals = [];

function clearAllGameLoops() {
  activeGameTimeouts.forEach(t => clearTimeout(t));
  activeGameIntervals.forEach(i => clearInterval(i));
  activeGameTimeouts = [];
  activeGameIntervals = [];
}

// ── Input throttle (prevents rapid-fire clicks) ───────────────
let _inputLocked = false;
function throttledAction(fn, delayMs = 500) {
  if (_inputLocked) return;
  _inputLocked = true;
  fn();
  const t = setTimeout(() => { _inputLocked = false; }, delayMs);
  activeGameTimeouts.push(t);
}

// ── Init ──────────────────────────────────────────────────────
function initGamesFlow() {
  activeGameIndex = 1;
  activeGamePhase = 'intro';
  gameDifficulty = 'normal';
  loadGameScreen();
}

// Skip practice guide and jump straight to actual game
function skipToActualGame() {
  activeGamePhase = 'actual';
  loadGameScreen();
}

function loadGameScreen() {
  clearAllGameLoops();
  _inputLocked = false;

  // Hide all game elements
  ['game1Wrapper', 'game1FlowerGrid', 'game2MoleGrid', 'game3TrailGrid', 'game4ClockWrapper',
    'game5StroopWrapper', 'game6RecallGrid'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('d-none');
    });
  const npb = document.getElementById('nextPhaseBtn');
  const pc = document.getElementById('practiceCursor');
  const sh = document.getElementById('game3SequenceHeader');
  if (npb) npb.classList.add('d-none');
  if (pc) pc.classList.add('d-none');
  if (sh) sh.classList.add('d-none');

  // Clean up mole landscape scene
  const gc = document.getElementById('gameContainer');
  if (gc) gc.classList.remove('mole-scene');
  const mls = document.getElementById('moleLandscape');
  if (mls) mls.remove();

  // Progress bar
  const fill = document.getElementById('progressBarFill');
  const txt = document.getElementById('progressText');
  if (fill) fill.style.width = `${(activeGameIndex / 6) * 100}%`;
  if (txt) txt.innerText = `Game ${activeGameIndex} of 6`;

  const titleEl = document.getElementById('gameTitle');
  const introTitleEl = document.getElementById('gameIntroTitle');
  const descEl = document.getElementById('gameDescription');
  const goalTitle = document.getElementById('gameGoalTitle');

  if (activeGamePhase === 'intro') {
    document.getElementById('gameIntroPanel').classList.remove('d-none');
    document.getElementById('gamePlayPanel').classList.add('d-none');
    const gth = document.getElementById('gameTitleHeader');
    if (gth) gth.classList.add('d-none');

    const defs = {
      1: { title: 'Game 1: Flower Memory', emoji: '🌸', desc: 'Watch the flowers light up on the tiles and click them back in the exact same order. The sequence gets longer each round.' },
      2: { title: 'Game 2: Whack-a-Mole', emoji: '🐹', desc: 'Moles are eating up Geetha\'s garden fruits — hit them as fast as possible to save the garden! Watch out for bees 🐝.' },
      3: { title: 'Game 3: Garden Path', emoji: '🌿', desc: 'Help Geetha cross the garden path! Connect the numbered and lettered stones in the order shown — alternating numbers and letters.' },
      4: { title: 'Game 4: Clock Drawing', emoji: '🕐', desc: 'Draw a clock face on the canvas and set the hands to the time shown. Use the guide circle if you need it, then hit Submit Clock.' },
      5: { title: 'Game 5: Colour Word Match', emoji: '🎨', desc: 'A colour word appears in a different ink colour. Click the button that matches the INK COLOUR — not what the word says!' },
      6: { title: 'Game 6: Delayed Recall', emoji: '🧠', desc: 'Think back to the 5 items you memorised in Step 4. Select exactly those 5 items from the grid — take your time!' },
    };
    const d = defs[activeGameIndex] || { title: 'Game', emoji: '🌸', desc: '' };

    if (titleEl) titleEl.innerText = d.title;
    if (introTitleEl) introTitleEl.innerText = d.title;
    if (descEl) descEl.innerText = d.desc;
    if (goalTitle) goalTitle.innerText = 'How to play:';

    const emojiEl = document.getElementById('gameIntroEmoji');
    if (emojiEl) emojiEl.textContent = d.emoji;

    // Wire intro buttons
    const spb = document.getElementById('startPracticeBtn');
    const sgb = document.getElementById('skipGuideBtn');
    const pit = document.getElementById('gamePracticeIntroText');

    if (pit) {
      pit.style.display = activeGameIndex === 6 ? 'none' : '';
    }
    if (spb) {
      spb.innerText = 'show demo ▶';
      spb.onclick = () => openDemoOverlay();
    }
    if (sgb) {
      sgb.style.display = '';
      sgb.innerText = 'skip demo ▶';
      sgb.onclick = () => skipToActualGame();
    }

    // Render the thumbnail preview on the small canvas
    if (typeof renderDemoThumb === 'function') renderDemoThumb(activeGameIndex);
  } else {
    document.getElementById('gameIntroPanel').classList.add('d-none');
    document.getElementById('gamePlayPanel').classList.remove('d-none');
    const gth = document.getElementById('gameTitleHeader');
    if (gth) gth.classList.remove('d-none');
    launchGameEngine();
  }
}

function startPracticeMode() {
  activeGamePhase = 'practice';
  loadGameScreen();
}

function transitionFromPracticeToActual() {
  activeGamePhase = 'actual';
  const npb = document.getElementById('nextPhaseBtn');
  if (npb) npb.classList.add('d-none');
  loadGameScreen();
}

let _finishingGame = false;
function finishActiveGame() {
  if (_finishingGame) return;
  _finishingGame = true;
  localStorage.setItem('tempGameResults', JSON.stringify(gameSessionData));

  // Reset finishing flag after 800ms to allow transition to settle
  setTimeout(() => { _finishingGame = false; }, 800);

  const completedIndex = activeGameIndex; // capture before increment
  activeGameIndex++;

  if (activeGameIndex <= 6) {
    // Show a short congratulatory popup before the next game
    showGameCompletePopup(completedIndex, () => {
      activeGamePhase = 'intro';
      loadGameScreen();
    });
  } else {
    currentStep = 10;
    if (typeof updateAssessmentView === 'function') updateAssessmentView();
  }
}

// Short congratulatory popup shown between games
const GAME_CHEERS = [
  'Wonderful! 🌟',
  'You\'re doing great! 🌸',
  'Brilliant! Keep it up! 🎉',
  'Superstar! 🌻',
  'Amazing effort! 🌈',
  'You\'re on a roll! 🏆'
];

function showGameCompletePopup(completedGameIndex, onNext) {
  let overlay = document.getElementById('gameCompleteOverlay');
  if (overlay) overlay.remove(); // always rebuild so cheer is fresh

  overlay = document.createElement('div');
  overlay.id = 'gameCompleteOverlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:950',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(3,0,34,0.50)'
  ].join(';');

  const cheer = GAME_CHEERS[(completedGameIndex - 1) % GAME_CHEERS.length];

  overlay.innerHTML = `
    <div style="background:#FAFCF2;border:3px solid #030022;box-shadow:8px 8px 0 rgba(80,80,100,0.25);
                padding:2rem 2.5rem;max-width:380px;width:90%;text-align:center;animation:popIn .3s cubic-bezier(.36,.07,.19,.97) both;">
      <div style="font-size:2.8rem;margin-bottom:.6rem;">🌻</div>
      <h3 style="font-family:'Lora',Georgia,serif;margin-bottom:.4rem;">${cheer}</h3>
      <p style="font-size:1rem;color:#555;margin-bottom:1.5rem;">Game ${completedGameIndex} done — you're getting closer to the end!</p>
      <button id="gameCompleteNextBtn" class="btn btn-green" style="width:100%;font-size:1rem;">Next Game ➔</button>
    </div>`;

  document.body.appendChild(overlay);

  document.getElementById('gameCompleteNextBtn').onclick = () => {
    overlay.remove();
    if (onNext) onNext();
  };
}

function launchGameEngine() {
  const runners = {
    1: runGame1FlowerMemory,
    2: runGame2WhackMole,
    3: runGame3GardenPath,
    4: runGame4ClockDrawing,
    5: runGame5ColourStroop,
    6: runGame6DelayedRecall
  };
  if (runners[activeGameIndex]) runners[activeGameIndex]();
}

// ============================================================
// GAME 1: FLOWER MEMORY
// ============================================================
// Practice state
let g1PracticePhase = 'demo2_observe';  // 'demo2_observe' | 'demo2_cursor' | 'trial2' | 'demo3_observe' | 'demo3_cursor' | 'trial3'
let g1PracticeTrialCount = 0;   // trials completed in current phase
let g1PracticePassCount = 0;    // passes in current phase
let g1ClickLocked = false;      // true during playback or post-error gap

// Main game state
let g1Sequence = [];
let g1UserSequence = [];
let g1BlinkSpeed = 500;  // flash duration in ms (tile stays lit for this long)
let g1SequenceLength = 2;
let g1CurrentScore = 0;
let g1IsPlayback = false;
// Per-length trial tracking
let g1TrialsAtLength = 0;   // attempts at current length (max 2)
let g1PassesAtLength = 0;   // passes at current length
let g1MainGameTryIndex = 0; // 0 = first try, 1 = second try at current length

// Predefined sequences for the main game.
// Internally tiles are 0-indexed (data-id 0-8); user labels them 1-9.
// Each length has exactly 2 sequences: [tryA, tryB].
const MAIN_GAME_SEQUENCES = {
  2: [[3, 6], [1, 8]],
  3: [[8, 2, 3], [5, 2, 6]],
  4: [[0, 4, 1, 7], [6, 3, 2, 8]],
  5: [[2, 0, 7, 5, 4], [8, 2, 0, 3, 6]],
  6: [[1, 7, 2, 4, 5, 3], [4, 2, 0, 1, 7, 8]],
  7: [[6, 2, 1, 8, 0, 7, 5], [3, 2, 6, 5, 1, 4, 8]],
  8: [[0, 8, 5, 2, 4, 3, 1, 7], [1, 8, 3, 5, 0, 6, 2, 4]],
  9: [[4, 2, 7, 6, 0, 1, 3, 5, 8], [3, 1, 5, 7, 0, 6, 8, 2, 4]],
  10: [[8, 7, 4, 1, 2, 0, 5, 6, 3, 2], [0, 7, 1, 3, 5, 6, 0, 2, 8, 4]],
  11: [[4, 1, 7, 2, 0, 6, 5, 8, 3, 6, 7], [3, 1, 6, 0, 4, 5, 7, 2, 8, 3, 2]]
};

function runGame1FlowerMemory() {
  const wrapper = document.getElementById('game1Wrapper');
  if (wrapper) wrapper.classList.remove('d-none');
  document.getElementById('game1FlowerGrid').classList.remove('d-none');

  g1UserSequence = [];
  g1CurrentScore = 0;
  g1IsPlayback = false;
  g1ClickLocked = false;
  setStartCircleLit(false);

  const indicator = document.getElementById('game1StatusIndicator');
  if (indicator) indicator.classList.remove('d-none');

  if (activeGamePhase === 'practice') {
    startDemo2Observe();
  } else {
    // Main game: start at length 2, 2 trials per length
    g1SequenceLength = 2;
    g1TrialsAtLength = 0;
    g1PassesAtLength = 0;
    g1MainGameTryIndex = 0;
    g1BlinkSpeed = 500;
    generateNewSequence();
    playFlowerSequence();
  }
}

function generateNewSequence() {
  if (activeGamePhase === 'actual') {
    // Use predefined sequence for this length + try index
    const seqs = MAIN_GAME_SEQUENCES[g1SequenceLength];
    if (seqs) {
      g1Sequence = seqs[g1MainGameTryIndex % 2].slice();
    } else {
      // Fallback for lengths beyond defined (shouldn't happen in normal play)
      g1Sequence = Array.from({ length: g1SequenceLength }, () => Math.floor(Math.random() * 9));
    }
  } else {
    // Practice uses random sequences
    g1Sequence = Array.from({ length: g1SequenceLength }, () => Math.floor(Math.random() * 9));
  }
}

function setStartCircleLit(isLit) {
  const circle = document.getElementById('game1StartCircle');
  if (circle) {
    if (isLit) {
      circle.classList.add('lit');
    } else {
      circle.classList.remove('lit');
    }
  }
}

function playObserveSequence(sequence, statusText, callback) {
  g1IsPlayback = true;
  g1ClickLocked = true;
  g1UserSequence = [];
  setStartCircleLit(false);

  const indicator = document.getElementById('game1StatusIndicator');
  if (indicator) {
    indicator.innerText = statusText;
    indicator.style.color = '#CB448D';
  }

  let i = 0;
  const interval = setInterval(() => {
    if (i >= sequence.length) {
      clearInterval(interval);
      const t = setTimeout(() => {
        g1IsPlayback = false;
        if (callback) callback();
      }, 1000);
      activeGameTimeouts.push(t);
      return;
    }
    flashFlower(sequence[i++]);
  }, 1000); // IOI = 1000ms (onset-to-onset interval)
  activeGameIntervals.push(interval);
}

function playFlowerSequence() {
  g1IsPlayback = true;
  g1ClickLocked = true;
  g1UserSequence = [];
  setStartCircleLit(false);

  const indicator = document.getElementById('game1StatusIndicator');
  if (indicator) {
    indicator.innerText = 'Watch!';
    indicator.style.color = '#CB448D';
  }

  let i = 0;
  const interval = setInterval(() => {
    if (i >= g1Sequence.length) {
      clearInterval(interval);
      // Small gap then unlock for player
      const t = setTimeout(() => {
        g1IsPlayback = false;
        g1ClickLocked = false;
        setStartCircleLit(true);
        if (indicator) {
          indicator.innerText = 'Your turn!';
          indicator.style.color = '#CB448D';
        }
      }, 400);
      activeGameTimeouts.push(t);
      return;
    }
    flashFlower(g1Sequence[i++]);
  }, 1000); // IOI = 1000ms (onset-to-onset interval)
  activeGameIntervals.push(interval);
}

function flashFlower(id) {
  const btn = document.querySelector(`.flower-btn[data-id="${id}"]`);
  if (!btn) return;
  btn.classList.add('lit');
  btn.innerText = '\uD83C\uDF3B';
  if (window.GardenAudio) window.GardenAudio.playPop();
  const t = setTimeout(() => {
    btn.classList.remove('lit');
    btn.innerText = '';
  }, g1BlinkSpeed);
  activeGameTimeouts.push(t);
}

function handleFlowerClick(id) {
  // Block clicks during playback or post-error gap
  if (g1IsPlayback || g1ClickLocked) return;

  const btn = document.querySelector(`.flower-btn[data-id="${id}"]`);
  if (btn) {
    btn.classList.add('active');
    btn.innerText = '\uD83C\uDF3B';
    setTimeout(() => {
      btn.classList.remove('active');
      btn.innerText = '';
    }, 200);
  }

  g1UserSequence.push(id);

  // Wait until the user has tapped all tiles before evaluating
  if (g1UserSequence.length < g1Sequence.length) return;

  // Full sequence entered — evaluate now
  const isCorrect = g1UserSequence.every((val, i) => val === g1Sequence[i]);
  g1ClickLocked = true;
  setStartCircleLit(false);
  g1UserSequence = [];

  const indicator = document.getElementById('game1StatusIndicator');

  if (isCorrect) {
    if (window.GardenAudio) window.GardenAudio.playSuccess();
    if (indicator) {
      indicator.innerText = 'Great job!';
      indicator.style.color = '#34BB72';
      indicator.classList.remove('indicator-pop');
      // Force reflow so animation retriggers each time
      void indicator.offsetWidth;
      indicator.classList.add('indicator-pop');
    }
    if (activeGamePhase === 'practice') {
      handlePracticePass();
    } else {
      handleMainGamePass();
    }
  } else {
    if (window.GardenAudio) window.GardenAudio.playError();
    if (indicator) {
      indicator.innerText = 'Uh oh! Let\'s try another time';
      indicator.style.color = '#CB448D';
    }
    if (activeGamePhase === 'practice') {
      handlePracticeFail();
    } else {
      handleMainGameFail();
    }
  }
}

// ── Practice helpers ─────────────────────────────────────────

function startDemo2Observe() {
  g1PracticePhase = 'demo2_observe';
  g1PracticeTrialCount = 0;
  g1PracticePassCount = 0;
  g1BlinkSpeed = 1000;
  g1Sequence = [1, 4];
  playObserveSequence(g1Sequence, 'Watch!', () => startDemo2Cursor());
}

function startDemo2Cursor() {
  g1PracticePhase = 'demo2_cursor';

  const indicator = document.getElementById('game1StatusIndicator');
  if (indicator) {
    indicator.innerText = 'Start after the blue lights up!';
    indicator.style.color = '#CB448D';
  }

  // Wait 1.5 seconds, then light up circle
  const t1 = setTimeout(() => {
    setStartCircleLit(true);

    // Wait 800ms, then show cursor and animate clicks
    const t2 = setTimeout(() => {
      const cursor = document.getElementById('practiceCursor');
      if (cursor) {
        cursor.classList.remove('d-none');
        cursor.style.top = '50%';
        cursor.style.left = '50%';
      }

      animateCursorClicks([1, 4], () => {
        if (cursor) cursor.classList.add('d-none');
        setStartCircleLit(false);
        const t3 = setTimeout(() => {
          startTrial2();
        }, 1200);
        activeGameTimeouts.push(t3);
      });
    }, 800);
    activeGameTimeouts.push(t2);
  }, 1500);
  activeGameTimeouts.push(t1);
}

function startTrial2() {
  g1PracticePhase = 'trial2';
  g1PracticeTrialCount = 0;
  g1PracticePassCount = 0;
  nextTrial2();
}

function nextTrial2() {
  g1UserSequence = [];
  g1ClickLocked = true;
  setStartCircleLit(false);
  g1Sequence = generatePractice2Seq();

  playObserveSequence(g1Sequence, 'Watch!', () => {
    setStartCircleLit(true);
    g1ClickLocked = false;
    g1IsPlayback = false;
    const indicator = document.getElementById('game1StatusIndicator');
    if (indicator) {
      indicator.innerText = 'Your turn!';
      indicator.style.color = '#CB448D';
    }
  });
}

function startDemo3Observe() {
  g1PracticePhase = 'demo3_observe';
  g1PracticeTrialCount = 0;
  g1PracticePassCount = 0;
  g1BlinkSpeed = 1000;
  g1Sequence = [2, 5, 7];
  playObserveSequence(g1Sequence, 'Watch!', () => startDemo3Cursor());
}

function startDemo3Cursor() {
  g1PracticePhase = 'demo3_cursor';

  const indicator = document.getElementById('game1StatusIndicator');
  if (indicator) {
    indicator.innerText = 'Start after the blue lights up!';
    indicator.style.color = '#CB448D';
  }

  // Wait 1.5 seconds, then light up circle
  const t1 = setTimeout(() => {
    setStartCircleLit(true);

    // Wait 800ms, then show cursor and animate clicks
    const t2 = setTimeout(() => {
      const cursor = document.getElementById('practiceCursor');
      if (cursor) {
        cursor.classList.remove('d-none');
        cursor.style.top = '50%';
        cursor.style.left = '50%';
      }

      animateCursorClicks([2, 5, 7], () => {
        if (cursor) cursor.classList.add('d-none');
        setStartCircleLit(false);
        const t3 = setTimeout(() => {
          startTrial3();
        }, 1200);
        activeGameTimeouts.push(t3);
      });
    }, 800);
    activeGameTimeouts.push(t2);
  }, 1500);
  activeGameTimeouts.push(t1);
}

function startTrial3() {
  g1PracticePhase = 'trial3';
  g1PracticeTrialCount = 0;
  g1PracticePassCount = 0;
  nextTrial3();
}

function nextTrial3() {
  g1UserSequence = [];
  g1ClickLocked = true;
  setStartCircleLit(false);
  g1Sequence = generatePractice3Seq();

  playObserveSequence(g1Sequence, 'Watch!', () => {
    setStartCircleLit(true);
    g1ClickLocked = false;
    g1IsPlayback = false;
    const indicator = document.getElementById('game1StatusIndicator');
    if (indicator) {
      indicator.innerText = 'Your turn!';
      indicator.style.color = '#CB448D';
    }
  });
}

function animateCursorClicks(sequence, callback) {
  const cursor = document.getElementById('practiceCursor');
  if (!cursor) {
    if (callback) callback();
    return;
  }

  let step = 0;
  function clickNext() {
    if (step >= sequence.length) {
      if (callback) callback();
      return;
    }

    const targetId = sequence[step];
    const btn = document.querySelector(`.flower-btn[data-id="${targetId}"]`);
    if (!btn) {
      step++;
      clickNext();
      return;
    }

    const rect = btn.getBoundingClientRect();
    const parent = document.getElementById('gameContainer').getBoundingClientRect();
    cursor.style.top = `${rect.top - parent.top + rect.height / 2}px`;
    cursor.style.left = `${rect.left - parent.left + rect.width / 2}px`;

    const tMove = setTimeout(() => {
      btn.classList.add('active');
      btn.innerText = '\uD83C\uDF3B';
      if (window.GardenAudio) window.GardenAudio.playPop();

      const tHold = setTimeout(() => {
        btn.classList.remove('active');
        btn.innerText = '';
        step++;
        const tNext = setTimeout(clickNext, 400);
        activeGameTimeouts.push(tNext);
      }, 250);
      activeGameTimeouts.push(tHold);
    }, 800);
    activeGameTimeouts.push(tMove);
  }

  clickNext();
}

function handlePracticePass() {
  g1PracticePassCount++;
  g1PracticeTrialCount++;

  if (g1PracticePhase === 'trial2') {
    // Passed 2-tile trial, proceed immediately to 3-tile observe
    const t = setTimeout(() => startDemo3Observe(), 1000);
    activeGameTimeouts.push(t);
  } else if (g1PracticePhase === 'trial3') {
    // Passed 3-tile trial, enable proceed to main game
    document.getElementById('nextPhaseBtn').classList.remove('d-none');
  }
}

function handlePracticeFail() {
  g1PracticeTrialCount++;

  if (g1PracticePhase === 'trial2') {
    if (g1PracticeTrialCount >= 3) {
      if (g1PracticePassCount >= 1) {
        const t = setTimeout(() => startDemo3Observe(), 1200);
        activeGameTimeouts.push(t);
      } else {
        const t = setTimeout(() => showPracticeFailPopup(), 600);
        activeGameTimeouts.push(t);
      }
    } else {
      const t = setTimeout(() => nextTrial2(), 1500);
      activeGameTimeouts.push(t);
    }
  } else if (g1PracticePhase === 'trial3') {
    if (g1PracticeTrialCount >= 3) {
      if (g1PracticePassCount >= 1) {
        document.getElementById('nextPhaseBtn').classList.remove('d-none');
      } else {
        const t = setTimeout(() => showPracticeFailPopup(), 600);
        activeGameTimeouts.push(t);
      }
    } else {
      const t = setTimeout(() => nextTrial3(), 1500);
      activeGameTimeouts.push(t);
    }
  }
}

function generatePractice2Seq() {
  return [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)];
}

function generatePractice3Seq() {
  return [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)];
}

function showPracticeFailPopup() {
  clearAllGameLoops();
  // Show a styled in-game notification instead of a browser confirm dialog
  let overlay = document.getElementById('practiceFailOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'practiceFailOverlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:900',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(3,0,34,0.55)'
    ].join(';');
    overlay.innerHTML = `
      <div style="background:#FAFCF2;border:3.05px solid #030022;box-shadow:8px 8px 0 rgba(80,80,100,0.28);padding:2rem 2.5rem;max-width:400px;width:90%;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:.75rem;">🌸</div>
        <h3 style="font-family:'Lora',Georgia,serif;margin-bottom:.6rem;">Almost there!</h3>
        <p style="margin-bottom:1.5rem;font-size:1.05rem;">Please read the instructions again and give it another try.</p>
        <button id="practiceFailRetryBtn" class="btn btn-blue" style="width:100%;font-size:1rem;">Try Again ➔</button>
      </div>`;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
  document.getElementById('practiceFailRetryBtn').onclick = () => {
    overlay.style.display = 'none';
    activeGamePhase = 'intro';
    loadGameScreen();
  };
}

// ── Main game helpers ─────────────────────────────────────────
// Rules:
//  3. First try correct          → advance to next length immediately
//  4. First try wrong, 2nd right → advance to next length
//  5. Both wrong                 → end game
function handleMainGamePass() {
  g1CurrentScore += 10 * g1SequenceLength;

  // Any correct answer → advance length immediately (rules 3 & 4)
  g1SequenceLength++;
  g1TrialsAtLength = 0;
  g1PassesAtLength = 0;
  g1MainGameTryIndex = 0; // reset to first predefined sequence for new length

  const t = setTimeout(() => {
    g1ClickLocked = false;
    generateNewSequence();
    playFlowerSequence();
  }, 1500);
  activeGameTimeouts.push(t);
}

function handleMainGameFail() {
  g1TrialsAtLength++;
  g1MainGameTryIndex++; // move to the second predefined sequence for retry

  if (g1TrialsAtLength >= 2) {
    // Used both tries and neither was correct → end game (rule 5)
    gameSessionData.flowerMemory = { maxSeq: Math.max(g1SequenceLength - 1, 0), score: g1CurrentScore };
    const indicator = document.getElementById('game1StatusIndicator');
    if (indicator) indicator.classList.add('d-none');
    setStartCircleLit(false);
    const t = setTimeout(finishActiveGame, 1500);
    activeGameTimeouts.push(t);
  } else {
    // First try failed → give second try with the alternate predefined sequence
    const t = setTimeout(() => {
      g1ClickLocked = false;
      generateNewSequence();
      playFlowerSequence();
    }, 1500);
    activeGameTimeouts.push(t);
  }
}

// ============================================================
// GAME 2: WHACK-A-MOLE
// ============================================================
let g2GridSize = 3;
let g2MoleUpDur = 1200;
let g2MoleIntMs = 1800;
let g2MolesShown = 0;
let g2MaxMoles = 10;
let g2Hits = 0;
let g2ActiveHoleIdx = -1;

function runGame2WhackMole() {
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.classList.add('mole-scene');

  // Remove old landscape if any
  const oldLnd = document.getElementById('moleLandscape');
  if (oldLnd) oldLnd.remove();

  g2Hits = 0; g2MolesShown = 0; g2ActiveHoleIdx = -1;

  if (activeGamePhase === 'practice') {
    g2GridSize = 2; g2MoleUpDur = 1800; g2MoleIntMs = 2400; g2MaxMoles = 4;
  } else {
    if (gameDifficulty === 'easy') { g2GridSize = 2; g2MoleUpDur = 1800; g2MoleIntMs = 2500; }
    else if (gameDifficulty === 'hard') { g2GridSize = 4; g2MoleUpDur = 750; g2MoleIntMs = 1100; }
    else { g2GridSize = 3; g2MoleUpDur = 1200; g2MoleIntMs = 1800; }
    g2MaxMoles = 10;
  }

  // Create new garden landscape element (borderless, fills the available space)
  const landscape = document.createElement('div');
  landscape.id = 'moleLandscape';
  landscape.className = 'mole-landscape';

  // Add decorative stepping stones to landscape
  const stones = [
    { left: '38%', top: '25%' },
    { left: '42%', top: '55%' },
    { left: '70%', top: '40%' }
  ];
  stones.forEach(st => {
    const stone = document.createElement('div');
    stone.className = 'stepping-stone';
    stone.style.left = st.left;
    stone.style.top = st.top;
    landscape.appendChild(stone);
  });

  // Coordinates mapping for organic layout
  const coordMap = {
    2: [
      { left: '15%', top: '20%' },
      { left: '70%', top: '15%' },
      { left: '25%', top: '70%' },
      { left: '75%', top: '65%' }
    ],
    3: [
      { left: '15%', top: '15%' },
      { left: '50%', top: '10%' },
      { left: '82%', top: '20%' },
      { left: '22%', top: '48%' },
      { left: '52%', top: '42%' },
      { left: '80%', top: '52%' },
      { left: '12%', top: '78%' },
      { left: '48%', top: '75%' },
      { left: '84%', top: '82%' }
    ],
    4: [
      { left: '8%', top: '10%' },
      { left: '33%', top: '8%' },
      { left: '60%', top: '12%' },
      { left: '86%', top: '15%' },
      { left: '15%', top: '35%' },
      { left: '40%', top: '32%' },
      { left: '68%', top: '38%' },
      { left: '90%', top: '40%' },
      { left: '10%', top: '62%' },
      { left: '35%', top: '58%' },
      { left: '62%', top: '65%' },
      { left: '84%', top: '68%' },
      { left: '18%', top: '86%' },
      { left: '45%', top: '84%' },
      { left: '72%', top: '88%' },
      { left: '92%', top: '85%' }
    ]
  };

  const coords = coordMap[g2GridSize] || coordMap[3];
  const holeDecors = ['🌱', '🌸', '🍄', '🌿', '🌻', '🍀', '🌱', '🌸', '🍄', '🌿', '🌻', '🍀', '🌱', '🌸', '🍄', '🌿'];

  for (let i = 0; i < coords.length; i++) {
    const hole = document.createElement('div');
    hole.className = 'mole-hole-organic';
    hole.setAttribute('data-index', i);
    hole.style.left = coords[i].left;
    hole.style.top = coords[i].top;

    const rim = document.createElement('div');
    rim.className = 'soil-rim';

    const pit = document.createElement('div');
    pit.className = 'soil-pit';

    const mole = document.createElement('div');
    mole.className = 'mole-element-organic';
    mole.innerText = '🐹';

    const decor = document.createElement('div');
    decor.className = 'hole-decor';
    decor.innerText = holeDecors[i % holeDecors.length];

    hole.appendChild(rim);
    hole.appendChild(pit);
    hole.appendChild(mole);
    hole.appendChild(decor);

    // Click handler with throttle
    hole.onclick = (() => { const idx = i; return () => throttledAction(() => whackMole(idx), 300); })();
    landscape.appendChild(hole);
  }

  gameContainer.appendChild(landscape);

  if (activeGamePhase === 'practice') runMolePracticeLoop();
  else runMoleActualLoop();
}

function runMoleActualLoop() {
  const interval = setInterval(() => {
    hideAllMoles();
    if (g2MolesShown >= g2MaxMoles) {
      clearInterval(interval);
      gameSessionData.whackMole = { maxGrid: `${g2GridSize}x${g2GridSize}`, hits: g2Hits };
      if (g2Hits <= 3) gameDifficulty = 'easy';
      else if (g2Hits >= 8) gameDifficulty = 'hard';
      setTimeout(finishActiveGame, 1500);
      return;
    }
    showRandomMole();
  }, g2MoleIntMs);
  activeGameIntervals.push(interval);
}

function showRandomMole() {
  const landscape = document.getElementById('moleLandscape');
  const holes = landscape?.querySelectorAll('.mole-hole-organic');
  if (!holes || !holes.length) return;
  let idx;
  do { idx = Math.floor(Math.random() * holes.length); } while (idx === g2ActiveHoleIdx && holes.length > 1);
  g2ActiveHoleIdx = idx;
  const mole = holes[idx].querySelector('.mole-element-organic');
  if (!mole) return;
  mole.classList.remove('hit');

  // 25% chance to spawn a bee distractor
  const isDistractor = (Math.random() < 0.25);
  mole.innerText = isDistractor ? '🐝' : '🐹';
  mole.dataset.isDistractor = isDistractor ? 'true' : 'false';

  mole.classList.add('up');
  g2MolesShown++;
  const t = setTimeout(() => mole.classList.remove('up'), g2MoleUpDur);
  activeGameTimeouts.push(t);
}

function hideAllMoles() {
  document.querySelectorAll('.mole-element-organic').forEach(m => m.classList.remove('up'));
}

function whackMole(index) {
  if (index !== g2ActiveHoleIdx) return;
  const landscape = document.getElementById('moleLandscape');
  const hole = landscape?.querySelector(`.mole-hole-organic[data-index="${index}"]`);
  const mole = hole?.querySelector('.mole-element-organic');
  if (!mole || !mole.classList.contains('up') || mole.classList.contains('hit')) return;

  mole.classList.add('hit');
  const isDistractor = (mole.dataset.isDistractor === 'true');

  if (isDistractor) {
    mole.innerText = '🚫';
    if (window.GardenAudio) window.GardenAudio.playError();
    if (hole) {
      hole.classList.add('shake');
      setTimeout(() => hole.classList.remove('shake'), 400);
    }
    g2Hits = Math.max(0, g2Hits - 1);
  } else {
    mole.innerText = '💥';
    if (window.GardenAudio) window.GardenAudio.playSuccess();
    g2Hits++;
  }

  if (activeGamePhase === 'practice' && g2Hits >= 2) {
    document.getElementById('nextPhaseBtn').classList.remove('d-none');
  }
}

function runMolePracticeLoop() {
  const cursor = document.getElementById('practiceCursor');
  if (cursor) cursor.classList.remove('d-none');
  let round = 0;
  const interval = setInterval(() => {
    hideAllMoles();
    if (round >= 3) { clearInterval(interval); if (cursor) cursor.classList.add('d-none'); return; }
    g2ActiveHoleIdx = round;
    const landscape = document.getElementById('moleLandscape');
    const holes = landscape?.querySelectorAll('.mole-hole-organic');
    if (!holes || !holes[g2ActiveHoleIdx]) return;
    const mole = holes[g2ActiveHoleIdx].querySelector('.mole-element-organic');
    if (!mole) return;
    mole.classList.remove('hit');
    mole.innerText = '🐹';
    mole.dataset.isDistractor = 'false';
    mole.classList.add('up');
    g2MolesShown++;

    // Calculate cursor movement position relative to game container
    const rect = holes[g2ActiveHoleIdx].getBoundingClientRect();
    const parent = document.getElementById('gameContainer').getBoundingClientRect();
    if (cursor) {
      cursor.style.top = `${rect.top - parent.top + rect.height / 2}px`;
      cursor.style.left = `${rect.left - parent.left + rect.width / 2}px`;
    }

    const tw = setTimeout(() => whackMole(g2ActiveHoleIdx), 900);
    const th = setTimeout(() => mole.classList.remove('up'), g2MoleUpDur);
    activeGameTimeouts.push(tw, th);
    round++;
  }, g2MoleIntMs);
  activeGameIntervals.push(interval);
}

// ============================================================
// GAME 3: GARDEN PATH (Trail Making)
// ============================================================
let g3Nodes = [];
let g3CurrentTargetIdx = 0;
let g3StartTime = null;

function runGame3GardenPath() {
  const grid = document.getElementById('game3TrailGrid');
  grid.classList.remove('d-none');
  document.getElementById('game3NodesWrapper').innerHTML = '';
  document.getElementById('game3SvgLines').innerHTML = '';

  let targetSeq = ['1', 'A', '2', 'B'];
  if (activeGamePhase === 'actual') {
    if (gameDifficulty === 'hard') targetSeq = ['1', 'A', '2', 'B', '3', 'C', '4', 'D'];
    else if (gameDifficulty === 'normal') targetSeq = ['1', 'A', '2', 'B', '3', 'C'];
  }

  g3CurrentTargetIdx = 0;
  g3Nodes = [];

  const seqHeader = document.getElementById('game3SequenceHeader');
  if (seqHeader) {
    seqHeader.classList.remove('d-none');
    document.getElementById('game3SequenceText').innerText = targetSeq.join(' ➔ ');
  }

  // Lay out nodes with minimum distance
  const gridEl = document.getElementById('game3TrailGrid');
  // Use offsetWidth/Height after a short tick so layout is ready
  const W = gridEl.offsetWidth || 480;
  const H = gridEl.offsetHeight || 370;
  const minDist = 80;

  targetSeq.forEach((label, idx) => {
    let x, y, tries = 0, valid = false;
    while (!valid && tries < 300) {
      x = Math.floor(Math.random() * (W - 100)) + 50;
      y = Math.floor(Math.random() * (H - 100)) + 50;
      valid = g3Nodes.every(n => Math.hypot(n.x - x, n.y - y) >= minDist);
      tries++;
    }
    g3Nodes.push({ label, x, y, index: idx });
  });

  // Render
  const wrapper = document.getElementById('game3NodesWrapper');
  g3Nodes.forEach(node => {
    const div = document.createElement('div');
    div.className = 'trail-node';
    div.innerText = node.label;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    div.id = `trail-node-${node.index}`;
    div.onclick = () => throttledAction(() => handleTrailNodeClick(node.index), 350);
    wrapper.appendChild(div);
  });

  highlightActiveTrailNode();
  g3StartTime = new Date();

  if (activeGamePhase === 'practice') runTrailPracticeDemo();
}

function highlightActiveTrailNode() {
  document.querySelectorAll('.trail-node').forEach(n => n.classList.remove('active-target'));
  // Practice: soft orange pulse on next target
  if (activeGamePhase === 'practice') {
    const t = document.getElementById(`trail-node-${g3CurrentTargetIdx}`);
    if (t) t.classList.add('active-target');
  }
  // Actual mode: no highlight — player reads sequence text above
}

function handleTrailNodeClick(index) {
  if (index !== g3CurrentTargetIdx) {
    if (window.GardenAudio) window.GardenAudio.playError();
    const nodeEl = document.getElementById(`trail-node-${index}`);
    if (nodeEl) {
      nodeEl.classList.add('shake');
      setTimeout(() => nodeEl.classList.remove('shake'), 400);
    }
    return;
  }
  const nodeEl = document.getElementById(`trail-node-${index}`);
  nodeEl.classList.remove('active-target');
  nodeEl.classList.add('completed');
  if (index > 0) drawTrailLine(g3Nodes[index - 1], g3Nodes[index]);
  g3CurrentTargetIdx++;

  if (g3CurrentTargetIdx < g3Nodes.length) {
    if (window.GardenAudio) window.GardenAudio.playPop();
    highlightActiveTrailNode();
  } else {
    if (window.GardenAudio) window.GardenAudio.playSuccess();
    const timeSpent = Math.round((new Date() - g3StartTime) / 1000);
    if (activeGamePhase === 'practice') {
      document.getElementById('nextPhaseBtn').classList.remove('d-none');
    } else {
      gameSessionData.gardenPath = { nodes: g3Nodes.length, time: `${timeSpent} seconds` };
      if (timeSpent > 30) gameDifficulty = 'easy';
      else if (timeSpent < 15) gameDifficulty = 'hard';
      setTimeout(finishActiveGame, 1500);
    }
  }
}

function drawTrailLine(nodeA, nodeB) {
  const svg = document.getElementById('game3SvgLines');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', nodeA.x); line.setAttribute('y1', nodeA.y);
  line.setAttribute('x2', nodeB.x); line.setAttribute('y2', nodeB.y);
  line.setAttribute('stroke', '#030022');
  line.setAttribute('stroke-width', '3');
  svg.appendChild(line);
}

function runTrailPracticeDemo() {
  const cursor = document.getElementById('practiceCursor');
  cursor.classList.remove('d-none');
  let step = 0;
  const interval = setInterval(() => {
    if (step >= g3Nodes.length) {
      clearInterval(interval);
      cursor.classList.add('d-none');
      // Reset for player's turn
      g3CurrentTargetIdx = 0;
      document.getElementById('game3SvgLines').innerHTML = '';
      document.querySelectorAll('.trail-node').forEach(n => { n.className = 'trail-node'; });
      highlightActiveTrailNode();
      return;
    }
    const node = g3Nodes[step];
    const gridEl = document.getElementById('game3TrailGrid');
    const gRect = gridEl.getBoundingClientRect();

    // Use the stored x/y which are already relative to the grid container
    cursor.style.left = `${node.x}px`;
    cursor.style.top = `${node.y}px`;

    setTimeout(() => handleTrailNodeClick(step), 400);
    step++;
  }, 1400);
  activeGameIntervals.push(interval);
}

// ============================================================
// GAME 4: CLOCK DRAWING
// ============================================================
let canvas = null, ctx = null, drawing = false;
let strokesHistory = [], currentStroke = [];
let canvasGuidesEnabled = false;

// Clock times library — format HH:MM
const clockTimes = ['11:10', '03:00', '09:15', '06:30', '02:25', '07:35', '10:50', '04:20'];

function runGame4ClockDrawing() {
  document.getElementById('game4ClockWrapper').classList.remove('d-none');

  // Show random time in HH:MM format
  const timeStr = clockTimes[Math.floor(Math.random() * clockTimes.length)];
  const clockDisplay = document.getElementById('clockTimeDisplay');
  if (clockDisplay) clockDisplay.innerText = `Set hands to: ${timeStr}`;

  canvas = document.getElementById('clockDrawingCanvas');
  ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokesHistory = [];

  canvasGuidesEnabled = (gameDifficulty === 'easy');
  drawCanvasGuidelines();

  canvas.onmousedown = startDrawing;
  canvas.onmousemove = draw;
  canvas.onmouseup = stopDrawing;
  canvas.onmouseleave = stopDrawing;

  canvas.ontouchstart = e => { e.preventDefault(); const t = e.touches[0]; canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY })); };
  canvas.ontouchmove = e => { e.preventDefault(); const t = e.touches[0]; canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY })); };
  canvas.ontouchend = e => { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mouseup', {})); };
}

function drawCanvasGuidelines() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (canvasGuidesEnabled) {
    ctx.save();
    ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 140, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 4, 0, Math.PI * 2); ctx.fillStyle = '#CCCCCC'; ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = '#030022'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  strokesHistory.forEach(stroke => {
    if (!stroke.length) return;
    ctx.beginPath(); ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  });
  ctx.restore();
}

function toggleCanvasGuides() { canvasGuidesEnabled = !canvasGuidesEnabled; drawCanvasGuidelines(); }

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDrawing(e) {
  drawing = true; currentStroke = [];
  const c = getCanvasCoords(e); currentStroke.push(c);
  ctx.save(); ctx.strokeStyle = '#030022'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.restore();
}

function draw(e) {
  if (!drawing) return;
  const c = getCanvasCoords(e); currentStroke.push(c);
  if (currentStroke.length < 2) return;
  ctx.save(); ctx.strokeStyle = '#030022'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const prev = currentStroke[currentStroke.length - 2];
  ctx.moveTo(prev.x, prev.y); ctx.lineTo(c.x, c.y); ctx.stroke();
  ctx.restore();
}

function stopDrawing() {
  if (drawing) { drawing = false; if (currentStroke.length) strokesHistory.push(currentStroke); }
  if (activeGamePhase === 'practice' && strokesHistory.length >= 1) {
    document.getElementById('nextPhaseBtn').classList.remove('d-none');
  }
}

function undoCanvas() { strokesHistory.pop(); drawCanvasGuidelines(); if (window.GardenAudio) window.GardenAudio.playPop(); }
function resetCanvas() { strokesHistory = []; drawCanvasGuidelines(); if (window.GardenAudio) window.GardenAudio.playPop(); }

function submitClockCanvas() {
  const dataURL = canvas.toDataURL('image/png');
  gameSessionData.clockDrawing = dataURL;
  if (window.GardenAudio) window.GardenAudio.playSuccess();
  setTimeout(finishActiveGame, 800);
}

// ============================================================
// GAME 5: COLOUR STROOP
// ============================================================
const g5WordColors = [
  { name: 'RED', color: '#BB3434' },
  { name: 'BLUE', color: '#0055FF' },
  { name: 'GREEN', color: '#34BB72' },
  { name: 'PINK', color: '#CB448D' }
];
let g5TrialIndex = 0, g5MaxTrials = 8;
let g5CorrectAnswers = 0, g5ReactionTimes = [];
let g5StartTime = null, g5TimerTimeout = null;
let g5TimerLimit = 3000;
let g5AwaitingAnswer = false; // prevent auto-skip

function runGame5ColourStroop() {
  document.getElementById('game5StroopWrapper').classList.remove('d-none');
  g5TrialIndex = 0; g5CorrectAnswers = 0; g5ReactionTimes = []; g5AwaitingAnswer = false;

  if (activeGamePhase === 'practice') {
    g5MaxTrials = 2;
    g5TimerLimit = 5000;
  } else {
    g5MaxTrials = 8;
    g5TimerLimit = gameDifficulty === 'easy' ? 4500 : gameDifficulty === 'hard' ? 2000 : 3000;
  }

  const container = document.getElementById('stroopButtonsContainer');
  container.innerHTML = '';
  const lightColors = {
    '#BB3434': '#FFC4C4',
    '#0055FF': '#B8D3FF',
    '#34BB72': '#B3F0CC',
    '#CB448D': '#F9C8E4'
  };
  g5WordColors.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerText = opt.name;
    btn.style.borderColor = opt.color;
    btn.style.backgroundColor = lightColors[opt.color] || '#ffffff';
    btn.style.color = 'var(--primary-dark)';
    btn.onclick = () => {
      if (!g5AwaitingAnswer) return;
      const correctColor = document.getElementById('stroopWordText').dataset.correctColor;
      throttledAction(() => submitStroopAnswer(opt.color, correctColor), 600);
    };
    container.appendChild(btn);
  });

  nextStroopTrial();
}

function nextStroopTrial() {
  if (g5TimerTimeout) clearTimeout(g5TimerTimeout);

  if (g5TrialIndex >= g5MaxTrials) {
    const totalRT = g5ReactionTimes.reduce((a, b) => a + b, 0);
    const avgRT = g5ReactionTimes.length ? (totalRT / g5ReactionTimes.length / 1000).toFixed(1) : '—';
    const acc = Math.round((g5CorrectAnswers / g5MaxTrials) * 100);
    if (activeGamePhase === 'practice') {
      document.getElementById('nextPhaseBtn').classList.remove('d-none');
    } else {
      gameSessionData.stroop = { acc: `${acc}%`, rt: `${avgRT}s` };
      if (acc < 60) gameDifficulty = 'easy'; else if (acc > 85) gameDifficulty = 'hard';
      setTimeout(finishActiveGame, 1500);
    }
    return;
  }

  const wordItem = g5WordColors[Math.floor(Math.random() * 4)];
  let fontItem = g5WordColors[Math.floor(Math.random() * 4)];
  if (activeGamePhase === 'actual' && gameDifficulty === 'hard') {
    while (fontItem.name === wordItem.name) fontItem = g5WordColors[Math.floor(Math.random() * 4)];
  }

  const textEl = document.getElementById('stroopWordText');
  textEl.innerText = wordItem.name;
  textEl.style.color = fontItem.color;
  textEl.dataset.correctColor = fontItem.color;

  g5StartTime = new Date();
  g5AwaitingAnswer = true;

  g5TimerTimeout = setTimeout(() => {
    g5ReactionTimes.push(g5TimerLimit);
  }, g5TimerLimit);
}

function submitStroopAnswer(selected, correct) {
  if (!g5AwaitingAnswer) return;
  g5AwaitingAnswer = false;
  if (g5TimerTimeout) clearTimeout(g5TimerTimeout);
  g5ReactionTimes.push(new Date() - g5StartTime);

  const isCorrect = (selected === correct);
  if (isCorrect) {
    g5CorrectAnswers++;
    if (window.GardenAudio) window.GardenAudio.playSuccess();
  } else {
    if (window.GardenAudio) window.GardenAudio.playError();
    const textEl = document.getElementById('stroopWordText');
    if (textEl) {
      textEl.classList.add('shake');
      setTimeout(() => textEl.classList.remove('shake'), 400);
    }
  }

  g5TrialIndex++;
  const t = setTimeout(nextStroopTrial, 700);
  activeGameTimeouts.push(t);
}

// ============================================================
// GAME 6: DELAYED RECALL
// ============================================================
let g6SelectedIndices = [];
let g6RecallList = [];

function runGame6DelayedRecall() {
  // No practice mode for game 6 — always go straight to actual
  const grid = document.getElementById('game6RecallGrid');
  grid.classList.remove('d-none');
  grid.innerHTML = '';
  g6SelectedIndices = [];

  const targets = window._encodingSelected || [];
  const distractors = window._encodingDistractors || [];

  let numDistractors = 5;
  if (gameDifficulty === 'easy') numDistractors = 3;
  else if (gameDifficulty === 'hard') numDistractors = 9;

  const chosen = [...distractors].sort(() => Math.random() - 0.5).slice(0, numDistractors);
  g6RecallList = [...targets, ...chosen].sort(() => Math.random() - 0.5);

  g6RecallList.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.setAttribute('data-index', idx);
    card.onclick = () => toggleRecallSelection(idx, card);
    card.innerHTML = `
      <img class="option-image-no-border" src="${item.src}" alt="${item.label}">
      <span class="option-label">${item.label}</span>
    `;
    grid.appendChild(card);
  });

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-green mt-3';
  submitBtn.innerText = 'Submit Selections ✔';
  submitBtn.style.gridColumn = '1 / -1';
  submitBtn.onclick = evaluateDelayedRecall;
  grid.appendChild(submitBtn);
}

function toggleRecallSelection(index, cardEl) {
  const pos = g6SelectedIndices.indexOf(index);
  if (pos > -1) {
    g6SelectedIndices.splice(pos, 1);
    cardEl.classList.remove('selected');
  }
  else {
    g6SelectedIndices.push(index);
    cardEl.classList.add('selected');
  }
  // No sound for recall card clicks
}

function evaluateDelayedRecall() {
  if (g6SelectedIndices.length === 0) { alert('Please select at least one item.'); return; }
  const targets = window._encodingSelected || [];
  const correctCount = g6SelectedIndices.filter(idx => targets.some(t => t.label === g6RecallList[idx].label)).length;
  gameSessionData.delayedRecall = { correct: correctCount, distractors: g6RecallList.length - 5 };

  if (correctCount >= 3) {
    if (window.GardenAudio) window.GardenAudio.playSuccess();
  } else {
    if (window.GardenAudio) window.GardenAudio.playError();
  }

  setTimeout(finishActiveGame, 800);
}

// EOF
