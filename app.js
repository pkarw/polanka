/* ==============================
   POLANA PRZYGÓD — APP.JS
   5 Speech Therapy Mini-Games
   ============================== */

// ==================== CONSTANTS ====================
const COLORS = {
  green: '#2A5C47', greenDark: '#1E4635', greenLight: '#3D7A5C',
  lime: '#E8FC59', straw: '#EFF1C5', olive: '#BCC7A1',
  violet: '#E3D0F8', white: '#ffffff', cream: '#FFF8E7',
  sky: '#87CEEB', water: '#2E8B8B', brown: '#8B6914',
};

const GAME_INFO = {
  dandelion: {
    title: 'Magiczny Dmuchawiec',
    animal: '🐻',
    guide: 'Miś Puchaty',
    desc: 'Dmuchaj delikatnie w mikrofon, aby nasionka dmuchawca poleciały do ogrodu kwiatów!',
    tip: 'Dmuchaj równomiernie — zbyt mocny podmuch rozproszy nasionka!',
    levels: [
      { seeds: 6, targetSize: 0.4, time: 20 },
      { seeds: 10, targetSize: 0.3, time: 25 },
      { seeds: 15, targetSize: 0.25, time: 30 },
    ],
    usesMic: true,
  },
  bubbles: {
    title: 'Bąbelkowa Rzeka',
    animal: '🐸',
    guide: 'Żabka Kumka',
    desc: 'Twórz bąbelki dmuchając w mikrofon i pomóż rybce przepłynąć rzekę!',
    tip: 'Długie, spokojne dmuchanie tworzy duże bąbelki — a rybka potrzebuje dużych!',
    levels: [
      { bubblesNeeded: 4, riverWidth: 0.6, popTime: 12 },
      { bubblesNeeded: 6, riverWidth: 0.75, popTime: 10 },
      { bubblesNeeded: 8, riverWidth: 0.9, popTime: 8 },
    ],
    usesMic: true,
  },
  mouthgym: {
    title: 'Gimnastyka Buzi',
    animal: '🦔',
    guide: 'Jeżyk Kolczyk',
    desc: 'Wykonuj ćwiczenia języka i warg razem z Jeżykiem! Usiądź przed lustrem i powtarzaj ruchy.',
    tip: 'Każde ćwiczenie ma swój czas — staraj się wykonywać je dokładnie!',
    levels: [
      { exercises: 4, duration: 6 },
      { exercises: 6, duration: 8 },
      { exercises: 6, duration: 10 },
    ],
    usesMic: false,
  },
  drum: {
    title: 'Leśny Bębenek',
    animal: '🐿️',
    guide: 'Wiewiórka Ruda',
    desc: 'Posłuchaj rytmu i powtórz go, stukając w bęben!',
    tip: 'Słuchaj uważnie przerw między uderzeniami — rytm to nie tylko stuknięcia!',
    levels: [
      { rounds: 4, patternLen: 3, speed: 500 },
      { rounds: 5, patternLen: 4, speed: 450 },
      { rounds: 6, patternLen: 5, speed: 400 },
    ],
    usesMic: false,
  },
  memory: {
    title: 'Dźwiękowe Memory',
    animal: '🦉',
    guide: 'Sowa Mądralka',
    desc: 'Odkrywaj karty i szukaj par zwierząt po ich odgłosach!',
    tip: 'Słuchaj uważnie dźwięków — każde zwierzę brzmi inaczej!',
    levels: [
      { pairs: 4, cols: 4 },
      { pairs: 6, cols: 4 },
      { pairs: 8, cols: 4 },
    ],
    usesMic: false,
  },
};

const EXERCISES = [
  { id: 'konik', name: 'Konik', desc: 'Kląskaj językiem o podniebienie!', emoji: '🐴' },
  { id: 'hustawka', name: 'Huśtawka', desc: 'Język do nosa, potem do brody!', emoji: '🎢' },
  { id: 'zegar', name: 'Zegar', desc: 'Język w lewy kącik, potem w prawy!', emoji: '⏰' },
  { id: 'malarz', name: 'Malarz', desc: 'Przesuń język po podniebieniu!', emoji: '🎨' },
  { id: 'rybka', name: 'Rybka', desc: 'Cmokaj wargami jak rybka!', emoji: '🐟' },
  { id: 'usmiech', name: 'Uśmiech–Dzióbek', desc: 'Uśmiech szeroki, potem dzióbek!', emoji: '😊' },
];

const MEMORY_ANIMALS = [
  { emoji: '🐶', name: 'Piesek', freq: [300, 500], type: 'bark' },
  { emoji: '🐱', name: 'Kotek', freq: [600, 800], type: 'meow' },
  { emoji: '🐦', name: 'Ptaszek', freq: [1200, 1400], type: 'tweet' },
  { emoji: '🐸', name: 'Żabka', freq: [200, 350], type: 'croak' },
  { emoji: '🦁', name: 'Lew', freq: [100, 180], type: 'roar' },
  { emoji: '🐝', name: 'Pszczółka', freq: [250, 280], type: 'buzz' },
  { emoji: '🦉', name: 'Sowa', freq: [300, 200], type: 'hoot' },
  { emoji: '🐴', name: 'Konik', freq: [400, 600], type: 'neigh' },
];

// ==================== AUDIO MANAGER ====================
class AudioManager {
  constructor() {
    this.ctx = null;
    this.micStream = null;
    this.analyser = null;
    this.blowLevel = 0;
    this.micActive = false;
    this._blowData = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  async initMicrophone() {
    this.init();
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      const source = this.ctx.createMediaStreamSource(this.micStream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);
      this._blowData = new Uint8Array(this.analyser.frequencyBinCount);
      this.micActive = true;
      return true;
    } catch (e) {
      console.warn('Microphone not available:', e);
      this.micActive = false;
      return false;
    }
  }

  getBlowLevel() {
    if (!this.analyser || !this._blowData) return 0;
    this.analyser.getByteFrequencyData(this._blowData);
    // Focus on low-mid frequencies (blowing is ~100-600Hz)
    let sum = 0;
    const bins = Math.min(40, this._blowData.length);
    for (let i = 1; i < bins; i++) sum += this._blowData[i];
    const avg = sum / ((bins - 1) * 255);
    // Light smoothing to keep responsiveness
    this.blowLevel = this.blowLevel * 0.2 + avg * 0.8;
    return this.blowLevel;
  }

  playTone(freq, duration, type = 'sine', volume = 0.25) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.playTone(660, 0.06, 'square', 0.1);
  }

  playSuccess() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.playTone(f, 0.25, 'sine', 0.2), i * 100));
  }

  playFail() {
    this.playTone(300, 0.15, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(220, 0.25, 'sawtooth', 0.1), 150);
  }

  playDrum(pitch = 1) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 * pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
    // noise burst
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = this.ctx.createBufferSource();
    const ng = this.ctx.createGain();
    noise.buffer = buf;
    ng.gain.setValueAtTime(0.3, this.ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    noise.connect(ng);
    ng.connect(this.ctx.destination);
    noise.start();
  }

  playAnimalSound(animal) {
    this.init();
    const [f1, f2] = animal.freq;
    switch (animal.type) {
      case 'bark':
        this.playTone(f1, 0.12, 'square', 0.15);
        setTimeout(() => this.playTone(f2, 0.12, 'square', 0.15), 150);
        break;
      case 'meow':
        this._sweep(f1, f2, 0.4, 'sine', 0.2);
        break;
      case 'tweet':
        for (let i = 0; i < 3; i++) setTimeout(() => this.playTone(f1 + i * 50, 0.08, 'sine', 0.15), i * 100);
        break;
      case 'croak':
        this.playTone(f1, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(f2, 0.15, 'square', 0.15), 120);
        break;
      case 'roar':
        this._sweep(f1, f2, 0.5, 'sawtooth', 0.15);
        break;
      case 'buzz':
        this.playTone(f1, 0.4, 'sawtooth', 0.08);
        break;
      case 'hoot':
        this.playTone(f1, 0.3, 'sine', 0.2);
        setTimeout(() => this.playTone(f2, 0.4, 'sine', 0.2), 400);
        break;
      case 'neigh':
        this._sweep(f1, f2, 0.3, 'sawtooth', 0.12);
        setTimeout(() => this._sweep(f2, f1, 0.3, 'sawtooth', 0.12), 350);
        break;
      default:
        this.playTone(f1, 0.3, 'sine', 0.2);
    }
  }

  _sweep(f1, f2, dur, type, vol) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(f2, this.ctx.currentTime + dur * 0.7);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  playPop() {
    this.playTone(800, 0.04, 'sine', 0.15);
    setTimeout(() => this.playTone(400, 0.06, 'sine', 0.1), 40);
  }

  playStar() {
    this.playTone(1200, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(1600, 0.15, 'sine', 0.15), 100);
  }

  stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    this.analyser = null;
    this.micActive = false;
    this.blowLevel = 0;
  }
}

// ==================== PARTICLE SYSTEM ====================
class Particles {
  constructor() {
    this.list = [];
  }

  emit(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      this.list.push({
        x, y,
        vx: (Math.random() - 0.5) * (opts.spread || 4),
        vy: (Math.random() - 0.5) * (opts.spread || 4) - (opts.rise || 0),
        life: 1,
        decay: opts.decay || (0.01 + Math.random() * 0.02),
        size: opts.size || (2 + Math.random() * 4),
        color: opts.color || COLORS.lime,
        gravity: opts.gravity || 0,
        shape: opts.shape || 'circle',
      });
    }
  }

  update() {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.shape === 'star') {
        this._drawStar(ctx, p.x, p.y, p.size * p.life);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawStar(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](x + Math.cos(a) * r, y + Math.sin(a) * r);
      const b = ((i * 72 + 36) - 90) * Math.PI / 180;
      ctx.lineTo(x + Math.cos(b) * r * 0.4, y + Math.sin(b) * r * 0.4);
    }
    ctx.closePath();
    ctx.fill();
  }

  clear() { this.list = []; }
}

// ==================== APP ====================
class App {
  constructor() {
    this.audio = new AudioManager();
    this.currentScreen = 'splash';
    this.currentGame = null;
    this.games = {};
    this.state = this.loadState();
    this.init();
  }

  loadState() {
    try {
      const s = JSON.parse(localStorage.getItem('polana-state'));
      if (s && s.stars) return s;
    } catch (e) {}
    return {
      stars: { dandelion: 0, bubbles: 0, mouthgym: 0, drum: 0, memory: 0 },
      levels: { dandelion: 1, bubbles: 1, mouthgym: 1, drum: 1, memory: 1 },
    };
  }

  saveState() {
    localStorage.setItem('polana-state', JSON.stringify(this.state));
  }

  init() {
    // Splash sequence
    this.runSplash();
    // Navigation
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        this.audio.init();
        this.audio.playClick();
        const game = card.dataset.game;
        this.openGame(game);
      });
    });
    document.querySelectorAll('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.closeGame();
      });
    });
    document.querySelectorAll('[data-info]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.showGameInfo(btn.dataset.info);
      });
    });
    // Rules
    document.getElementById('btn-rules').addEventListener('click', () => {
      this.audio.init();
      this.audio.playClick();
      document.getElementById('rules-modal').classList.remove('hidden');
    });
    document.getElementById('btn-close-rules').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('rules-modal').classList.add('hidden');
    });
    // Game info
    document.getElementById('btn-close-info').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('game-info').classList.add('hidden');
    });
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('game-info').classList.add('hidden');
    });
    // Mic prompt
    document.getElementById('btn-mic-go').addEventListener('click', async () => {
      this.audio.init();
      const ok = await this.audio.initMicrophone();
      document.getElementById('mic-prompt').classList.add('hidden');
      if (this._pendingMicGame) {
        this.startGame(this._pendingMicGame);
        this._pendingMicGame = null;
      }
    });
    document.getElementById('btn-mic-skip').addEventListener('click', () => {
      document.getElementById('mic-prompt').classList.add('hidden');
      if (this._pendingMicGame) {
        this.startGame(this._pendingMicGame);
        this._pendingMicGame = null;
      }
    });
    // Complete overlay
    document.getElementById('btn-again').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('game-complete').classList.add('hidden');
      if (this.currentGame) this.startGame(this.currentGame);
    });
    document.getElementById('btn-next').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('game-complete').classList.add('hidden');
      if (this.currentGame) {
        const lvl = this.state.levels[this.currentGame];
        if (lvl < 3) this.state.levels[this.currentGame]++;
        this.saveState();
        this.startGame(this.currentGame);
      }
    });
    document.getElementById('btn-tomenu').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('game-complete').classList.add('hidden');
      this.closeGame();
    });
    // Update stars display
    this.updateAllStars();
  }

  runSplash() {
    const fill = document.getElementById('loader-fill');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2 + Math.random() * 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => this.showScreen('menu'), 400);
      }
      fill.style.width = progress + '%';
    }, 80);
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) {
      // Small delay for transition
      requestAnimationFrame(() => el.classList.add('active'));
    }
    this.currentScreen = id;
  }

  openGame(gameId) {
    const info = GAME_INFO[gameId];
    if (!info) return;
    this.currentGame = gameId;
    if (info.usesMic && !this.audio.micActive) {
      this._pendingMicGame = gameId;
      document.getElementById('mic-prompt').classList.remove('hidden');
      return;
    }
    this.showScreen('game-' + gameId);
    this.startGame(gameId);
  }

  startGame(gameId) {
    this.showScreen('game-' + gameId);
    // Update HUD
    const lvl = this.state.levels[gameId];
    const el = document.getElementById('hud-' + gameId + '-level');
    if (el) el.textContent = 'Poziom ' + lvl;
    this.updateGameStars(gameId);
    // Start the game
    if (this.games[gameId]) this.games[gameId].stop();
    switch (gameId) {
      case 'dandelion': this.games[gameId] = new DandelionGame(this); break;
      case 'bubbles': this.games[gameId] = new BubbleGame(this); break;
      case 'mouthgym': this.games[gameId] = new MouthGymGame(this); break;
      case 'drum': this.games[gameId] = new DrumGame(this); break;
      case 'memory': this.games[gameId] = new MemoryGame(this); break;
    }
    this.games[gameId].start(lvl);
  }

  closeGame() {
    if (this.currentGame && this.games[this.currentGame]) {
      this.games[this.currentGame].stop();
    }
    this.audio.stopMic();
    this.currentGame = null;
    this.showScreen('menu');
    this.updateAllStars();
  }

  showGameInfo(gameId) {
    const info = GAME_INFO[gameId];
    if (!info) return;
    const body = document.getElementById('game-info-body');
    body.innerHTML = `
      <div style="text-align:center;font-size:3rem;margin-bottom:0.5rem">${info.animal}</div>
      <h3>${info.title}</h3>
      <p style="font-size:0.8rem;color:var(--olive);margin-bottom:0.8rem">Prowadzi: ${info.guide}</p>
      <p>${info.desc}</p>
      <div class="info-tip">${info.tip}</div>
    `;
    document.getElementById('game-info').classList.remove('hidden');
  }

  completeGame(gameId, score, maxScore) {
    const stars = score >= maxScore ? 3 : score >= maxScore * 0.66 ? 2 : score > 0 ? 1 : 0;
    const info = GAME_INFO[gameId];
    // Update state
    if (stars > this.state.stars[gameId]) this.state.stars[gameId] = stars;
    this.saveState();
    // Show overlay
    const overlay = document.getElementById('game-complete');
    document.getElementById('complete-animal').textContent = info.animal;
    const titles = ['Spróbuj jeszcze raz!', 'Dobra robota!', 'Świetnie!', 'Brawo! Fantastycznie!'];
    const msgs = [
      'Nie poddawaj się, na pewno Ci się uda!',
      'Udało Ci się! Spróbuj zdobyć więcej gwiazdek!',
      'Bardzo dobrze Ci poszło!',
      'Mistrzostwo! Jesteś wspaniały/wspaniała!'
    ];
    document.getElementById('complete-title').textContent = titles[stars];
    document.getElementById('complete-msg').textContent = msgs[stars];
    // Stars
    const starEls = document.getElementById('complete-stars').children;
    for (let i = 0; i < 3; i++) {
      starEls[i].textContent = '☆';
      starEls[i].classList.remove('earned');
    }
    overlay.classList.remove('hidden');
    // Animate stars
    for (let i = 0; i < stars; i++) {
      setTimeout(() => {
        starEls[i].textContent = '★';
        starEls[i].classList.add('earned');
        this.audio.playStar();
      }, 400 + i * 400);
    }
    if (stars > 0) {
      setTimeout(() => this.audio.playSuccess(), 200);
      this.runConfetti();
    }
    // Next level button visibility
    const lvl = this.state.levels[gameId];
    document.getElementById('btn-next').style.display = (stars >= 1 && lvl < 3) ? 'block' : 'none';
    this.updateAllStars();
  }

  runConfetti() {
    const canvas = document.getElementById('canvas-confetti');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = [COLORS.lime, COLORS.straw, COLORS.violet, '#FF6B8A', '#FFD93D', COLORS.olive];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1,
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;
        p.life -= 0.003;
        if (p.life <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(animate);
  }

  updateGameStars(gameId) {
    const stars = this.state.stars[gameId];
    const el = document.getElementById('hud-' + gameId + '-stars');
    if (el) {
      const spans = el.querySelectorAll('span');
      spans.forEach((s, i) => {
        s.textContent = i < stars ? '★' : '☆';
        s.classList.toggle('earned', i < stars);
      });
    }
  }

  updateAllStars() {
    let total = 0;
    for (const [gameId, stars] of Object.entries(this.state.stars)) {
      total += stars;
      // Card stars
      const cardEl = document.getElementById('stars-' + gameId);
      if (cardEl) {
        const spans = cardEl.querySelectorAll('span');
        spans.forEach((s, i) => {
          s.textContent = i < stars ? '★' : '☆';
          s.classList.toggle('earned', i < stars);
        });
      }
    }
    document.getElementById('total-stars').textContent = total;
  }
}

// ==================== GAME: DANDELION ====================
class DandelionGame {
  constructor(app) {
    this.app = app;
    this.canvas = document.getElementById('canvas-dandelion');
    this.ctx = this.canvas.getContext('2d');
    this.particles = new Particles();
    this.running = false;
    this.seeds = [];
    this.landed = 0;
    this.scattered = 0;
    this.level = {};
    this.time = 0;
    this.blowSmooth = 0;
  }

  start(lvlNum) {
    this.level = GAME_INFO.dandelion.levels[lvlNum - 1];
    this.resize();
    this.seeds = [];
    this.landed = 0;
    this.scattered = 0;
    this.time = this.level.time;
    this.running = true;
    // Create seeds using CSS coordinates (this.w, this.h)
    const cx = this.w / 2;
    const stemTop = this.h * 0.3;
    for (let i = 0; i < this.level.seeds; i++) {
      const angle = (i / this.level.seeds) * Math.PI * 2 + Math.random() * 0.3;
      const r = 12 + Math.random() * 18;
      this.seeds.push({
        x: cx + Math.cos(angle) * r,
        y: stemTop + Math.sin(angle) * r,
        vx: 0, vy: 0,
        attached: true,
        landed: false,
        scattered: false,
        size: 3 + Math.random() * 2,
        angle: angle,
        fluffSize: 8 + Math.random() * 6,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    this._lastTime = performance.now();
    this._timerInterval = setInterval(() => {
      if (this.running && this.time > 0) {
        this.time--;
        if (this.time <= 0) this.finish();
      }
    }, 1000);
    window.addEventListener('resize', this._onResize = () => this.resize());
    // Touch/click fallback for blowing
    this.canvas.addEventListener('pointerdown', this._onTouch = () => { this._touchBlowing = true; });
    this.canvas.addEventListener('pointerup', this._onTouchEnd = () => { this._touchBlowing = false; });
    this.canvas.addEventListener('pointerleave', this._onTouchEnd2 = () => { this._touchBlowing = false; });
    this._touchBlowing = false;
    this.loop();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    // Get blow level from mic OR touch
    const micBlow = this.app.audio.getBlowLevel();
    const touchBlow = this._touchBlowing ? 0.15 : 0;
    const blow = Math.max(micBlow, touchBlow);
    this.blowSmooth = this.blowSmooth * 0.3 + blow * 0.7;
    // Update mic indicator
    const fill = document.getElementById('mic-fill-dandelion');
    if (fill) fill.style.width = Math.min(100, this.blowSmooth * 500) + '%';
    // Threshold: ignore background noise, detect actual blowing
    const isBlowing = this.blowSmooth > 0.06;
    const blowForce = Math.min((this.blowSmooth - 0.04) * 4, 1);
    // Target zone (garden at bottom)
    const gardenY = this.h * 0.82;
    const gardenCx = this.w / 2;
    const gardenR = this.w * this.level.targetSize;
    // Release seeds one at a time while blowing (every few frames)
    this._releaseTimer = (this._releaseTimer || 0) + dt;
    const attachedSeeds = this.seeds.filter(s => s.attached);
    if (isBlowing && attachedSeeds.length > 0 && this._releaseTimer > 0.5) {
      this._releaseTimer = 0;
      const seed = attachedSeeds[0];
      seed.attached = false;
      // Float gently downward with slight wind
      seed.vx = (Math.random() - 0.5) * 20;
      seed.vy = 5 + Math.random() * 10;
    }
    for (const seed of this.seeds) {
      if (seed.landed || seed.scattered || seed.attached) continue;
      seed.wobble += dt * 2;
      // Gentle gravity — seeds float like dandelion fluff
      seed.vy += 8 * dt;
      seed.vx *= 0.99;
      // Wind from blowing pushes seeds DOWN and sideways toward garden
      if (isBlowing) {
        const dx = gardenCx - seed.x;
        seed.vx += dx * 0.3 * dt * blowForce;
        seed.vy += blowForce * 25 * dt;
      }
      // Float resistance — seeds don't fall too fast
      if (seed.vy > 50) seed.vy = 50;
      // Add wobble
      seed.x += seed.vx * dt + Math.sin(seed.wobble) * 0.5;
      seed.y += seed.vy * dt;
      // Check garden landing — generous zone
      const dx = seed.x - gardenCx;
      if (seed.y >= gardenY - 15) {
        // Any seed that reaches ground level in the middle 80% of screen = landed
        if (Math.abs(dx) < this.w * 0.45) {
          seed.landed = true;
          seed.y = gardenY;
          this.landed++;
          this.particles.emit(seed.x, seed.y, 10, { color: COLORS.lime, spread: 4, rise: 1, size: 4 });
          this.app.audio.playPop();
        } else {
          // Seed landed outside garden — still counts as done but no points
          seed.scattered = true;
          this.scattered++;
        }
      }
      // Only scatter if WAY off screen (very lenient)
      if (seed.x < -80 || seed.x > this.w + 80 || seed.y > this.h + 50) {
        seed.scattered = true;
        this.scattered++;
      }
    }
    this.particles.update();
    // Check if all seeds are done
    const allDone = this.seeds.every(s => s.landed || s.scattered);
    if (allDone && this.running) this.finish();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.h);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.4, '#A8D8A8');
    skyGrad.addColorStop(0.7, '#5AA07B');
    skyGrad.addColorStop(1, '#3D7A5C');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.w, this.h);
    // Clouds
    const t = performance.now() * 0.0001;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 4; i++) {
      const cx = ((t * (20 + i * 10) + i * 200) % (this.w + 200)) - 100;
      const cy = 30 + i * 40;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 + i * 15, 20 + i * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Background trees
    const gardenY = this.h * 0.82;
    for (let i = 0; i < 6; i++) {
      const tx = i * this.w / 5 - 20;
      const ty = gardenY + 10;
      ctx.fillStyle = '#2A6B45';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 25, ty - 50 - i * 8);
      ctx.lineTo(tx + 50, ty);
      ctx.closePath();
      ctx.fill();
    }
    // Garden zone
    const gardenCx = this.w / 2;
    const gardenR = this.w * this.level.targetSize;
    // Ground
    ctx.fillStyle = '#2D6B50';
    ctx.fillRect(0, gardenY + 10, this.w, this.h - gardenY);
    // Grass tufts
    ctx.fillStyle = '#4A9B6B';
    for (let i = 0; i < 20; i++) {
      const gx = i * this.w / 19;
      ctx.beginPath();
      ctx.moveTo(gx - 5, gardenY + 12);
      ctx.lineTo(gx, gardenY + 2);
      ctx.lineTo(gx + 5, gardenY + 12);
      ctx.fill();
    }
    // Garden highlight with arrow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = COLORS.lime;
    ctx.beginPath();
    ctx.ellipse(gardenCx, gardenY + 5, gardenR, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Garden label
    ctx.fillStyle = 'rgba(232,252,89,0.5)';
    ctx.font = '600 13px Jost';
    ctx.textAlign = 'center';
    ctx.fillText('OGRÓD', gardenCx, gardenY + 25);
    // Flowers in garden
    for (let i = 0; i < 5; i++) {
      const fx = gardenCx - gardenR + (i + 0.5) * (gardenR * 2 / 5);
      const fy = gardenY + 5;
      this._drawFlower(ctx, fx, fy, 6 + i % 3 * 2);
    }
    // Dandelion stem
    const stemBase = this.h * 0.75;
    const stemTop = this.h * 0.3;
    const stemX = this.w / 2;
    ctx.strokeStyle = '#5A9B7A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(stemX, stemBase);
    ctx.quadraticCurveTo(stemX - 5, (stemBase + stemTop) / 2, stemX, stemTop);
    ctx.stroke();
    // Dandelion head (if seeds remain)
    const attachedSeeds = this.seeds.filter(s => s.attached);
    if (attachedSeeds.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(stemX, stemTop, 25, 0, Math.PI * 2);
      ctx.fill();
    }
    // Seeds
    for (const seed of this.seeds) {
      if (seed.scattered) continue;
      this._drawSeed(ctx, seed);
    }
    // Particles
    this.particles.draw(ctx);
    // Timer
    ctx.fillStyle = COLORS.straw;
    ctx.font = '600 16px Jost';
    ctx.textAlign = 'right';
    ctx.fillText(this.time + 's', this.w - 15, 25);
    // Score
    ctx.textAlign = 'left';
    ctx.fillText(this.landed + '/' + this.level.seeds, 15, 25);
  }

  _drawSeed(ctx, seed) {
    ctx.save();
    ctx.translate(seed.x, seed.y);
    if (!seed.attached) {
      ctx.rotate(Math.sin(seed.wobble) * 0.3);
    }
    // Fluff
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = seed.fluffSize;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.3, 1.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, seed.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawFlower(ctx, x, y, size) {
    const colors = ['#FF6B8A', '#FFD93D', '#FF8C42', '#C084FC', '#FB7185'];
    const c = colors[Math.floor(x * 7) % colors.length];
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * size * 0.5, y + Math.sin(a) * size * 0.5, size * 0.4, size * 0.25, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  finish() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this._timerInterval);
    setTimeout(() => {
      this.app.completeGame('dandelion', this.landed, this.level.seeds);
    }, 500);
  }

  stop() {
    this.running = false;
    clearInterval(this._timerInterval);
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('pointerdown', this._onTouch);
    this.canvas.removeEventListener('pointerup', this._onTouchEnd);
    this.canvas.removeEventListener('pointerleave', this._onTouchEnd2);
  }
}

// ==================== GAME: BUBBLES ====================
class BubbleGame {
  constructor(app) {
    this.app = app;
    this.canvas = document.getElementById('canvas-bubbles');
    this.ctx = this.canvas.getContext('2d');
    this.particles = new Particles();
    this.running = false;
    this.bubbles = [];
    this.fish = {};
    this.level = {};
    this.currentBubbleSize = 0;
    this.isBlowing = false;
    this.score = 0;
    this.blowSmooth = 0;
    this._touchBlowing = false;
  }

  start(lvlNum) {
    this.level = GAME_INFO.bubbles.levels[lvlNum - 1];
    this.resize();
    this.bubbles = [];
    this.score = 0;
    this.currentBubbleSize = 0;
    this.isBlowing = false;
    this._touchBlowing = false;
    this.running = true;
    this._blowStartTime = 0;
    // Fish starts on left
    this.fish = {
      x: this.w * 0.08,
      y: this.h * 0.55,
      targetX: this.w * 0.08,
      targetY: this.h * 0.55,
      size: 25,
      hopping: false,
      hopIndex: -1,
    };
    this._lastTime = performance.now();
    window.addEventListener('resize', this._onResize = () => this.resize());
    // Long press = blow, tap = hop fish
    this._touchStart = 0;
    this.canvas.addEventListener('pointerdown', this._onDown = (e) => {
      e.preventDefault();
      this._touchStart = performance.now();
      this._touchBlowing = true;
    });
    this.canvas.addEventListener('pointerup', this._onUp = () => {
      const dur = performance.now() - this._touchStart;
      this._touchBlowing = false;
      if (dur < 200) this.tryHopFish(); // short tap = hop
    });
    this.canvas.addEventListener('pointerleave', this._onLeave = () => { this._touchBlowing = false; });
    this.loop();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    const micBlow = this.app.audio.getBlowLevel();
    const touchBlow = this._touchBlowing ? 0.15 : 0;
    const blow = Math.max(micBlow, touchBlow);
    this.blowSmooth = this.blowSmooth * 0.3 + blow * 0.7;
    const fill = document.getElementById('mic-fill-bubbles');
    if (fill) fill.style.width = Math.min(100, this.blowSmooth * 500) + '%';
    const isBlowing = this.blowSmooth > 0.06;
    if (isBlowing && !this.isBlowing) {
      this._blowStartTime = performance.now();
    }
    this.isBlowing = isBlowing;
    // Create/grow bubble while blowing
    if (isBlowing && this.bubbles.length < this.level.bubblesNeeded + 3) {
      this.currentBubbleSize += dt * 45 * Math.min(this.blowSmooth * 5, 1);
      if (this.currentBubbleSize > 55) this.currentBubbleSize = 55;
    } else if (!isBlowing && this.currentBubbleSize > 5) {
      // Release bubble
      const spacing = 0.7 / Math.max(this.level.bubblesNeeded, 1);
      const bx = this.w * (0.15 + this.bubbles.length * spacing);
      this.bubbles.push({
        x: Math.min(bx, this.w * 0.82),
        y: this.h * 0.5,
        r: Math.max(18, this.currentBubbleSize),
        vy: -0.3,
        life: this.level.popTime,
        wobble: Math.random() * Math.PI * 2,
        opacity: 1,
      });
      this.app.audio.playPop();
      this.particles.emit(bx, this.h * 0.55, 5, { color: '#87CEEB', spread: 2, size: 2 });
      this.currentBubbleSize = 0;
    } else if (!isBlowing) {
      this.currentBubbleSize *= 0.95;
    }
    // Update bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.wobble += dt * 2;
      b.y += b.vy * dt * 10;
      b.x += Math.sin(b.wobble) * 0.3;
      b.life -= dt;
      if (b.life < 2) b.opacity = b.life / 2;
      if (b.life <= 0) {
        this.particles.emit(b.x, b.y, 6, { color: '#87CEEB', spread: 3, size: 2 });
        this.bubbles.splice(i, 1);
      }
    }
    // Fish movement
    const f = this.fish;
    f.x += (f.targetX - f.x) * 0.08;
    f.y += (f.targetY - f.y) * 0.08;
    // Check if fish reached the end
    if (f.x > this.w * 0.88 && this.running) {
      this.score = this.level.bubblesNeeded;
      this.finish();
    }
    this.particles.update();
  }

  tryHopFish() {
    if (this.fish.hopping) return;
    // Find next bubble to hop to
    const sortedBubbles = [...this.bubbles]
      .filter(b => b.x > this.fish.x + 10 && b.life > 1)
      .sort((a, b) => a.x - b.x);
    if (sortedBubbles.length > 0) {
      const target = sortedBubbles[0];
      this.fish.targetX = target.x;
      this.fish.targetY = target.y - target.r - 10;
      this.fish.hopping = true;
      this.score++;
      this.app.audio.playClick();
      setTimeout(() => { this.fish.hopping = false; }, 300);
    } else if (this.bubbles.length >= this.level.bubblesNeeded) {
      // Hop to finish
      this.fish.targetX = this.w * 0.92;
      this.fish.targetY = this.h * 0.45;
      this.app.audio.playClick();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.3, '#6BB5D0');
    grad.addColorStop(0.4, '#4A9BBB');
    grad.addColorStop(1, '#1E6B8B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    const t = performance.now() * 0.00008;
    for (let i = 0; i < 3; i++) {
      const cx = ((t * (30 + i * 15) + i * 250) % (this.w + 200)) - 100;
      ctx.beginPath();
      ctx.ellipse(cx, 25 + i * 30, 50 + i * 10, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Banks (left and right)
    ctx.fillStyle = '#2D6B50';
    ctx.fillRect(0, this.h * 0.35, this.w * 0.06, this.h * 0.65);
    ctx.fillRect(this.w * 0.92, this.h * 0.35, this.w * 0.08, this.h * 0.65);
    // Trees on banks
    ctx.fillStyle = '#1E5A3A';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-5, this.h * 0.38 + i * 60);
      ctx.lineTo(15, this.h * 0.28 + i * 60); ctx.lineTo(35, this.h * 0.38 + i * 60); ctx.fill();
      ctx.beginPath(); ctx.moveTo(this.w - 35, this.h * 0.38 + i * 60);
      ctx.lineTo(this.w - 15, this.h * 0.28 + i * 60); ctx.lineTo(this.w + 5, this.h * 0.38 + i * 60); ctx.fill();
    }
    // Water surface with waves
    const waterY = this.h * 0.4;
    ctx.fillStyle = 'rgba(30, 107, 139, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    for (let x = 0; x <= this.w; x += 10) {
      ctx.lineTo(x, waterY + Math.sin(x * 0.04 + performance.now() * 0.003) * 6);
    }
    ctx.lineTo(this.w, this.h);
    ctx.lineTo(0, this.h);
    ctx.closePath();
    ctx.fill();
    // Water depth lines
    for (let i = 1; i < 4; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + i * 0.02})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= this.w; x += 10) {
        const y = waterY + i * this.h * 0.12 + Math.sin(x * 0.03 + performance.now() * 0.002 + i) * 3;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Instruction text
    if (this.bubbles.length === 0 && this.currentBubbleSize < 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '600 16px Jost';
      ctx.textAlign = 'center';
      ctx.fillText('Dmuchaj lub przytrzymaj palec!', this.w / 2, this.h * 0.25);
      ctx.font = '400 13px Jost';
      ctx.fillText('Puść aby wypuścić bąbelek', this.w / 2, this.h * 0.25 + 22);
    }
    // Growing bubble preview
    if (this.currentBubbleSize > 3) {
      const spacing = 0.7 / Math.max(this.level.bubblesNeeded, 1);
      const bx = this.w * (0.15 + this.bubbles.length * spacing);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#87CEEB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(Math.min(bx, this.w * 0.85), this.h * 0.55, this.currentBubbleSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Bubbles
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.opacity * 0.7;
      const bg = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
      bg.addColorStop(0, 'rgba(255,255,255,0.4)');
      bg.addColorStop(0.5, 'rgba(135,206,235,0.2)');
      bg.addColorStop(1, 'rgba(135,206,235,0.05)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.2, b.r * 0.12, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Fish
    this._drawFish(ctx, this.fish.x, this.fish.y);
    // Score
    ctx.fillStyle = COLORS.straw;
    ctx.font = '600 15px Jost';
    ctx.textAlign = 'left';
    ctx.fillText('Bąbelki: ' + this.bubbles.length + '/' + this.level.bubblesNeeded, 15, 25);
    ctx.textAlign = 'center';
    if (this.bubbles.length >= this.level.bubblesNeeded) {
      ctx.fillStyle = COLORS.lime;
      ctx.font = '700 16px Jost';
      ctx.fillText('Kliknij by rybka skoczyła!', this.w / 2, 50);
    }
    // Particles
    this.particles.draw(ctx);
  }

  _drawFish(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Body
    ctx.fillStyle = '#FF8C42';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.fillStyle = '#FF6B2B';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-24, -8);
    ctx.lineTo(-24, 8);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2A3B30';
    ctx.beginPath();
    ctx.arc(9, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  finish() {
    if (!this.running) return;
    this.running = false;
    setTimeout(() => {
      this.app.completeGame('bubbles', this.score, this.level.bubblesNeeded);
    }, 600);
  }

  stop() {
    this.running = false;
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointerup', this._onUp);
    this.canvas.removeEventListener('pointerleave', this._onLeave);
  }
}

// ==================== GAME: MOUTH GYM ====================
class MouthGymGame {
  constructor(app) {
    this.app = app;
    this.canvas = document.getElementById('canvas-mouthgym');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.exerciseIndex = 0;
    this.exerciseList = [];
    this.timeLeft = 0;
    this.duration = 0;
    this.phase = 'intro'; // intro, exercise, transition, done
  }

  start(lvlNum) {
    this.level = GAME_INFO.mouthgym.levels[lvlNum - 1];
    this.resize();
    this.exerciseIndex = 0;
    this.running = true;
    // Shuffle and pick exercises
    const shuffled = [...EXERCISES].sort(() => Math.random() - 0.5);
    this.exerciseList = shuffled.slice(0, this.level.exercises);
    this.duration = this.level.duration;
    window.addEventListener('resize', this._onResize = () => this.resize());
    this._animFrame = 0;
    this.showExercise();
    this.loop();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  showExercise() {
    if (this.exerciseIndex >= this.exerciseList.length) {
      this.finish();
      return;
    }
    const ex = this.exerciseList[this.exerciseIndex];
    document.getElementById('mg-name').textContent = ex.emoji + ' ' + ex.name;
    document.getElementById('mg-desc').textContent = ex.desc;
    document.getElementById('mg-count').textContent =
      (this.exerciseIndex + 1) + ' / ' + this.exerciseList.length;
    document.getElementById('mg-progress').style.width =
      ((this.exerciseIndex / this.exerciseList.length) * 100) + '%';
    this.timeLeft = this.duration;
    document.getElementById('mg-timer').textContent = this.timeLeft;
    this.phase = 'exercise';
    // Timer circle
    const circumference = 2 * Math.PI * 52;
    const ring = document.getElementById('mg-timer-ring');
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = '0';
    // Countdown
    clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      if (!this.running) return;
      this.timeLeft--;
      document.getElementById('mg-timer').textContent = Math.max(0, this.timeLeft);
      const progress = 1 - (this.timeLeft / this.duration);
      ring.style.strokeDashoffset = (circumference * progress).toFixed(1);
      if (this.timeLeft <= 0) {
        clearInterval(this._timerInterval);
        this.app.audio.playClick();
        this.exerciseIndex++;
        document.getElementById('mg-progress').style.width =
          ((this.exerciseIndex / this.exerciseList.length) * 100) + '%';
        if (this.exerciseIndex < this.exerciseList.length) {
          this.phase = 'transition';
          setTimeout(() => this.showExercise(), 600);
        } else {
          this.finish();
        }
      }
    }, 1000);
  }

  loop() {
    if (!this.running) return;
    this._animFrame++;
    this.drawFace();
    requestAnimationFrame(() => this.loop());
  }

  drawFace() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    // Background
    ctx.fillStyle = '#3D7A5C';
    ctx.fillRect(0, 0, this.w, this.h);
    const cx = this.w / 2;
    const cy = this.h * 0.42;
    const r = Math.min(this.w, this.h * 0.6) * 0.3;
    const t = this._animFrame * 0.05;
    const ex = this.exerciseList[this.exerciseIndex] || this.exerciseList[0];
    // Face circle
    ctx.fillStyle = '#FFD4A8';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E8B888';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Eyes
    const eyeY = cy - r * 0.15;
    const eyeSpacing = r * 0.35;
    ctx.fillStyle = '#2A3B30';
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY, r * 0.08, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpacing, eyeY, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing + 2, eyeY - 2, r * 0.03, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpacing + 2, eyeY - 2, r * 0.03, 0, Math.PI * 2);
    ctx.fill();
    // Cheeks
    ctx.fillStyle = 'rgba(255, 150, 150, 0.25)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy + r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.55, cy + r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Mouth & tongue based on exercise
    const mouthY = cy + r * 0.3;
    const mouthW = r * 0.4;
    switch (ex.id) {
      case 'konik': {
        // Tongue clicking - tongue goes up and down
        const tongueUp = Math.sin(t * 4) > 0;
        ctx.fillStyle = '#E85050';
        if (tongueUp) {
          // Tongue pressed to palate
          ctx.beginPath();
          ctx.ellipse(cx, mouthY - r * 0.08, mouthW * 0.4, r * 0.06, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Open mouth with tongue down
          ctx.fillStyle = '#8B2020';
          ctx.beginPath();
          ctx.ellipse(cx, mouthY, mouthW * 0.5, r * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#E85050';
          ctx.beginPath();
          ctx.ellipse(cx, mouthY + r * 0.06, mouthW * 0.3, r * 0.05, 0, 0, Math.PI);
          ctx.fill();
        }
        break;
      }
      case 'hustawka': {
        // Tongue up and down
        const tongueY = Math.sin(t * 2) * r * 0.2;
        ctx.fillStyle = '#8B2020';
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mouthW * 0.5, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E85050';
        ctx.beginPath();
        ctx.ellipse(cx, mouthY + tongueY, mouthW * 0.25, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'zegar': {
        // Tongue left and right
        const tongueX = Math.sin(t * 2) * r * 0.3;
        ctx.fillStyle = '#8B2020';
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mouthW * 0.5, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E85050';
        ctx.beginPath();
        ctx.ellipse(cx + tongueX, mouthY, mouthW * 0.2, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'malarz': {
        // Tongue sweeping palate
        const tonguePos = (Math.sin(t * 1.5) + 1) / 2;
        ctx.fillStyle = '#8B2020';
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mouthW * 0.5, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E85050';
        const ty = mouthY - r * 0.1 + tonguePos * r * 0.15;
        ctx.beginPath();
        ctx.ellipse(cx, ty, mouthW * 0.2, r * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'rybka': {
        // Lip puckering/popping
        const pucker = (Math.sin(t * 3) + 1) / 2;
        const mw = mouthW * (0.2 + pucker * 0.3);
        const mh = r * (0.05 + pucker * 0.1);
        ctx.fillStyle = '#D44040';
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mw, mh, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'usmiech': {
        // Alternating smile and pucker
        const isSmile = Math.sin(t * 2) > 0;
        if (isSmile) {
          ctx.strokeStyle = '#D44040';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, mouthY - r * 0.05, mouthW * 0.6, 0.2, Math.PI - 0.2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#D44040';
          ctx.beginPath();
          ctx.arc(cx, mouthY, r * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      default: {
        ctx.strokeStyle = '#D44040';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, mouthY - r * 0.05, mouthW * 0.5, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    }
  }

  finish() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this._timerInterval);
    document.getElementById('mg-progress').style.width = '100%';
    // All exercises completed = max score
    setTimeout(() => {
      this.app.completeGame('mouthgym', this.exerciseList.length, this.exerciseList.length);
    }, 500);
  }

  stop() {
    this.running = false;
    clearInterval(this._timerInterval);
    window.removeEventListener('resize', this._onResize);
  }
}

// ==================== GAME: DRUM ====================
// New mechanic: dots light up one by one. Tap the drum when a dot lights up.
// Tap = hit (good), miss = dot passes without tap (ok, just no points).
// Much more forgiving — counts hits, not perfection.
class DrumGame {
  constructor(app) {
    this.app = app;
    this.running = false;
    this.level = {};
    this.round = 0;
    this.pattern = [];
    this.phase = 'listen';
    this.correctRounds = 0;
    this._currentDot = -1;
    this._hits = 0;
    this._totalBeats = 0;
    this._tapped = false;
  }

  start(lvlNum) {
    this.level = GAME_INFO.drum.levels[lvlNum - 1];
    this.round = 0;
    this.correctRounds = 0;
    this.running = true;
    const pad = document.getElementById('drum-pad');
    pad.addEventListener('pointerdown', this._onTap = (e) => {
      e.preventDefault();
      this.onTap();
    });
    this.nextRound();
  }

  nextRound() {
    if (this.round >= this.level.rounds) {
      this.finish();
      return;
    }
    this.round++;
    this._hits = 0;
    this._tapped = false;
    document.getElementById('drum-round').textContent =
      'Runda ' + this.round + ' / ' + this.level.rounds;
    // Generate simple pattern — only beats, no rests for clarity
    this.pattern = [];
    for (let i = 0; i < this.level.patternLen; i++) {
      this.pattern.push(0); // all beats
    }
    this._totalBeats = this.pattern.length;
    this._currentDot = -1;
    this.phase = 'listen';
    document.getElementById('drum-msg').textContent = 'Posłuchaj i zapamiętaj...';
    this.renderPattern();
    setTimeout(() => this.playPattern(), 500);
  }

  renderPattern() {
    const container = document.getElementById('drum-pattern');
    container.innerHTML = '';
    this.pattern.forEach((beat, i) => {
      const dot = document.createElement('div');
      dot.className = 'drum-dot';
      dot.id = 'dot-' + i;
      container.appendChild(dot);
    });
  }

  playPattern() {
    let i = 0;
    const speed = this.level.speed;
    const play = () => {
      if (i >= this.pattern.length || !this.running) return;
      // Highlight dot
      document.querySelectorAll('.drum-dot').forEach(d => d.classList.remove('active'));
      const dot = document.getElementById('dot-' + i);
      if (dot) {
        dot.classList.add('active');
        this.app.audio.playDrum();
      }
      i++;
      if (i < this.pattern.length) {
        setTimeout(play, speed);
      } else {
        setTimeout(() => {
          document.querySelectorAll('.drum-dot').forEach(d => d.classList.remove('active'));
          // Now player's turn — dots light up and player must tap
          this.phase = 'play';
          this._currentDot = -1;
          document.getElementById('drum-msg').textContent = 'Twoja kolej! Stukaj gdy się świeci!';
          setTimeout(() => this.playDotSequence(), 600);
        }, speed * 0.6);
      }
    };
    play();
  }

  playDotSequence() {
    this._currentDot++;
    if (this._currentDot >= this.pattern.length) {
      this.evaluateRound();
      return;
    }
    if (!this.running) return;
    // Light up current dot
    document.querySelectorAll('.drum-dot').forEach(d => d.classList.remove('active'));
    const dot = document.getElementById('dot-' + this._currentDot);
    if (dot) dot.classList.add('active');
    this._tapped = false;
    // Give generous window to tap (speed + 300ms grace)
    const window = this.level.speed + 300;
    this._dotTimeout = setTimeout(() => {
      // Time's up for this dot
      if (!this._tapped) {
        // Missed — mark as missed but continue (no penalty, just no point)
        const d = document.getElementById('dot-' + this._currentDot);
        if (d) { d.classList.remove('active'); d.classList.add('hit-bad'); }
      }
      this.playDotSequence();
    }, window);
  }

  onTap() {
    if (!this.running) return;
    this.app.audio.playDrum();
    const pad = document.getElementById('drum-pad');
    pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 100);
    if (this.phase !== 'play' || this._tapped) return;
    // Player tapped while dot is active — that's a hit!
    this._tapped = true;
    this._hits++;
    const dot = document.getElementById('dot-' + this._currentDot);
    if (dot) {
      dot.classList.remove('active');
      dot.classList.add('hit-ok');
    }
    // Clear timeout and advance immediately
    clearTimeout(this._dotTimeout);
    setTimeout(() => this.playDotSequence(), 150);
  }

  evaluateRound() {
    this.phase = 'feedback';
    document.querySelectorAll('.drum-dot').forEach(d => d.classList.remove('active'));
    const ratio = this._hits / this._totalBeats;
    if (ratio >= 0.5) {
      this.correctRounds++;
      document.getElementById('drum-msg').textContent =
        ratio >= 0.9 ? 'Perfekcyjnie! 🎉' : 'Dobrze! ' + this._hits + '/' + this._totalBeats;
      this.app.audio.playSuccess();
    } else {
      document.getElementById('drum-msg').textContent = 'Spróbuj jeszcze! ' + this._hits + '/' + this._totalBeats;
      this.app.audio.playFail();
    }
    setTimeout(() => {
      if (this.running) this.nextRound();
    }, 1800);
  }

  finish() {
    if (!this.running) return;
    this.running = false;
    document.getElementById('drum-msg').textContent = 'Koniec!';
    setTimeout(() => {
      this.app.completeGame('drum', this.correctRounds, this.level.rounds);
    }, 500);
  }

  stop() {
    this.running = false;
    clearTimeout(this._dotTimeout);
    const pad = document.getElementById('drum-pad');
    if (this._onTap) pad.removeEventListener('pointerdown', this._onTap);
  }
}

// ==================== GAME: MEMORY ====================
class MemoryGame {
  constructor(app) {
    this.app = app;
    this.running = false;
    this.cards = [];
    this.flipped = [];
    this.matched = 0;
    this.moves = 0;
    this.level = {};
    this.locked = false;
  }

  start(lvlNum) {
    this.level = GAME_INFO.memory.levels[lvlNum - 1];
    this.matched = 0;
    this.moves = 0;
    this.flipped = [];
    this.locked = false;
    this.running = true;
    // Pick animals
    const shuffled = [...MEMORY_ANIMALS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, this.level.pairs);
    // Create card pairs
    this.cards = [];
    picked.forEach((animal, i) => {
      this.cards.push({ id: i * 2, animalIdx: i, animal, matched: false });
      this.cards.push({ id: i * 2 + 1, animalIdx: i, animal, matched: false });
    });
    // Shuffle
    this.cards.sort(() => Math.random() - 0.5);
    this.renderCards();
    this.updateStats();
  }

  renderCards() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    const total = this.cards.length;
    const cols = total <= 8 ? 4 : 4;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.cards.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'memory-card';
      el.dataset.index = i;
      el.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front"></div>
          <div class="memory-card-back">${card.animal.emoji}</div>
        </div>
      `;
      el.addEventListener('click', () => this.flipCard(i));
      grid.appendChild(el);
    });
  }

  flipCard(index) {
    if (!this.running || this.locked) return;
    const card = this.cards[index];
    if (card.matched || this.flipped.includes(index)) return;
    this.flipped.push(index);
    const el = document.querySelectorAll('.memory-card')[index];
    el.classList.add('flipped');
    // Play animal sound
    this.app.audio.init();
    this.app.audio.playAnimalSound(card.animal);
    if (this.flipped.length === 2) {
      this.moves++;
      this.updateStats();
      this.locked = true;
      const [i1, i2] = this.flipped;
      const c1 = this.cards[i1];
      const c2 = this.cards[i2];
      if (c1.animalIdx === c2.animalIdx) {
        // Match!
        setTimeout(() => {
          c1.matched = true;
          c2.matched = true;
          document.querySelectorAll('.memory-card')[i1].classList.add('matched');
          document.querySelectorAll('.memory-card')[i2].classList.add('matched');
          this.matched++;
          this.updateStats();
          this.app.audio.playPop();
          this.flipped = [];
          this.locked = false;
          if (this.matched === this.level.pairs) {
            setTimeout(() => this.finish(), 600);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          document.querySelectorAll('.memory-card')[i1].classList.remove('flipped');
          document.querySelectorAll('.memory-card')[i2].classList.remove('flipped');
          this.flipped = [];
          this.locked = false;
        }, 1000);
      }
    }
  }

  updateStats() {
    document.getElementById('mem-moves').textContent = 'Ruchy: ' + this.moves;
    document.getElementById('mem-pairs').textContent = 'Pary: ' + this.matched + ' / ' + this.level.pairs;
  }

  finish() {
    if (!this.running) return;
    this.running = false;
    // Score based on moves vs optimal
    const optimal = this.level.pairs * 2;
    const ratio = optimal / Math.max(this.moves, optimal);
    const score = Math.round(ratio * this.level.pairs);
    setTimeout(() => {
      this.app.completeGame('memory', score, this.level.pairs);
    }, 300);
  }

  stop() {
    this.running = false;
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
