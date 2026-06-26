// ============================================================
// App State Management & Core Logic
// ============================================================

window.CustomDialog = {
  _createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    document.body.appendChild(overlay);
    return overlay;
  },
  _createBox(title, message) {
    const box = document.createElement('div');
    box.className = 'custom-dialog-box';
    box.innerHTML = `
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="custom-dialog-buttons"></div>
    `;
    return box;
  },
  alert(message) {
    return new Promise(resolve => {
      const overlay = this._createOverlay();
      const box = this._createBox('Alert', message);
      const btnContainer = box.querySelector('.custom-dialog-buttons');
      
      const okBtn = document.createElement('button');
      okBtn.className = 'btn btn-green';
      okBtn.textContent = 'OK';
      okBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve();
      };
      
      btnContainer.appendChild(okBtn);
      overlay.appendChild(box);
    });
  },
  confirm(message) {
    return new Promise(resolve => {
      const overlay = this._createOverlay();
      const box = this._createBox('Please Confirm', message);
      const btnContainer = box.querySelector('.custom-dialog-buttons');
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-red';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve(false);
      };
      
      const okBtn = document.createElement('button');
      okBtn.className = 'btn btn-green';
      okBtn.textContent = 'Confirm';
      okBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve(true);
      };
      
      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(okBtn);
      overlay.appendChild(box);
    });
  }
};

// Web Audio API Sound Synthesizer for interactive feedback
window.GardenAudio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playPop() {
    // Button sounds completely removed
  },
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const playNote = (freq, start, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playNote(523.25, now, 0.08); // C5
      playNote(659.25, now + 0.06, 0.08); // E5
      playNote(783.99, now + 0.12, 0.12); // G5
    } catch (e) { }
  },
  playError() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.2);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch (e) { }
  },
  playFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const playNote = (freq, start, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playNote(523.25, now, 0.12); // C5
      playNote(587.33, now + 0.1, 0.12); // D5
      playNote(659.25, now + 0.2, 0.12); // E5
      playNote(783.99, now + 0.3, 0.18); // G5
      playNote(659.25, now + 0.4, 0.12); // E5
      playNote(783.99, now + 0.5, 0.35); // G5
    } catch (e) { }
  }
};

// Global click listeners for cooldown and click pop feedback sounds
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (btn && !btn.disabled && !btn.classList.contains('no-cooldown') && !btn.classList.contains('btn-cooldown-active')) {
    // Button click sound removed as requested
    btn.classList.add('btn-cooldown-active');
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.classList.remove('btn-cooldown-active');
      btn.style.pointerEvents = '';
    }, 600);
  }

}, true);


// ── Database bootstrap ────────────────────────────────────────
function initDatabase() {
  if (!localStorage.getItem('usersDB')) {
    const defaultUsers = [
      { username: 'rose_gardener', name: 'Grandma Rose', password: 'password123', role: 'patient' },
      { username: 'dr_sarah', name: 'Dr. Sarah', password: 'password123', role: 'doctor' }
    ];
    localStorage.setItem('usersDB', JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem('patientAssessments')) {
    const dummy = [{
      username: 'rose_gardener', name: 'Grandma Rose',
      date: new Date().toLocaleDateString(),
      viewed: false,
      preAssessment: {
        feeling: 'Calm', timeOfDay: 'Evening',
        orientation: { date: '16', month: 'June', year: '2026', day: 'Tuesday', location: 'Lounge', city: 'Mumbai' },
        naming: { obj1: 'Apple', obj2: 'Clock', obj3: 'Bicycle' },
        subtraction: [
          { question: '88-7', answer: '81', correct: true }, { question: '81-7', answer: '74', correct: true },
          { question: '74-7', answer: '67', correct: true }, { question: '67-7', answer: '60', correct: true },
          { question: '60-7', answer: '53', correct: true }
        ],
        sentenceRepetition: [
          { sentence: 'The sunny sunset garden smells of fresh lavender and wet earth.', result: 'Correct' },
          { sentence: 'Two busy bees carried golden pollen back to the wooden hive.', result: 'Correct' }
        ],
        verbalFluency: { letter: 'S', words: ['Sun', 'Sunset', 'Seed', 'Sprout', 'Soil'] },
        similarities: 'Both are fruits.'
      },
      games: {
        flowerMemory: { maxSeq: 5, score: 120 },
        whackMole: { maxGrid: '3x3', hits: 14 },
        gardenPath: { nodes: 6, time: '24 seconds' },
        stroop: { acc: '92%', rt: '1.2 seconds' },
        delayedRecall: { correct: 4, distractors: 3 },
        clockDrawing: ''
      },
      feedback: { enjoy: 'Loved them', easy: 'Very Easy', comments: '' }
    }];
    localStorage.setItem('patientAssessments', JSON.stringify(dummy));
  }
}
initDatabase();

// ── Auth ──────────────────────────────────────────────────────
let activeRole = 'patient';
let authMode = 'login';

function updateAuthFields() {
  const t = document.getElementById('formTitle');
  const sub = document.getElementById('submitBtn');
  const tog = document.getElementById('toggleActionText');

  const nfg = document.getElementById('nameFieldGroup');
  const afg = document.getElementById('ageFieldGroup');
  const gfg = document.getElementById('genderFieldGroup');
  const cfg = document.getElementById('contactFieldGroup');
  const efg = document.getElementById('educationFieldGroup');
  const tfg = document.getElementById('techFieldGroup');
  const cs = document.getElementById('consentSection');

  // Reset visibility of standard card elements
  const toggleGrp = document.querySelector('.login-toggle-group');
  if (toggleGrp) toggleGrp.classList.remove('d-none');
  if (t) t.classList.remove('d-none');
  const authForm = document.getElementById('authForm');
  if (authForm) authForm.classList.remove('d-none');
  if (cs) cs.classList.add('d-none');

  if (authMode === 'register') {
    t.innerText = activeRole === 'doctor' ? 'Clinician Registration' : 'Patient Registration';
    sub.innerText = 'Register Account';
    tog.innerHTML = `Already have an account? <a href="#" onclick="toggleMode(event)" style="font-weight:800;color:var(--color-pink);text-decoration:underline;">Login here</a>`;

    nfg.classList.remove('d-none');
    nfg.querySelector('input').setAttribute('required', 'true');
    afg.classList.remove('d-none');
    afg.querySelector('input').setAttribute('required', 'true');
    gfg.classList.remove('d-none');
    gfg.querySelector('input').setAttribute('required', 'true');
    cfg.classList.remove('d-none');
    cfg.querySelector('input').setAttribute('required', 'true');

    if (activeRole === 'patient') {
      efg.classList.remove('d-none');
      efg.querySelector('select').setAttribute('required', 'true');
      tfg.classList.remove('d-none');
      tfg.querySelector('select').setAttribute('required', 'true');
    } else {
      efg.classList.add('d-none');
      efg.querySelector('select').removeAttribute('required');
      tfg.classList.add('d-none');
      tfg.querySelector('select').removeAttribute('required');
    }
  } else {
    t.innerText = activeRole === 'doctor' ? 'Clinician Login' : 'Patient Login';
    sub.innerText = 'Log In';
    tog.innerHTML = `Don't have an account? <a href="#" onclick="toggleMode(event)" style="font-weight:800;color:var(--color-pink);text-decoration:underline;">Register here</a>`;

    [nfg, afg, gfg, cfg, efg, tfg].forEach(fg => {
      if (fg) {
        fg.classList.add('d-none');
        const inp = fg.querySelector('input, select');
        if (inp) inp.removeAttribute('required');
      }
    });
  }
}

function setRole(role) {
  activeRole = role;
  document.getElementById('togglePatient').classList.toggle('active', role === 'patient');
  document.getElementById('toggleDoctor').classList.toggle('active', role === 'doctor');
  updateAuthFields();
}

function toggleMode(e) {
  if (e) e.preventDefault();
  authMode = authMode === 'login' ? 'register' : 'login';
  updateAuthFields();
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('regName')?.value.trim() || '';
  const usernameInput = document.getElementById('authUsername').value.trim();
  const passwordInput = document.getElementById('authPassword').value;
  const usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');

  if (authMode === 'register') {
    if (usersDB.some(u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.role === activeRole)) {
      CustomDialog.alert('An account with that username already exists.'); return;
    }

    if (activeRole === 'patient') {
      window.tempRegData = {
        username: usernameInput,
        name: nameInput || usernameInput,
        password: passwordInput,
        role: activeRole,
        age: document.getElementById('regAge').value.trim(),
        gender: document.getElementById('regGender').value.trim(),
        contact: document.getElementById('regContact').value.trim(),
        education: document.getElementById('regEducation').value,
        tech: document.getElementById('regTech').value
      };

      const toggleGrp = document.querySelector('.login-toggle-group');
      if (toggleGrp) toggleGrp.classList.add('d-none');
      document.getElementById('formTitle').classList.add('d-none');
      document.getElementById('authForm').classList.add('d-none');
      document.getElementById('consentSection').classList.remove('d-none');
    } else {
      const newUser = {
        username: usernameInput,
        name: nameInput || usernameInput,
        password: passwordInput,
        role: activeRole,
        age: document.getElementById('regAge').value.trim(),
        gender: document.getElementById('regGender').value.trim(),
        contact: document.getElementById('regContact').value.trim()
      };
      usersDB.push(newUser);
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
      localStorage.setItem('activeDoctor', JSON.stringify(newUser));
      window.location.href = 'doctor.html';
    }
  } else {
    const user = usersDB.find(u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput && u.role === activeRole);
    if (!user) { CustomDialog.alert('Invalid username or password.'); return; }
    if (activeRole === 'patient') { localStorage.setItem('activeUser', JSON.stringify(user)); window.location.href = 'patient.html'; }
    else { localStorage.setItem('activeDoctor', JSON.stringify(user)); window.location.href = 'doctor.html'; }
  }
}

function handleConsentSubmit(event) {
  event.preventDefault();
  const c1 = document.getElementById('consent1').checked;
  const c2 = document.getElementById('consent2').checked;
  const c3 = document.getElementById('consent3').checked;
  if (!c1 || !c2 || !c3) {
    CustomDialog.alert('Please accept all consent items to proceed.');
    return;
  }

  if (window.tempRegData) {
    const usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');
    usersDB.push(window.tempRegData);
    localStorage.setItem('usersDB', JSON.stringify(usersDB));
    localStorage.setItem('activeUser', JSON.stringify(window.tempRegData));
    delete window.tempRegData;
    window.location.href = 'patient.html';
  }
}

async function confirmLogout() {
  if (await CustomDialog.confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('activeUser');
    localStorage.removeItem('activeDoctor');
    window.location.href = 'index.html';
  }
}

// ── Patient Assessment Flow ───────────────────────────────────
let currentStep = 0;
let currentAssessmentData = {
  feeling: '', timeOfDay: '', orientation: {}, naming: {},
  subtraction: [], sentenceRepetition: [], verbalFluency: {}, similarities: '',
  games: {}, feedback: {}
};

function startPreAssessment() {
  document.getElementById('screenWelcome').style.display = 'none';
  currentStep = 1;
  updateAssessmentView();
}

// Back button handler — each step goes to the previous one
function goBack() {
  if (currentStep <= 1) {
    document.getElementById('screenWelcome').style.display = '';
    hideAllSteps();
    currentStep = 0;
    updateProgress(0, 8);
    return;
  }
  // Handle the fractional step 8.5 → go back to 8
  if (currentStep === 8.5) {
    currentStep = 8;
  } else {
    currentStep--;
  }
  updateAssessmentView();
}

function hideAllSteps() {
  const ids = ['stepEmotion', 'stepOrientation', 'stepNaming', 'stepEncoding',
    'stepSubtraction', 'stepSentence', 'stepFluency', 'stepSimilarities',
    'screenSession1Complete',
    'screenGameWrapper', 'screenFeedback', 'screenCongratulations'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('d-none'); });
}

function updateProgress(cur, total) {
  const fill = document.getElementById('progressBarFill');
  const txt = document.getElementById('progressText');
  if (!fill || !txt) return;
  fill.style.width = total > 0 ? `${(cur / total) * 100}%` : '100%';
  txt.innerText = total > 0 ? `Step ${cur} of ${total}` : (cur === 10 ? 'Feedback' : 'Done!');
}

function updateAssessmentView() {
  hideAllSteps();
  const skipBtn = document.getElementById('skipBtn');

  if (currentStep >= 1 && currentStep <= 8) {
    updateProgress(currentStep, 8);
    if (skipBtn) skipBtn.classList.remove('d-none');
  } else if (currentStep === 8.5) {
    updateProgress(8, 8); // all pre-assessment steps complete
    if (skipBtn) skipBtn.classList.add('d-none');
  } else if (currentStep === 9) {
    updateProgress(6, 6); // games manage their own bar updates via games.js
    if (skipBtn) skipBtn.classList.add('d-none');
  } else {
    updateProgress(0, 0);
    if (skipBtn) skipBtn.classList.add('d-none');
  }

  switch (currentStep) {
    case 1: document.getElementById('stepEmotion').classList.remove('d-none'); break;
    case 2: document.getElementById('stepOrientation').classList.remove('d-none');
      // Clear fields so autofill cannot pre-populate them
      ['orientDate', 'orientMonth', 'orientYear', 'orientDay'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      break;
    case 3:
      document.getElementById('stepNaming').classList.remove('d-none');
      initNamingImages();
      break;
    case 4:
      document.getElementById('stepEncoding').classList.remove('d-none');
      initEncodingImages();
      break;
    case 5: document.getElementById('stepSubtraction').classList.remove('d-none'); initSubtraction(); break;
    case 6: document.getElementById('stepSentence').classList.remove('d-none'); initSentenceRepetition(); break;
    case 7: document.getElementById('stepFluency').classList.remove('d-none'); initVerbalFluency(); break;
    case 8: document.getElementById('stepSimilarities').classList.remove('d-none'); break;
    case 8.5:
      document.getElementById('screenSession1Complete').classList.remove('d-none');
      break;
    case 9:
      document.getElementById('screenGameWrapper').classList.remove('d-none');
      if (typeof initGamesFlow === 'function') initGamesFlow();
      break;
    case 10: document.getElementById('screenFeedback').classList.remove('d-none'); break;
    case 11:
      document.getElementById('screenCongratulations').classList.remove('d-none');
      triggerCongratulations();
      break;
  }
}

// Mascot — always hidden (grandma disabled globally)
function showMascot() {
  const el = document.getElementById('mascotBox');
  if (el) el.classList.remove('d-none');
}
function hideMascot() {
  const el = document.getElementById('mascotBox');
  if (el) el.classList.add('d-none');
}

// ── Step 1: Emotion & Time ────────────────────────────────────
let selectedEmotionVal = '';
let selectedTimeOfDayVal = '';

function selectEmotion(val, el) {
  selectedEmotionVal = val;
  document.getElementById('emotionGrid').querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  checkStep1Complete();
}
function selectTimeOfDay(val, el) {
  selectedTimeOfDayVal = val;
  document.getElementById('todGrid').querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  checkStep1Complete();
}
function checkStep1Complete() {
  const btn = document.getElementById('continueStep1');
  if (!btn) return;
  if (selectedEmotionVal && selectedTimeOfDayVal) {
    btn.classList.remove('btn-submit-pending');
    btn.classList.add('btn-green');
  } else {
    btn.classList.add('btn-submit-pending');
    btn.classList.remove('btn-green');
  }
}
function submitStep1() {
  if (!selectedEmotionVal || !selectedTimeOfDayVal) return;
  currentAssessmentData.feeling = selectedEmotionVal;
  currentAssessmentData.timeOfDay = selectedTimeOfDayVal;
  currentStep = 2; updateAssessmentView();
}

// ── Step 2: Orientation ───────────────────────────────────────
function submitStep2() {
  const date = document.getElementById('orientDate').value.trim();
  const month = document.getElementById('orientMonth').value.trim();
  const year = document.getElementById('orientYear').value.trim();
  const day = document.getElementById('orientDay').value.trim();
  const location = document.getElementById('orientLocation').value.trim();
  const city = document.getElementById('orientCity').value.trim();
  if (!date || !month || !year || !day || !location || !city) {
    CustomDialog.alert('Please complete all fields. Write "Unsure" if you are not certain.'); return;
  }
  currentAssessmentData.orientation = { date, month, year, day, location, city };
  currentStep = 3; updateAssessmentView();
}

// ── Step 3: Naming ────────────────────────────────────────────
function submitStep3() {
  const obj1 = document.getElementById('namingObj1').value.trim();
  const obj2 = document.getElementById('namingObj2').value.trim();
  const obj3 = document.getElementById('namingObj3').value.trim();
  if (!obj1 || !obj2 || !obj3) { CustomDialog.alert('Please name all three objects.'); return; }
  currentAssessmentData.naming = { 
    obj1, obj2, obj3,
    expected: _namingSelected ? _namingSelected.map(i => i.label) : []
  };
  currentStep = 4; updateAssessmentView();
}

// ── Step 4: Memory Encoding ───────────────────────────────────
function submitStep4() { currentStep = 5; updateAssessmentView(); }

// ── Step 5: Serial Subtraction ────────────────────────────────
let subStartNum = 0, subDiff = 0, subCurrentNum = 0, subRoundIndex = 0;
const subTotalRounds = 5;

function initSubtraction() {
  subStartNum = Math.floor(Math.random() * 51) + 50;
  subDiff = Math.floor(Math.random() * 5) + 5;
  subCurrentNum = subStartNum;
  subRoundIndex = 0;
  currentAssessmentData.subtraction = [];
  document.getElementById('subMathDisplay').innerText = `${subStartNum} − ${subDiff}`;
  const inp = document.getElementById('subInput');
  inp.value = '';
  inp.onkeydown = e => { if (e.key === 'Enter') submitSubtractionRound(); };
  inp.focus();
}

function submitSubtractionRound() {
  const val = document.getElementById('subInput').value.trim();
  if (val === '') return;
  const expected = subCurrentNum - subDiff;
  const parsed = parseInt(val, 10);

  currentAssessmentData.subtraction.push({ question: `${subCurrentNum}-${subDiff}`, answer: val, expected: expected });
  subCurrentNum = isNaN(parsed) ? expected : parsed;
  subRoundIndex++;
  const inp = document.getElementById('subInput');
  inp.value = '';
  if (subRoundIndex < subTotalRounds) {
    document.getElementById('subMathDisplay').innerText = `${subCurrentNum} − ${subDiff}`;
    inp.focus();
  } else {
    currentStep = 6; updateAssessmentView();
  }
}

// ── Step 6: Sentence Repetition ───────────────────────────────
const sentenceRounds = [
  'The sunny sunset garden smells of fresh lavender and wet earth.',
  'Two busy bees carried golden pollen back to the wooden hive.'
];
let sentenceIndex = 0;

function initSentenceRepetition() {
  sentenceIndex = 0;
  currentAssessmentData.sentenceRepetition = [];
  document.getElementById('sentenceScoringPanel').classList.add('d-none');
  document.getElementById('sentenceStartBtnContainer').classList.remove('d-none');
  document.getElementById('sentenceTextDisplay').classList.add('d-none');
}

function startSentenceRound() {
  document.getElementById('sentenceStartBtnContainer').classList.add('d-none');
  const display = document.getElementById('sentenceTextDisplay');
  display.innerText = `"${sentenceRounds[sentenceIndex]}"`;
  display.classList.remove('d-none');
  setTimeout(() => {
    display.classList.add('d-none');
    document.getElementById('sentenceScoringPanel').classList.remove('d-none');
    const inp = document.getElementById('sentenceInput');
    if(inp) { inp.value = ''; inp.focus(); }
  }, 5000);
}

function submitSentence() {
  const inp = document.getElementById('sentenceInput');
  const typed = inp ? inp.value.trim() : '';
  if (!typed) { CustomDialog.alert('Please type the sentence from memory.'); return; }
  
  currentAssessmentData.sentenceRepetition.push({ 
    expected: sentenceRounds[sentenceIndex], 
    typed: typed 
  });
  
  document.getElementById('sentenceScoringPanel').classList.add('d-none');
  sentenceIndex++;
  if (sentenceIndex < 2) {
    document.getElementById('sentenceStartBtnContainer').classList.remove('d-none');
  } else {
    currentStep = 7; updateAssessmentView();
  }
}

// ── Step 7: Verbal Fluency ────────────────────────────────────
let fluencyTimerCount = 60, fluencyInterval = null;
let fluencyLetter = 'S', fluencyWordsList = [];
const alphabet = ['S', 'F', 'P', 'M', 'C'];

function initVerbalFluency() {
  if (fluencyInterval) clearInterval(fluencyInterval);
  fluencyTimerCount = 60;
  fluencyWordsList = [];
  fluencyLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
  document.getElementById('fluencyTimer').innerText = '60s';
  document.getElementById('fluencyLetter').innerText = `Letter: ${fluencyLetter}`;
  document.getElementById('fluencyWordsContainer').innerHTML = `<span style="color:#666;font-style:italic;">No words yet — type and press Enter.</span>`;
  document.getElementById('fluencyInputGroup').classList.remove('d-none');
  document.getElementById('fluencySubmitBtn').classList.add('d-none');
  const inp = document.getElementById('fluencyWordInput');
  inp.value = '';
  inp.disabled = false;
  inp.onkeydown = e => { if (e.key === 'Enter') addFluencyWord(); };
  startFluencyTimer();
}

function startFluencyTimer() {
  if (fluencyInterval) clearInterval(fluencyInterval);
  fluencyInterval = setInterval(() => {
    fluencyTimerCount--;
    document.getElementById('fluencyTimer').innerText = `${fluencyTimerCount}s`;
    if (fluencyTimerCount <= 0) { clearInterval(fluencyInterval); finishFluencyRound(); }
  }, 1000);
}

function addFluencyWord() {
  const inp = document.getElementById('fluencyWordInput');
  const word = inp.value.trim().toLowerCase();
  inp.value = '';
  if (!word || !word.startsWith(fluencyLetter.toLowerCase()) || fluencyWordsList.includes(word)) return;
  fluencyWordsList.push(word);
  document.getElementById('fluencyWordsContainer').innerHTML = fluencyWordsList.map(w => `<span class="fluency-tag">${w}</span>`).join('');
}

function finishFluencyRound() {
  const inp = document.getElementById('fluencyWordInput');
  inp.disabled = true;
  document.getElementById('fluencyInputGroup').classList.add('d-none');
  const btn = document.getElementById('fluencySubmitBtn');
  btn.classList.remove('d-none');
  if (fluencyWordsList.length > 0) {
    btn.classList.remove('btn-submit-pending');
    btn.classList.add('btn-green');
  }
}

function submitStep7() {
  currentAssessmentData.verbalFluency = { letter: fluencyLetter, words: fluencyWordsList };
  currentStep = 8; updateAssessmentView();
}

// ── Step 8: Abstract Similarities ────────────────────────────
function submitStep8() {
  const val = document.getElementById('similarityInput').value.trim();
  if (!val) { CustomDialog.alert('Please describe how the Apple and Mango are similar.'); return; }
  currentAssessmentData.similarities = val;
  localStorage.setItem('tempAssessmentData', JSON.stringify(currentAssessmentData));
  currentStep = 8.5; updateAssessmentView();
}

// ── Session 1 Complete → Enter Garden ────────────────────────
function startGardenJourney() {
  currentStep = 9; updateAssessmentView();
}

// ── Step 3: Randomised Naming Images ─────────────────────────
const namingPool = [
  { src: 'images/naming-key.jpg', label: 'Key' },
  { src: 'images/naming-pencil.jpg', label: 'Pencil' },
  { src: 'images/naming-watch.jpg', label: 'Watch' },
  { src: 'images/dist-apple.jpg', label: 'Apple' },
  { src: 'images/dist-bicycle.jpg', label: 'Bicycle' },
  { src: 'images/dist-elephant.jpg', label: 'Elephant' },
  { src: 'images/dist-keys.jpg', label: 'Keys' },
  { src: 'images/dist-phone.jpg', label: 'Phone' },
  { src: 'images/dist-radio.jpg', label: 'Radio' },
  { src: 'images/dist-umbrella.jpg', label: 'Umbrella' },
  { src: 'images/dist-watch.jpg', label: 'Watch' },
];
let _namingSelected = [];

function initNamingImages() {
  const grid = document.getElementById('namingGrid');
  if (!grid) return;
  // Pick 3 random unique items
  const shuffled = [...namingPool].sort(() => Math.random() - 0.5);
  _namingSelected = shuffled.slice(0, 3);
  grid.innerHTML = _namingSelected.map((item, i) => `
    <div class="naming-card">
      <div class="naming-image-box-img">
        <img src="${item.src}" alt="${item.label}" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <input type="text" id="namingObj${i + 1}" class="form-input" placeholder="What is this?" autocomplete="off">
    </div>
  `).join('');
}

// ── Step 4: Randomised Encoding Images ───────────────────────
const encodingPool = [
  { src: 'images/recall-basket.jpg', label: 'Basket' },
  { src: 'images/recall-chai.jpg', label: 'Chai' },
  { src: 'images/recall-coconut.jpg', label: 'Coconut' },
  { src: 'images/recall-cow.jpg', label: 'Cow' },
  { src: 'images/recall-cricket.jpg', label: 'Cricket' },
  { src: 'images/recall-curry.jpg', label: 'Curry' },
  { src: 'images/recall-diya.jpg', label: 'Diya' },
  { src: 'images/recall-feather.jpg', label: 'Feather' },
  { src: 'images/recall-hibiscus.jpg', label: 'Hibiscus' },
  { src: 'images/recall-kite.jpg', label: 'Kite' },
  { src: 'images/recall-lamp.jpg', label: 'Lamp' },
  { src: 'images/recall-lotus.jpg', label: 'Lotus' },
  { src: 'images/recall-mango.jpg', label: 'Mango' },
  { src: 'images/recall-om.jpg', label: 'Om' },
  { src: 'images/recall-peacock.jpg', label: 'Peacock' },
  { src: 'images/recall-rickshaw.jpg', label: 'Rickshaw' },
  { src: 'images/recall-shrine.jpg', label: 'Shrine' },
  { src: 'images/recall-temple.jpg', label: 'Temple' },
];

function initEncodingImages() {
  const grid = document.getElementById('encodingGrid');
  if (!grid) return;
  const shuffled = [...encodingPool].sort(() => Math.random() - 0.5);
  window._encodingSelected = shuffled.slice(0, 5);
  window._encodingDistractors = shuffled.slice(5);
  grid.innerHTML = window._encodingSelected.map(item => `
    <div class="encoding-card">
      <div class="encoding-image-box">
        <img src="${item.src}" alt="${item.label}" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <strong>${item.label}</strong>
    </div>
  `).join('');
}

// ── Skip button ───────────────────────────────────────────────
function handleSkip() {
  if (currentStep >= 1 && currentStep <= 8) { currentStep++; updateAssessmentView(); }
}

// ── Modals ────────────────────────────────────────────────────
function openPauseModal() { document.getElementById('pauseModal').classList.remove('d-none'); }
function closePauseModal() { document.getElementById('pauseModal').classList.add('d-none'); }
function closeInfoOverlay() { document.getElementById('infoModal').classList.add('d-none'); }
function viewAssessmentInfo() { closePauseModal(); toggleInfoOverlay(); }

function toggleInfoOverlay() {
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('infoModalTitle');
  const body = document.getElementById('infoModalBody');
  const explanations = {
    1: 'Emotional baseline and self-reported time-of-day orientation.',
    2: 'Spatial-temporal orientation: time and place.',
    3: 'Visual recognition and semantic naming of common objects.',
    4: 'Short-term memory encoding task for delayed recall later.',
    5: 'Serial subtraction — tests sustained attention and working memory.',
    6: 'Sentence repetition — auditory verbal memory and syntax.',
    7: 'Phonemic verbal fluency — executive function and lexical retrieval.',
    8: 'Abstract categorisation — semantic similarity and concept forming.',
    9: 'Interactive games: sequence, spatial reactivity, path, drawing, colour, recall.'
  };
  title.innerText = `Step ${currentStep} Info`;
  body.innerText = explanations[currentStep] || 'Follow the on-screen instructions at your own pace.';
  modal.classList.remove('d-none');
}

async function exitToDashboard() {
  if (await CustomDialog.confirm('Exit? Current step data will be discarded.')) window.location.href = 'index.html';
}

// ── Feedback & Congrats ───────────────────────────────────────
let selectedFeedbackEnjoy = '', selectedFeedbackEasy = '';

function selectFeedbackOption(category, val, el) {
  const id = category === 'enjoy' ? 'enjoyGrid' : 'difficultyGrid';
  document.getElementById(id).querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  if (category === 'enjoy') selectedFeedbackEnjoy = val;
  else selectedFeedbackEasy = val;
}

function submitFeedback(event) {
  event.preventDefault();
  if (!selectedFeedbackEnjoy || !selectedFeedbackEasy) { CustomDialog.alert('Please answer both survey questions.'); return; }
  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');
  const tempData = JSON.parse(localStorage.getItem('tempAssessmentData') || '{}');
  const gameResults = JSON.parse(localStorage.getItem('tempGameResults') || '{}');
  const finalReport = {
    username: activeUser.username || 'anonymous',
    name: activeUser.name || 'Anonymous',
    age: activeUser.age || 'N/A',
    gender: activeUser.gender || 'N/A',
    contact: activeUser.contact || 'N/A',
    education: activeUser.education || 'N/A',
    tech: activeUser.tech || 'N/A',
    date: new Date().toLocaleDateString(),
    viewed: false,
    preAssessment: tempData,
    games: gameResults,
    feedback: { enjoy: selectedFeedbackEnjoy, easy: selectedFeedbackEasy, comments: document.getElementById('feedbackComments').value.trim() }
  };
  const list = JSON.parse(localStorage.getItem('patientAssessments') || '[]');
  list.push(finalReport);
  localStorage.setItem('patientAssessments', JSON.stringify(list));
  currentStep = 11; updateAssessmentView();
}

// ── Congratulations: trophies + falling flowers ───────────────
function triggerCongratulations() {
  if (window.GardenAudio) window.GardenAudio.playFanfare();

  // Compute performance score 0-5
  const gameResults = JSON.parse(localStorage.getItem('tempGameResults') || '{}');
  let score = 0;
  if (gameResults.flowerMemory && gameResults.flowerMemory.maxSeq >= 4) score++;
  if (gameResults.whackMole && gameResults.whackMole.hits >= 6) score++;
  if (gameResults.gardenPath && parseInt(gameResults.gardenPath.time) <= 30) score++;
  if (gameResults.stroop && parseInt(gameResults.stroop.acc) >= 70) score++;
  if (gameResults.delayedRecall && gameResults.delayedRecall.correct >= 3) score++;

  // Render trophies
  const trophyRow = document.getElementById('trophyRow');
  if (trophyRow) {
    const filled = '🏆'.repeat(score);
    const empty = '⬜'.repeat(5 - score);
    trophyRow.innerHTML = `<span style="font-size:2.6rem;">${filled}${empty}</span>`;
  }

  // Falling flowers
  spawnFallingFlowers();
}

function spawnFallingFlowers() {
  const emojis = ['🌸', '🌼', '🌷', '🌹', '🌺', '🌻', '🍃', '🏵️', '💮'];
  for (let i = 0; i < 85; i++) {
    const el = document.createElement('div');
    el.className = 'falling-flower';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (1.5 + Math.random() * 5.0) + 'rem';
    el.style.animationDuration = (1.2 + Math.random() * 2.3) + 's';
    el.style.animationDelay = (Math.random() * 3.0) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function restartScreening() {
  localStorage.removeItem('tempAssessmentData');
  localStorage.removeItem('tempGameResults');
  currentStep = 0;
  window.location.reload();
}

// ── Clinician Dashboard ───────────────────────────────────────
let _currentReportIndex = -1;

function loadDoctorDashboard() {
  const activeDoc = localStorage.getItem('activeDoctor');
  if (!activeDoc) { window.location.href = 'index.html'; return; }
  const docObj = JSON.parse(activeDoc);
  const badge = document.getElementById('doctorNameBadge');
  if (badge) badge.innerText = docObj.name || docObj.username;
  renderPatientsTable(JSON.parse(localStorage.getItem('patientAssessments') || '[]'));
}

function renderPatientsTable(list) {
  const tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:2rem;color:#666;font-style:italic;">No patient records found.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((item, idx) => {
    let statusClass = 'badge-green', statusLabel = 'Completed';
    if (item.preAssessment?.subtraction) {
      const mistakes = item.preAssessment.subtraction.filter(s => !s.correct).length;
      if (mistakes > 2) { statusClass = 'badge-orange'; statusLabel = 'Attention'; }
    }
    const viewedMark = item.viewed ? ' ✓' : '';
    return `
      <tr>
        <td><strong>${item.name}</strong>${viewedMark ? ` <span style="color:var(--color-green);font-size:.8rem;">${viewedMark}</span>` : ''}</td>
        <td><code>${item.username}</code></td>
        <td>${item.date}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="btn btn-blue" onclick="showPatientReport(${idx})" style="padding:.35rem .75rem;font-size:.82rem;">View Report</button>
        </td>
      </tr>`;
  }).join('');
}

function filterPatientsList() {
  const q = document.getElementById('patientSearchInput').value.toLowerCase();
  const list = JSON.parse(localStorage.getItem('patientAssessments') || '[]');
  renderPatientsTable(list.filter(a => a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q)));
}

function showPatientReport(index) {
  const list = JSON.parse(localStorage.getItem('patientAssessments') || '[]');
  const record = list[index];
  if (!record) return;
  _currentReportIndex = index;

  const overlay = document.getElementById('reportOverlay');
  overlay.classList.add('active');

  document.getElementById('reportTitle').innerText = `Report: ${record.name}`;
  document.getElementById('reportDateBadge').innerText = `Date: ${record.date}`;

  // Demographics fields in report
  document.getElementById('repAge').innerText = record.age || 'N/A';
  document.getElementById('repGender').innerText = record.gender || 'N/A';
  document.getElementById('repContact').innerText = record.contact || 'N/A';
  document.getElementById('repEducation').innerText = record.education || 'N/A';
  document.getElementById('repTech').innerText = record.tech || 'N/A';

  const pa = record.preAssessment || {};
  document.getElementById('repFeeling').innerText = pa.feeling || 'N/A';
  document.getElementById('repTimeOfDay').innerText = pa.timeOfDay || 'N/A';
  const o = pa.orientation || {};
  document.getElementById('repDate').innerText = o.date || 'N/A';
  document.getElementById('repMonth').innerText = o.month || 'N/A';
  document.getElementById('repYear').innerText = o.year || 'N/A';
  document.getElementById('repDayOfWeek').innerText = o.day || 'N/A';
  document.getElementById('repLocation').innerText = o.location || 'N/A';
  document.getElementById('repCity').innerText = o.city || 'N/A';

  const n = pa.naming || {};
  document.getElementById('repNaming1').innerText = n.obj1 || 'Unanswered';
  document.getElementById('repNaming2').innerText = n.obj2 || 'Unanswered';
  document.getElementById('repNaming3').innerText = n.obj3 || 'Unanswered';
  const expected = n.expected || ['Apple', 'Clock', 'Bicycle'];
  const checkNaming = (ans, exp) => (!ans) ? '❌' : (ans.toLowerCase().trim() === exp.toLowerCase().trim() ? '✅' : '❌');
  document.getElementById('repNamingExp1').innerText = `(Expected: ${expected[0] || '?'}) ${checkNaming(n.obj1, expected[0])}`;
  document.getElementById('repNamingExp2').innerText = `(Expected: ${expected[1] || '?'}) ${checkNaming(n.obj2, expected[1])}`;
  document.getElementById('repNamingExp3').innerText = `(Expected: ${expected[2] || '?'}) ${checkNaming(n.obj3, expected[2])}`;

  const sub = pa.subtraction || [];
  document.getElementById('repSubList').innerHTML = sub.length
    ? sub.map(s => {
        const isCorrect = (parseInt(s.answer, 10) === parseInt(s.expected, 10));
        const mark = isCorrect ? '✅' : '❌';
        return `${s.question} = <strong>${s.answer}</strong> <span class="text-muted" style="color:#888;">(Expected: ${s.expected || '?'})</span> ${mark}`;
      }).join('<br>')
    : '—';

  const sent = pa.sentenceRepetition || [];
  const s1 = sent[0];
  const s2 = sent[1];
  const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const checkSentence = (ans, exp) => cleanStr(ans) === cleanStr(exp) ? '✅' : '❌';
  document.getElementById('repSent1').innerHTML = s1 ? `${s1.typed} <span class="text-muted" style="color:#888;font-weight:normal;">(Expected: ${s1.expected})</span> ${checkSentence(s1.typed, s1.expected)}` : 'N/A';
  document.getElementById('repSent2').innerHTML = s2 ? `${s2.typed} <span class="text-muted" style="color:#888;font-weight:normal;">(Expected: ${s2.expected})</span> ${checkSentence(s2.typed, s2.expected)}` : 'N/A';

  const fl = pa.verbalFluency || {};
  document.getElementById('repFluencyLetter').innerText = fl.letter || 'N/A';
  document.getElementById('repFluencyWords').innerText = fl.words?.join(', ') || '—';

  document.getElementById('repSimilarityText').innerText = pa.similarities || 'N/A';

  const g = record.games || {};

  // ── Game 1: Flower Memory ─────────────────────────────────
  const gf = g.flowerMemory || {};
  document.getElementById('g1MaxSpan').innerText      = gf.max_span ?? 'N/A';
  document.getElementById('g1AccuracyRate').innerText = gf.accuracy_rate != null ? `${gf.accuracy_rate}%` : 'N/A';
  document.getElementById('g1EncLatency').innerText   = gf.encoding_latency_ms != null ? `${gf.encoding_latency_ms} ms` : 'N/A';
  document.getElementById('g1SeqErrors').innerText    = gf.sequence_error_count ?? 'N/A';
  document.getElementById('g1SpatialErrors').innerText= gf.spatial_error_count ?? 'N/A';

  // ── Game 2: Whack-a-Mole ─────────────────────────────────
  const gw = g.whackMole || {};
  document.getElementById('g2MeanRT').innerText        = gw.mean_hit_rt_ms != null ? `${gw.mean_hit_rt_ms} ms` : 'N/A';
  document.getElementById('g2RTVariance').innerText    = gw.rt_variance    != null ? `±${gw.rt_variance} ms` : 'N/A';
  document.getElementById('g2OmissionErrors').innerText  = gw.omission_errors   ?? 'N/A';
  document.getElementById('g2CommissionErrors').innerText= gw.commission_errors ?? 'N/A';
  document.getElementById('g2Hits').innerText          = gw.hits            ?? 'N/A';
  document.getElementById('g2Targets').innerText       = gw.total_targets   ?? 'N/A';
  document.getElementById('g2HighestLevel').innerText  = gw.highest_level   ?? 'N/A';

  // ── Game 3: Garden Path ───────────────────────────────────
  const gp = g.gardenPath || {};
  document.getElementById('g3PathTime').innerText     = gp.total_path_time_sec != null ? `${gp.total_path_time_sec} s` : 'N/A';
  document.getElementById('g3SeqErrors').innerText    = gp.sequence_error_count ?? 'N/A';
  document.getElementById('g3CorrLatency').innerText  = gp.correction_latency_ms != null ? `${gp.correction_latency_ms} ms` : 'N/A';
  document.getElementById('g3DwellTime').innerText    = gp.dwell_time_ms != null ? `${gp.dwell_time_ms} ms` : 'N/A';

  // ── Game 4: Clock Drawing ─────────────────────────────────
  const gc4 = g.clockDrawing || {};
  const clockImg = typeof gc4 === 'string' ? gc4 : (gc4.image || '');
  document.getElementById('g4TargetTime').innerText    = gc4.target_time || 'N/A';
  document.getElementById('g4CompletionTime').innerText= gc4.total_completion_time_sec != null ? `${gc4.total_completion_time_sec} s` : 'N/A';

  const img = document.getElementById('clockDrawingImage');
  const noMsg = document.getElementById('noClockDrawingMsg');
  if (clockImg.startsWith('data:image')) {
    img.src = clockImg; img.style.display = 'inline-block'; noMsg.style.display = 'none';
  } else {
    img.src = ''; img.style.display = 'none'; noMsg.style.display = 'flex';
  }

  // ── Game 5: Colour Stroop ─────────────────────────────────
  const gs = g.stroop || {};
  document.getElementById('g5CongruentRT').innerText    = gs.congruent_rt_ms    != null ? `${gs.congruent_rt_ms} ms`    : 'N/A';
  document.getElementById('g5IncongruentRT').innerText  = gs.incongruent_rt_ms  != null ? `${gs.incongruent_rt_ms} ms`  : 'N/A';
  document.getElementById('g5InterferenceCost').innerText = gs.interference_cost_ms != null ? `${gs.interference_cost_ms} ms` : 'N/A';
  document.getElementById('g5IncongruentAcc').innerText = gs.incongruent_accuracy_rate != null ? `${gs.incongruent_accuracy_rate}%` : 'N/A';

  // ── Game 6: Delayed Recall ────────────────────────────────
  const gr = g.delayedRecall || {};
  document.getElementById('g6RetentionRate').innerText  = gr.recall_retention_rate != null ? `${gr.recall_retention_rate}%` : 'N/A';
  document.getElementById('g6IntrusionErrors').innerText= gr.intrusion_error_count ?? 'N/A';
  document.getElementById('g6RetrievalLatency').innerText= gr.retrieval_latency_ms != null ? `${gr.retrieval_latency_ms} ms` : 'N/A';
  document.getElementById('g6CorrectCount').innerText   = gr.correct_count  ?? 'N/A';
  document.getElementById('g6TotalTargets').innerText   = gr.total_targets  ?? 'N/A';

  const fd = record.feedback || {};
  document.getElementById('repFeedbackEnjoy').innerText = fd.enjoy || 'N/A';
  document.getElementById('repFeedbackEasy').innerText  = fd.easy  || 'N/A';
  document.getElementById('repFeedbackNotes').innerText = fd.comments || '—';

  overlay.scrollTop = 0;
}

function closeReport() {
  document.getElementById('reportOverlay').classList.remove('active');
  _currentReportIndex = -1;
}

function markCurrentViewed() {
  if (_currentReportIndex < 0) return;
  const list = JSON.parse(localStorage.getItem('patientAssessments') || '[]');
  if (list[_currentReportIndex]) {
    list[_currentReportIndex].viewed = true;
    localStorage.setItem('patientAssessments', JSON.stringify(list));
  }
  const btn = document.getElementById('markViewedBtn');
  if (btn) { btn.innerText = 'Viewed ✓'; btn.classList.add('btn-grey'); }
  renderPatientsTable(list);
}

function scrollToTable() {
  const el = document.querySelector('.stats-table-wrapper');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ── Startup ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('authForm')) {
    updateAuthFields();
  }
  if (window.location.pathname.endsWith('doctor.html')) {
    loadDoctorDashboard();
  }
  if (window.location.pathname.endsWith('patient.html')) {
    const activePatient = localStorage.getItem('activeUser');
    if (!activePatient) { window.location.href = 'index.html'; return; }
    const userObj = JSON.parse(activePatient);
    const nameEl = document.getElementById('welcomeName');
    if (nameEl) nameEl.innerText = `Welcome back, ${userObj.name || userObj.username}!`;

    // Wire skip button
    const skipBtn = document.getElementById('skipBtn');
    if (skipBtn) {
      skipBtn.onclick = function () {
        if (typeof activeGameIndex !== 'undefined' && activeGameIndex === 4 && typeof activeGamePhase !== 'undefined' && activeGamePhase === 'actual') {
          return; // clock game — must use Submit Clock
        }
        handleSkip();
      };
    }
  }
});

// Format memory strings
function _fmt(val) {
  return typeof val === 'string' ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : String(val);
}

function skipStep(step) {
  switch (step) {
    case 1:
      currentAssessmentData.feeling = 'Skipped';
      currentAssessmentData.timeOfDay = 'Skipped';
      currentStep = 2; break;
    case 2:
      currentAssessmentData.orientation = { date: 'Skipped', month: 'Skipped', year: 'Skipped', day: 'Skipped', location: 'Skipped', city: 'Skipped' };
      currentStep = 3; break;
    case 3:
      currentAssessmentData.naming = { obj1: 'Skipped', obj2: 'Skipped', obj3: 'Skipped', expected: _namingSelected ? _namingSelected.map(i => i.label) : [] };
      currentStep = 4; break;
    case 4:
      currentStep = 5; break;
    case 5:
      currentAssessmentData.subtraction.push({ question: `${subCurrentNum}-${subDiff}`, answer: 'Skipped', expected: subCurrentNum - subDiff });
      currentStep = 6; break;
    case 6:
      currentAssessmentData.sentenceRepetition.push({ expected: sentenceRounds[sentenceIndex], typed: 'Skipped' });
      sentenceIndex++;
      if (sentenceIndex >= 2) currentStep = 7;
      break;
    case 7:
      currentAssessmentData.verbalFluency = { letter: fluencyLetter, words: ['Skipped'] };
      currentStep = 8; break;
    case 8:
      currentAssessmentData.similarities = 'Skipped';
      localStorage.setItem('tempAssessmentData', JSON.stringify(currentAssessmentData));
      currentStep = 8.5; break;
  }
  updateAssessmentView();
}

document.addEventListener('DOMContentLoaded', () => {
  const stepMappings = [
    { container: 'stepOrientation', btnId: 'continueStep2' },
    { container: 'stepNaming', btnId: 'continueStep3' },
    { container: 'stepSubtraction', btnId: 'continueStep5' },
    { container: 'stepSentence', btnId: 'continueStep6' },
    { container: 'stepSimilarities', btnId: 'continueStep8' }
  ];

  stepMappings.forEach(mapping => {
    const container = document.getElementById(mapping.container);
    if (!container) return;
    const btn = document.getElementById(mapping.btnId);
    if (!btn) return;
    
    container.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        btn.classList.remove('btn-submit-pending');
        btn.classList.add('btn-green');
      }
    });
  });

  const step4Btn = document.getElementById('continueStep4');
  if (step4Btn) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (!mutation.target.classList.contains('d-none')) {
           setTimeout(() => {
             step4Btn.classList.remove('btn-submit-pending');
             step4Btn.classList.add('btn-green');
           }, 2000);
        }
      });
    });
    observer.observe(document.getElementById('stepEncoding'), { attributes: true, attributeFilter: ['class'] });
  }
});
