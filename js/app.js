// ============================================================
// Supabase Configuration & Initialization
// ============================================================
const SUPABASE_URL = 'https://vtpgtvzzqmrkrbvnyfoi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cGd0dnp6cW1ya3Jidm55Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjIwNjAsImV4cCI6MjA5NzQ5ODA2MH0.9H3svBbVNyv24SJh7EVJzGE19mpZRj_AJTmC93m9v_k';

// FIXED: Renamed to supabaseClient to prevent collision with window.supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// App State Management & Core Logic
// ============================================================

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

// Global click listeners for cooldown and click pop  sounds
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



window.startPreAssessment = function () {
    document.getElementById('screenWelcome').classList.add('d-none');
    document.getElementById('stepEmotion').classList.remove('d-none');

    if (typeof updateProgressBar === 'function') {
        updateProgressBar(1);
    }
};
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
     feedback : { enjoy: 'Loved them', easy: 'Very Easy', comments: '' }
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
    gfg.querySelector('select').setAttribute('required', 'true');
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
    
    // UPDATED: Only show the "Register here" toggle if the active role is patient
    tog.innerHTML = activeRole === 'patient' 
      ? `Don't have an account? <a href="#" onclick="toggleMode(event)" style="font-weight:800;color:var(--color-pink);text-decoration:underline;">Register here</a>` 
      : ''; 

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

async function handleAuthSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('regName')?.value.trim() || '';
  const usernameInput = document.getElementById('authUsername').value.trim();
  const passwordInput = document.getElementById('authPassword').value;

  if (authMode === 'register') {
    // Check if user exists in Supabase
    const { data: existingUsers } = await supabaseClient
      .from('app_users')
      .select('*')
      .eq('username', usernameInput)
      .eq('role', activeRole);

    if (existingUsers && existingUsers.length > 0) {
      alert('An account with that username already exists.'); 
      return;
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
      
      // Insert Doctor into Supabase
      await supabaseClient.from('app_users').insert([newUser]);
      localStorage.setItem('activeDoctor', JSON.stringify(newUser));
      window.location.href = 'doctor.html';
    }
  } else {
    // Login flow via Supabase
    const { data: user, error } = await supabaseClient
      .from('app_users')
      .select('*')
      .eq('username', usernameInput)
      .eq('password', passwordInput)
      .eq('role', activeRole)
      .single();

    if (error || !user) { 
      alert('Invalid username or password.'); 
      return; 
    }
    
    if (activeRole === 'patient') { 
      localStorage.setItem('activeUser', JSON.stringify(user)); 
      window.location.href = 'patient.html'; 
    } else { 
      localStorage.setItem('activeDoctor', JSON.stringify(user)); 
      window.location.href = 'doctor.html'; 
    }
  }
}

async function handleConsentSubmit(event) {
  event.preventDefault();
  const c1 = document.getElementById('consent1').checked;
  const c2 = document.getElementById('consent2').checked;
  const c3 = document.getElementById('consent3').checked;
  
  if (!c1 || !c2 || !c3) {
    alert('Please accept all consent items to proceed.');
    return;
  }

  if (window.tempRegData) {
    // Insert Patient into Supabase
    await supabaseClient.from('app_users').insert([window.tempRegData]);
    localStorage.setItem('activeUser', JSON.stringify(window.tempRegData));
    delete window.tempRegData;
    window.location.href = 'patient.html';
  }
}

function confirmLogout() {
  if (confirm('Are you sure you want to log out?')) {
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
function start() {
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
    'screenGameWrapper', 'screenGoogleForm', 'screenFeedback', 'screenCongratulations'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('d-none'); });
}

function updateProgress(cur, total) {
  const fill = document.getElementById('progressBarFill');
  const txt = document.getElementById('progressText');
  if (!fill || !txt) return;
  fill.style.width = total > 0 ? `${(cur / total) * 100}%` : '100%';
  txt.innerText = total > 0 ? `Step ${cur} of ${total}` : (cur === 10 ? '' : 'Done!');
}
let sentenceAudioUrls = [];
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
    case 10:
      document.getElementById('screenGoogleForm').classList.remove('d-none');
      break;
    case 11:
      document.getElementById('screenFeedback').classList.remove('d-none');
      break;
   case 12:
      document.getElementById('screenCongratulations').classList.remove('d-none');
      triggerCongratulations();
      break;
  }

  if (currentStep >= 1 && currentStep <= 9) {
    showGeethaDialogue(currentStep);
  } else {
    hideMascot();
  }
}

// Mascot — always hidden (grandma disabled globally)
let _geethaTypeInterval = null;

const GEETHA_LINES = {
  1: "How are you feeling today? Pick what fits, then tell me the time of day.",
  2: "Let's get grounded — tell me today's date and where you are right now.",
  3: "Take a look at these pictures and tell me what they are.",
  4: "Study these five carefully — I'll ask about them again soon!",
  5: "Let's do some quick subtraction together.",
  6: "Listen closely, then repeat the sentence back to me.",
  7: "Quick as you can — name words starting with the letter shown!",
  8: "Tell me how these two are alike.",
  9: "Time to play! Six little games are waiting in the garden."
};

function showGeethaDialogue(step) {
  const line = GEETHA_LINES[step];
  const box = document.getElementById('mascotBox');
  const textEl = document.getElementById('mascotDialogueText');
  if (!line || !box || !textEl) { hideMascot(); return; }

  if (_geethaTypeInterval) clearInterval(_geethaTypeInterval);
  let typed = '';
  textEl.textContent = '';
  box.classList.remove('d-none');

  let i = 0;
  _geethaTypeInterval = setInterval(() => {
    typed += line[i];
    textEl.textContent = typed;
    i++;
    if (i >= line.length) clearInterval(_geethaTypeInterval);
  }, 35); // typing speed — ms per character
}

function hideMascot() {
  const el = document.getElementById('mascotBox');
  if (el) el.classList.add('d-none');
  if (_geethaTypeInterval) clearInterval(_geethaTypeInterval);
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
    alert('Please complete all fields. Write "Unsure" if you are not certain.'); return;
  }
  currentAssessmentData.orientation = { date, month, year, day, location, city };
  currentStep = 3; updateAssessmentView();
}

// ── Step 3: Naming ────────────────────────────────────────────
function submitStep3() {
  const obj1 = document.getElementById('namingObj1').value.trim();
  const obj2 = document.getElementById('namingObj2').value.trim();
  const obj3 = document.getElementById('namingObj3').value.trim();
  if (!obj1 || !obj2 || !obj3) { alert('Please name all three objects.'); return; }
  currentAssessmentData.naming = {
    obj1, obj2, obj3,
    expected: _namingSelected ? _namingSelected.map(i => i.label) : [],
    images: _namingSelected ? _namingSelected.map(i => i.src) : []   // ← new
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
  const isCorrect = (parsed === expected);

  if (isCorrect) {
    if (window.GardenAudio) window.GardenAudio.playSuccess();
  } else {
    if (window.GardenAudio) window.GardenAudio.playError();
    const inpEl = document.getElementById('subInput');
    if (inpEl) {
      inpEl.classList.add('shake');
      setTimeout(() => inpEl.classList.remove('shake'), 400);
    }
  }

  currentAssessmentData.subtraction.push({ question: `${subCurrentNum}-${subDiff}`, answer: val, correct: isCorrect });
  subCurrentNum = expected;
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
  sentenceAudioUrls = [];
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

  setTimeout(async () => {
    display.classList.add('d-none');
    await recordSentenceAudio();
    document.getElementById('sentenceScoringPanel').classList.remove('d-none');
  }, 5000);
}

function recordSentenceAudio() {
  return new Promise(async (resolve) => {
    const indicator = document.getElementById('sentenceRecordingIndicator');
    const countdownEl = document.getElementById('sentenceRecordCountdown');
    const roundIndex = sentenceIndex;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        indicator.classList.add('d-none');
        const blob = new Blob(chunks, { type: 'audio/webm' });
        sentenceAudioUrls[roundIndex] = await uploadSentenceAudioBlob(blob, roundIndex);
        resolve();
      };

      indicator.classList.remove('d-none');
      let secondsLeft = 7;
      countdownEl.innerText = secondsLeft;
      const countdownInterval = setInterval(() => {
        secondsLeft--;
        countdownEl.innerText = Math.max(secondsLeft, 0);
        if (secondsLeft <= 0) clearInterval(countdownInterval);
      }, 1000);

      recorder.start();
      setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 7000);

    } catch (err) {
      console.error('Microphone unavailable:', err);
      indicator.classList.add('d-none');
      sentenceAudioUrls[roundIndex] = null;
      resolve();
    }
  });
}

async function uploadSentenceAudioBlob(blob, roundIndex) {
  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');
  const fileName = `${activeUser.username || 'anon'}_${Date.now()}_r${roundIndex + 1}.webm`;

  const { error } = await supabaseClient.storage
    .from('sentence-audio')
    .upload(fileName, blob, { contentType: 'audio/webm' });

  if (error) {
    console.error('Audio upload failed:', error);
    return null;
  }

  const { data } = supabaseClient.storage.from('sentence-audio').getPublicUrl(fileName);
  return data.publicUrl;
}


function scoreSentence(isCorrect) {
  if (isCorrect) {
    if (window.GardenAudio) window.GardenAudio.playSuccess();
  } else {
    if (window.GardenAudio) window.GardenAudio.playError();
  }
  currentAssessmentData.sentenceRepetition.push({
    sentence: sentenceRounds[sentenceIndex],
    result: isCorrect ? 'Correct' : 'Incorrect',
    audioUrl: sentenceAudioUrls[sentenceIndex] || null
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
  document.getElementById('fluencySubmitBtn').classList.remove('d-none');
}

function submitStep7() {
  currentAssessmentData.verbalFluency = { letter: fluencyLetter, words: fluencyWordsList };
  currentStep = 8; updateAssessmentView();
}

// ── Step 8: Abstract Similarities ────────────────────────────
function submitStep8() {
  const val = document.getElementById('similarityInput').value.trim();
  if (!val) { alert('Please describe how the Apple and Mango are similar.'); return; }
  currentAssessmentData.similarities = val;
  localStorage.setItem('tempAssessmentData', JSON.stringify(currentAssessmentData));
  currentStep = 8.5; updateAssessmentView();
}


function goToFeedback() {
  currentStep = 11;
  updateAssessmentView();
}
// ── Session 1 Complete → Enter Garden ────────────────────────
function startGardenJourney() {
  currentStep = 9; updateAssessmentView();
}

// ── Step 3: Randomised Naming Images ─────────────────────────
const namingPool = [
  { src: 'images/cat.webp', label: 'Cat' },
  { src: 'images/dog.webp', label: 'Dog' },
  { src: 'images/chicken.webp', label: 'Chicken' },
  { src: 'images/crow.webp', label: 'Crow' },
  { src: 'images/frog.webp', label: 'Frog' },
  { src: 'images/gloves.webp', label: 'Gloves' },
  { src: 'images/shovel.webp', label: 'Shovel' },
  { src: 'images/carrot.webp', label: 'Carrot' },
  { src: 'images/grapes.webp', label: 'Grapes' },
  { src: 'images/apple.webp', label: 'Apple' },
  { src: 'images/tomato.webp', label: 'Tomato' },
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
  { src: 'images/tea.webp', label: 'Tea' },
  { src: 'images/coconut.webp', label: 'Coconut' },
  { src: 'images/feather.webp', label: 'Feather' },
  { src: 'images/lotus.webp', label: 'Lotus' },
  { src: 'images/mango.webp', label: 'Mango' },
  { src: 'images/peacock.webp', label: 'Peacock' },
  { src: 'images/rickshaw.webp', label: 'Rickshaw' },
  { src: 'images/rainbow.webp', label: 'Rainbow' },
  { src: 'images/umbrella.webp', label: 'Umbrella' },
  { src: 'images/lock.webp', label: 'Lock' },
  { src: 'images/cycle.webp', label: 'Cycle' },
  { src: 'images/sunflower_recall.webp', label: 'Sunflower' },
  { src: 'images/car.webp', label: 'Car' },
  { src: 'images/bus.webp', label: 'Bus' },
  { src: 'images/butterfly.webp', label: 'Butterfly' },
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

function exitToDashboard() {
  if (confirm('Exit? Current step data will be discarded.')) window.location.href = 'index.html';
}

// ──  & Congrats ───────────────────────────────────────
let selectedEnjoy = '', selectedEasy = '';

function selectOption(category, val, el) {
  const id = category === 'enjoy' ? 'enjoyGrid' : 'difficultyGrid';
  document.getElementById(id).querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  if (category === 'enjoy') selectedEnjoy = val;
  else selectedEasy = val;
}

async function submitFeedback(event) {
  event.preventDefault();
  if (!selectedEnjoy || !selectedEasy) { 
    alert('Please answer both survey questions.'); 
    return; 
  }
  
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
    preAssessment: tempData, // <-- Database requires this to be lowercase
    games: gameResults,
    feedback: { 
      enjoy: selectedEnjoy, 
      easy: selectedEasy, 
      comments: document.getElementById('feedbackComments').value.trim() 
    }
  };
  
  // Insert the final report into Supabase
  const { error } = await supabaseClient.from('app_assessments').insert([finalReport]);
  
  if (error) {
    console.error("Error saving assessment:", error);
    alert("There was a problem saving your results. Please try again.");
    return;
  }

  currentStep = 12; 
  updateAssessmentView();
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

  // Trophy row hidden per design spec
  const trophyRow = document.getElementById('trophyRow');
  if (trophyRow) trophyRow.style.display = 'none';

}


function restartScreening() {
  localStorage.removeItem('tempAssessmentData');
  localStorage.removeItem('tempGameResults');
  currentStep = 0;
  window.location.reload();
}

// ── Clinician Dashboard ───────────────────────────────────────
let _currentReportIndex = -1;

async function loadDoctorDashboard() {
  const activeDoc = localStorage.getItem('activeDoctor');
  if (!activeDoc) { window.location.href = 'index.html'; return; }
  
  const docObj = JSON.parse(activeDoc);
  // const badge = document.getElementById('doctorNameBadge');
  // if (badge) badge.innerText = docObj.name || docObj.username;
  
  // Fetch from Supabase
  const { data: assessments, error } = await supabaseClient
    .from('app_assessments')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching patients:", error);
    renderPatientsTable([]);
    return;
  }
  
  // Store globally so your view/filter functions still work smoothly
  window.currentPatientList = assessments || [];
  renderPatientsTable(window.currentPatientList);
}

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
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
       <td>${formatDateTime(item.created_at)}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="btn btn-blue" onclick="showPatientReport(${idx})" style="padding:.35rem .75rem;font-size:.82rem;">View Report</button>
        </td>
      </tr>`;
  }).join('');
}

function filterPatientsList() {
  const q = document.getElementById('patientSearchInput').value.toLowerCase();
    const list = window.currentPatientList || [];
  renderPatientsTable(list.filter(a => a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q)));
}

function showPatientReport(index) {
  const list = window.currentPatientList || [];
  const record = list[index];
  if (!record) return;
  _currentReportIndex = index;

  const overlay = document.getElementById('reportOverlay');
  overlay.classList.add('active');

  document.getElementById('reportTitle').innerText = `Report: ${record.name}`;
  document.getElementById('reportDateBadge').innerText = `Completed: ${formatDateTime(record.created_at)}`;

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
document.getElementById('repNamingExp1').innerText = `(${expected[0] || '?'})`;
document.getElementById('repNamingExp2').innerText = `(${expected[1] || '?'})`;
document.getElementById('repNamingExp3').innerText = `(${expected[2] || '?'})`;

const namingImgs = n.images || [];
[1, 2, 3].forEach((num, idx) => {
  const imgEl = document.getElementById(`repNamingImg${num}`);
  if (!imgEl) return;
  if (namingImgs[idx]) {
    imgEl.src = namingImgs[idx];
    imgEl.style.display = 'inline-block';
  } else {
    imgEl.style.display = 'none';
  }
});

 const sent = pa.sentenceRepetition || [];
  document.getElementById('repSent1').innerText = sent[0]?.result || 'N/A';
  document.getElementById('repSent2').innerText = sent[1]?.result || 'N/A';
  document.getElementById('repSent1Text').innerText = sent[0]?.sentence ? `"${sent[0].sentence}"` : '';
  document.getElementById('repSent2Text').innerText = sent[1]?.sentence ? `"${sent[1].sentence}"` : '';

  const sub = pa.subtraction || [];
  document.getElementById('repSubList').innerHTML = sub.length
    ? sub.map(s => `${s.question} = ${s.answer} ${s.correct ? '<span style="color:green;">✓</span>' : '<span style="color:var(--color-red);">✗</span>'}`).join('<br>')
    : '—';

  [1, 2].forEach(n => {
    const round = sent[n - 1];
    const audioEl = document.getElementById(`repSentAudio${n}`);
    const missingEl = document.getElementById(`repSentAudio${n}Missing`);
    if (round?.audioUrl) {
      audioEl.src = round.audioUrl;
      audioEl.style.display = 'block';
      missingEl.style.display = 'none';
    } else {
      audioEl.src = '';
      audioEl.style.display = 'none';
      missingEl.style.display = 'inline';
    }
  });

  const fl = pa.verbalFluency || {};
  document.getElementById('repFluencyLetter').innerText = fl.letter || 'N/A';
  document.getElementById('repFluencyWords').innerText = fl.words?.join(', ') || '—';

  document.getElementById('repSimilarityText').innerText = pa.similarities || 'N/A';

// Game 1 — Flower Recall
const g = record.games || {};
const fm = g.flowerMemory || {};

// 1. Forward Span Length
document.getElementById('g1ForwardSpan').innerText =
  fm.forwardSpan != null ? fm.forwardSpan : (fm.maxSeq != null ? fm.maxSeq : 'N/A');

// 2. Forward Number Correct (count + fraction + percentage)
if (fm.correctTrials != null && fm.totalTrials != null) {
  const pct = fm.correctPct != null ? fm.correctPct : (fm.totalTrials > 0 ? Math.round((fm.correctTrials / fm.totalTrials) * 100) : 0);
  document.getElementById('g1ForwardCorrect').innerText = fm.correctTrials;
  document.getElementById('g1ForwardCorrectDetail').innerText = ` / ${fm.totalTrials} sequences (${pct}%)`;
} else {
  document.getElementById('g1ForwardCorrect').innerText = 'N/A';
  document.getElementById('g1ForwardCorrectDetail').innerText = '';
}

// 3. First Tap Latency (avg)
document.getElementById('g1FTL').innerText =
  fm.ftlMs != null ? `${fm.ftlMs} ms` : 'N/A';

// 4. Intertapping Interval (avg)
document.getElementById('g1ITI').innerText =
  fm.itiMs != null ? `${fm.itiMs} ms` : 'N/A';


// Game 2
document.getElementById('g2MeanRT').innerText =
    g.whackMole?.mrt ? `${g.whackMole.mrt} ms` : 'N/A';

document.getElementById('g2RTVariance').innerText =
    g.whackMole?.rtv ? `±${g.whackMole.rtv} ms` : 'N/A';

document.getElementById('g2OmissionErrors').innerText =
    g.whackMole?.omissionErrors ?? 'N/A';

document.getElementById('g2CommissionErrors').innerText =
    g.whackMole?.commissionErrors ?? 'N/A';

document.getElementById('g2Hits').innerText =
    g.whackMole?.hits ?? 'N/A';

document.getElementById('g2Targets').innerText =
    g.whackMole?.targets ?? 'N/A';

document.getElementById('g2HighestLevel').innerText =
    g.whackMole?.highestLevel ?? 'N/A';


// Game 3
document.getElementById('g3Sequence').innerText =
    g.gardenPath?.sequence ?? 'N/A';

document.getElementById('g3PathTime').innerText =
    g.gardenPath?.time ?? 'N/A';

document.getElementById('g3SeqErrors').innerText =
    g.gardenPath?.sequenceErrors ?? 'N/A';

document.getElementById('g3Undos').innerText =
    g.gardenPath?.undoCount ?? '0';

document.getElementById('g3MicroHesitations').innerText =
    g.gardenPath?.avgHesitationMs ? `${g.gardenPath.avgHesitationMs} ms` : 'N/A';

// Game 3 — Trail screenshot
const trailImg = document.getElementById('trailDrawingImage');
const noTrailMsg = document.getElementById('noTrailDrawingMsg');
if (g.gardenPath?.screenshot?.startsWith('data:image')) {
  trailImg.src = g.gardenPath.screenshot;
  trailImg.style.display = 'inline-block';
  noTrailMsg.style.display = 'none';
} else {
  trailImg.src = '';
  trailImg.style.display = 'none';
  noTrailMsg.style.display = 'flex';
}

// Game 5
const stroop = g.stroop || {};
document.getElementById('g5WAttempted').innerText = stroop.wAttempted ?? 'N/A';
document.getElementById('g5WCorrect').innerText = stroop.wCorrect ?? 'N/A';
document.getElementById('g5WAcc').innerText = stroop.wAcc != null ? `${stroop.wAcc}%` : 'N/A';
document.getElementById('g5WSpeed').innerText = stroop.wSpeed != null ? `${stroop.wSpeed} items/s` : 'N/A';

document.getElementById('g5CAttempted').innerText = stroop.cAttempted ?? 'N/A';
document.getElementById('g5CCorrect').innerText = stroop.cCorrect ?? 'N/A';
document.getElementById('g5CAcc').innerText = stroop.cAcc != null ? `${stroop.cAcc}%` : 'N/A';
document.getElementById('g5CSpeed').innerText = stroop.cSpeed != null ? `${stroop.cSpeed} items/s` : 'N/A';

document.getElementById('g5CWAttempted').innerText = stroop.cwAttempted ?? 'N/A';
document.getElementById('g5CWCorrect').innerText = stroop.cwCorrect ?? 'N/A';
document.getElementById('g5CWAcc').innerText = stroop.cwAcc != null ? `${stroop.cwAcc}%` : 'N/A';
document.getElementById('g5CWSpeed').innerText = stroop.cwSpeed != null ? `${stroop.cwSpeed} items/s` : 'N/A';

document.getElementById('g5TI').innerText = stroop.timeInterference ?? 'N/A';
document.getElementById('g5EI').innerText = stroop.errorInterference ?? 'N/A';


// Game 6
document.getElementById('g6RetentionRate').innerText =
    g.delayedRecall?.retentionRate ?? 'N/A';

document.getElementById('g6IntrusionErrors').innerText =
    g.delayedRecall?.intrusionErrors ?? 'N/A';

document.getElementById('g6RetrievalLatency').innerText =
    g.delayedRecall?.retrievalLatency ?? 'N/A';

document.getElementById('g6CorrectCount').innerText =
    g.delayedRecall?.correct ?? 'N/A';

document.getElementById('g6TotalTargets').innerText =
    g.delayedRecall?.totalTargets ?? 'N/A';

  const fd = record.feedback || {};
  document.getElementById('repFeedbackEnjoy').innerText = fd.enjoy || 'N/A';
  document.getElementById('repFeedbackEasy').innerText = fd.easy || 'N/A';
  document.getElementById('repFeedbackNotes').innerText = fd.comments || '—';

  const img = document.getElementById('clockDrawingImage');
  const noMsg = document.getElementById('noClockDrawingMsg');
  if (g.clockDrawing?.startsWith('data:image')) {
    img.src = g.clockDrawing; img.style.display = 'inline-block'; noMsg.style.display = 'none';
  } else {
    img.src = ''; img.style.display = 'none'; noMsg.style.display = 'flex';
  }

  overlay.scrollTop = 0;
}

function closeReport() {
  document.getElementById('reportOverlay').classList.remove('active');
  _currentReportIndex = -1;
}

function markCurrentViewed() {
  if (_currentReportIndex < 0) return;

  const list = window.currentPatientList || [];

  if (list[_currentReportIndex]) {
    list[_currentReportIndex].viewed = true;
  }

  const btn = document.getElementById('markViewedBtn');
  if (btn) {
    btn.innerText = 'Viewed ✓';
    btn.classList.add('btn-grey');
  }

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
