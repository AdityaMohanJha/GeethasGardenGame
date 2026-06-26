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
// GAME 2 — WHACK-A-MOLE (90-second Adaptive Level Protocol)
// 4 adaptive levels based on accuracy and RT
// ============================================================

// ── Configuration ────────────────────────────────────────────
const G2_LEVEL_CONFIG = {
  1: { grid: 2, freqMs: 2500, visibleMs: 2000, distChance: 0.0, multiplier: 1.0 },
  2: { grid: 2, freqMs: 2000, visibleMs: 1800, distChance: 0.15, multiplier: 1.5 },
  3: { grid: 3, freqMs: 1600, visibleMs: 1500, distChance: 0.30, multiplier: 2.0 },
  4: { grid: 3, freqMs: 1200, visibleMs: 1200, distChance: 0.50, multiplier: 3.0 }
};

// ── State ────────────────────────────────────────────────────
let g2Level = 2;            // starts at Level 2
let g2Score = 0;
let g2GridSize = 2;         // 2 or 3
let g2ActiveHoleIdx = -1;
let g2SpawnTimestamp = 0;

// Metric accumulators (Global)
let g2ReactionTimes = [];   // all successful hit RTs
let g2TotalTargets = 0;
let g2TotalHits = 0;
let g2TotalMissed = 0;
let g2TotalDistractors = 0;
let g2TotalDistractorClicks = 0;
let g2HighestLevel = 2;
let g2LevelSustainedArray = [];

// Window trackers
let g2WindowTargets = 0;
let g2WindowHits = 0;
let g2WindowRTs = [];
let g2WindowStartTime = 0;

// Timer
let g2AssessmentStartTime = 0;     // performance.now() at game start
let g2PhaseTimerEl = null;         // DOM element for countdown
let g2ClockInterval = null;        // setInterval handle for the clock
let g2SpawnTimeout = null;         // handle for next spawn cycle
let g2CurrentEntityTimeout = null; // handle to despawn current entity

// Coordinate grids (fixed 120×120 px holes, centred in fixed 600×440 px canvas)
const G2_COORDS = {
  2: [
    { left: 105, top: 70  },
    { left: 375, top: 70  },
    { left: 105, top: 250 },
    { left: 375, top: 250 }
  ],
  3: [
    { left: 60,  top: 30  }, { left: 240, top: 30  }, { left: 420, top: 30  },
    { left: 60,  top: 160 }, { left: 240, top: 160 }, { left: 420, top: 160 },
    { left: 60,  top: 290 }, { left: 240, top: 290 }, { left: 420, top: 290 }
  ]
};

// ── Entry Point ───────────────────────────────────────────────
function runGame2WhackMole() {
  const gc = document.getElementById('gameContainer');
  gc.classList.add('mole-scene');

  const oldLnd = document.getElementById('moleLandscape');
  if (oldLnd) oldLnd.remove();

  // Reset all state
  g2Level = 2;
  g2Score = 0;
  g2GridSize = 2;
  g2ActiveHoleIdx = -1;
  g2SpawnTimestamp = 0;
  g2ReactionTimes = [];
  g2TotalTargets = 0;
  g2TotalHits = 0;
  g2TotalMissed = 0;
  g2TotalDistractors = 0;
  g2TotalDistractorClicks = 0;
  g2HighestLevel = 2;
  g2LevelSustainedArray = [];
  g2WindowTargets = 0;
  g2WindowHits = 0;
  g2WindowRTs = [];
  g2WindowStartTime = 0;

  if (activeGamePhase === 'practice') {
    _runMolePractice();
    return;
  }

  _buildMoleLandscape(2);
  _startPhaseHUD();
  g2AssessmentStartTime = performance.now();
  _scheduleNextSpawn();
}

// ── HUD: Phase banner + countdown ────────────────────────────
function _startPhaseHUD() {
  const gc = document.getElementById('gameContainer');
  let hud = document.getElementById('g2HUD');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'g2HUD';
    hud.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      display:flex;align-items:center;gap:16px;z-index:20;
      background:rgba(255,255,255,0.88);border-radius:24px;
      padding:6px 20px;box-shadow:0 2px 10px rgba(0,0,0,0.12);
      font-family:inherit;pointer-events:none;user-select:none;
    `;
    gc.appendChild(hud);
  }
  _updateHUD();

  g2ClockInterval = setInterval(() => {
    const elapsed = (performance.now() - g2AssessmentStartTime) / 1000;
    const remaining = Math.max(0, 90 - elapsed);
    const secs = Math.ceil(remaining);
    const phaseEl = document.getElementById('g2HUDPhase');
    const timeEl  = document.getElementById('g2HUDTime');
    const scoreEl = document.getElementById('g2HUDScore');
    if (phaseEl) phaseEl.textContent = `Level ${g2Level}/4`;
    if (timeEl)  timeEl.textContent  = `${secs}s`;
    if (scoreEl) scoreEl.textContent = `${g2Score}`;

    // Check 15-second evaluation window
    if (g2WindowTargets > 0 && (performance.now() - g2WindowStartTime) >= 15000) {
      _evaluateWindow();
    }
  }, 250);
  activeGameIntervals.push(g2ClockInterval);
}

function _updateHUD() {
  const hud = document.getElementById('g2HUD');
  if (!hud) return;
  const phaseLabel = `Score: <span id="g2HUDScore" style="color:#1a6e3c;">${g2Score}</span>`;
  hud.innerHTML = `
    <span style="font-size:0.78rem;color:#7a7a7a;font-weight:600;letter-spacing:.04em;">
      DIFFICULTY <span id="g2HUDPhase" style="color:#2d7a4f;">Level ${g2Level}/4</span>
    </span>
    <span style="font-size:0.82rem;font-weight:700;color:#333;">${phaseLabel}</span>
    <span style="font-size:0.78rem;color:#7a7a7a;">
      ⏱ <span id="g2HUDTime" style="font-weight:700;color:#c0392b;">90s</span>
    </span>
  `;
}

// ── Grid builder ─────────────────────────────────────────────
function _buildMoleLandscape(size) {
  const gc = document.getElementById('gameContainer');
  const old = document.getElementById('moleLandscape');
  if (old) old.remove();

  const landscape = document.createElement('div');
  landscape.id = 'moleLandscape';
  landscape.className = 'mole-landscape';
  // Fixed-size canvas centred inside gc
  landscape.style.cssText = `
    position:fixed;width:600px;height:440px;
    left:50%;top:50%;transform:translate(-50%,-50%);
  `;

  const coords = G2_COORDS[size] || G2_COORDS[2];
  const decors = ['🌱','🌸','🍄','🌿','🌻','🍀','🌾','🌼','🌺'];

  for (let i = 0; i < coords.length; i++) {
    const hole = document.createElement('div');
    hole.className = 'mole-hole-organic';
    hole.setAttribute('data-index', i);
    // Fixed 120×120 hitboxes, positioned absolutely
    hole.style.cssText = `
      position:absolute;width:120px;height:120px;
      left:${coords[i].left}px;top:${coords[i].top}px;
    `;

    const rim   = document.createElement('div'); rim.className = 'soil-rim';
    const pit   = document.createElement('div'); pit.className = 'soil-pit';
    const mole  = document.createElement('div'); mole.className = 'mole-element-organic';
    mole.innerText = '🐹';

    hole.appendChild(rim);
    hole.appendChild(pit);
    hole.appendChild(mole);

    // Use pointerdown for precise timing (avoids mouseup latency)
    hole.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      _handleMolePointerDown(i);
    });
    landscape.appendChild(hole);
  }
  gc.appendChild(landscape);
}

// ── Spawn cycle ───────────────────────────────────────────────
function _scheduleNextSpawn() {
  const elapsed = performance.now() - g2AssessmentStartTime;

  if (elapsed >= 90000) { _finishG2Assessment(); return; }

  const config = G2_LEVEL_CONFIG[g2Level];
  const gapMs = Math.max(config.freqMs - config.visibleMs, 100);

  g2SpawnTimeout = setTimeout(() => {
    _hideCurrentEntity();
    _spawnEntity();
    
    // Schedule despawn
    g2CurrentEntityTimeout = setTimeout(() => {
      const liveElapsed = performance.now() - g2AssessmentStartTime;
      if (liveElapsed >= 90000) { _finishG2Assessment(); return; }
      
      const landscape = document.getElementById('moleLandscape');
      const hole = landscape?.querySelector(`.mole-hole-organic[data-index="${g2ActiveHoleIdx}"]`);
      const moleEl = hole?.querySelector('.mole-element-organic');
      if (moleEl && moleEl.classList.contains('up') && moleEl.dataset.isDistractor === 'false') {
        g2TotalMissed++;
        g2Score -= (2 * config.multiplier);
        const scoreEl = document.getElementById('g2HUDScore');
        if (scoreEl) scoreEl.textContent = `${g2Score}`;
      }
      _hideCurrentEntity();
      g2ActiveHoleIdx = -1;
      _scheduleNextSpawn();
    }, config.visibleMs);
    activeGameTimeouts.push(g2CurrentEntityTimeout);
  }, gapMs);
  activeGameTimeouts.push(g2SpawnTimeout);
}

function _spawnEntity() {
  const landscape = document.getElementById('moleLandscape');
  const holes = landscape?.querySelectorAll('.mole-hole-organic');
  if (!holes || !holes.length) return;

  let idx;
  do { idx = Math.floor(Math.random() * holes.length); }
  while (idx === g2ActiveHoleIdx && holes.length > 1);
  g2ActiveHoleIdx = idx;

  const mole = holes[idx].querySelector('.mole-element-organic');
  if (!mole) return;
  mole.classList.remove('hit');

  const config = G2_LEVEL_CONFIG[g2Level];
  const isDistractor = Math.random() < config.distChance;
  mole.innerText = isDistractor ? '🐝' : '🐹';
  mole.dataset.isDistractor = isDistractor ? 'true' : 'false';
  mole.classList.add('up');

  if (isDistractor) {
    g2TotalDistractors++;
  } else {
    g2TotalTargets++;
    g2WindowTargets++;
  }

  g2SpawnTimestamp = performance.now();
  if (g2WindowTargets === 1) g2WindowStartTime = performance.now();
}

function _hideCurrentEntity() {
  document.querySelectorAll('.mole-element-organic').forEach(m => m.classList.remove('up'));
}

// ── Input handler ─────────────────────────────────────────────
function _handleMolePointerDown(index) {
  if (index !== g2ActiveHoleIdx) return;
  const landscape = document.getElementById('moleLandscape');
  const hole = landscape?.querySelector(`.mole-hole-organic[data-index="${index}"]`);
  const mole = hole?.querySelector('.mole-element-organic');
  if (!mole || !mole.classList.contains('up') || mole.classList.contains('hit')) return;

  const rt = performance.now() - g2SpawnTimestamp;
  mole.classList.add('hit');
  const isDistractor = mole.dataset.isDistractor === 'true';
  const config = G2_LEVEL_CONFIG[g2Level];

  if (isDistractor) {
    mole.innerText = '🚫';
    if (window.GardenAudio) window.GardenAudio.playError();
    
    g2TotalDistractorClicks++;
    g2Score -= (5 * config.multiplier);
  } else {
    mole.innerText = '💥';
    if (window.GardenAudio) window.GardenAudio.playSuccess();
    
    g2ReactionTimes.push(rt);
    g2WindowRTs.push(rt);
    g2TotalHits++;
    g2WindowHits++;
    g2Score += (10 * config.multiplier);
  }

  const scoreEl = document.getElementById('g2HUDScore');
  if (scoreEl) scoreEl.textContent = `${g2Score}`;

  // Evaluate after 8 targets
  if (g2WindowTargets >= 8) {
    _evaluateWindow();
  }
}

function _evaluateWindow() {
  if (g2WindowTargets === 0) return;
  
  const accuracy = (g2WindowHits / g2WindowTargets) * 100;
  const avgRT = g2WindowRTs.length > 0 ? (g2WindowRTs.reduce((a,b)=>a+b,0) / g2WindowRTs.length) : 2000;
  
  let rtScore = 100 * (2000 - avgRT) / 1500;
  rtScore = Math.max(0, Math.min(100, rtScore));
  
  const performanceScore = (0.7 * accuracy) + (0.3 * rtScore);
  
  let oldLevel = g2Level;
  if (performanceScore >= 80 && g2Level < 4) {
    g2Level++;
  } else if (performanceScore <= 55 && g2Level > 1) {
    g2Level--;
  }
  
  if (g2Level > g2HighestLevel) g2HighestLevel = g2Level;
  g2LevelSustainedArray.push(g2Level);
  
  if (G2_LEVEL_CONFIG[oldLevel].grid !== G2_LEVEL_CONFIG[g2Level].grid) {
    g2GridSize = G2_LEVEL_CONFIG[g2Level].grid;
    _buildMoleLandscape(g2GridSize);
    g2ActiveHoleIdx = -1;
  }
  
  if (g2Level > oldLevel) {
    _showPhaseFlash(`Level ${g2Level}! Faster!`, '#2d7a4f');
  } else if (g2Level < oldLevel) {
    _showPhaseFlash(`Level ${g2Level}`, '#c0392b');
  }
  
  _updateHUD();
  
  g2WindowTargets = 0;
  g2WindowHits = 0;
  g2WindowRTs = [];
  g2WindowStartTime = performance.now();
}

function _showPhaseFlash(msg, color) {
  const gc = document.getElementById('gameContainer');
  const flash = document.createElement('div');
  flash.textContent = msg;
  flash.style.cssText = `
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    background:${color};color:#fff;font-size:1.1rem;font-weight:700;
    padding:10px 28px;border-radius:32px;z-index:30;pointer-events:none;
    opacity:1;transition:opacity 0.8s;
  `;
  gc.appendChild(flash);
  setTimeout(() => { flash.style.opacity = '0'; }, 700);
  setTimeout(() => flash.remove(), 1550);
}

// ── Finalise ──────────────────────────────────────────────────
function _finishG2Assessment() {
  _hideCurrentEntity();
  clearInterval(g2ClockInterval);
  
  if (g2WindowTargets > 0) _evaluateWindow();

  const mrt = g2ReactionTimes.length ? _mean(g2ReactionTimes) : null;
  const rtv = g2ReactionTimes.length > 1 ? _stdDev(g2ReactionTimes) : null;
  
  const accuracy = g2TotalTargets > 0 ? (g2TotalHits / g2TotalTargets) * 100 : 0;
  const distractorErrorRate = g2TotalDistractors > 0 ? (g2TotalDistractorClicks / g2TotalDistractors) * 100 : 0;
  const missRate = g2TotalTargets > 0 ? (g2TotalMissed / g2TotalTargets) * 100 : 0;
  
  const avgLevel = g2LevelSustainedArray.length ? _mean(g2LevelSustainedArray) : g2Level;

  gameSessionData.whackMole = {
    hits: g2TotalHits,
    score: g2Score,
    mrt: mrt ? +mrt.toFixed(1) : null,
    rtv: rtv ? +rtv.toFixed(1) : null,
    accuracy: +accuracy.toFixed(1),
    distractorErrorRate: +distractorErrorRate.toFixed(1),
    missRate: +missRate.toFixed(1),
    highestLevel: g2HighestLevel,
    avgLevel: +avgLevel.toFixed(1)
  };

  // Preserve legacy difficulty heuristic
  if (g2TotalHits <= 10)      gameDifficulty = 'easy';
  else if (g2TotalHits >= 25) gameDifficulty = 'hard';

  setTimeout(finishActiveGame, 1500);
}

// ── Math helpers ──────────────────────────────────────────────
function _mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function _stdDev(arr) {
  const m = _mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

// ── Practice mode (unchanged flow) ────────────────────────────
function runMolePracticeLoop() {
  const cursor = document.getElementById('practiceCursor');
  if (cursor) cursor.classList.remove('d-none');
  let round = 0;
  _buildMoleLandscape(2);
  let practiceHits = 0;
  const interval = setInterval(() => {
    _hideCurrentEntity();
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
    g2SpawnTimestamp = performance.now();

    const rect = holes[g2ActiveHoleIdx].getBoundingClientRect();
    const parent = document.getElementById('gameContainer').getBoundingClientRect();
    if (cursor) {
      cursor.style.top  = `${rect.top  - parent.top  + rect.height / 2}px`;
      cursor.style.left = `${rect.left - parent.left + rect.width  / 2}px`;
    }

    const tw = setTimeout(() => {
      const m2 = holes[g2ActiveHoleIdx]?.querySelector('.mole-element-organic');
      if (m2 && m2.classList.contains('up') && !m2.classList.contains('hit')) {
        m2.innerText = '💥'; m2.classList.add('hit');
        practiceHits++;
        if (practiceHits >= 2) document.getElementById('nextPhaseBtn')?.classList.remove('d-none');
      }
    }, 900);
    const th = setTimeout(() => mole.classList.remove('up'), 1800);
    activeGameTimeouts.push(tw, th);
    round++;
  }, 2400);
  activeGameIntervals.push(interval);
}

function _runMolePractice() { runMolePracticeLoop(); }

// ── Shim: old whackMole function kept for practice cursor ──────
function whackMole(index) { _handleMolePointerDown(index); }


// ============================================================
// GAME 3: GARDEN PATH (Trail Making)
// ============================================================
let g3Nodes = [];
let g3CurrentTargetIdx = 0;
let g3StartTime = null;

function generateRandomGardenSeq(length) {
  const numbers = ['1','2','3','4','5','6','7','8','9'].sort(() => 0.5 - Math.random());
  const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].sort(() => 0.5 - Math.random());
  let seq = [];
  for (let i = 0; i < length; i++) {
    seq.push(i % 2 === 0 ? numbers[Math.floor(i / 2)] : letters[Math.floor(i / 2)]);
  }
  return seq;
}

function runGame3GardenPath() {
  const grid = document.getElementById('game3TrailGrid');
  grid.classList.remove('d-none');
  document.getElementById('game3NodesWrapper').innerHTML = '';
  document.getElementById('game3SvgLines').innerHTML = '';

  let targetSeq = [];
  if (activeGamePhase === 'practice') {
    const practiceLen = Math.floor(Math.random() * 3) + 4; // 4 to 6
    targetSeq = generateRandomGardenSeq(practiceLen);
  } else {
    targetSeq = generateRandomGardenSeq(10);
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
