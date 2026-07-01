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
      1: { title: 'Game 1: Flower Memory', desc: 'Watch the flowers light up on the tiles and click them back in the exact same order. The sequence gets longer each round.' },
      2: { title: 'Game 2: Whack-a-Mole', desc: 'Moles are eating up Geetha\'s garden fruits — hit them as fast as possible to save the garden! Watch out for bees.' },
      3: { title: 'Game 3: Garden Path', desc: 'Help Geetha cross the garden path! Connect the numbered and lettered stones in the order shown — alternating numbers and letters.' },
      4: { title: 'Game 4: Clock Drawing', desc: 'Draw a clock face on the canvas and set the hands to the time shown. Use the guide circle if you need it, then hit Submit Clock.' },
      5: { title: 'Game 5: Colour Word Match', desc: 'A colour word appears in a different ink colour. Click the button that matches the INK COLOUR — not what the word says!' },
      6: { title: 'Game 6: Delayed Recall', desc: 'Think back to the 5 items you memorised in Step 4. Select exactly those 5 items from the grid — take your time!' },
    };
    const d = defs[activeGameIndex] || { title: 'Game', desc: '' };

    if (titleEl) titleEl.innerText = d.title;
    if (introTitleEl) introTitleEl.innerText = d.title;
    if (descEl) descEl.innerText = d.desc;
    if (goalTitle) goalTitle.innerText = 'How to play:';

    const emojiEl = document.getElementById('gameIntroEmoji');
    if (emojiEl) { emojiEl.textContent = ''; emojiEl.style.display = 'none'; }

    // Wire intro buttons
    const spb = document.getElementById('startPracticeBtn');
    const sgb = document.getElementById('skipGuideBtn');
    const pit = document.getElementById('gamePracticeIntroText');

    if (pit) {
      pit.style.display = activeGameIndex === 6 ? 'none' : '';
    }
    if (spb) {
      spb.style.display = activeGameIndex === 6 ? 'none' : '';
      spb.innerText = 'Start Practice ▶';
      spb.onclick = () => startPracticeMode();
    }
    if (sgb) {
      sgb.style.display = '';
      sgb.innerText = 'Start Game ▶';
      sgb.onclick = () => skipToActualGame();
    }

    // Load corresponding YouTube video
    const videoUrls = {
      1: 'nM6OKtm5r90',
      2: 'FKqynPzQ0n8',
      3: 'SsREMBgvXp4',
      4: 'V8tjxJIzgbc',
      5: 'PmwnHLD8NmQ',
      6: 'cMb_Vm_vL0I'
    };
    const videoId = videoUrls[activeGameIndex];
    const iframe = document.getElementById('demoVideoIframe');
    if (iframe) {
      if (videoId) {
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&fs=1&color=white`;
      } else {
        iframe.src = "";
      }
    }

    // Reset video wrapper size to standard
    const wrapper = document.getElementById('demoVideoWrapper');
    const resizeBtn = document.getElementById('resizeVideoBtn');
    if (wrapper) {
      wrapper.style.maxWidth = '480px';
    }
    if (resizeBtn) {
      resizeBtn.innerHTML = 'Theater Mode 📺';
    }
  } else {
    document.getElementById('gameIntroPanel').classList.add('d-none');
    document.getElementById('gamePlayPanel').classList.remove('d-none');
    const gth = document.getElementById('gameTitleHeader');
    if (gth) gth.classList.remove('d-none');

    // Stop video playback when leaving intro panel
    const iframe = document.getElementById('demoVideoIframe');
    if (iframe) iframe.src = "";

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

  const g2Hud = document.getElementById('g2HUD');
  if (g2Hud) g2Hud.remove();

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
let g1PracticeAttemptCount = 0;
let g1PracticeCurrentLength = 2;
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

// ── Clinical metric accumulators (main game only) ─────────────
let g1TotalTrials = 0;          // total sequences presented in main game
let g1CorrectTrials = 0;        // sequences correctly recalled
let g1ForwardSpan = 0;          // longest correctly recalled sequence length
let g1SequenceEndTime = 0;      // performance.now() when playback unlocks input
let g1TapTimestamps = [];        // timestamps of each tap within a trial
let g1AllFTLs = [];              // per-trial First Tap Latencies (ms)
let g1AllITIs = [];              // per-tap Intertapping Intervals (ms)

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

  // Reset clinical metric accumulators
  g1TotalTrials = 0;
  g1CorrectTrials = 0;
  g1ForwardSpan = 0;
  g1SequenceEndTime = 0;
  g1TapTimestamps = [];
  g1AllFTLs = [];
  g1AllITIs = [];

  const indicator = document.getElementById('game1StatusIndicator');
  if (indicator) indicator.classList.remove('d-none');

  if (activeGamePhase === 'practice') {
    g1PracticeAttemptCount = 0;
    startPracticeTrial();
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
  g1TapTimestamps = []; // reset tap timestamps for this trial
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
        // Record the exact moment the player is allowed to start tapping
        if (activeGamePhase === 'actual') {
          g1SequenceEndTime = performance.now();
          g1TotalTrials++;
        }
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

  // Record tap timestamp for FTL / ITI metrics (main game only)
  if (activeGamePhase === 'actual') {
    g1TapTimestamps.push(performance.now());
  }

  g1UserSequence.push(id);

  // Wait until the user has tapped all tiles before evaluating
  if (g1UserSequence.length < g1Sequence.length) return;

  // Full sequence entered — compute and store per-trial latency metrics
  if (activeGamePhase === 'actual' && g1TapTimestamps.length > 0) {
    // First Tap Latency: time from sequence-end signal to first tap
    const ftl = g1TapTimestamps[0] - g1SequenceEndTime;
    if (ftl >= 0) g1AllFTLs.push(ftl);
    // Intertapping Interval: average gap between consecutive taps
    for (let t = 1; t < g1TapTimestamps.length; t++) {
      g1AllITIs.push(g1TapTimestamps[t] - g1TapTimestamps[t - 1]);
    }
  }

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
      indicator.innerText = activeGamePhase === 'practice' ? 'Incorrect sequence' : 'Observe carefully';
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

function startPracticeTrial() {
  if (g1PracticeAttemptCount >= 4) {
    document.getElementById('nextPhaseBtn').classList.remove('d-none');
    const indicator = document.getElementById('game1StatusIndicator');
    if (indicator) {
      indicator.innerText = 'Practice complete!';
      indicator.style.color = '#34BB72';
    }
    return;
  }

  g1PracticeCurrentLength = (g1PracticeAttemptCount < 2) ? 2 : 3;

  g1UserSequence = [];
  g1ClickLocked = true;
  setStartCircleLit(false);
  g1BlinkSpeed = 1000;

  g1Sequence = Array.from({ length: g1PracticeCurrentLength }, () => Math.floor(Math.random() * 9));

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

function handlePracticePass() {
  g1PracticeAttemptCount++;
  const t = setTimeout(() => startPracticeTrial(), 1000);
  activeGameTimeouts.push(t);
}

function handlePracticeFail() {
  g1PracticeAttemptCount++;
  const t = setTimeout(() => startPracticeTrial(), 1500);
  activeGameTimeouts.push(t);
}

// ── Main game helpers ─────────────────────────────────────────
// Rules:
//  3. First try correct          → advance to next length immediately
//  4. First try wrong, 2nd right → advance to next length
//  5. Both wrong                 → end game
function handleMainGamePass() {
  g1CurrentScore += 10 * g1SequenceLength;
  g1TrialsAtLength++;
  g1PassesAtLength++;
  g1MainGameTryIndex++;
  g1CorrectTrials++;
  // Update forward span: highest length recalled correctly
  if (g1SequenceLength > g1ForwardSpan) g1ForwardSpan = g1SequenceLength;

  if (g1TrialsAtLength >= 2) {
    if (g1PassesAtLength >= 1) {
      g1SequenceLength++;
      g1TrialsAtLength = 0;
      g1PassesAtLength = 0;
      g1MainGameTryIndex = 0;
    }
  }

  const t = setTimeout(() => {
    g1ClickLocked = false;
    generateNewSequence();
    playFlowerSequence();
  }, 1500);
  activeGameTimeouts.push(t);
}

// Helper: compute and store final Game 1 clinical metrics into gameSessionData
function _saveGame1Metrics() {
  const avgFTL = g1AllFTLs.length
    ? Math.round(g1AllFTLs.reduce((a, b) => a + b, 0) / g1AllFTLs.length)
    : null;
  const avgITI = g1AllITIs.length
    ? Math.round(g1AllITIs.reduce((a, b) => a + b, 0) / g1AllITIs.length)
    : null;
  const pct = g1TotalTrials > 0
    ? Math.round((g1CorrectTrials / g1TotalTrials) * 100)
    : 0;

  gameSessionData.flowerMemory = {
    // Legacy field retained so existing code paths remain intact
    maxSeq: g1ForwardSpan,
    score: g1CurrentScore,
    // New clinical metrics
    forwardSpan: g1ForwardSpan,
    correctTrials: g1CorrectTrials,
    totalTrials: g1TotalTrials,
    correctPct: pct,
    ftlMs: avgFTL,           // average First Tap Latency in ms (null if no data)
    itiMs: avgITI            // average Intertapping Interval in ms (null if no data)
  };
}

function handleMainGameFail() {
  g1TrialsAtLength++;
  g1MainGameTryIndex++;

  if (g1TrialsAtLength >= 2) {
    if (g1PassesAtLength >= 1) {
      g1SequenceLength++;
      g1TrialsAtLength = 0;
      g1PassesAtLength = 0;
      g1MainGameTryIndex = 0;

      const t = setTimeout(() => {
        g1ClickLocked = false;
        generateNewSequence();
        playFlowerSequence();
      }, 1500);
      activeGameTimeouts.push(t);
    } else {
      // Used both tries and neither was correct → end game
      _saveGame1Metrics();
      const indicator = document.getElementById('game1StatusIndicator');
      if (indicator) indicator.classList.add('d-none');
      setStartCircleLit(false);
      const t = setTimeout(finishActiveGame, 1500);
      activeGameTimeouts.push(t);
    }
  } else {
    // First try completed → give second try
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
    { left: 105, top: 70 },
    { left: 375, top: 70 },
    { left: 105, top: 250 },
    { left: 375, top: 250 }
  ],
  3: [
    { left: 60, top: 30 }, { left: 240, top: 30 }, { left: 420, top: 30 },
    { left: 60, top: 160 }, { left: 240, top: 160 }, { left: 420, top: 160 },
    { left: 60, top: 290 }, { left: 240, top: 290 }, { left: 420, top: 290 }
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
    const timeEl = document.getElementById('g2HUDTime');
    const scoreEl = document.getElementById('g2HUDScore');
    if (timeEl) timeEl.textContent = `${secs}s`;
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
  hud.innerHTML = `
    <span style="font-size:1.1rem;color:#7a7a7a;">
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
  // Position relatively and center within parent container via flexbox/margin
  landscape.style.cssText = `
    position:relative;width:600px;height:440px;min-height:440px;
    margin:0 auto;
  `;

  const coords = G2_COORDS[size] || G2_COORDS[2];
  const decors = ['🌱', '🌸', '🍄', '🌿', '🌻', '🍀', '🌾', '🌼', '🌺'];

  for (let i = 0; i < coords.length; i++) {
    const hole = document.createElement('div');
    hole.className = 'mole-hole-organic';
    hole.setAttribute('data-index', i);
    // Fixed 120×120 hitboxes, positioned absolutely
    hole.style.cssText = `
      position:absolute;width:120px;height:120px;
      left:${coords[i].left}px;top:${coords[i].top}px;
    `;

    const rim = document.createElement('div'); rim.className = 'soil-rim';
    const pit = document.createElement('div'); pit.className = 'soil-pit';
    const mole = document.createElement('div'); mole.className = 'mole-element-organic';
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

    if (activeGamePhase === 'practice') {
      _showPhaseFlash("Don't hit the bees!", '#c0392b');
    } else {
      g2TotalDistractorClicks++;
      g2Score -= (5 * config.multiplier);
    }
  } else {
    mole.innerText = '💥';
    if (window.GardenAudio) window.GardenAudio.playSuccess();

    if (activeGamePhase === 'practice') {
      _showPhaseFlash("Good job!", '#2d7a4f');
    } else {
      g2ReactionTimes.push(rt);
      g2WindowRTs.push(rt);
      g2TotalHits++;
      g2WindowHits++;
      g2Score += (10 * config.multiplier);
    }
  }

  if (activeGamePhase !== 'practice') {
    const scoreEl = document.getElementById('g2HUDScore');
    if (scoreEl) scoreEl.textContent = `${g2Score}`;

    // Evaluate after 8 targets
    if (g2WindowTargets >= 8) {
      _evaluateWindow();
    }
  }
}

function _evaluateWindow() {
  if (g2WindowTargets === 0) return;

  const accuracy = (g2WindowHits / g2WindowTargets) * 100;
  const avgRT = g2WindowRTs.length > 0 ? (g2WindowRTs.reduce((a, b) => a + b, 0) / g2WindowRTs.length) : 2000;

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
  if (g2TotalHits <= 10) gameDifficulty = 'easy';
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
  if (cursor) cursor.classList.add('d-none');

  _buildMoleLandscape(2);
  let activePTimeout = null;

  function practiceSpawn() {
    _hideCurrentEntity();
    const landscape = document.getElementById('moleLandscape');
    const holes = landscape?.querySelectorAll('.mole-hole-organic');
    if (!holes || holes.length === 0) return;

    let idx;
    do { idx = Math.floor(Math.random() * holes.length); } while (idx === g2ActiveHoleIdx);
    g2ActiveHoleIdx = idx;

    const mole = holes[g2ActiveHoleIdx].querySelector('.mole-element-organic');
    if (!mole) return;
    mole.classList.remove('hit');

    const isDistractor = Math.random() < 0.3;
    mole.innerText = isDistractor ? '🐝' : '🐹';
    mole.dataset.isDistractor = isDistractor ? 'true' : 'false';
    mole.classList.add('up');
    g2SpawnTimestamp = performance.now();

    const th = setTimeout(() => {
      if (mole.classList.contains('up') && !mole.classList.contains('hit') && !isDistractor) {
        _showPhaseFlash("Hit the mole!", '#c0392b');
      }
      mole.classList.remove('up');
      activePTimeout = setTimeout(practiceSpawn, 800);
      activeGameTimeouts.push(activePTimeout);
    }, 1500);
    activeGameTimeouts.push(th);
  }

  practiceSpawn();

  const mainPTimeout = setTimeout(() => {
    clearTimeout(activePTimeout);
    document.getElementById('nextPhaseBtn')?.classList.remove('d-none');
    _hideCurrentEntity();
  }, 30000);
  activeGameTimeouts.push(mainPTimeout);
}

function _runMolePractice() { runMolePracticeLoop(); }

// ── Shim: old whackMole function kept for practice cursor ──────
function whackMole(index) { _handleMolePointerDown(index); }


// ============================================================
// GAME 3: GARDEN PATH (Trail Making)
// ============================================================
// ============================================================
// GAME 3: GARDEN PATH (Trail Making)
// ============================================================
let g3Nodes = [];
let g3CurrentTargetIdx = 0;
let g3StartTime = null;
let g3WrongClicks = 0;
let g3TargetSeq = [];        // the ordered sequence labels
let g3UsedPracticeFamily = -1; // index of the family used for practice

// New tracking variables for clinical metrics
let g3UndoCount = 0;
let g3ClickIntervals = [];   // millisecond gaps between clicks
let g3LastClickTime = 0;
let g3IncorrectNodes = [];   // node indices clicked incorrectly
let g3TappedNodeIndices = []; // order of node indices tapped by the user

// ── Predefined sequence families ─────────────────────────────
// Each family has a practice (4 items) and main (10 items) variant.
const G3_FAMILIES = [
  {
    practice: ['1', 'A', '2', 'B'],
    main:     ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E']
  },
  {
    practice: ['1', 'F', '2', 'G'],
    main:     ['1', 'F', '2', 'G', '3', 'H', '4', 'I', '5', 'J']
  },
  {
    practice: ['1', 'V', '2', 'W'],
    main:     ['1', 'V', '2', 'W', '3', 'X', '4', 'Y', '5', 'Z']
  }
];

// ── Non-crossing zigzag layout ───────────────────────────────
// Place nodes along a zigzag path so that lines connecting consecutive
// nodes never cross. We define fixed slot positions and assign them
// in alternating left→right / right→left rows (snake pattern).
function _computeNonCrossingPositions(count, W, H) {
  // Determine grid dimensions
  const cols = Math.min(count, 4);            // max 4 per row
  const rows = Math.ceil(count / cols);
  const padX = 60, padY = 60;
  const cellW = (W - 2 * padX) / Math.max(cols - 1, 1);
  const cellH = (H - 2 * padY) / Math.max(rows - 1, 1);

  // Build slot positions in snake order (row 0 L→R, row 1 R→L, etc.)
  const positions = [];
  let idx = 0;
  for (let r = 0; r < rows && idx < count; r++) {
    const itemsInRow = Math.min(cols, count - idx);
    const rowPositions = [];
    for (let c = 0; c < itemsInRow; c++) {
      // Centre the items in this row
      const totalRowWidth = (itemsInRow - 1) * cellW;
      const offsetX = (W - 2 * padX - totalRowWidth) / 2;
      const x = padX + offsetX + c * cellW;
      const y = padY + r * cellH;
      // Add slight random jitter for visual variety (±15px)
      const jx = x + (Math.random() - 0.5) * 30;
      const jy = y + (Math.random() - 0.5) * 20;
      rowPositions.push({ x: Math.max(30, Math.min(W - 30, jx)), y: Math.max(30, Math.min(H - 30, jy)) });
    }
    // Reverse every other row for snake pattern
    if (r % 2 === 1) rowPositions.reverse();
    positions.push(...rowPositions);
    idx += itemsInRow;
  }
  return positions;
}

function runGame3GardenPath() {
  const grid = document.getElementById('game3TrailGrid');
  grid.classList.remove('d-none');
  document.getElementById('game3NodesWrapper').innerHTML = '';
  document.getElementById('game3SvgLines').innerHTML = '';

  // Pick sequence
  if (activeGamePhase === 'practice') {
    g3UsedPracticeFamily = Math.floor(Math.random() * G3_FAMILIES.length);
    g3TargetSeq = G3_FAMILIES[g3UsedPracticeFamily].practice.slice();
  } else {
    // Main game: pick a different family than what was used for practice
    const available = [0, 1, 2].filter(i => i !== g3UsedPracticeFamily);
    const pick = available[Math.floor(Math.random() * available.length)];
    g3TargetSeq = G3_FAMILIES[pick].main.slice();
  }

  g3CurrentTargetIdx = 0;
  g3Nodes = [];
  g3WrongClicks = 0;

  // Reset tracking stats
  g3UndoCount = 0;
  g3ClickIntervals = [];
  g3LastClickTime = 0;
  g3IncorrectNodes = [];
  g3TappedNodeIndices = [];

  // Show sequence header
  const seqHeader = document.getElementById('game3SequenceHeader');
  if (seqHeader) {
    seqHeader.classList.remove('d-none');
    document.getElementById('game3SequenceText').innerText = g3TargetSeq.join(' ➔ ');
  }

  // Show undo bar
  const undoBar = document.getElementById('game3UndoBar');
  if (undoBar) undoBar.classList.remove('d-none');
  _updateUndoBtnState();

  // Layout — non-crossing positions
  const gridEl = document.getElementById('game3TrailGrid');
  const W = gridEl.offsetWidth || 480;
  const H = gridEl.offsetHeight || 370;
  const positions = _computeNonCrossingPositions(g3TargetSeq.length, W, H);

  g3TargetSeq.forEach((label, idx) => {
    g3Nodes.push({ label, x: positions[idx].x, y: positions[idx].y, index: idx });
  });

  // Render nodes
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
  g3StartTime = performance.now();
}

function highlightActiveTrailNode() {
  document.querySelectorAll('.trail-node').forEach(n => n.classList.remove('active-target'));
  // Practice: soft orange pulse on next target after 2 wrong clicks
  if (activeGamePhase === 'practice' && g3WrongClicks >= 2) {
    const t = document.getElementById(`trail-node-${g3CurrentTargetIdx}`);
    if (t) t.classList.add('active-target');
  }
}

function handleTrailNodeClick(index) {
  // Ignore clicks on already completed nodes
  const nodeEl = document.getElementById(`trail-node-${index}`);
  if (!nodeEl || nodeEl.classList.contains('completed')) return;

  // Track hesitation click gaps in the main game
  if (activeGamePhase === 'actual') {
    const now = performance.now();
    const gap = now - (g3LastClickTime || g3StartTime);
    g3ClickIntervals.push(gap);
    g3LastClickTime = now;
  }

  // Check correctness relative to target sequence
  const expectedLabel = g3TargetSeq[g3CurrentTargetIdx];
  const clickedNode = g3Nodes.find(n => n.index === index);
  const isCorrect = clickedNode && clickedNode.label === expectedLabel;

  if (!isCorrect) {
    // Wrong click
    g3WrongClicks++;
    if (activeGamePhase === 'actual' && !g3IncorrectNodes.includes(index)) {
      g3IncorrectNodes.push(index);
    }
  } else {
    // Correct click
    if (activeGamePhase === 'practice') g3WrongClicks = 0;
  }

  // Accept the click regardless of correctness
  nodeEl.classList.remove('active-target');
  nodeEl.classList.add('completed');
  
  if (g3TappedNodeIndices.length > 0) {
    const lastNode = g3Nodes[g3TappedNodeIndices[g3TappedNodeIndices.length - 1]];
    drawTrailLine(lastNode, clickedNode);
  }
  g3TappedNodeIndices.push(index);
  g3CurrentTargetIdx++;
  _updateUndoBtnState();

  if (g3CurrentTargetIdx < g3Nodes.length) {
    if (window.GardenAudio) window.GardenAudio.playPop();
    highlightActiveTrailNode();
  } else {
    // Path complete
    if (window.GardenAudio) window.GardenAudio.playSuccess();
    if (activeGamePhase === 'practice') {
      document.getElementById('nextPhaseBtn').classList.remove('d-none');
      const undoBar = document.getElementById('game3UndoBar');
      if (undoBar) undoBar.classList.add('d-none');
    } else {
      _finishGame3();
    }
  }
}

// ── Undo last node tap ───────────────────────────────────────
function undoLastTrailNode() {
  if (g3CurrentTargetIdx <= 0) return;

  if (activeGamePhase === 'actual') {
    g3UndoCount++;
  }

  g3CurrentTargetIdx--;
  const lastIndex = g3TappedNodeIndices.pop();
  const nodeEl = document.getElementById(`trail-node-${lastIndex}`);
  if (nodeEl) {
    nodeEl.classList.remove('completed');
  }

  // Remove last SVG line
  const svg = document.getElementById('game3SvgLines');
  if (svg && svg.lastChild) {
    svg.removeChild(svg.lastChild);
  }

  _updateUndoBtnState();
  highlightActiveTrailNode();
}

function _updateUndoBtnState() {
  const btn = document.getElementById('game3UndoBtn');
  if (btn) {
    btn.disabled = g3CurrentTargetIdx <= 0;
    btn.style.opacity = g3CurrentTargetIdx <= 0 ? '0.4' : '1';
  }
}

// ── Finish main game & capture screenshot ────────────────────
function _finishGame3() {
  const timeSpent = Math.round((performance.now() - g3StartTime) / 1000);

  // Hide undo bar
  const undoBar = document.getElementById('game3UndoBar');
  if (undoBar) undoBar.classList.add('d-none');

  // Capture screenshot of the trail
  const screenshot = _captureTrailScreenshot();

  // Average micro-hesitation gap (ms)
  const avgHesitation = g3ClickIntervals.length
    ? Math.round(g3ClickIntervals.reduce((a, b) => a + b, 0) / g3ClickIntervals.length)
    : 0;

  gameSessionData.gardenPath = {
    nodes: g3Nodes.length,
    time: `${timeSpent} seconds`,
    sequenceErrors: g3WrongClicks,
    sequence: g3TargetSeq.join(' → '),
    screenshot: screenshot,
    undoCount: g3UndoCount,
    avgHesitationMs: avgHesitation
  };

  if (timeSpent > 30) gameDifficulty = 'easy';
  else if (timeSpent < 15) gameDifficulty = 'hard';
  setTimeout(finishActiveGame, 1500);
}

// ── Manual canvas-based screenshot of the trail ──────────────
function _captureTrailScreenshot() {
  try {
    const gridEl = document.getElementById('game3TrailGrid');
    const W = gridEl.offsetWidth || 480;
    const H = gridEl.offsetHeight || 370;

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const cx = c.getContext('2d');

    // Background
    cx.fillStyle = '#FAFCF2';
    cx.fillRect(0, 0, W, H);

    // Draw lines between consecutive tapped nodes in tapped order
    cx.strokeStyle = '#030022';
    cx.lineWidth = 3;
    cx.lineCap = 'round';
    for (let i = 1; i < g3TappedNodeIndices.length; i++) {
      const nodeA = g3Nodes[g3TappedNodeIndices[i - 1]];
      const nodeB = g3Nodes[g3TappedNodeIndices[i]];
      cx.beginPath();
      cx.moveTo(nodeA.x, nodeA.y);
      cx.lineTo(nodeB.x, nodeB.y);
      cx.stroke();
    }

    // Draw node circles with labels + ✓/✗ status marks
    g3Nodes.forEach((node, idx) => {
      const isWrong = g3IncorrectNodes.includes(node.index);

      // Circle
      cx.beginPath();
      cx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      cx.fillStyle = isWrong ? '#F8D7DA' : '#D4EDDA'; // soft red or soft green
      cx.fill();
      cx.strokeStyle = isWrong ? '#DC3545' : '#28A745'; // red or green border
      cx.lineWidth = 2.5;
      cx.stroke();

      // Label text
      cx.fillStyle = isWrong ? '#DC3545' : '#155724';
      cx.font = 'bold 14px sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(node.label, node.x, node.y);

      // Order number below
      cx.fillStyle = '#555';
      cx.font = '10px sans-serif';
      cx.fillText(`${idx + 1}`, node.x, node.y + 30);

      // Draw status mark badge (✓ or ✗) top right
      cx.beginPath();
      cx.arc(node.x + 16, node.y - 16, 7, 0, Math.PI * 2);
      cx.fillStyle = isWrong ? '#DC3545' : '#28A745';
      cx.fill();

      cx.fillStyle = '#fff';
      cx.font = 'bold 8px sans-serif';
      cx.fillText(isWrong ? '✗' : '✓', node.x + 16, node.y - 16);
    });

    // Draw error count badge
    if (g3WrongClicks > 0) {
      cx.fillStyle = 'rgba(203, 68, 141, 0.9)';
      const badgeX = W - 15, badgeY = 20;
      cx.beginPath();
      cx.arc(badgeX - 55, badgeY, 14, 0, Math.PI * 2);
      cx.fill();
      cx.fillStyle = '#fff';
      cx.font = 'bold 12px sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(`${g3WrongClicks}`, badgeX - 55, badgeY);
      cx.fillStyle = '#CB448D';
      cx.font = '11px sans-serif';
      cx.textAlign = 'left';
      cx.fillText('errors', badgeX - 38, badgeY);
    }

    // Sequence label at top
    cx.fillStyle = '#030022';
    cx.font = 'bold 12px sans-serif';
    cx.textAlign = 'left';
    cx.fillText('Sequence: ' + g3TargetSeq.join(' → '), 10, 16);

    return c.toDataURL('image/png');
  } catch (e) {
    console.error('Trail screenshot capture failed:', e);
    return '';
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

// ============================================================
// GAME 4: CLOCK DRAWING
// ============================================================
let canvas = null, ctx = null, drawing = false;
let strokesHistory = [], currentStroke = [];
let canvasGuidesEnabled = true;

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

  canvasGuidesEnabled = true;
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
// ============================================================
// GAME 5: COLOUR STROOP (Multi-Level Protocol)
// ============================================================
const g5WordColors = [
  { name: 'RED', color: '#BB3434' },
  { name: 'BLUE', color: '#0055FF' },
  { name: 'GREEN', color: '#34BB72' },
  { name: 'YELLOW', color: '#E8B923' }
];

let g5Level = 1;             // 1 = W (Word), 2 = C (Color), 3 = CW (Interference)
let g5Stage = 'intro';       // 'intro' | 'countdown' | 'game' | 'summary'
let g5LevelTimer = null;     // 30-second timer handle for main game level
let g5CountdownTimer = null;
let g5NextItemTimeout = null;
let g5AwaitingAnswer = false;
let g5StartTime = 0;

// Shapes and color tracking for clinical metrics
const g5Shapes = ["████", "●●●●", "■■■■", "▲▲▲▲", "◆◆◆◆", "XXXX"];
let g5LastCorrectColor = null;

// Metric accumulators (Main Game only)
let g5WAttempted = 0, g5WCorrect = 0;
let g5CAttempted = 0, g5CCorrect = 0;
let g5CWAttempted = 0, g5CWCorrect = 0;

// Practice mode trial counter
let g5PracticeTrialsCount = 0;

// Tick-based level timer state
let g5TimeRemainingMs = 30000;
let g5TickInterval = null;

function runGame5ColourStroop() {
  g5Level = 1;
  g5Stage = 'intro';
  g5AwaitingAnswer = false;
  g5LastCorrectColor = null;

  // Reset timers/intervals
  if (g5TickInterval) clearInterval(g5TickInterval);
  if (g5LevelTimer) clearTimeout(g5LevelTimer);
  if (g5CountdownTimer) clearInterval(g5CountdownTimer);
  if (g5NextItemTimeout) clearTimeout(g5NextItemTimeout);

  // Reset metrics
  g5WAttempted = 0; g5WCorrect = 0;
  g5CAttempted = 0; g5CCorrect = 0;
  g5CWAttempted = 0; g5CWCorrect = 0;

  g5RenderStroopUI();
}

function g5RenderStroopUI() {
  const wrapper = document.getElementById('game5StroopWrapper');
  if (!wrapper) return;
  wrapper.className = ''; // reset border flash classes
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.width = '100%';
  wrapper.style.position = 'relative';

  // Ensure game container doesn't have old border classes
  const gc = document.getElementById('gameContainer');
  if (gc) gc.className = 'game-container';

  if (g5Stage === 'intro') {
    let title = "";
    let desc = "";
    if (g5Level === 1) {
      title = "Level 1: Word Reading 📖";
      desc = "Read the word text and select the option matching what the word spells. The words are printed in simple black ink.";
    } else if (g5Level === 2) {
      title = "Level 2: Color Naming 🎨";
      desc = "Focus on the color of the blocks shown and select the option matching that ink color!";
    } else if (g5Level === 3) {
      title = "Level 3: Color-Word Interference ⚡";
      desc = "Trust the INK, ignore the WORD! Select the ink color of the word text, completely ignoring what the word spells.";
    }

    wrapper.innerHTML = `
      <div style="text-align:center; max-width:520px; padding:2rem 1.5rem; background:rgba(255,255,255,0.75); backdrop-filter:blur(8px); border-radius:18px; border:var(--border-main); box-shadow:var(--shadow-main); animation:popIn 0.3s ease-out;">
        <h3 style="font-family:var(--font-serif); font-size:1.6rem; margin-bottom:0.75rem; color:var(--primary-dark);">${title}</h3>
        <p style="font-size:1.05rem; line-height:1.55; margin-bottom:1.75rem; color:#555;">${desc}</p>
        <button class="btn btn-green" onclick="g5StartCountdown()" style="padding:0.65rem 2rem; font-size:1.05rem;">Ready ▶</button>
      </div>
    `;
  } else if (g5Stage === 'countdown') {
    wrapper.innerHTML = `
      <div style="font-size:6.5rem; font-weight:800; color:var(--color-pink); text-align:center; animation:pulseTarget 1s infinite alternate; padding:3rem 0;" id="stroopCountdown">3</div>
    `;
  } else if (g5Stage === 'game') {
    wrapper.innerHTML = `
      <div class="stroop-word-display" id="stroopWordText" style="transition: transform 0.2s; user-select: none;"></div>
      <div class="stroop-buttons" id="stroopButtonsContainer"></div>
    `;
    _g5SetupButtons();
  } else if (g5Stage === 'summary') {
    let title = `Level ${g5Level} Complete! 🎉`;
    let desc = "Take a quick breath. Click continue to proceed.";
    let nextBtnLabel = (g5Level < 3) ? `Continue to Level ${g5Level + 1} ➔` : "Complete Game ➔";

    if (activeGamePhase === 'practice') {
      if (g5Level === 3) {
        nextBtnLabel = "Start Main Game ▶";
      }
    }

    wrapper.innerHTML = `
      <div style="text-align:center; max-width:520px; padding:2rem 1.5rem; background:rgba(255,255,255,0.75); backdrop-filter:blur(8px); border-radius:18px; border:var(--border-main); box-shadow:var(--shadow-main); animation:popIn 0.3s ease-out;">
        <h3 style="font-family:var(--font-serif); font-size:1.6rem; margin-bottom:0.75rem; color:var(--primary-dark);">${title}</h3>
        <p style="font-size:1.05rem; line-height:1.55; margin-bottom:1.75rem; color:#555;">${desc}</p>
        <button class="btn btn-green" onclick="g5ProceedFromSummary()" style="padding:0.65rem 2rem; font-size:1.05rem;">${nextBtnLabel}</button>
      </div>
    `;
  }
}

function g5StartCountdown() {
  g5Stage = 'countdown';
  g5RenderStroopUI();

  let count = 3;
  const countEl = document.getElementById('stroopCountdown');

  if (g5CountdownTimer) clearInterval(g5CountdownTimer);
  g5CountdownTimer = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(g5CountdownTimer);
      g5StartGameplay();
    } else {
      if (countEl) countEl.innerText = count;
    }
  }, 1000);
  activeGameIntervals.push(g5CountdownTimer);
}

function g5StartGameplay() {
  g5Stage = 'game';
  g5RenderStroopUI();

  g5PracticeTrialsCount = 0;

  if (activeGamePhase === 'actual') {
    g5TimeRemainingMs = 30000;
    if (g5TickInterval) clearInterval(g5TickInterval);
    g5TickInterval = setInterval(() => {
      // Robust pause check: check if the pause modal is active or stage is not game
      const pm = document.getElementById('pauseModal');
      const isPaused = pm && !pm.classList.contains('d-none');
      if (isPaused || g5Stage !== 'game') {
        return; // pause countdown ticking when instructions/pause is active
      }

      g5TimeRemainingMs -= 100;
      if (g5TimeRemainingMs <= 0) {
        clearInterval(g5TickInterval);
        g5EndLevel();
      }
    }, 100);
    activeGameIntervals.push(g5TickInterval);
  }

  g5NextItem();
}

function _g5SetupButtons() {
  const container = document.getElementById('stroopButtonsContainer');
  if (!container) return;
  container.innerHTML = '';

  const lightColors = {
    '#BB3434': '#FFC4C4',
    '#0055FF': '#B8D3FF',
    '#34BB72': '#B3F0CC',
    '#E8B923': '#FCEBB6'
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
      g5SubmitAnswer(opt.color);
    };
    container.appendChild(btn);
  });
}

function g5NextItem() {
  if (g5NextItemTimeout) clearTimeout(g5NextItemTimeout);

  // Check practice limit
  if (activeGamePhase === 'practice' && g5PracticeTrialsCount >= 4) {
    g5EndLevel();
    return;
  }

  const textEl = document.getElementById('stroopWordText');
  if (!textEl) return;

  let wordItem = g5WordColors[Math.floor(Math.random() * 4)];
  let inkItem = g5WordColors[Math.floor(Math.random() * 4)];

  if (g5Level === 1) {
    // Level 1: Word reading W. Crisp black ink text. Enforce no continuous correct color name.
    while (wordItem.color === g5LastCorrectColor) {
      wordItem = g5WordColors[Math.floor(Math.random() * 4)];
    }
    g5LastCorrectColor = wordItem.color;

    textEl.innerText = wordItem.name;
    textEl.style.color = '#000000';
    textEl.dataset.correctColor = wordItem.color; // correct answer matches word name
  } else if (g5Level === 2) {
    // Level 2: Color naming C. Neutral block shapes in correct ink color. Enforce no continuous correct color.
    while (inkItem.color === g5LastCorrectColor) {
      inkItem = g5WordColors[Math.floor(Math.random() * 4)];
    }
    g5LastCorrectColor = inkItem.color;

    const shape = g5Shapes[Math.floor(Math.random() * g5Shapes.length)];
    textEl.innerText = shape;
    textEl.style.color = inkItem.color;
    textEl.dataset.correctColor = inkItem.color; // correct answer matches ink
  } else if (g5Level === 3) {
    // Level 3: Color-Word Interference CW. Words printed in conflicting colors (never matching). Enforce no continuous correct color.
    while (inkItem.color === g5LastCorrectColor || inkItem.color === wordItem.color) {
      inkItem = g5WordColors[Math.floor(Math.random() * 4)];
      wordItem = g5WordColors[Math.floor(Math.random() * 4)];
    }
    g5LastCorrectColor = inkItem.color;

    textEl.innerText = wordItem.name;
    textEl.style.color = inkItem.color;
    textEl.dataset.correctColor = inkItem.color; // correct answer matches ink color
  }

  g5StartTime = performance.now();
  g5AwaitingAnswer = true;
}

function g5SubmitAnswer(selectedColor) {
  if (!g5AwaitingAnswer) return;
  g5AwaitingAnswer = false;

  const textEl = document.getElementById('stroopWordText');
  const correctColor = textEl?.dataset.correctColor;
  const isCorrect = (selectedColor === correctColor);

  // Log clinical metrics in main game
  if (activeGamePhase === 'actual') {
    if (g5Level === 1) {
      g5WAttempted++;
      if (isCorrect) g5WCorrect++;
    } else if (g5Level === 2) {
      g5CAttempted++;
      if (isCorrect) g5CCorrect++;
    } else if (g5Level === 3) {
      g5CWAttempted++;
      if (isCorrect) g5CWCorrect++;
    }
  }

  // Trigger sound feedback
  if (isCorrect) {
    if (window.GardenAudio) window.GardenAudio.playSuccess();
    _g5TriggerFlash(true);
  } else {
    if (window.GardenAudio) window.GardenAudio.playError();
    _g5TriggerFlash(false);
  }

  g5PracticeTrialsCount++;

  // Short pause before next item
  g5NextItemTimeout = setTimeout(() => {
    g5NextItem();
  }, 600);
  activeGameTimeouts.push(g5NextItemTimeout);
}

function _g5TriggerFlash(isCorrect) {
  const gc = document.getElementById('gameContainer');
  if (!gc) return;

  const flashClass = isCorrect ? 'stroop-correct-border-flash' : 'stroop-incorrect-shake';
  gc.classList.remove('stroop-correct-border-flash', 'stroop-incorrect-shake');
  void gc.offsetWidth; // trigger reflow
  gc.classList.add(flashClass);

  setTimeout(() => {
    gc.classList.remove(flashClass);
  }, 400);
}

function g5EndLevel() {
  if (g5TickInterval) clearInterval(g5TickInterval);
  if (g5LevelTimer) clearTimeout(g5LevelTimer);
  g5AwaitingAnswer = false;
  g5Stage = 'summary';
  g5RenderStroopUI();
}

function g5ProceedFromSummary() {
  if (g5Level < 3) {
    g5Level++;
    g5Stage = 'intro';
    g5RenderStroopUI();
  } else {
    // Stroop complete
    if (activeGamePhase === 'practice') {
      document.getElementById('nextPhaseBtn').classList.remove('d-none');
    } else {
      _finishGame5Stroop();
    }
  }
}

function _finishGame5Stroop() {
  // Compute overall diagnostics
  const totalAttempted = g5WAttempted + g5CAttempted + g5CWAttempted;
  const totalCorrect = g5WCorrect + g5CCorrect + g5CWCorrect;
  const overallAcc = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Speeds (items per second completed in 30 seconds)
  const wSpeed = +(g5WAttempted / 30).toFixed(2);
  const cSpeed = +(g5CAttempted / 30).toFixed(2);
  const cwSpeed = +(g5CWAttempted / 30).toFixed(2);

  // Time Interference (TI): W + C - CW (higher = slowed down during CW)
  const ti = g5WAttempted + g5CAttempted - g5CWAttempted;

  // Error Interference (EI): CWE - (WE + CE) / 2
  const wErrors = g5WAttempted - g5WCorrect;
  const cErrors = g5CAttempted - g5CCorrect;
  const cwErrors = g5CWAttempted - g5CWCorrect;
  const ei = +(cwErrors - ((wErrors + cErrors) / 2)).toFixed(1);

  gameSessionData.stroop = {
    // Multi-level metrics
    wAttempted: g5WAttempted,
    wCorrect: g5WCorrect,
    wAcc: g5WAttempted > 0 ? Math.round((g5WCorrect / g5WAttempted) * 100) : 0,
    wSpeed: wSpeed,

    cAttempted: g5CAttempted,
    cCorrect: g5CCorrect,
    cAcc: g5CAttempted > 0 ? Math.round((g5CCorrect / g5CAttempted) * 100) : 0,
    cSpeed: cSpeed,

    cwAttempted: g5CWAttempted,
    cwCorrect: g5CWCorrect,
    cwAcc: g5CWAttempted > 0 ? Math.round((g5CWCorrect / g5CWAttempted) * 100) : 0,
    cwSpeed: cwSpeed,

    // Integrated metrics
    timeInterference: ti,
    errorInterference: ei,

    // Legacy fields for backward compatibility
    acc: `${overallAcc}%`,
    rt: `${(1 / Math.max(cwSpeed, 0.1)).toFixed(1)}s`
  };

  if (overallAcc < 60) gameDifficulty = 'easy';
  else if (overallAcc > 85) gameDifficulty = 'hard';

  setTimeout(finishActiveGame, 1500);
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

function toggleVideoSize() {
  const wrapper = document.getElementById('demoVideoWrapper');
  const btn = document.getElementById('resizeVideoBtn');
  if (!wrapper || !btn) return;
  if (wrapper.style.maxWidth === '850px') {
    wrapper.style.maxWidth = '480px';
    btn.innerHTML = 'Theater Mode 📺';
  } else {
    wrapper.style.maxWidth = '850px';
    btn.innerHTML = 'Standard Mode 📺';
  }
}

// EOF
