(() => {
  "use strict";

  /* =========================================================
     1. 阴冷深海与远古低鸣 Web Audio 声景引擎（零跳脸、去科幻感）
     432Hz 温暖助眠和弦 → 走音空洞残响与海底暗流 → 缓慢沉重的水下翻身脉动 → 宏大静谧黑日低鸣
     ========================================================= */
  class AbyssalAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.explicitlyMuted = false;
      this.initialized = false;

      this.masterGain = null;
      this.noiseBuffer = null;

      this.warmOscs = [];
      this.warmGain = null;
      this.warmFilter = null;

      this.oceanGain = null;
      this.oceanFilter = null;

      this.monolithOscs = [];
      this.monolithGain = null;
      this.monolithFilter = null;

      this.lastTidePulse = 0;
      this.lastDistantEcho = 0;
    }

    init() {
      if (this.initialized) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);

      const sr = this.ctx.sampleRate;
      const len = sr * 4;
      this.noiseBuffer = this.ctx.createBuffer(1, len, sr);
      const data = this.noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.022 * white) / 1.022;
        data[i] = lastOut * 2.5;
      }

      // 第一幕：温暖轻柔的助眠和弦
      this.warmFilter = this.ctx.createBiquadFilter();
      this.warmFilter.type = "lowpass";
      this.warmFilter.frequency.value = 650;

      this.warmGain = this.ctx.createGain();
      this.warmGain.gain.value = 0.14;
      this.warmFilter.connect(this.warmGain);
      this.warmGain.connect(this.masterGain);

      [216, 432, 540, 648].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.value = idx === 0 ? 0.34 : 0.16;
        osc.connect(g);
        g.connect(this.warmFilter);
        osc.start();
        this.warmOscs.push({ osc, baseFreq: freq });
      });

      // 黑暗海底潮汐暗流
      const oceanSrc = this.ctx.createBufferSource();
      oceanSrc.buffer = this.noiseBuffer;
      oceanSrc.loop = true;

      this.oceanFilter = this.ctx.createBiquadFilter();
      this.oceanFilter.type = "lowpass";
      this.oceanFilter.frequency.value = 90;
      this.oceanFilter.Q.value = 2.1;

      this.oceanGain = this.ctx.createGain();
      this.oceanGain.gain.value = 0.0001;

      oceanSrc.connect(this.oceanFilter);
      this.oceanFilter.connect(this.oceanGain);
      this.oceanGain.connect(this.masterGain);
      oceanSrc.start();

      // 终局：深沉、古老、空洞的黑海低鸣群（渐进涌起，无刺耳惊吓）
      this.monolithFilter = this.ctx.createBiquadFilter();
      this.monolithFilter.type = "lowpass";
      this.monolithFilter.frequency.value = 260;
      this.monolithFilter.Q.value = 1.6;

      this.monolithGain = this.ctx.createGain();
      this.monolithGain.gain.value = 0.0001;
      this.monolithFilter.connect(this.monolithGain);
      this.monolithGain.connect(this.masterGain);

      [48, 96, 142, 198, 289].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx < 2 ? "sine" : "triangle";
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.value = idx === 0 ? 0.44 : 0.13 / Math.sqrt(idx);
        osc.connect(g);
        g.connect(this.monolithFilter);
        osc.start();
        this.monolithOscs.push({ osc, baseFreq: freq, idx });
      });

      this.initialized = true;
    }

    enable() {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.enabled = true;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.75, now, 0.35);
    }

    disable() {
      this.enabled = false;
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.2);
    }

    toggle() {
      if (this.enabled) {
        this.explicitlyMuted = true;
        this.disable();
      } else {
        this.explicitlyMuted = false;
        this.enable();
      }
      return this.enabled;
    }

    update(corrupt, dread, abyssHorizonP, postAbyss, pointerDist) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;

      const effCorrupt = postAbyss ? Math.max(corrupt, 0.65) : corrupt;
      const effDread = postAbyss ? Math.max(dread, 0.55) : dread;

      this.warmOscs.forEach((item, idx) => {
        let ratio = 1;
        if (idx === 2) ratio = 1 - effCorrupt * 0.095;
        if (idx === 3) ratio = 1 - effCorrupt * 0.062;
        if (idx === 1) ratio = 1 + Math.sin(now * 0.42) * effCorrupt * 0.009;
        item.osc.frequency.setTargetAtTime(item.baseFreq * ratio, now, 0.2);
      });

      const warmLevel = Math.max(0.01, 0.14 * (1 - effDread * 0.8));
      this.warmGain.gain.setTargetAtTime(warmLevel, now, 0.25);
      this.warmFilter.frequency.setTargetAtTime(650 - effCorrupt * 350, now, 0.25);

      this.oceanGain.gain.setTargetAtTime(effCorrupt * 0.24 + effDread * 0.2, now, 0.3);
      this.oceanFilter.frequency.setTargetAtTime(72 + Math.sin(now * 0.28) * 20 + effDread * 42, now, 0.3);

      const monolithTarget = Math.max(postAbyss ? 0.08 : 0.0001, abyssHorizonP * 0.36);
      this.monolithGain.gain.setTargetAtTime(monolithTarget, now, 0.45);

      const mod = 1 + (1 - Math.min(1, pointerDist)) * 0.5;
      this.monolithFilter.frequency.setTargetAtTime((195 + abyssHorizonP * 165) * mod, now, 0.25);

      this.monolithOscs.forEach((m) => {
        const drift = Math.sin(now * (0.2 + m.idx * 0.06)) * 0.007 * (1 + abyssHorizonP);
        m.osc.frequency.setTargetAtTime(m.baseFreq * (1 + drift), now, 0.3);
      });

      // 缓慢如庞然大物在地板下呼吸般的次声脉动
      if (effCorrupt > 0.3 && now - this.lastTidePulse > 2.8) {
        this.lastTidePulse = now;
        this.playDeepBreath(0.09 + effDread * 0.14);
        pulseAbyssLayer(effDread * 0.44);
      }

      // 遥远空洞的水底回响
      if ((effDread > 0.28 || postAbyss) && now - this.lastDistantEcho > 6.8) {
        if (Math.random() < 0.48) {
          this.lastDistantEcho = now;
          this.playDistantBell((Math.random() - 0.5) * 1.3, 0.04 + effDread * 0.04);
        }
      }
    }

    playDeepBreath(amount = 0.14) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.55);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(amount, now + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.9);
    }

    playDistantBell(panVal = 0, volume = 0.05) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [392, 528, 740];
      const chosen = freqs[(Math.random() * freqs.length) | 0];

      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(chosen, now);
      osc.frequency.exponentialRampToValueAtTime(chosen * 0.98, now + 2.5);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(volume, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = panVal;
        osc.connect(g);
        g.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(g);
        g.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(now + 2.7);
    }

    playWaterStep() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      const base = 170 + Math.random() * 55;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 0.68, now + 0.5);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.62);
    }
  }

  const audio = new AbyssalAudioEngine();

  /* =========================================================
     2. DOM 引用与交互状态
     ========================================================= */
  const root = document.documentElement;
  const body = document.body;
  const fxCanvas = document.getElementById("fx-canvas");
  const fxCtx = fxCanvas.getContext("2d");
  const abyssPulseLayer = document.getElementById("abyss-pulse-layer");

  const labCanvas = document.getElementById("lab-anomaly-canvas");
  const labFrame = document.getElementById("lab-plate-frame");
  const corridorViewport = document.getElementById("corridor-viewport");
  const abyssViewport = document.getElementById("abyss-viewport");
  const corridorWarpCanvas = document.getElementById("corridor-warp-canvas");
  const eldritchCanvas = document.getElementById("eldritch-canvas");

  const audioToggleBtn = document.getElementById("audio-toggle-btn");
  const audioBtnLabel = document.getElementById("audio-btn-label");
  const heroSoundCta = document.getElementById("hero-sound-cta");
  const resetSanityBtn = document.getElementById("reset-sanity-btn");
  const retreatToast = document.getElementById("retreat-toast");

  const hudClock = document.getElementById("hud-clock");
  const hudDepth = document.getElementById("hud-depth");
  const hudCamId = document.getElementById("hud-cam-id");
  const cinemaSubtitle = document.getElementById("cinema-subtitle");

  const corridorSection = document.getElementById("corridor-anchor");
  const abyssSection = document.getElementById("abyss-climax");

  const liveVisitorReview = document.getElementById("live-visitor-review");
  const visitorDeviceLabel = document.getElementById("visitor-device-label");
  const visitorTimeLabel = document.getElementById("visitor-time-label");
  const liveDistanceLog = document.getElementById("live-distance-log");

  const runawayBtn = document.getElementById("runaway-unsubscribe-btn");
  const escapeCardNote = document.getElementById("escape-card-note");
  const trackingPupils = Array.from(document.querySelectorAll(".tracking-pupil"));
  const glitchSpans = Array.from(document.querySelectorAll(".subtle-creep[data-glitch]"));
  const dualCopyNodes = Array.from(document.querySelectorAll("[data-normal][data-abyss]"));

  let scrollP = 0;
  let smoothP = 0;
  let lastScrollY = window.scrollY;
  let rippleAccum = 0;
  let abyssUnlocked = false;
  let retreatWarned = false;
  let dodgeCount = 0;

  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let labPtrX = 0.5;
  let labPtrY = 0.42;
  let labActive = false;
  let lastInteractionAt = performance.now();

  function pulseAbyssLayer(strength = 0.3) {
    if (!abyssPulseLayer) return;
    abyssPulseLayer.style.opacity = String(Math.min(0.62, strength));
    setTimeout(() => {
      abyssPulseLayer.style.opacity = "0";
    }, 680);
  }

  /* =========================================================
     3. 第三幕暗房异常底片画布（无写实人脸、无科幻数据感，支持鼠标与手机触控）
     ========================================================= */
  function updateLabPointer(clientX, clientY) {
    if (!labFrame) return;
    const r = labFrame.getBoundingClientRect();
    labPtrX = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
    labPtrY = Math.min(1, Math.max(0, (clientY - r.top) / Math.max(1, r.height)));
    labActive = true;
  }

  if (labFrame) {
    labFrame.addEventListener("mousemove", (e) => updateLabPointer(e.clientX, e.clientY));
    labFrame.addEventListener("mouseleave", () => { labActive = false; });
    labFrame.addEventListener("touchstart", (e) => {
      if (e.touches[0]) updateLabPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    labFrame.addEventListener("touchmove", (e) => {
      if (e.touches[0]) updateLabPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  }

  function renderLabArchiveNegative(nowMs) {
    if (!labCanvas) return;
    const rect = labCanvas.getBoundingClientRect();
    if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;

    const ctx = labCanvas.getContext("2d");
    const w = labCanvas.width;
    const h = labCanvas.height;
    const t = nowMs * 0.001;

    // 阴郁老旧暗房底片底色
    ctx.fillStyle = "#06080d";
    ctx.fillRect(0, 0, w, h);

    const subjects = [
      { cx: w * 0.19, headY: h * 0.36, bodyW: 54 },
      { cx: w * 0.36, headY: h * 0.34, bodyW: 58 },
      { cx: w * 0.64, headY: h * 0.35, bodyW: 56 },
      { cx: w * 0.81, headY: h * 0.34, bodyW: 58 }
    ];

    const mx = labActive ? labPtrX * w : w * 0.5;
    const my = labActive ? labPtrY * h : h * 0.43;

    // 72 条暗房底片显影条纹：四个研发人员的轮廓面部向内塌陷成漆黑漩涡
    const rows = 72;
    for (let r = 8; r < rows; r++) {
      const baseY = (r / rows) * h;
      ctx.beginPath();

      for (let x = 0; x <= w; x += 6) {
        let dy = Math.sin(x * 0.022 + t * 0.9 + r * 0.24) * 1.1;

        for (let s = 0; s < subjects.length; s++) {
          const sub = subjects[s];
          const dxSub = x - sub.cx;
          const dyHead = baseY - sub.headY;
          const distHead = Math.hypot(dxSub, dyHead);

          if (baseY > sub.headY + 26 && Math.abs(dxSub) < sub.bodyW * 1.32) {
            const env = Math.exp(-(dxSub * dxSub) / (2 * sub.bodyW * sub.bodyW * 0.44));
            dy -= env * (8 + Math.sin(r * 0.85 + t * 1.6 + s) * 3.2);
          }

          if (distHead < 48) {
            const pull = 1 - distHead / 48;
            dy += (sub.headY - baseY) * pull * 0.94 + Math.sin(distHead * 0.42 - t * 2.8) * pull * 5.8;
          }
        }

        if (labActive) {
          const dMouse = Math.hypot(x - mx, baseY - my);
          if (dMouse < 130) {
            const mPull = 1 - dMouse / 130;
            dy += (my - baseY) * mPull * 0.42;
          }
        }

        if (x === 0) ctx.moveTo(x, baseY + dy);
        else ctx.lineTo(x, baseY + dy);
      }

      const alpha = 0.2 + (r / rows) * 0.32;
      ctx.strokeStyle = `rgba(186, 194, 206, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }

    // 四个向内塌陷的无五官漆黑焦斑
    subjects.forEach((sub, idx) => {
      const grad = ctx.createRadialGradient(sub.cx, sub.headY, 12, sub.cx, sub.headY, 36);
      grad.addColorStop(0, "#020306");
      grad.addColorStop(0.58, "#020306");
      grad.addColorStop(0.75, "rgba(198, 174, 130, 0.46)");
      grad.addColorStop(1, "rgba(2, 3, 6, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sub.cx, sub.headY, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(198, 174, 130, 0.6)";
      ctx.font = "13px serif";
      ctx.textAlign = "center";
      ctx.fillText(`0${idx + 1}`, sub.cx, h - 22);
    });

    // 中央背景阴影中缓慢悬停、无法对焦的不明暗影团块（克苏鲁式模糊轮廓）
    const cx = w * 0.5;
    const cy = h * 0.45;
    ctx.save();
    ctx.translate(cx, cy);

    const coreGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 56);
    coreGrad.addColorStop(0, "rgba(1, 2, 4, 0.98)");
    coreGrad.addColorStop(0.55, "rgba(42, 58, 78, 0.28)");
    coreGrad.addColorStop(1, "rgba(1, 2, 4, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();

    for (let ring = 0; ring < 3; ring++) {
      ctx.strokeStyle = `rgba(198, 174, 130, ${(0.48 - ring * 0.12).toFixed(2)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        24 + ring * 10 + Math.sin(t + ring) * 3,
        10 + ring * 5,
        t * (ring % 2 === 0 ? 0.35 : -0.28) + ring,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  /* =========================================================
     4. 第五幕画布：沉没长廊水面冷波纹与幽暗空间弯曲丝线
     ========================================================= */
  function resizeCorridorCanvas() {
    if (!corridorWarpCanvas) return;
    corridorWarpCanvas.width = Math.min(1280, window.innerWidth);
    corridorWarpCanvas.height = Math.min(820, window.innerHeight);
  }

  function renderCorridorWater(nowMs, localP) {
    if (!corridorWarpCanvas) return;
    const ctx = corridorWarpCanvas.getContext("2d");
    const w = corridorWarpCanvas.width;
    const h = corridorWarpCanvas.height;
    const t = nowMs * 0.001;

    ctx.clearRect(0, 0, w, h);
    const vx = w * 0.5;
    const vy = h * 0.51;

    // 极其克制的幽暗空间折痕
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + t * 0.06;
      const ctrl = 150 + Math.sin(t * 0.6 + i) * 55;
      ctx.strokeStyle = `rgba(176, 192, 212, ${(0.045 + localP * 0.06).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.quadraticCurveTo(
        vx + Math.cos(angle + 0.4) * ctrl,
        vy + Math.sin(angle + 0.4) * ctrl,
        vx + Math.cos(angle) * w * 0.72,
        vy + Math.sin(angle) * h * 0.72
      );
      ctx.stroke();
    }

    // 地面浅黑水面的冷波纹
    for (let k = 0; k < 4; k++) {
      const prog = (t * 0.26 + k * 0.25) % 1;
      const ry = 10 + prog * 62;
      const rx = ry * 3.6;
      const yPos = h * 0.68 + prog * h * 0.26;
      ctx.strokeStyle = `rgba(198, 174, 130, ${((1 - prog) * 0.2).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(vx, yPos, rx, ry * 0.26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* =========================================================
     5. 第六幕核心终局画布：无尽黑海、静默黑日与日常词汇的沉没消散
     （自动适配手机竖屏与电脑横屏构图，绝不与底部文字冲突）
     ========================================================= */
  const sinkingWords = [
    { word: "天亮", glyph: "☉", angle: 0.2, radius: 0.92, speed: 0.13 },
    { word: "家", glyph: "⟁", angle: 1.0, radius: 0.78, speed: 0.16 },
    { word: "名字", glyph: "☍", angle: 1.9, radius: 0.86, speed: 0.12 },
    { word: "人脸", glyph: "⌬", angle: 2.8, radius: 0.68, speed: 0.15 },
    { word: "门锁", glyph: "⧗", angle: 3.6, radius: 0.94, speed: 0.13 },
    { word: "呼吸", glyph: "ꙮ", angle: 4.4, radius: 0.74, speed: 0.15 },
    { word: "声音", glyph: "◈", angle: 5.2, radius: 0.84, speed: 0.17 },
    { word: "醒来", glyph: "⏣", angle: 5.9, radius: 0.62, speed: 0.14 }
  ];

  const abyssDust = Array.from({ length: 110 }, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: 0.16 + Math.random() * 0.74,
    speed: (0.035 + Math.random() * 0.1) * (Math.random() > 0.25 ? 1 : -0.5),
    size: 0.6 + Math.random() * 1.4,
    gold: Math.random() > 0.45
  }));

  function resizeEldritchCanvas() {
    if (!eldritchCanvas) return;
    eldritchCanvas.width = window.innerWidth;
    eldritchCanvas.height = window.innerHeight;
  }

  function renderBlackSeaEclipse(nowMs, revealP) {
    if (!eldritchCanvas) return;
    const ctx = eldritchCanvas.getContext("2d");
    const w = eldritchCanvas.width;
    const h = eldritchCanvas.height;
    const t = nowMs * 0.001;
    const isPortrait = w < h;

    // 竖屏手机自动上移黑日与海平线，给底部碑文留出呼吸空间
    const horizonY = isPortrait ? h * 0.54 : h * 0.64;
    const cx = w * 0.5;
    const cy = isPortrait ? h * 0.3 : h * 0.37;
    const minDim = Math.min(w, h);
    const eclipseR = isPortrait
      ? w * (0.13 + revealP * 0.025)
      : minDim * (0.095 + revealP * 0.03);

    const normMx = (pointerX - cx) / Math.max(1, w * 0.5);
    const normMy = (pointerY - cy) / Math.max(1, h * 0.5);

    // 1. 无星永夜天空
    const skyGrad = ctx.createRadialGradient(cx, cy, eclipseR * 0.6, cx, cy, Math.max(w, h) * 0.78);
    skyGrad.addColorStop(0, "#101724");
    skyGrad.addColorStop(0.32, "#070b13");
    skyGrad.addColorStop(0.7, "#020408");
    skyGrad.addColorStop(1, "#010204");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // 2. 黯淡苍白古金与冷靛日冕光晕（与回滚后卧室窗外日食严格呼应）
    const outerHalo = ctx.createRadialGradient(
      cx + normMx * 12,
      cy + normMy * 8,
      eclipseR * 0.95,
      cx,
      cy,
      eclipseR * 4.0
    );
    outerHalo.addColorStop(0, "rgba(248, 243, 228, 0.72)");
    outerHalo.addColorStop(0.09, "rgba(198, 174, 130, 0.42)");
    outerHalo.addColorStop(0.26, "rgba(74, 96, 128, 0.22)");
    outerHalo.addColorStop(0.55, "rgba(38, 56, 78, 0.07)");
    outerHalo.addColorStop(1, "rgba(2, 4, 8, 0)");

    ctx.fillStyle = outerHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, eclipseR * 4.0, 0, Math.PI * 2);
    ctx.fill();

    // 3. 围绕黑日缓慢折转的暗环（抽象而静默的不可名状感，非人、非科幻）
    ctx.save();
    ctx.translate(cx + normMx * 7, cy + normMy * 5);
    for (let i = 0; i < 5; i++) {
      const rx = eclipseR * (1.3 + i * 0.34 + Math.sin(t * 0.38 + i) * 0.05);
      const ry = eclipseR * (0.32 + (i % 3) * 0.22 + Math.cos(t * 0.3 + i * 1.4) * 0.1);
      const rot = t * (i % 2 === 0 ? 0.09 : -0.07) + i * 0.55 + normMx * 0.14;

      ctx.strokeStyle = i % 2 === 0
        ? `rgba(214, 192, 148, ${(0.32 - i * 0.045).toFixed(3)})`
        : `rgba(148, 168, 194, ${(0.24 - i * 0.035).toFixed(3)})`;
      ctx.lineWidth = i === 0 ? 1.4 : 0.95;

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, Math.abs(ry), rot, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 极细的暗影日珥丝线
    for (let f = 0; f < 40; f++) {
      const a = (f / 40) * Math.PI * 2 + t * 0.04;
      const bend = Math.sin(a * 3 + t * 0.8) * 14;
      const r1 = eclipseR * 1.01;
      const r2 = eclipseR * (1.26 + (f % 5) * 0.14);
      ctx.strokeStyle = "rgba(232, 220, 194, 0.14)";
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.08) * ((r1 + r2) * 0.5) + bend,
        Math.sin(a + 0.08) * ((r1 + r2) * 0.5),
        Math.cos(a) * r2,
        Math.sin(a) * r2
      );
      ctx.stroke();
    }
    ctx.restore();

    // 4. 坠落微尘
    abyssDust.forEach((p) => {
      p.angle += p.speed * 0.007;
      p.dist -= 0.0003;
      if (p.dist < 0.14) p.dist = 0.88;

      const r = p.dist * minDim * 0.6;
      const px = cx + Math.cos(p.angle) * r * (isPortrait ? 1.05 : 1.32);
      const py = cy + Math.sin(p.angle) * r * 0.62;
      if (py > horizonY) return;

      ctx.fillStyle = p.gold
        ? `rgba(218, 198, 156, ${(0.16 + (1 - p.dist) * 0.42).toFixed(3)})`
        : `rgba(176, 196, 218, ${(0.14 + (1 - p.dist) * 0.32).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. 白天记忆中的词（天亮、家、名字、人脸、醒来）缓缓坠入黑核消融
    if (revealP > 0.25) {
      ctx.textAlign = "center";
      sinkingWords.forEach((c, idx) => {
        const cycle = c.radius - ((t * c.speed * 0.17 + idx * 0.13) % 0.76);
        const normR = cycle < 0.16 ? cycle + 0.76 : cycle;
        const r = normR * minDim * (isPortrait ? 0.52 : 0.5);
        const ang = c.angle + t * 0.1 + (1 - normR) * 1.5;

        const x = cx + Math.cos(ang) * r * (isPortrait ? 1.02 : 1.35);
        const y = cy + Math.sin(ang) * r * 0.58;
        if (y > horizonY - 12 || y < 44) return;

        const nearCore = normR < 0.34;
        const alpha = Math.min(0.66, (normR - 0.15) * 1.35) * revealP;
        if (alpha <= 0.02) return;

        ctx.font = nearCore ? "14px serif" : (isPortrait ? "11.5px serif" : "12.5px serif");
        ctx.fillStyle = nearCore
          ? `rgba(198, 174, 130, ${alpha.toFixed(3)})`
          : `rgba(194, 204, 218, ${(alpha * 0.76).toFixed(3)})`;
        ctx.fillText(nearCore ? c.glyph : c.word, x, y);
      });
    }

    // 6. 中央绝对漆黑的日食空洞
    ctx.beginPath();
    ctx.arc(cx, cy, eclipseR, 0, Math.PI * 2);
    ctx.fillStyle = "#010103";
    ctx.shadowColor = "rgba(248, 242, 224, 0.82)";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(250, 245, 232, 0.86)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, eclipseR + 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // 7. 无边无际的静止黑海与波光倒影
    const seaGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    seaGrad.addColorStop(0, "#050911");
    seaGrad.addColorStop(0.32, "#03050a");
    seaGrad.addColorStop(1, "#010204");
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    const hLineGrad = ctx.createLinearGradient(cx - w * 0.42, horizonY, cx + w * 0.42, horizonY);
    hLineGrad.addColorStop(0, "rgba(2, 4, 8, 0)");
    hLineGrad.addColorStop(0.35, "rgba(116, 138, 168, 0.2)");
    hLineGrad.addColorStop(0.5, "rgba(226, 212, 180, 0.48)");
    hLineGrad.addColorStop(0.65, "rgba(116, 138, 168, 0.2)");
    hLineGrad.addColorStop(1, "rgba(2, 4, 8, 0)");
    ctx.fillStyle = hLineGrad;
    ctx.fillRect(0, horizonY - 1, w, 2);

    const numRipples = isPortrait ? 44 : 56;
    for (let i = 0; i < numRipples; i++) {
      const p = i / numRipples;
      const y = horizonY + 4 + Math.pow(p, 1.45) * (h - horizonY - 6);
      const waveShift = Math.sin(p * 22 - t * 1.4) * (6 + p * 26) + normMx * 14 * p;
      const spanW = (eclipseR * 1.1 + p * eclipseR * 2.5) * (0.76 + 0.24 * Math.sin(t * 0.85 + i * 0.7));
      const alpha = (1 - p) * 0.32 * (0.6 + 0.4 * Math.sin(i * 1.9 - t * 1.8));

      ctx.strokeStyle = i % 3 === 0
        ? `rgba(148, 168, 194, ${(alpha * 0.72).toFixed(3)})`
        : `rgba(218, 198, 156, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1 + p * 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + waveShift - spanW * 0.5, y);
      ctx.lineTo(cx + waveShift + spanW * 0.5, y);
      ctx.stroke();
    }
  }

  /* =========================================================
     6. 全局胶片微粒层与尺寸自适应
     ========================================================= */
  const grainTile = document.createElement("canvas");
  grainTile.width = 160;
  grainTile.height = 160;
  const grainCtx = grainTile.getContext("2d");

  function refreshGrainTile() {
    const img = grainCtx.createImageData(160, 160);
    const buf = img.data;
    for (let i = 0; i < buf.length; i += 4) {
      const v = (Math.random() * 230) | 0;
      buf[i] = v * 0.9;
      buf[i + 1] = v * 0.94;
      buf[i + 2] = v;
      buf[i + 3] = 24;
    }
    grainCtx.putImageData(img, 0, 0);
  }
  refreshGrainTile();

  function handleResize() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
    resizeCorridorCanvas();
    resizeEldritchCanvas();
  }
  window.addEventListener("resize", handleResize);
  handleResize();

  /* =========================================================
     7. 第四面墙：真实本地时间与浏览设备呼应（自然接地气，无科幻术语）
     ========================================================= */
  function detectDeviceLabel() {
    const ua = navigator.userAgent || "";
    if (/iPhone/i.test(ua)) return "iPhone 屏幕前";
    if (/iPad/i.test(ua)) return "iPad 屏幕前";
    if (/Android/i.test(ua)) return "手机屏幕前";
    if (/Win/i.test(ua)) return "Windows 电脑前";
    if (/Mac/i.test(ua)) return "Mac 电脑前";
    return "发光的屏幕前";
  }

  const deviceText = detectDeviceLabel();

  function updateClockAndFourthWall() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const timeStr = `${hh}:${mm}:${ss}`;

    if (hudClock) {
      hudClock.textContent = smoothP > 0.84 ? `03:14:${ss}` : timeStr;
    }

    if (visitorDeviceLabel) {
      visitorDeviceLabel.textContent = `此刻正坐在${deviceText}的你`;
    }

    if (visitorTimeLabel) {
      visitorTimeLabel.textContent = `本地时间 ${hh}:${mm} · 屋里比刚才安静了许多`;
    }

    if (liveVisitorReview && !abyssUnlocked && smoothP > 0.34 && smoothP < 0.68) {
      liveVisitorReview.textContent =
        `“第 142,805 位夜访者…… 你正在${deviceText}看着这行字，现在已经是 ${hh}:${mm} 了。你有没有觉得屋里的影子比刚才暗了一点？别急着关掉页面——你往下滑得太深了，先看看最下面是什么吧。”`;
    }
  }
  setInterval(updateClockAndFourthWall, 1000);
  updateClockAndFourthWall();

  /* =========================================================
     8. 潜意识文字微闪烁
     ========================================================= */
  setInterval(() => {
    if (smoothP < 0.16 || smoothP > 0.74 || glitchSpans.length === 0) return;
    if (Math.random() > 0.55) return;

    const target = glitchSpans[(Math.random() * glitchSpans.length) | 0];
    if (target.dataset.busy === "1") return;

    const original = target.textContent;
    const secret = target.getAttribute("data-glitch");
    if (!secret) return;

    target.dataset.busy = "1";
    target.classList.add("char-glitching");
    target.textContent = `「 ${secret} 」`;

    setTimeout(() => {
      target.textContent = original;
      target.classList.remove("char-glitching");
      target.dataset.busy = "0";
    }, 280);
  }, 3100);

  /* =========================================================
     9. 躲避退出的按钮（手机端限制偏移幅度，绝不跑出屏幕）
     ========================================================= */
  if (runawayBtn) {
    const dodgeHandler = (ev) => {
      if (dodgeCount >= 4) {
        runawayBtn.textContent = "已经太晚了 · 往下看最后一眼吧";
        runawayBtn.style.transform = "translate(0, 0)";
        runawayBtn.style.borderColor = "rgba(198, 174, 130, 0.55)";
        runawayBtn.style.color = "#c6ae82";
        return;
      }
      ev.preventDefault();
      dodgeCount++;
      const isMobile = window.innerWidth <= 768;
      const maxX = isMobile ? 22 : 68;
      const maxY = isMobile ? 12 : 28;
      const offsetX = (Math.random() > 0.5 ? 1 : -1) * (maxX * 0.55 + Math.random() * maxX * 0.45);
      const offsetY = (Math.random() > 0.5 ? 1 : -1) * (maxY * 0.45 + Math.random() * maxY * 0.55);
      runawayBtn.style.transform = `translate(${offsetX.toFixed(0)}px, ${offsetY.toFixed(0)}px)`;

      const msgs = [
        "退不回去了，楼上的房间已经空了",
        "你明明听见那声音了，为什么还要走？",
        "门早就从里面打不开了",
        "别挣扎了，往下看最后一眼吧 ↓"
      ];
      runawayBtn.textContent = msgs[dodgeCount - 1] || msgs[0];
      if (escapeCardNote) {
        escapeCardNote.textContent = `第 ${dodgeCount} 次尝试离开失败：门后只剩下湿冷的海水味。`;
      }
      audio.playWaterStep();
    };

    runawayBtn.addEventListener("mouseenter", dodgeHandler);
    runawayBtn.addEventListener("click", dodgeHandler);
  }

  /* =========================================================
     10. 音频控制与交互唤醒
     ========================================================= */
  function syncAudioUI() {
    if (!audioToggleBtn || !audioBtnLabel) return;
    if (audio.enabled) {
      audioToggleBtn.classList.add("active");
      audioToggleBtn.setAttribute("aria-pressed", "true");
      audioBtnLabel.textContent = smoothP > 0.42 || abyssUnlocked ? "水底低鸣中" : "声景播放中";
    } else {
      audioToggleBtn.classList.remove("active");
      audioToggleBtn.setAttribute("aria-pressed", "false");
      audioBtnLabel.textContent = "试听声景";
    }
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      audio.toggle();
      syncAudioUI();
    });
  }

  if (heroSoundCta) {
    heroSoundCta.addEventListener("click", (e) => {
      e.stopPropagation();
      audio.explicitlyMuted = false;
      audio.enable();
      syncAudioUI();
    });
  }

  window.addEventListener(
    "pointerdown",
    () => {
      lastInteractionAt = performance.now();
      if (!audio.enabled && !audio.explicitlyMuted) {
        audio.enable();
        syncAudioUI();
      }
    },
    { passive: true }
  );

  /* =========================================================
     11. 触底异变：向上回滚后整座阳光官网变成空屋黑海
     ========================================================= */
  function activatePostAbyssCorruption() {
    if (abyssUnlocked) return;
    abyssUnlocked = true;
    body.classList.add("post-abyss");
    if (resetSanityBtn) resetSanityBtn.classList.remove("hidden");

    dualCopyNodes.forEach((el) => {
      const abyssHtml = el.getAttribute("data-abyss");
      if (abyssHtml) {
        el.innerHTML = abyssHtml;
      }
    });
  }

  if (resetSanityBtn) {
    resetSanityBtn.addEventListener("click", () => {
      abyssUnlocked = false;
      retreatWarned = false;
      dodgeCount = 0;
      body.classList.remove("post-abyss");
      resetSanityBtn.classList.add("hidden");

      dualCopyNodes.forEach((el) => {
        const normalHtml = el.getAttribute("data-normal");
        if (normalHtml) {
          el.innerHTML = normalHtml;
        }
      });

      if (runawayBtn) {
        runawayBtn.style.transform = "translate(0, 0)";
        runawayBtn.style.borderColor = "";
        runawayBtn.style.color = "";
        runawayBtn.textContent = "立即退出并回到上面";
      }

      document.title = "澄境 LUMINA™ | 下一代空间情绪节律与深度安眠系统";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* =========================================================
     12. 鼠标 + 手机手指触控统一驱动光束与瞳孔追踪
     ========================================================= */
  function updatePointer(clientX, clientY) {
    pointerX = clientX;
    pointerY = clientY;
    lastInteractionAt = performance.now();

    const xp = ((pointerX / Math.max(1, window.innerWidth)) * 100).toFixed(2) + "%";
    const yp = ((pointerY / Math.max(1, window.innerHeight)) * 100).toFixed(2) + "%";
    root.style.setProperty("--flash-x", xp);
    root.style.setProperty("--flash-y", yp);

    trackingPupils.forEach((pupil) => {
      const svg = pupil.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(pointerY - cy, pointerX - cx);
      const dist = Math.min(4.5, Math.hypot(pointerX - cx, pointerY - cy) / 48);
      pupil.style.transform = `translate(${(Math.cos(angle) * dist).toFixed(2)}px, ${(Math.sin(angle) * dist).toFixed(2)}px)`;
    });
  }

  window.addEventListener("mousemove", (e) => updatePointer(e.clientX, e.clientY), { passive: true });

  [corridorViewport, abyssViewport].forEach((vp) => {
    if (!vp) return;
    vp.addEventListener("touchstart", (e) => {
      if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    vp.addEventListener("touchmove", (e) => {
      if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  });

  /* =========================================================
     13. 滚动监听：长廊水波声 & 向上回滚提示
     ========================================================= */
  function showRetreatToast(msg) {
    if (!retreatToast) return;
    retreatToast.textContent = msg;
    retreatToast.classList.add("visible");
    setTimeout(() => {
      retreatToast.classList.remove("visible");
    }, 3800);
  }

  window.addEventListener(
    "scroll",
    () => {
      lastInteractionAt = performance.now();
      const currentY = window.scrollY;
      const dy = currentY - lastScrollY;
      lastScrollY = currentY;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollP = Math.min(1, Math.max(0, currentY / maxScroll));

      if (corridorSection) {
        const rect = corridorSection.getBoundingClientRect();
        if (rect.top <= 40 && rect.bottom >= window.innerHeight * 0.5 && Math.abs(dy) > 0) {
          rippleAccum += Math.abs(dy);
          if (rippleAccum > 145) {
            rippleAccum = 0;
            audio.playWaterStep();
          }
        }
      }

      if (!retreatWarned && scrollP > 0.46 && dy < -48) {
        retreatWarned = true;
        showRetreatToast(
          abyssUnlocked
            ? "滑回最上面看看吧……窗帘外面的街道已经不见了。"
            : "为什么往回滑？上面已经不是刚才的房间了。"
        );
      }
    },
    { passive: true }
  );

  /* =========================================================
     14. 主动画循环
     ========================================================= */
  let frameCount = 0;

  function tick(nowMs) {
    frameCount++;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollP = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    smoothP += (scrollP - smoothP) * 0.1;

    const corrupt = Math.min(1, Math.max(0, (smoothP - 0.16) / 0.56));
    const dread = Math.min(1, Math.max(0, (smoothP - 0.38) / 0.52));

    root.style.setProperty("--scroll-p", smoothP.toFixed(4));
    root.style.setProperty("--corrupt", corrupt.toFixed(4));
    root.style.setProperty("--dread", dread.toFixed(4));

    let stage = 1;
    if (smoothP >= 0.16) stage = 2;
    if (smoothP >= 0.34) stage = 3;
    if (smoothP >= 0.54) stage = 4;
    if (smoothP >= 0.71) stage = 5;
    if (smoothP >= 0.87) stage = 6;
    body.setAttribute("data-stage", String(stage));

    // 浏览器标签页标题随氛围诡异演化
    if (stage <= 2 && !abyssUnlocked) {
      document.title = "澄境 LUMINA™ | 下一代空间情绪节律与深度安眠系统";
    } else if (stage === 3) {
      document.title = "澄境 LUMINA™ | 枕头下面为什么是湿的";
    } else if (stage === 4) {
      document.title = "03:14 AM · 别拉开窗帘";
    } else if (stage === 5) {
      document.title = "走廊里全是冰冷的黑水...";
    } else if (stage === 6 || abyssUnlocked) {
      document.title = "☉ 天再也没有亮过";
    }

    if (liveDistanceLog && stage >= 4) {
      const pct = Math.min(100, Math.round(smoothP * 100));
      liveDistanceLog.textContent =
        `[03:14:07] 房间已沉入黑暗 ${pct}% …… 走廊尽头没有门，只有一片无边无际的黑海。`;
    }

    // 电影上下遮幅高度：手机端稍高一点避免两行中文被截断
    const maxBarH = window.innerWidth <= 768 ? 60 : 54;
    const barHeight = smoothP > 0.64 ? Math.min(maxBarH, (smoothP - 0.64) * 230) : 0;
    root.style.setProperty("--cinema-bar-h", `${barHeight.toFixed(1)}px`);

    if (hudDepth) {
      if (smoothP < 0.72) hudDepth.textContent = "屋里很静";
      else if (smoothP < 0.9) hudDepth.textContent = "积水漫过脚踝";
      else hudDepth.textContent = "永夜";
    }

    // 第三幕暗房异常底片
    renderLabArchiveNegative(nowMs);

    // 第五幕沉没长廊
    if (corridorSection) {
      const cRect = corridorSection.getBoundingClientRect();
      const cSpan = Math.max(1, corridorSection.offsetHeight - window.innerHeight);
      const corridorLocalP = Math.min(1, Math.max(0, -cRect.top / cSpan));

      if (cRect.top < window.innerHeight && cRect.bottom > 0) {
        const zoom = 1.02 + Math.pow(corridorLocalP, 1.3) * 1.32;
        const swayX = Math.sin(corridorLocalP * 14 + nowMs * 0.001) * (4 + corridorLocalP * 5);
        const swayY = Math.cos(corridorLocalP * 14 + nowMs * 0.0008) * 3.5;
        const tilt = Math.sin(corridorLocalP * Math.PI) * 2.2;
        const riftGlow = 0.3 + corridorLocalP * 0.65;

        root.style.setProperty("--corridor-zoom", zoom.toFixed(4));
        root.style.setProperty("--cam-sway-x", `${swayX.toFixed(2)}px`);
        root.style.setProperty("--cam-sway-y", `${swayY.toFixed(2)}px`);
        root.style.setProperty("--corridor-tilt", `${tilt.toFixed(2)}deg`);
        root.style.setProperty("--rift-glow", riftGlow.toFixed(3));

        renderCorridorWater(nowMs, corridorLocalP);

        // 手机端未触摸或桌面端光标静止时，微光缓慢巡游照亮墙面恐惧留字
        if (nowMs - lastInteractionAt > 1500) {
          const autoX = 50 + Math.sin(nowMs * 0.0011) * 30;
          const autoY = 48 + Math.cos(nowMs * 0.0015) * 22;
          root.style.setProperty("--flash-x", `${autoX.toFixed(1)}%`);
          root.style.setProperty("--flash-y", `${autoY.toFixed(1)}%`);
        }

        if (cinemaSubtitle && stage === 5) {
          if (corridorLocalP < 0.3) {
            cinemaSubtitle.textContent = "「 走廊里积了一层漆黑冰冷的浅水，每走一步都没有回声 」";
          } else if (corridorLocalP < 0.65) {
            cinemaSubtitle.textContent = "「 照照两侧潮湿的墙面……前面来过这里的人留下了字 」";
          } else {
            cinemaSubtitle.textContent = "「 尽头裂缝后面没有门，也没有人——只有窒息般的巨大静默 」";
          }
        }
      }
    }

    // 第六幕黑海黑日终局
    let abyssHorizonP = 0;
    if (abyssSection) {
      const aRect = abyssSection.getBoundingClientRect();
      const aSpan = Math.max(1, abyssSection.offsetHeight - window.innerHeight);
      const abyssLocalP = Math.min(1, Math.max(0, -aRect.top / aSpan));

      if (aRect.top < window.innerHeight) {
        abyssHorizonP = Math.min(1, Math.max(0, (window.innerHeight - aRect.top) / (window.innerHeight + aSpan * 0.6)));
        renderBlackSeaEclipse(nowMs, Math.max(0.2, abyssHorizonP));

        if (aRect.top <= window.innerHeight * 0.15) {
          const threshOpacity = abyssLocalP < 0.32
            ? Math.sin((abyssLocalP / 0.32) * Math.PI)
            : 0;
          const climaxOpacity = abyssLocalP >= 0.3
            ? Math.min(1, (abyssLocalP - 0.3) / 0.34)
            : 0;

          root.style.setProperty("--threshold-opacity", threshOpacity.toFixed(3));
          root.style.setProperty("--climax-reveal", climaxOpacity.toFixed(3));

          if (abyssLocalP >= 0.42) {
            activatePostAbyssCorruption();
          }

          if (hudCamId) {
            hudCamId.textContent = "窗帘之外 · 无尽黑海";
          }
          if (cinemaSubtitle) {
            cinemaSubtitle.textContent = abyssLocalP < 0.35
              ? "「 身后的长廊不见了……前方是每晚梦里那片黑海 」"
              : "「 试着往上滑回最顶部，看看刚才那间阳光卧室变成了什么样 」";
          }
        } else {
          root.style.setProperty("--threshold-opacity", "0");
          root.style.setProperty("--climax-reveal", "0");
        }
      }
    }

    const ptrDist = Math.hypot(
      pointerX / Math.max(1, window.innerWidth) - 0.5,
      pointerY / Math.max(1, window.innerHeight) - 0.35
    ) * 1.8;

    audio.update(corrupt, dread, abyssHorizonP, abyssUnlocked, ptrDist);
    if (frameCount % 30 === 0) syncAudioUI();

    const fxOpacity = abyssUnlocked ? Math.max(0.22, dread * 0.48) : dread * 0.48;
    fxCanvas.style.opacity = fxOpacity.toFixed(3);
    if (fxOpacity > 0.02) {
      if (frameCount % 4 === 0) refreshGrainTile();
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      const ox = (Math.random() * 160) | 0;
      const oy = (Math.random() * 160) | 0;
      for (let x = -ox; x < fxCanvas.width; x += 160) {
        for (let y = -oy; y < fxCanvas.height; y += 160) {
          fxCtx.drawImage(grainTile, x, y);
        }
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
