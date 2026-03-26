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
    const bins = Math.min(30, this._blowData.length);
    for (let i = 1; i < bins; i++) sum += this._blowData[i];
    const avg = sum / ((bins - 1) * 255);
    // Smooth
    this.blowLevel = this.blowLevel * 0.3 + avg * 0.7;
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
    // Create seeds
    const cx = this.canvas.width / 2;
    const stemTop = this.canvas.height * 0.35;
    for (let i = 0; i < this.level.seeds; i++) {
      const angle = (i / this.level.seeds) * Math.PI * 2 + Math.random() * 0.3;
      const r = 15 + Math.random() * 20;
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
    // Get blow level
    const blow = this.app.audio.getBlowLevel();
    this.blowSmooth = this.blowSmooth * 0.5 + blow * 0.5;
    // Update mic indicator
    const fill = document.getElementById('mic-fill-dandelion');
    if (fill) fill.style.width = Math.min(100, this.blowSmooth * 300) + '%';
    // Threshold for blowing
    const isBlowing = this.blowSmooth > 0.08;
    const blowForce = Math.min(this.blowSmooth * 3, 1);
    // Target zone (garden at bottom)
    const gardenY = this.h * 0.85;
    const gardenCx = this.w / 2;
    const gardenR = this.w * this.level.targetSize;
    for (const seed of this.seeds) {
      if (seed.landed || seed.scattered) continue;
      seed.wobble += dt * 2;
      if (seed.attached) {
        if (isBlowing) {
          seed.attached = false;
          // Gentle blow sends seeds toward garden, strong blow scatters
          const toGarden = blowForce < 0.5;
          if (toGarden) {
            const dx = gardenCx - seed.x + (Math.random() - 0.5) * gardenR;
            const dy = gardenY - seed.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            seed.vx = (dx / dist) * (30 + blowForce * 40) + (Math.random() - 0.5) * 15;
            seed.vy = (dy / dist) * (30 + blowForce * 40) + Math.random() * 10;
          } else {
            seed.vx = (Math.random() - 0.5) * 120 * blowForce;
            seed.vy = -30 - Math.random() * 60 * blowForce;
          }
        }
      } else {
        // Physics
        seed.vy += 15 * dt; // gravity
        seed.vx *= 0.99;
        if (isBlowing) {
          seed.vx += (Math.random() - 0.5) * blowForce * 30 * dt;
          seed.vy -= blowForce * 20 * dt;
        }
        seed.x += seed.vx * dt;
        seed.y += seed.vy * dt;
        // Check garden landing
        const dx = seed.x - gardenCx;
        const dy = seed.y - gardenY;
        if (Math.abs(dx) < gardenR && seed.y >= gardenY - 10) {
          seed.landed = true;
          seed.y = gardenY;
          this.landed++;
          this.particles.emit(seed.x, seed.y, 8, { color: COLORS.lime, spread: 3, rise: 1, size: 3 });
          this.app.audio.playPop();
        }
        // Check out of bounds
        if (seed.x < -20 || seed.x > this.w + 20 || seed.y < -50 || seed.y > this.h + 20) {
          seed.scattered = true;
          this.scattered++;
        }
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
    skyGrad.addColorStop(0, '#4A8B6B');
    skyGrad.addColorStop(0.5, '#5AA07B');
    skyGrad.addColorStop(1, '#3D7A5C');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.w, this.h);
    // Garden zone
    const gardenY = this.h * 0.85;
    const gardenCx = this.w / 2;
    const gardenR = this.w * this.level.targetSize;
    // Ground
    ctx.fillStyle = '#2D6B50';
    ctx.fillRect(0, gardenY + 10, this.w, this.h - gardenY);
    // Garden highlight
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = COLORS.lime;
    ctx.beginPath();
    ctx.ellipse(gardenCx, gardenY + 5, gardenR, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Flowers in garden
    for (let i = 0; i < 5; i++) {
      const fx = gardenCx - gardenR + (i + 0.5) * (gardenR * 2 / 5);
      const fy = gardenY + 5;
      this._drawFlower(ctx, fx, fy, 6 + i % 3 * 2);
    }
    // Dandelion stem
    const stemBase = this.h * 0.8;
    const stemTop = this.h * 0.35;
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
  }

  start(lvlNum) {
    this.level = GAME_INFO.bubbles.levels[lvlNum - 1];
    this.resize();
    this.bubbles = [];
    this.score = 0;
    this.currentBubbleSize = 0;
    this.isBlowing = false;
    this.running = true;
    this._blowStartTime = 0;
    // Fish starts on left
    this.fish = {
      x: this.w * 0.08,
      y: this.h * 0.5,
      targetX: this.w * 0.08,
      targetY: this.h * 0.5,
      size: 20,
      hopping: false,
      hopIndex: -1,
    };
    this._lastTime = performance.now();
    window.addEventListener('resize', this._onResize = () => this.resize());
    // Touch/click to make fish hop
    this.canvas.addEventListener('click', this._onClick = () => this.tryHopFish());
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
    const blow = this.app.audio.getBlowLevel();
    this.blowSmooth = this.blowSmooth * 0.4 + blow * 0.6;
    const fill = document.getElementById('mic-fill-bubbles');
    if (fill) fill.style.width = Math.min(100, this.blowSmooth * 300) + '%';
    const isBlowing = this.blowSmooth > 0.08;
    if (isBlowing && !this.isBlowing) {
      this._blowStartTime = performance.now();
    }
    this.isBlowing = isBlowing;
    // Create/grow bubble while blowing
    if (isBlowing && this.bubbles.length < this.level.bubblesNeeded + 3) {
      this.currentBubbleSize += dt * 30 * Math.min(this.blowSmooth * 3, 1);
      if (this.currentBubbleSize > 60) this.currentBubbleSize = 60;
    } else if (!isBlowing && this.currentBubbleSize > 5) {
      // Release bubble
      const bx = this.w * (0.2 + this.bubbles.length * 0.12);
      this.bubbles.push({
        x: Math.min(bx, this.w * 0.85),
        y: this.h * 0.55,
        r: Math.max(12, this.currentBubbleSize),
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
    grad.addColorStop(0, '#4A8B6B');
    grad.addColorStop(0.4, '#5AA07B');
    grad.addColorStop(0.45, '#3E8B9B');
    grad.addColorStop(1, '#2E6B7B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);
    // Water surface
    const waterY = this.h * 0.45;
    ctx.fillStyle = 'rgba(46, 139, 139, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    for (let x = 0; x <= this.w; x += 20) {
      ctx.lineTo(x, waterY + Math.sin(x * 0.03 + performance.now() * 0.002) * 5);
    }
    ctx.lineTo(this.w, this.h);
    ctx.lineTo(0, this.h);
    ctx.closePath();
    ctx.fill();
    // Growing bubble preview
    if (this.currentBubbleSize > 3) {
      const bx = this.w * (0.2 + this.bubbles.length * 0.12);
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
    // Target zone (right bank)
    ctx.fillStyle = '#2D6B50';
    ctx.fillRect(this.w * 0.9, waterY - 5, this.w * 0.1, this.h - waterY + 5);
    // Left bank
    ctx.fillRect(0, waterY - 5, this.w * 0.05, this.h - waterY + 5);
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
    this.canvas.removeEventListener('click', this._onClick);
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
class DrumGame {
  constructor(app) {
    this.app = app;
    this.running = false;
    this.level = {};
    this.round = 0;
    this.pattern = [];
    this.playerPattern = [];
    this.phase = 'listen'; // listen, play, feedback
    this.correctRounds = 0;
    this.patternIndex = 0;
  }

  start(lvlNum) {
    this.level = GAME_INFO.drum.levels[lvlNum - 1];
    this.round = 0;
    this.correctRounds = 0;
    this.running = true;
    // Drum pad
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
    document.getElementById('drum-round').textContent =
      'Runda ' + this.round + ' / ' + this.level.rounds;
    // Generate pattern
    this.pattern = [];
    for (let i = 0; i < this.level.patternLen; i++) {
      // 0 = beat, 1 = rest (occasional)
      this.pattern.push(Math.random() > 0.25 ? 0 : 1);
    }
    // Make sure at least 2 beats
    if (this.pattern.filter(p => p === 0).length < 2) {
      this.pattern[0] = 0;
      this.pattern[this.pattern.length - 1] = 0;
    }
    this.playerPattern = [];
    this.patternIndex = 0;
    this.phase = 'listen';
    document.getElementById('drum-msg').textContent = 'Posłuchaj rytmu...';
    this.renderPattern();
    // Play the pattern
    setTimeout(() => this.playPattern(), 600);
  }

  renderPattern() {
    const container = document.getElementById('drum-pattern');
    container.innerHTML = '';
    this.pattern.forEach((beat, i) => {
      const dot = document.createElement('div');
      dot.className = 'drum-dot' + (beat === 1 ? ' rest' : '');
      dot.id = 'dot-' + i;
      container.appendChild(dot);
    });
  }

  playPattern() {
    let i = 0;
    const speed = this.level.speed;
    const play = () => {
      if (i >= this.pattern.length || !this.running) return;
      const dot = document.getElementById('dot-' + i);
      if (this.pattern[i] === 0) {
        dot.classList.add('active');
        this.app.audio.playDrum();
        setTimeout(() => dot.classList.remove('active'), speed * 0.4);
      }
      i++;
      if (i < this.pattern.length) {
        setTimeout(play, speed);
      } else {
        setTimeout(() => {
          this.phase = 'play';
          this.patternIndex = 0;
          this.playerPattern = [];
          document.getElementById('drum-msg').textContent = 'Twoja kolej! Stukaj!';
          this._playStartTime = performance.now();
          this._expectedTimes = [];
          // Calculate expected tap times
          let t = 0;
          for (let j = 0; j < this.pattern.length; j++) {
            if (this.pattern[j] === 0) this._expectedTimes.push(t);
            t += speed;
          }
        }, speed);
      }
    };
    play();
  }

  onTap() {
    if (!this.running) return;
    this.app.audio.playDrum();
    const pad = document.getElementById('drum-pad');
    pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 100);
    if (this.phase !== 'play') return;
    const elapsed = performance.now() - this._playStartTime;
    this.playerPattern.push(elapsed);
    // Light up the next beat dot
    let beatCount = 0;
    for (let i = 0; i < this.pattern.length; i++) {
      if (this.pattern[i] === 0) {
        if (beatCount === this.playerPattern.length - 1) {
          document.getElementById('dot-' + i).classList.add('active');
          setTimeout(() => {
            const d = document.getElementById('dot-' + i);
            if (d) d.classList.remove('active');
          }, 200);
          break;
        }
        beatCount++;
      }
    }
    // Check if done
    const totalBeats = this.pattern.filter(p => p === 0).length;
    if (this.playerPattern.length >= totalBeats) {
      this.evaluateRound();
    }
  }

  evaluateRound() {
    this.phase = 'feedback';
    // Compare timing
    const expected = this._expectedTimes;
    const player = this.playerPattern;
    let totalError = 0;
    for (let i = 0; i < Math.min(expected.length, player.length); i++) {
      const diff = Math.abs(player[i] - expected[i]);
      totalError += diff;
    }
    const avgError = totalError / expected.length;
    const isGood = avgError < this.level.speed * 0.6;
    // Visual feedback
    const beats = this.pattern.map((b, i) => ({ beat: b, idx: i })).filter(b => b.beat === 0);
    beats.forEach((b, i) => {
      const dot = document.getElementById('dot-' + b.idx);
      if (i < player.length) {
        const diff = Math.abs(player[i] - expected[i]);
        dot.classList.add(diff < this.level.speed * 0.5 ? 'hit-ok' : 'hit-bad');
      }
    });
    if (isGood) {
      this.correctRounds++;
      document.getElementById('drum-msg').textContent = 'Świetnie! 🎉';
      this.app.audio.playSuccess();
    } else {
      document.getElementById('drum-msg').textContent = 'Prawie! Spróbuj jeszcze!';
      this.app.audio.playFail();
    }
    setTimeout(() => {
      if (this.running) this.nextRound();
    }, 1500);
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
