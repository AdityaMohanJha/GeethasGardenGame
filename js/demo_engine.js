// ============================================================
// Demo Engine — animated canvas demos for each game
// Uses the same colours/layouts as the real games
// ============================================================

// CSS tokens (mirrored so canvas can use them)
const DM = {
  dark: '#030022',
  bg: '#FAFCF2',
  blueLt: '#E5F9FF',
  greenLt: '#E8FFF3',
  orangeLt: '#FFF0DC',
  pinkLt: '#FFE8F4',
  green: '#34BB72',
  pink: '#CB448D',
  blue: '#44CBCB',
  orange: '#F7A34A',
  red: '#BB3434',
  gold: '#FFD700',
  goldDark: '#FFC200',
  moleHole: '#6B4226',
  grass: '#5CB85C',
  white: '#FFFFFF',
  border: 3,
  shadow: 'rgba(80,80,100,0.28)',
};

// ── Active demo state ─────────────────────────────────────────
let _demoTimers = [];
let _demoIntervals = [];
let _demoCanvas = null;
let _demoCtx = null;
let _currentDemoGameIdx = 0;

function _demoT(fn, ms) {
  const id = setTimeout(fn, ms);
  _demoTimers.push(id);
  return id;
}
function _demoI(fn, ms) {
  const id = setInterval(fn, ms);
  _demoIntervals.push(id);
  return id;
}
function clearDemoLoops() {
  _demoTimers.forEach(clearTimeout);
  _demoIntervals.forEach(clearInterval);
  _demoTimers = [];
  _demoIntervals = [];
}

// ── Canvas helpers ────────────────────────────────────────────
function dRect(ctx, x, y, w, h, fill, stroke, lw) {
  ctx.save();
  ctx.fillStyle = fill || DM.white;
  ctx.strokeStyle = stroke || DM.dark;
  ctx.lineWidth = lw || DM.border;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function dShadow(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = DM.shadow;
  ctx.fillRect(x + 5, y + 5, w, h);
  ctx.restore();
}
function dText(ctx, txt, x, y, size, weight, color, align) {
  ctx.save();
  ctx.font = `${weight || 800} ${size || 14}px Inter, sans-serif`;
  ctx.fillStyle = color || DM.dark;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y);
  ctx.restore();
}
function dEmoji(ctx, emoji, x, y, size) {
  ctx.save();
  ctx.font = `${size || 22}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}
function dCircle(ctx, cx, cy, r, fill, stroke, lw) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke || DM.dark;
  ctx.lineWidth = lw || DM.border;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
function clearCanvas(ctx, w, h, bg) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg || DM.blueLt;
  ctx.fillRect(0, 0, w, h);
}

// ── Entry points ──────────────────────────────────────────────
function openDemoOverlay() {
  clearDemoLoops();
  _currentDemoGameIdx = activeGameIndex;

  // Update overlay title
  const titles = {
    1: '🌸 Demo: Flower Memory',
    2: '🐹 Demo: Whack-a-Mole',
    3: '🌿 Demo: Garden Path',
    4: '🕐 Demo: Clock Drawing',
    5: '🎨 Demo: Colour Word Match',
    6: '🧠 Demo: Delayed Recall',
  };
  const el = document.getElementById('demoOverlayTitle');
  if (el) el.innerText = titles[_currentDemoGameIdx] || 'Demo';

  const overlay = document.getElementById('demoOverlay');
  if (overlay) overlay.style.display = 'flex';

  // Set up canvas
  _demoCanvas = document.getElementById('demoAnimCanvas');
  if (!_demoCanvas) return;
  // Match aspect ratio 16:9 by setting intrinsic size
  _demoCanvas.width = 640;
  _demoCanvas.height = 360;
  _demoCtx = _demoCanvas.getContext('2d');

  runDemoForGame(_currentDemoGameIdx);
}

function closeDemoOverlay() {
  clearDemoLoops();
  const overlay = document.getElementById('demoOverlay');
  if (overlay) overlay.style.display = 'none';
}

function replayDemo() {
  clearDemoLoops();
  if (_demoCanvas && _demoCtx) {
    runDemoForGame(_currentDemoGameIdx);
  }
}

function runDemoForGame(idx) {
  const runners = {
    1: demoGame1,
    2: demoGame2,
    3: demoGame3,
    4: demoGame4,
    5: demoGame5,
    6: demoGame6,
  };
  if (runners[idx]) runners[idx](_demoCtx, _demoCanvas.width, _demoCanvas.height);
}

// ── Caption helper ────────────────────────────────────────────
function setCaption(text) {
  const el = document.getElementById('demoCaption');
  if (el) el.innerText = text;
}

// ============================================================
// GAME 1 DEMO — Flower Memory  (faithful replica of real game)
// ============================================================
function demoGame1(ctx, W, H) {
  // ── Layout constants (mirrors real CSS values) ────────────
  // Tile size: real game uses ~95px @ 400px max-width, 3 cols, 1.1rem gap
  // We scale proportionally to canvas width.
  const COLS = 3;
  const tileGap = Math.round(W * 0.030);   // ~1.1rem gap
  const tilePad = Math.round(W * 0.072);   // outer padding left/right
  const tileW = Math.floor((W - tilePad * 2 - tileGap * 2) / 3);
  const tileH = Math.round(tileW * 0.88); // slightly portrait like real 95px tiles

  // Vertical centering: title bar (barH) + status row + grid
  const barH = Math.round(H * 0.115);
  const statusY = barH + Math.round(H * 0.085);
  const gridTop = statusY + Math.round(H * 0.07);

  // START circle: sits just outside top-right corner of the grid
  const gridRight = tilePad + tileW * 3 + tileGap * 2;
  const circR = Math.round(W * 0.054);
  const circX = gridRight + circR + Math.round(W * 0.018);
  const circY = gridTop + Math.round(tileH * 0.5);

  // Cursor: a clean arrow pointer drawn in canvas
  function drawCursor(cx, cy, scale) {
    const s = scale || 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(2, 2); ctx.lineTo(2, 20); ctx.lineTo(6, 16); ctx.lineTo(9, 22);
    ctx.lineTo(11, 21); ctx.lineTo(8, 15); ctx.lineTo(13, 15); ctx.closePath();
    ctx.fill();
    // White fill
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.lineTo(4, 14); ctx.lineTo(7, 20);
    ctx.lineTo(9, 19); ctx.lineTo(6, 13); ctx.lineTo(11, 13); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Tile centre helpers
  function tileX(c) { return tilePad + c * (tileW + tileGap) + tileW / 2; }
  function tileY(r) { return gridTop + r * (tileH + tileGap) + tileH / 2; }
  function idxToRC(idx) { return { r: Math.floor(idx / COLS), c: idx % COLS }; }

  // ── Main draw function ────────────────────────────────────
  function drawScene(litIdx, cursorIdx, startLit, clickPop) {
    // Background  — matches real .game-container bg (#FAFCF2)
    ctx.fillStyle = '#FAFCF2';
    ctx.fillRect(0, 0, W, H);

    // Title bar (dark, like the real game header)
    ctx.fillStyle = DM.dark;
    ctx.fillRect(0, 0, W, barH);
    dText(ctx, '🌸  Flower Memory', W / 2, barH / 2, Math.round(H * 0.052), 800, '#ffffff');

    // Status badge
    const watching = litIdx >= 0;
    const yourTurn = litIdx === -2;
    const done = litIdx === -3;
    const statusTxt = yourTurn ? 'YOUR TURN 🫵' : watching ? 'WATCH! 👀' : done ? 'GREAT! 🌟' : '';
    const statusBg = yourTurn ? '#e8fff3' : watching ? '#ffe8f4' : '#e5f9ff';
    const statusBdr = yourTurn ? DM.green : watching ? DM.pink : DM.blue;
    const statusTxtC = yourTurn ? '#1a7a45' : watching ? '#8b1a5c' : '#1a6a8a';
    if (statusTxt) {
      const sw = Math.round(W * 0.36), sh = Math.round(H * 0.11);
      const sx = (W - sw) / 2, sy = barH + (gridTop - barH - sh) / 2;
      ctx.fillStyle = statusBg;
      ctx.strokeStyle = statusBdr;
      ctx.lineWidth = DM.border;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);
      dText(ctx, statusTxt, W / 2, sy + sh / 2, Math.round(H * 0.048), 800, statusTxtC);
    }

    // START circle
    const sLit = startLit || yourTurn;
    // outer glow when lit
    if (sLit) {
      ctx.save();
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 14;
      dCircle(ctx, circX, circY, circR, '#3b82f6', '#ffffff', 2.5);
      ctx.restore();
    } else {
      dCircle(ctx, circX, circY, circR, '#1d2b3a', DM.dark, 2);
    }
    dText(ctx, 'START', circX, circY, Math.round(H * 0.033), 800, sLit ? '#fff' : '#a8d5e2');

    // Grid tiles
    for (let r = 0; r < COLS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const x = tilePad + c * (tileW + tileGap);
        const y = gridTop + r * (tileH + tileGap);
        const lit = idx === litIdx;
        const pop = idx === clickPop;

        // shadow (matches var(--shadow-main) offset)
        ctx.fillStyle = 'rgba(80,80,100,0.22)';
        ctx.fillRect(x + 4, y + 4, tileW, tileH);

        // tile body
        if (lit || pop) {
          // Gold radial gradient — mirrors real .flower-btn.lit
          const grad = ctx.createRadialGradient(
            x + tileW / 2, y + tileH / 2, 2,
            x + tileW / 2, y + tileH / 2, tileW * 0.7
          );
          grad.addColorStop(0, '#FFF176');
          grad.addColorStop(0.6, '#FFD700');
          grad.addColorStop(1, '#FFC200');
          ctx.fillStyle = grad;
          ctx.save();
          ctx.shadowColor = 'rgba(255,215,0,0.85)';
          ctx.shadowBlur = pop ? 28 : 20;
          ctx.fillRect(x, y, tileW, tileH);
          ctx.restore();
          ctx.strokeStyle = DM.dark;
          ctx.lineWidth = DM.border;
          ctx.strokeRect(x, y, tileW, tileH);
          // Glow ring
          ctx.save();
          ctx.strokeStyle = '#FFC200';
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 2, y - 2, tileW + 4, tileH + 4);
          ctx.restore();
          // Sunflower emoji
          const emojiSz = Math.floor(tileH * 0.48);
          dEmoji(ctx, '🌻', x + tileW / 2, y + tileH / 2, emojiSz);
        } else {
          // Normal white tile (var(--color-white) + border-main)
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = DM.dark;
          ctx.lineWidth = DM.border;
          ctx.fillRect(x, y, tileW, tileH);
          ctx.strokeRect(x, y, tileW, tileH);
        }
      }
    }

    // Cursor on a specific tile
    if (cursorIdx != null && cursorIdx >= 0) {
      const { r, c } = idxToRC(cursorIdx);
      const cx = tilePad + c * (tileW + tileGap) + Math.round(tileW * 0.55);
      const cy = gridTop + r * (tileH + tileGap) + Math.round(tileH * 0.55);
      drawCursor(cx, cy, Math.min(tileW, tileH) / 56);
    }
  }

  // ── Sequence & animation ──────────────────────────────────
  const seq = [1, 5, 3];
  let step = 0;

  setCaption('Watch the flowers light up — then repeat the order!');
  drawScene(-1, null, false, null);

  function flashWatch() {
    if (step >= seq.length) {
      // Sequence done → START lights up
      drawScene(-2, null, true, null);
      setCaption('🔵 Blue circle lights up — your turn to click in order!');
      _demoT(startUserTurn, 900);
      return;
    }
    const tileIdx = seq[step];
    drawScene(tileIdx, null, false, null);
    _demoT(() => {
      drawScene(-1, null, false, null);
      step++;
      _demoT(flashWatch, 420);
    }, 680);
  }

  function startUserTurn() {
    let ust = 0;
    function userClick() {
      if (ust >= seq.length) {
        // All clicked — show success, loop
        drawScene(-3, null, false, null);
        setCaption('🎉 Correct! The sequence grows longer each round.');
        _demoT(() => {
          step = 0;
          drawScene(-1, null, false, null);
          setCaption('Watch the flowers light up — then repeat the order!');
          _demoT(flashWatch, 800);
        }, 2200);
        return;
      }
      const tileIdx = seq[ust];
      // Cursor approaches tile
      drawScene(-2, tileIdx, true, null);
      setCaption(`Clicking tile ${ust + 1} of ${seq.length}…`);
      _demoT(() => {
        // Click pop (lit + cursor)
        drawScene(tileIdx, tileIdx, true, tileIdx);
        _demoT(() => {
          drawScene(-2, null, true, null);
          ust++;
          _demoT(userClick, 680);
        }, 460);
      }, 420);
    }
    _demoT(userClick, 600);
  }

  _demoT(flashWatch, 700);
}

// ============================================================
// GAME 2 DEMO — Whack-a-Mole 3×3
// ============================================================
function demoGame2(ctx, W, H) {
  clearCanvas(ctx, W, H, DM.greenLt);
  const COLS = 3, gap = 8;
  const gridW = W - 60, gridH = H - 80;
  const cellW = Math.floor((gridW - gap * 2) / COLS);
  const cellH = Math.floor(cellW);
  const startX = 30, startY = 40;

  function drawScene(activeHole, hitHole, isDistractor) {
    // Sky-green BG
    clearCanvas(ctx, W, H, '#c8f5c0');
    // Title
    dRect(ctx, 0, 0, W, 30, DM.dark, DM.dark);
    dText(ctx, '🐹  Whack-a-Mole', W / 2, 15, 12, 800, DM.white);

    for (let i = 0; i < 9; i++) {
      const c = i % COLS, r = Math.floor(i / COLS);
      const x = startX + c * (cellW + gap);
      const y = startY + r * (cellH + gap);
      // Hole
      dShadow(ctx, x, y, cellW, cellH);
      dRect(ctx, x, y, cellW, cellH, DM.moleHole, DM.dark, DM.border);
      // Mole visible?
      if (i === activeHole) {
        const emoji = isDistractor ? '🐝' : '🐹';
        const hitEmoji = isDistractor ? '🚫' : '💥';
        dEmoji(ctx, i === hitHole ? hitEmoji : emoji,
          x + cellW / 2, y + cellH / 2, Math.floor(cellH * 0.55));
      }
    }
    // Grass strip
    ctx.save();
    ctx.fillStyle = DM.grass;
    ctx.fillRect(0, H - 28, W, 28);
    ctx.strokeStyle = DM.dark; ctx.lineWidth = DM.border;
    ctx.strokeRect(0, H - 28, W, 28);
    dText(ctx, '🌿🌿🌿🌿🌿🌿🌿🌿🌿🌿🌿🌿', W / 2, H - 14, 11, 400, DM.dark);
    ctx.restore();
  }

  const holes = [4, 1, 7, 2, 6]; // sequence of moles
  let i = 0;
  setCaption('Moles pop up — click them fast to save the garden!');

  function nextMole() {
    if (i >= holes.length) { i = 0; }
    const isD = (i === 3); // 4th one is a bee distractor
    drawScene(holes[i], -1, isD);
    setCaption(isD ? '🐝 That\'s a bee — don\'t click it!' : '🐹 Click the mole!');
    _demoT(() => {
      drawScene(holes[i], holes[i], isD); // hit
      setCaption(isD ? '🚫 Oops! Don\'t hit bees.' : '💥 Hit! Great reflexes!');
      _demoT(() => {
        drawScene(-1, -1, false);
        i++;
        _demoT(nextMole, 700);
      }, 600);
    }, 900);
  }
  _demoT(nextMole, 400);
}

// ============================================================
// GAME 3 DEMO — Garden Path
// ============================================================
function demoGame3(ctx, W, H) {
  clearCanvas(ctx, W, H, '#FFFEE9');
  const nodes = [
    { label: '1', x: 70, y: 180 },
    { label: 'A', x: 160, y: 80 },
    { label: '2', x: 270, y: 170 },
    { label: 'B', x: 370, y: 75 },
    { label: '3', x: 430, y: 200 },
  ];
  const NODE_R = 22;

  // Sequence header
  function drawHeader(seqArr, completedCount) {
    dRect(ctx, 0, 0, W, 34, DM.blueLt, DM.dark, DM.border);
    const parts = seqArr.map((l, i) => i < completedCount ? `✓${l}` : l);
    dText(ctx, 'Connect: ' + parts.join(' ➔ '), W / 2, 17, 11, 800, DM.dark);
  }

  function drawNodes(completedCount, activeIdx) {
    clearCanvas(ctx, W, H, '#FFFEE9');
    drawHeader(nodes.map(n => n.label), completedCount);

    // Draw lines for completed
    for (let i = 1; i < completedCount; i++) {
      ctx.save();
      ctx.strokeStyle = DM.dark; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y);
      ctx.lineTo(nodes[i].x, nodes[i].y);
      ctx.stroke();
      ctx.restore();
    }

    nodes.forEach((n, i) => {
      const done = i < completedCount;
      const active = i === activeIdx;
      const fill = done ? DM.green : active ? DM.orange : DM.white;
      dShadow(ctx, n.x - NODE_R, n.y - NODE_R, NODE_R * 2, NODE_R * 2);
      dCircle(ctx, n.x, n.y, NODE_R, fill, active ? DM.orange : DM.dark, 3);
      dText(ctx, n.label, n.x, n.y, 13, 800, done ? DM.white : DM.dark);
    });

    // cursor hand
    if (activeIdx >= 0 && activeIdx < nodes.length) {
      const n = nodes[activeIdx];
      ctx.font = '20px serif';
      ctx.fillText('👆', n.x + 14, n.y - 18);
    }
  }

  setCaption('Connect numbers and letters in order — tap the highlighted stone!');
  let step = 0;

  function advanceStep() {
    if (step > nodes.length) { step = 0; }
    if (step === nodes.length) {
      drawNodes(nodes.length, -1);
      setCaption('🎉 Path complete! Well done!');
      _demoT(() => { step = 0; advanceStep(); }, 2200);
      return;
    }
    drawNodes(step, step);
    setCaption(step === 0
      ? 'Start at 1 — the orange stone shows where to tap!'
      : `Tap ${nodes[step].label} — follow the sequence!`);
    _demoT(() => { step++; advanceStep(); }, 950);
  }
  _demoT(advanceStep, 400);
}

// ============================================================
// GAME 4 DEMO — Clock Drawing
// ============================================================
function demoGame4(ctx, W, H) {
  const cx = W / 2, cy = H / 2 + 10, R = 90;
  // Target: 11:10

  function drawClockScene(drawnFraction, showMinute, showHour) {
    clearCanvas(ctx, W, H, DM.bg);
    dRect(ctx, 0, 0, W, 30, DM.dark, DM.dark);
    dText(ctx, '🕐  Clock Drawing', W / 2, 15, 12, 800, DM.white);

    // Time prompt
    dRect(ctx, W / 2 - 90, 34, 180, 28, DM.orangeLt, DM.dark, 2);
    dText(ctx, 'Set hands to: 11:10', W / 2, 48, 11, 800, DM.dark);

    // Guide circle (dashed)
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Partial user-drawn circle arc
    if (drawnFraction > 0) {
      ctx.save();
      ctx.strokeStyle = DM.dark; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, R - 4, -Math.PI / 2, -Math.PI / 2 + drawnFraction * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hour numbers (just 12, 3, 6, 9)
    [[12, 0], [3, 90], [6, 180], [9, 270]].forEach(([n, deg]) => {
      const rad = (deg - 90) * Math.PI / 180;
      const nx = cx + Math.cos(rad) * (R - 14);
      const ny = cy + Math.sin(rad) * (R - 14);
      dText(ctx, String(n), nx, ny, 10, 800, DM.dark);
    });

    // Hour hand (11 o'clock + 10min = ~330°)
    if (showHour) {
      const hAngle = ((11 + 10 / 60) / 12 * 360 - 90) * Math.PI / 180;
      ctx.save();
      ctx.strokeStyle = DM.dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hAngle) * (R * 0.55), cy + Math.sin(hAngle) * (R * 0.55));
      ctx.stroke();
      ctx.restore();
    }
    // Minute hand (10 min = 60°)
    if (showMinute) {
      const mAngle = (10 / 60 * 360 - 90) * Math.PI / 180;
      ctx.save();
      ctx.strokeStyle = DM.pink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(mAngle) * (R * 0.75), cy + Math.sin(mAngle) * (R * 0.75));
      ctx.stroke();
      ctx.restore();
    }
    // Centre dot
    dCircle(ctx, cx, cy, 4, DM.dark, DM.dark, 1);

    // Pencil cursor
    ctx.font = '18px serif';
    ctx.fillText('✏️', cx + R - 6, cy - R + 6);
  }

  setCaption('Draw a clock face and place the hands at 11:10.');
  let frac = 0;
  const drawInterval = _demoI(() => {
    frac = Math.min(frac + 0.04, 1);
    drawClockScene(frac, false, false);
    if (frac >= 1) {
      clearInterval(drawInterval);
      _demoIntervals = _demoIntervals.filter(id => id !== drawInterval);
      setCaption('Now draw the minute hand (pink) to 10…');
      _demoT(() => {
        drawClockScene(1, true, false);
        setCaption('Now draw the hour hand (dark) to 11…');
        _demoT(() => {
          drawClockScene(1, true, true);
          setCaption('✅ 11:10 — that\'s correct! Click Submit Clock when ready.');
          _demoT(() => {
            frac = 0;
            demoGame4(ctx, W, H); // loop
          }, 3000);
        }, 1200);
      }, 1200);
    }
  }, 30);
}

// ============================================================
// GAME 5 DEMO — Colour Stroop
// ============================================================
function demoGame5(ctx, W, H) {
  const trials = [
    { word: 'RED', wordColor: DM.blue, correct: 'BLUE' },
    { word: 'GREEN', wordColor: DM.pink, correct: 'PINK' },
    { word: 'BLUE', wordColor: DM.green, correct: 'GREEN' },
  ];
  const btnColors = [
    { name: 'RED', bg: '#FFC4C4', border: DM.red },
    { name: 'BLUE', bg: '#B8D3FF', border: '#0055FF' },
    { name: 'GREEN', bg: '#B3F0CC', border: DM.green },
    { name: 'PINK', bg: '#F9C8E4', border: DM.pink },
  ];

  function drawScene(trial, flashName, result) {
    clearCanvas(ctx, W, H, DM.bg);
    dRect(ctx, 0, 0, W, 30, DM.dark, DM.dark);
    dText(ctx, '🎨  Colour Word Match', W / 2, 15, 12, 800, DM.white);

    // Word
    ctx.save();
    ctx.font = `800 52px Lora, Georgia, serif`;
    ctx.fillStyle = trial.wordColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(trial.word, W / 2, 105);
    ctx.restore();

    // Instruction
    dText(ctx, 'Click the INK COLOUR — not the word!', W / 2, 145, 10, 600, '#555');

    // 2×2 buttons
    const bW = 95, bH = 34, bGap = 10;
    const bStartX = W / 2 - bW - bGap / 2;
    const bStartY = 162;
    btnColors.forEach((b, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = bStartX + col * (bW + bGap);
      const by = bStartY + row * (bH + bGap);
      const isFlash = b.name === flashName;
      const isFill = isFlash && result === 'correct' ? DM.green
        : isFlash && result === 'wrong' ? DM.red
          : b.bg;
      dShadow(ctx, bx, by, bW, bH);
      ctx.save();
      ctx.fillStyle = isFill;
      ctx.strokeStyle = b.border; ctx.lineWidth = 2.5;
      ctx.fillRect(bx, by, bW, bH);
      ctx.strokeRect(bx, by, bW, bH);
      ctx.restore();
      dText(ctx, b.name, bx + bW / 2, by + bH / 2, 11, 800, DM.dark);
    });

    // Feedback strip
    if (result) {
      const msg = result === 'correct' ? '✅ Correct! Ink was ' + trial.correct
        : '🔄 The ink colour was ' + trial.correct;
      const fbColor = result === 'correct' ? DM.greenLt : DM.orangeLt;
      dRect(ctx, 10, H - 38, W - 20, 28, fbColor, DM.dark, 2);
      dText(ctx, msg, W / 2, H - 24, 10, 800, DM.dark);
    }
  }

  let t = 0;
  setCaption('Read the INK COLOUR — ignore what the word says!');

  function nextTrial() {
    const trial = trials[t % trials.length];
    drawScene(trial, null, null);
    setCaption(`The word says "${trial.word}" but the ink is ${trial.correct}. Click ${trial.correct}!`);
    _demoT(() => {
      drawScene(trial, trial.correct, 'correct');
      setCaption(`✅ Correct! Ink was ${trial.correct}, not "${trial.word}".`);
      _demoT(() => { t++; nextTrial(); }, 1800);
    }, 1400);
  }
  _demoT(nextTrial, 500);
}

// ============================================================
// GAME 6 DEMO — Delayed Recall
// ============================================================
function demoGame6(ctx, W, H) {
  const items = [
    { emoji: '🌸', label: 'FLOWER', target: true },
    { emoji: '🐱', label: 'CAT', target: true },
    { emoji: '🔑', label: 'KEY', target: true },
    { emoji: '⛵', label: 'BOAT', target: true },
    { emoji: '🏡', label: 'HOUSE', target: true },
    { emoji: '🍎', label: 'APPLE', target: false },
    { emoji: '⏰', label: 'CLOCK', target: false },
    { emoji: '🚲', label: 'BIKE', target: false },
  ];

  function drawGrid(selectedSet, revealTargets) {
    clearCanvas(ctx, W, H, DM.bg);
    dRect(ctx, 0, 0, W, 30, DM.dark, DM.dark);
    dText(ctx, '🧠  Delayed Recall — Which did you memorise?', W / 2, 15, 11, 800, DM.white);

    const cols = 4, cW = 98, cH = 56, gX = 18, gY = 42, gap = 7;
    items.forEach((item, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = gX + c * (cW + gap), y = gY + r * (cH + gap);
      const isSel = selectedSet.has(i);
      const isCorrect = revealTargets && item.target && isSel;
      const isWrong = revealTargets && !item.target && isSel;
      const fill = isCorrect ? DM.greenLt
        : isWrong ? '#FFE4E4'
          : isSel ? DM.blueLt
            : DM.white;
      const border = isCorrect ? DM.green : isWrong ? DM.red : isSel ? DM.blue : DM.dark;
      dShadow(ctx, x, y, cW, cH);
      dRect(ctx, x, y, cW, cH, fill, border, 2.5);
      dEmoji(ctx, item.emoji, x + cW / 2, y + cH / 2 - 8, 20);
      dText(ctx, item.label, x + cW / 2, y + cH - 11, 8, 800, DM.dark);
    });
  }

  setCaption('Think back to Step 4 — select the 5 items you memorised!');
  drawGrid(new Set(), false);

  // Animate: select 4 correct + 1 wrong, then reveal
  const order = [0, 1, 2, 5, 3]; // items picked step by step (5 is wrong)
  const selected = new Set();
  let step = 0;

  function pickNext() {
    if (step >= order.length) {
      // Reveal
      drawGrid(selected, true);
      setCaption('🌸 Review your picks! Green = correct, red = not memorised.');
      _demoT(() => {
        selected.clear();
        step = 0;
        drawGrid(new Set(), false);
        setCaption('Think back to Step 4 — select the 5 items you memorised!');
        _demoT(pickNext, 1200);
      }, 2800);
      return;
    }
    selected.add(order[step]);
    drawGrid(selected, false);
    const item = items[order[step]];
    setCaption(`Selecting "${item.label}"…`);
    step++;
    _demoT(pickNext, 800);
  }
  _demoT(pickNext, 700);
}

// ── Thumbnail renderer (small preview on intro page) ──────────
function renderDemoThumb(gameIdx) {
  const thumb = document.getElementById('demoThumbCanvas');
  if (!thumb) return;
  // Wait for layout
  requestAnimationFrame(() => {
    const w = thumb.offsetWidth || 320;
    const h = thumb.offsetHeight || 180;
    thumb.width = w;
    thumb.height = h;
    const tctx = thumb.getContext('2d');
    // Draw a static snapshot (first frame) of the demo
    thumbSnapshots[gameIdx] && thumbSnapshots[gameIdx](tctx, w, h);
  });
}

// Static first-frame thumbnails for each game
const thumbSnapshots = {
  1(ctx, W, H) {
    // Dark title bar
    ctx.fillStyle = '#FAFCF2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DM.dark; ctx.fillRect(0, 0, W, Math.round(H * 0.13));
    dText(ctx, '🌸 Flower Memory', W / 2, Math.round(H * 0.065), 10, 800, DM.white);
    // Grid
    const gap = Math.round(W * 0.030), pad = Math.round(W * 0.072);
    const cW = Math.floor((W - pad * 2 - gap * 2) / 3);
    const cH = Math.round(cW * 0.88);
    const gTop = Math.round(H * 0.22);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      const x = pad + c * (cW + gap), y = gTop + r * (cH + gap);
      ctx.fillStyle = 'rgba(80,80,100,0.18)'; ctx.fillRect(x + 4, y + 4, cW, cH);
      if (i === 1) {
        const g = ctx.createRadialGradient(x + cW / 2, y + cH / 2, 2, x + cW / 2, y + cH / 2, cW * 0.7);
        g.addColorStop(0, '#FFF176'); g.addColorStop(0.6, '#FFD700'); g.addColorStop(1, '#FFC200');
        ctx.fillStyle = g;
      } else { ctx.fillStyle = '#ffffff'; }
      ctx.strokeStyle = DM.dark; ctx.lineWidth = 2;
      ctx.fillRect(x, y, cW, cH); ctx.strokeRect(x, y, cW, cH);
      if (i === 1) dEmoji(ctx, '🌻', x + cW / 2, y + cH / 2, Math.floor(cH * 0.5));
    }
    // Dark overlay + play button
    ctx.fillStyle = 'rgba(3,0,34,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', W / 2, H / 2);
    dText(ctx, 'Watch how to play', W / 2, H / 2 + 20, 10, 600, 'rgba(255,255,255,0.8)');
  },
  2(ctx, W, H) {
    ctx.fillStyle = '#c8f5c0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DM.dark; ctx.fillRect(0, 0, W, 22);
    dText(ctx, '🐹 Whack-a-Mole', W / 2, 11, 10, 800, DM.white);
    const cW = Math.floor((W - 40) / 3), cH = Math.floor(cW * 0.85), gap = 6;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = 20 + c * (cW + gap), y = 30 + r * (cH + gap);
      ctx.fillStyle = DM.moleHole; ctx.strokeStyle = DM.dark; ctx.lineWidth = 2;
      ctx.fillRect(x, y, cW, cH); ctx.strokeRect(x, y, cW, cH);
      if (r === 1 && c === 1) dEmoji(ctx, '🐹', x + cW / 2, y + cH / 2, Math.floor(cH * 0.55));
    }
    ctx.fillStyle = 'rgba(3,0,34,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', W / 2, H / 2);
    dText(ctx, 'Watch how to play', W / 2, H / 2 + 20, 10, 600, 'rgba(255,255,255,0.8)');
  },
  3(ctx, W, H) {
    ctx.fillStyle = '#FFFEE9'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DM.dark; ctx.fillRect(0, 0, W, 22);
    dText(ctx, '🌿 Garden Path', W / 2, 11, 10, 800, DM.white);
    const pts = [{ x: W * .15, y: H * .6 }, { x: W * .35, y: H * .3 }, { x: W * .55, y: H * .7 }, { x: W * .75, y: H * .35 }, { x: W * .9, y: H * .65 }];
    ctx.strokeStyle = DM.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    pts.forEach((p, i) => {
      dCircle(ctx, p.x, p.y, 14, i === 0 ? DM.green : DM.white, DM.dark, 2);
      dText(ctx, ['1', 'A', '2', 'B', '3'][i], p.x, p.y, 9, 800, DM.dark);
    });
    ctx.fillStyle = 'rgba(3,0,34,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', W / 2, H / 2);
    dText(ctx, 'Watch how to play', W / 2, H / 2 + 20, 10, 600, 'rgba(255,255,255,0.8)');
  },
  4(ctx, W, H) {
    ctx.fillStyle = DM.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DM.dark; ctx.fillRect(0, 0, W, 22);
    dText(ctx, '🕐 Clock Drawing', W / 2, 11, 10, 800, DM.white);
    const cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) * 0.34;
    ctx.strokeStyle = '#CCC'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    [[12, 0], [3, 90], [6, 180], [9, 270]].forEach(([n, deg]) => {
      const rad = (deg - 90) * Math.PI / 180;
      dText(ctx, String(n), cx + Math.cos(rad) * (R - 10), cy + Math.sin(rad) * (R - 10), 8, 800, DM.dark);
    });
    ctx.fillStyle = 'rgba(3,0,34,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', W / 2, H / 2);
    dText(ctx, 'Watch how to play', W / 2, H / 2 + 20, 10, 600, 'rgba(255,255,255,0.8)');
  },
  5(ctx, W, H) {
    ctx.fillStyle = DM.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DM.dark; ctx.fillRect(0, 0, W, 22);
    dText(ctx, '🎨 Colour Word Match', W / 2, 11, 10, 800, DM.white);
    ctx.font = `800 ${Math.floor(H * 0.28)}px Lora,Georgia,serif`;
    ctx.fillStyle = DM.pink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GREEN', W / 2, H * 0.5);
    ctx.fillStyle = 'rgba(3,0,34,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', W / 2, H / 2);
    dText(ctx, 'Watch how to play', W / 2, H / 2 + 20, 10, 600, 'rgba(255,255,255,0.8)');
  },
  6(ctx, W, H) {
    ctx.fillStyle = DM.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DM.dark; ctx.fillRect(0, 0, W, 22);
    dText(ctx, '🧠 Delayed Recall', W / 2, 11, 10, 800, DM.white);
    const items = ['🌸', '🐱', '🔑', '⛵', '🏡', '🍎', '⏰', '🚲'];
    const cols = 4, cW = Math.floor((W - 20) / cols), cH = Math.floor((H - 36) / 2), gap = 4;
    items.forEach((e, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = 10 + c * (cW + gap), y = 30 + r * (cH + gap);
      ctx.fillStyle = i < 5 ? DM.greenLt : DM.white; ctx.strokeStyle = DM.dark; ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, cW, cH); ctx.strokeRect(x, y, cW, cH);
      dEmoji(ctx, e, x + cW / 2, y + cH / 2, Math.floor(cH * 0.55));
    });
    ctx.fillStyle = 'rgba(3,0,34,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', W / 2, H / 2);
    dText(ctx, 'Watch how to play', W / 2, H / 2 + 20, 10, 600, 'rgba(255,255,255,0.8)');
  },
};
