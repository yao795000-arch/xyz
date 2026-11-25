(() => {
  "use strict";

  /* =========================================================
     1. 克苏鲁深海与高维星蚀 Web Audio 声景合成引擎（零跳脸惊吓）
     从 432Hz 温暖助眠和弦 → 万米海沟暗流与微分音偏折 → 远古巨石声呐回响 → 黑日奇点泛音圣咏
     ========================================================= */
  class CosmicAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.explicitlyMuted = false;
      this.initialized = false;

      this.masterGain = null;
      this.noiseBuffer = null;

      // 第一幕温暖和弦
      this.warmOscs = [];
      this.warmGain = null;
      this.warmFilter = null;

      // 深海暗流层
      this.oceanGain = null;
      this.oceanFilter = null;

      // 终局黑日奇点高维泛音层（平滑渐入，绝无刺耳跳脸）
      this.monolithOscs = [];
      this.monolithGain = null;
      this.monolithFilter = null;

      this.lastTidePulse = 0;
      this.lastSonarPing = 0;
    }

    init() {
      if (this.initialized) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);

      // 生成平滑的布朗/粉红深海噪声缓冲
      const sr = this.ctx.sampleRate;
      const len = sr * 4;
      this.noiseBuffer = this.ctx.createBuffer(1, len, sr);
      const data = this.noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.022 * white) / 1.022;
        data[i] = lastOut * 2.6;
      }

      // 1. 温暖 432Hz 助眠垫音
      this.warmFilter = this.ctx.createBiquadFilter();
      this.warmFilter.type = "lowpass";
      this.warmFilter.frequency.value = 660;

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

      // 2. 万米海沟深水暗流循环层
      const oceanSrc = this.ctx.createBufferSource();
      oceanSrc.buffer = this.noiseBuffer;
      oceanSrc.loop = true;

      this.oceanFilter = this.ctx.createBiquadFilter();
      this.oceanFilter.type = "lowpass";
      this.oceanFilter.frequency.value = 95;
      this.oceanFilter.Q.value = 2.2;

      this.oceanGain = this.ctx.createGain();
      this.oceanGain.gain.value = 0.0001;

      oceanSrc.connect(this.oceanFilter);
      this.oceanFilter.connect(this.oceanGain);
      this.oceanGain.connect(this.masterGain);
      oceanSrc.start();

      // 3. 终局“不可名状黑日”高维泛音共鸣群（黄金分割与非谐泛音列，空灵宏大而诡异）
      this.monolithFilter = this.ctx.createBiquadFilter();
      this.monolithFilter.type = "bandpass";
      this.monolithFilter.frequency.value = 260;
      this.monolithFilter.Q.value = 1.4;

      this.monolithGain = this.ctx.createGain();
      this.monolithGain.gain.value = 0.0001;
      this.monolithFilter.connect(this.monolithGain);
      this.monolithGain.connect(this.masterGain);

      // 54Hz 基频 + 黄金比非欧泛音列（如《湮灭》灯塔与《2001太空漫游》黑石碑）
      const cosmicHarmonics = [54, 108, 161.8, 228.4, 349.5, 466.2];
      cosmicHarmonics.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx < 2 ? "sine" : "triangle";
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.value = idx === 0 ? 0.42 : 0.13 / Math.sqrt(idx);
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
      this.masterGain.gain.setTargetAtTime(0.76, now, 0.35);
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

    update(corrupt, dread, abyssHorizonP, postAbyss, cursorLensDist) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;

      const effCorrupt = postAbyss ? Math.max(corrupt, 0.65) : corrupt;
      const effDread = postAbyss ? Math.max(dread, 0.55) : dread;

      // 温暖和弦随下潜缓慢向空洞的微分音偏折
      this.warmOscs.forEach((item, idx) => {
        let ratio = 1;
        if (idx === 2) ratio = 1 - effCorrupt * 0.088;
        if (idx === 3) ratio = 1 - effCorrupt * 0.056;
        if (idx === 1) ratio = 1 + Math.sin(now * 0.45) * effCorrupt * 0.008;
        item.osc.frequency.setTargetAtTime(item.baseFreq * ratio, now, 0.2);
      });

      const warmLevel = Math.max(0.012, 0.14 * (1 - effDread * 0.78));
      this.warmGain.gain.setTargetAtTime(warmLevel, now, 0.25);
      this.warmFilter.frequency.setTargetAtTime(660 - effCorrupt * 340, now, 0.25);

      // 万米深海暗流随深度渐强
      this.oceanGain.gain.setTargetAtTime(effCorrupt * 0.24 + effDread * 0.18, now, 0.3);
      this.oceanFilter.frequency.setTargetAtTime(75 + Math.sin(now * 0.3) * 22 + effDread * 45, now, 0.3);

      // 终局黑日奇点高维泛音群：随进入视界平滑涌起，并随鼠标与奇点的引力距离产生共鸣偏移
      const monolithTarget = Math.max(postAbyss ? 0.08 : 0.0001, abyssHorizonP * 0.34);
      this.monolithGain.gain.setTargetAtTime(monolithTarget, now, 0.45);

      const lensMod = 1 + (1 - Math.min(1, cursorLensDist)) * 0.65;
      this.monolithFilter.frequency.setTargetAtTime((210 + abyssHorizonP * 190) * lensMod, now, 0.25);

      this.monolithOscs.forEach((m) => {
        const drift = Math.sin(now * (0.22 + m.idx * 0.07)) * 0.006 * (1 + abyssHorizonP);
        m.osc.frequency.setTargetAtTime(m.baseFreq * (1 + drift), now, 0.3);
      });

      // 缓慢如大陆板块呼吸般的深海潮汐脉动（每 2.6 秒一次，沉稳浩瀚，绝不急促）
      if (effCorrupt > 0.3 && now - this.lastTidePulse > 2.65) {
        this.lastTidePulse = now;
        this.playTidalSubSwell(0.08 + effDread * 0.14);
        pulseAbyssLayer(effDread * 0.45);
      }

      // 幽远空灵的深海巨石声呐泛音回响
      if ((effDread > 0.28 || postAbyss) && now - this.lastSonarPing > 6.2) {
        if (Math.random() < 0.5) {
          this.lastSonarPing = now;
          this.playAbyssalSonarPing((Math.random() - 0.5) * 1.4, 0.045 + effDread * 0.045);
        }
      }
    }

    playTidalSubSwell(amount = 0.14) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(48, now);
      osc.frequency.exponentialRampToValueAtTime(31, now + 1.45);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(amount, now + 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.75);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.8);
    }

    playAbyssalSonarPing(panVal = 0, volume = 0.06) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [576, 864, 1296];
      const chosen = freqs[(Math.random() * freqs.length) | 0];

      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(chosen, now);
      osc.frequency.exponentialRampToValueAtTime(chosen * 0.985, now + 2.4);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(volume, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

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
      osc.stop(now + 2.6);
    }

    // 沉没回廊中的水波共鸣声
    playWaterRippleTone() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      const base = 192 + Math.random() * 64;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 0.72, now + 0.55);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.65);
    }
  }

  const audio = new CosmicAudioEngine();

  /* =========================================================
     2. DOM 引用与全局状态
     ========================================================= */
  const root = document.documentElement;
  const body = document.body;
  const fxCanvas = document.getElementById("fx-canvas");
  const fxCtx = fxCanvas.getContext("2d");
  const abyssPulseLayer = document.getElementById("abyss-pulse-layer");

  const labCanvas = document.getElementById("lab-anomaly-canvas");
  const labFrame = document.getElementById("lab-plate-frame");
  const corridorWarpCanvas = document.getElementById("corridor-warp-canvas");
  const eldritchCanvas = document.getElementById("eldritch-canvas");

  const audioToggleBtn = document.getElementById("audio-toggle-btn");
  const audioBtnLabel = document.getElementById("audio-btn-label");
  const heroSoundCta = document.getElementById("hero-sound-cta");
  const resetSanityBtn = document.getElementById("reset-sanity-btn");
  const retreatToast = document.getElementById("retreat-toast");

  const hudClock = document.getElementById("hud-clock");
  const hudGeometry = document.getElementById("hud-geometry");
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

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let labMouseX = 0.5;
  let labMouseY = 0.42;
  let labHovering = false;
  let lastInteractionAt = performance.now();

  function pulseAbyssLayer(strength = 0.3) {
    if (!abyssPulseLayer) return;
    abyssPulseLayer.style.opacity = String(Math.min(0.65, strength));
    setTimeout(() => {
      abyssPulseLayer.style.opacity = "0";
    }, 650);
  }

  /* =========================================================
     3. 第三幕画布：声学干涉成像底片（无写实人脸！条纹引力坍缩 + 四维多面体）
     ========================================================= */
  if (labFrame) {
    labFrame.addEventListener("mousemove", (e) => {
      const r = labFrame.getBoundingClientRect();
      labMouseX = (e.clientX - r.left) / Math.max(1, r.width);
      labMouseY = (e.clientY - r.top) / Math.max(1, r.height);
      labHovering = true;
    });
    labFrame.addEventListener("mouseleave", () => {
      labHovering = false;
    });
  }

  function renderLabInterferometry(nowMs) {
    if (!labCanvas) return;
    const rect = labCanvas.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;

    const ctx = labCanvas.getContext("2d");
    const w = labCanvas.width;
    const h = labCanvas.height;
    const t = nowMs * 0.001;

    ctx.fillStyle = "#060913";
    ctx.fillRect(0, 0, w, h);

    // 柔和深海靛蓝实验室网格背景
    ctx.strokeStyle = "rgba(120, 142, 185, 0.08)";
    ctx.lineWidth = 1;
    for (let gx = 60; gx < w; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    // 四名研究员的抽象声波柱坐标（无写实人体，纯干涉波包与头部引力奇点）
    const subjects = [
      { cx: w * 0.19, headY: h * 0.35, bodyW: 54 },
      { cx: w * 0.36, headY: h * 0.33, bodyW: 58 },
      { cx: w * 0.64, headY: h * 0.34, bodyW: 56 },
      { cx: w * 0.81, headY: h * 0.33, bodyW: 58 }
    ];

    const mx = labHovering ? labMouseX * w : w * 0.5;
    const my = labHovering ? labMouseY * h : h * 0.42;

    // 74 条水平狭缝干涉扫描线
    const rows = 74;
    for (let r = 8; r < rows; r++) {
      const baseY = (r / rows) * h;
      ctx.beginPath();

      for (let x = 0; x <= w; x += 6) {
        let dy = Math.sin(x * 0.025 + t * 1.1 + r * 0.25) * 1.1;

        // 计算四个受试者波形轮廓与“面部光学坍缩”
        for (let s = 0; s < subjects.length; s++) {
          const sub = subjects[s];
          const dxSub = x - sub.cx;
          const dyHead = baseY - sub.headY;
          const distHead = Math.hypot(dxSub, dyHead);

          // 肩躯抽象驻波包络（没有任何具象五官或恐怖尸体，像《索拉里斯》或未知脉冲星图谱）
          if (baseY > sub.headY + 26 && Math.abs(dxSub) < sub.bodyW * 1.3) {
            const env = Math.exp(-(dxSub * dxSub) / (2 * sub.bodyW * sub.bodyW * 0.42));
            dy -= env * (8 + Math.sin(r * 0.9 + t * 2 + s) * 3.5);
          }

          // 面部区域：扫描线向圆心剧烈弯曲塌陷，留出漆黑无五官奇点！
          if (distHead < 46) {
            const pull = (1 - distHead / 46);
            dy += (sub.headY - baseY) * pull * 0.92 + Math.sin(distHead * 0.45 - t * 3.2) * pull * 6;
          }
        }

        // 鼠标引力透镜偏折
        if (labHovering) {
          const dMouse = Math.hypot(x - mx, baseY - my);
          if (dMouse < 120) {
            const mPull = (1 - dMouse / 120);
            dy += (my - baseY) * mPull * 0.42;
          }
        }

        if (x === 0) ctx.moveTo(x, baseY + dy);
        else ctx.lineTo(x, baseY + dy);
      }

      const alpha = 0.22 + (r / rows) * 0.34;
      ctx.strokeStyle = `rgba(182, 200, 232, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }

    // 在每名研究员原本面部位置绘制纯粹的暗日食焦斑环（完全抽象、冰冷、不可名状）
    subjects.forEach((sub, idx) => {
      const grad = ctx.createRadialGradient(sub.cx, sub.headY, 12, sub.cx, sub.headY, 34);
      grad.addColorStop(0, "#020308");
      grad.addColorStop(0.56, "#020308");
      grad.addColorStop(0.72, "rgba(203, 176, 122, 0.52)");
      grad.addColorStop(0.86, "rgba(129, 140, 248, 0.22)");
      grad.addColorStop(1, "rgba(2, 3, 8, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sub.cx, sub.headY, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(203, 176, 122, 0.55)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`SUB_0${idx + 1} [∅]`, sub.cx, h - 22);
    });

    // 中央背景磨砂区：悬浮旋转的四维正八面体/超立方体投影 (OBJECT_∅)
    const cx = w * 0.5;
    const cy = h * 0.44;
    ctx.save();
    ctx.translate(cx, cy);

    // 暗影核心
    const coreGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
    coreGrad.addColorStop(0, "rgba(1, 2, 6, 0.98)");
    coreGrad.addColorStop(0.55, "rgba(99, 102, 241, 0.22)");
    coreGrad.addColorStop(1, "rgba(1, 2, 6, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();

    // 旋转高维多面体棱线
    const verts3D = [
      [0, -42, 0], [0, 42, 0], [-32, 0, -32],
      [32, 0, -32], [32, 0, 32], [-32, 0, 32]
    ];
    const edges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 3], [3, 4], [4, 5], [5, 2]
    ];

    const rotY = t * 0.65;
    const rotX = Math.sin(t * 0.4) * 0.45;
    const project = ([vx, vy, vz]) => {
      const x1 = vx * Math.cos(rotY) - vz * Math.sin(rotY);
      const z1 = vx * Math.sin(rotY) + vz * Math.cos(rotY);
      const y2 = vy * Math.cos(rotX) - z1 * Math.sin(rotX);
      const z2 = vy * Math.sin(rotX) + z1 * Math.cos(rotX);
      const scale = 190 / (190 + z2);
      return [x1 * scale, y2 * scale];
    };

    const pts = verts3D.map(project);
    ctx.strokeStyle = "rgba(203, 176, 122, 0.78)";
    ctx.lineWidth = 1.2;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    });

    // 内嵌反向旋转环
    ctx.strokeStyle = "rgba(129, 140, 248, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 14, -t * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* =========================================================
     4. 第五幕画布：非欧几里得弯曲空间拓扑线与黑水涟漪
     ========================================================= */
  function resizeCorridorCanvas() {
    if (!corridorWarpCanvas) return;
    corridorWarpCanvas.width = Math.min(1280, window.innerWidth);
    corridorWarpCanvas.height = Math.min(800, window.innerHeight);
  }

  function renderCorridorTopology(nowMs, localP) {
    if (!corridorWarpCanvas) return;
    const ctx = corridorWarpCanvas.getContext("2d");
    const w = corridorWarpCanvas.width;
    const h = corridorWarpCanvas.height;
    const t = nowMs * 0.001;

    ctx.clearRect(0, 0, w, h);
    const vx = w * 0.5;
    const vy = h * 0.51;

    // 围绕消失点弯曲的非欧几里得测地线弧
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + t * 0.08;
      const ctrlDist = 160 + Math.sin(t * 0.7 + i) * 65;
      ctx.strokeStyle = `rgba(165, 180, 252, ${(0.06 + localP * 0.09).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.quadraticCurveTo(
        vx + Math.cos(angle + 0.45) * ctrlDist,
        vy + Math.sin(angle + 0.45) * ctrlDist,
        vx + Math.cos(angle) * w * 0.75,
        vy + Math.sin(angle) * h * 0.75
      );
      ctx.stroke();
    }

    // 地面浅黑水面的同心声波涟漪
    for (let k = 0; k < 4; k++) {
      const prog = ((t * 0.28 + k * 0.25) % 1);
      const ry = 12 + prog * 68;
      const rx = ry * 3.8;
      const yPos = h * 0.68 + prog * h * 0.26;
      ctx.strokeStyle = `rgba(203, 176, 122, ${((1 - prog) * 0.22).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(vx, yPos, rx, ry * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* =========================================================
     5. 第六幕核心终局画布：不可名状的地下黑海、高维黑日奇点与人类语言溶解
     （完全取代低级“跳脸杀”——以宏大、寂静、非人几何的宇宙级诡异感收束全篇）
     ========================================================= */
  const fallingConcepts = [
    { word: "呼吸", glyph: "☉", angle: 0.2, radius: 0.92, speed: 0.14 },
    { word: "安眠", glyph: "⟁", angle: 1.1, radius: 0.78, speed: 0.17 },
    { word: "房间", glyph: "☍", angle: 2.0, radius: 0.86, speed: 0.12 },
    { word: "90°直角", glyph: "⌬", angle: 2.9, radius: 0.68, speed: 0.16 },
    { word: "线性时间", glyph: "⧗", angle: 3.7, radius: 0.96, speed: 0.13 },
    { word: "清醒", glyph: "ꙮ", angle: 4.5, radius: 0.74, speed: 0.15 },
    { word: "自我边界", glyph: "◈", angle: 5.3, radius: 0.84, speed: 0.18 },
    { word: "432Hz", glyph: "⏣", angle: 5.9, radius: 0.62, speed: 0.15 }
  ];

  const abyssParticles = Array.from({ length: 130 }, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: 0.16 + Math.random() * 0.75,
    speed: (0.04 + Math.random() * 0.12) * (Math.random() > 0.2 ? 1 : -0.6),
    size: 0.7 + Math.random() * 1.6,
    gold: Math.random() > 0.45
  }));

  function resizeEldritchCanvas() {
    if (!eldritchCanvas) return;
    eldritchCanvas.width = window.innerWidth;
    eldritchCanvas.height = window.innerHeight;
  }

  function renderIneffableAbyss(nowMs, revealP) {
    if (!eldritchCanvas) return;
    const ctx = eldritchCanvas.getContext("2d");
    const w = eldritchCanvas.width;
    const h = eldritchCanvas.height;
    const t = nowMs * 0.001;

    const horizonY = h * 0.64;
    const cx = w * 0.5;
    const cy = h * 0.37;
    const minDim = Math.min(w, h);
    const eclipseR = minDim * (0.095 + revealP * 0.032);

    // 鼠标对高维流形的微弱引力牵引（仿佛整片空间在无声地感知你的视线）
    const normMx = (mouseX - cx) / Math.max(1, w * 0.5);
    const normMy = (mouseY - cy) / Math.max(1, h * 0.5);

    // 1. 无星地下穹顶背景
    const skyGrad = ctx.createRadialGradient(cx, cy, eclipseR * 0.6, cx, cy, Math.max(w, h) * 0.78);
    skyGrad.addColorStop(0, "#10162b");
    skyGrad.addColorStop(0.32, "#070b18");
    skyGrad.addColorStop(0.7, "#02040a");
    skyGrad.addColorStop(1, "#010205");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // 2. 奇点外围《星之彩 / 湮灭》虹彩引力晕（与回滚后卧室墙面光晕遥相呼应！）
    const outerHalo = ctx.createRadialGradient(
      cx + normMx * 14,
      cy + normMy * 10,
      eclipseR * 0.95,
      cx,
      cy,
      eclipseR * 4.2
    );
    outerHalo.addColorStop(0, "rgba(255, 250, 235, 0.72)");
    outerHalo.addColorStop(0.08, "rgba(203, 176, 122, 0.44)");
    outerHalo.addColorStop(0.24, "rgba(99, 102, 241, 0.20)");
    outerHalo.addColorStop(0.52, "rgba(56, 189, 248, 0.06)");
    outerHalo.addColorStop(1, "rgba(2, 4, 10, 0)");

    ctx.fillStyle = outerHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, eclipseR * 4.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. 高维非欧几里得嵌套星盘 / 四维流形折环（缓慢翻转，绝无人类形态却充满压倒性的神性与异质感）
    ctx.save();
    ctx.translate(cx + normMx * 8, cy + normMy * 6);
    const ringCount = 6;
    for (let i = 0; i < ringCount; i++) {
      const rx = eclipseR * (1.32 + i * 0.36 + Math.sin(t * 0.4 + i) * 0.06);
      const ry = eclipseR * (0.34 + ((i % 3) * 0.24) + Math.cos(t * 0.33 + i * 1.4) * 0.12);
      const rot = t * (i % 2 === 0 ? 0.11 : -0.08) + i * 0.52 + normMx * 0.16;

      ctx.strokeStyle = i % 2 === 0
        ? `rgba(218, 193, 142, ${(0.34 - i * 0.04).toFixed(3)})`
        : `rgba(148, 163, 238, ${(0.28 - i * 0.035).toFixed(3)})`;
      ctx.lineWidth = i === 0 ? 1.5 : 1.0;

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, Math.abs(ry), rot, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 视界边缘纤细如发丝的引力偏折光线
    for (let f = 0; f < 48; f++) {
      const a = (f / 48) * Math.PI * 2 + t * 0.05;
      const bend = Math.sin(a * 3 + t * 0.9) * 16;
      const r1 = eclipseR * 1.01;
      const r2 = eclipseR * (1.28 + (f % 5) * 0.16);
      ctx.strokeStyle = "rgba(236, 224, 196, 0.16)";
      ctx.lineWidth = 0.8;
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

    // 4. 环绕奇点坠落的星尘微粒
    abyssParticles.forEach((p) => {
      p.angle += p.speed * 0.008;
      p.dist -= 0.00035;
      if (p.dist < 0.13) p.dist = 0.88;

      const r = p.dist * minDim * 0.62;
      const px = cx + Math.cos(p.angle) * r * 1.35;
      const py = cy + Math.sin(p.angle) * r * 0.68;
      if (py > horizonY) return;

      ctx.fillStyle = p.gold
        ? `rgba(224, 201, 152, ${(0.18 + (1 - p.dist) * 0.45).toFixed(3)})`
        : `rgba(165, 198, 255, ${(0.15 + (1 - p.dist) * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. 人类日常概念向奇点坠落并坍缩为不可名状的几何字符
    if (revealP > 0.25) {
      ctx.textAlign = "center";
      fallingConcepts.forEach((c, idx) => {
        const cycle = (c.radius - ((t * c.speed * 0.18 + idx * 0.13) % 0.78));
        const normR = cycle < 0.15 ? cycle + 0.78 : cycle;
        const r = normR * minDim * 0.52;
        const ang = c.angle + t * 0.11 + (1 - normR) * 1.6;

        const x = cx + Math.cos(ang) * r * 1.38;
        const y = cy + Math.sin(ang) * r * 0.62;
        if (y > horizonY - 14) return;

        // 越靠近事件视界，人类文字越模糊并蜕变为高维符号
        const nearHorizon = normR < 0.34;
        const alpha = Math.min(0.68, (normR - 0.14) * 1.4) * revealP;
        if (alpha <= 0.02) return;

        ctx.font = nearHorizon ? "15px serif" : "12px sans-serif";
        ctx.fillStyle = nearHorizon
          ? `rgba(203, 176, 122, ${alpha.toFixed(3)})`
          : `rgba(186, 198, 226, ${(alpha * 0.75).toFixed(3)})`;
        ctx.fillText(nearHorizon ? c.glyph : c.word, x, y);
      });
    }

    // 6. 中央绝对虚无的日食黑核（连光都无法逃逸的静默中心，与回滚后卧室窗外的黑日完全一致！）
    ctx.beginPath();
    ctx.arc(cx, cy, eclipseR, 0, Math.PI * 2);
    ctx.fillStyle = "#010103";
    ctx.shadowColor = "rgba(255, 248, 228, 0.85)";
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 紧贴事件视界的极细白金日冕环
    ctx.strokeStyle = "rgba(255, 250, 236, 0.88)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, eclipseR + 0.8, 0, Math.PI * 2);
    ctx.stroke();

    // 7. 下方 36% 视口：无边无际的地下静止黑海与日食波光倒影
    const seaGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    seaGrad.addColorStop(0, "#050914");
    seaGrad.addColorStop(0.28, "#03050c");
    seaGrad.addColorStop(1, "#010205");
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // 水平线微光
    const hLineGrad = ctx.createLinearGradient(cx - w * 0.4, horizonY, cx + w * 0.4, horizonY);
    hLineGrad.addColorStop(0, "rgba(2, 4, 10, 0)");
    hLineGrad.addColorStop(0.35, "rgba(129, 140, 248, 0.22)");
    hLineGrad.addColorStop(0.5, "rgba(236, 220, 182, 0.52)");
    hLineGrad.addColorStop(0.65, "rgba(129, 140, 248, 0.22)");
    hLineGrad.addColorStop(1, "rgba(2, 4, 10, 0)");
    ctx.fillStyle = hLineGrad;
    ctx.fillRect(0, horizonY - 1, w, 2);

    // 海面层叠波纹倒影
    const numRipples = 56;
    for (let i = 0; i < numRipples; i++) {
      const p = i / numRipples;
      const y = horizonY + 4 + Math.pow(p, 1.45) * (h - horizonY - 6);
      const waveShift = Math.sin(p * 24 - t * 1.5) * (8 + p * 34) + normMx * 18 * p;
      const spanW = (eclipseR * 1.1 + p * eclipseR * 2.8) * (0.75 + 0.25 * Math.sin(t * 0.9 + i * 0.7));
      const alpha = (1 - p) * 0.34 * (0.6 + 0.4 * Math.sin(i * 1.9 - t * 2));

      ctx.strokeStyle = i % 3 === 0
        ? `rgba(148, 163, 245, ${(alpha * 0.75).toFixed(3)})`
        : `rgba(226, 204, 158, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1 + p * 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + waveShift - spanW * 0.5, y);
      ctx.lineTo(cx + waveShift + spanW * 0.5, y);
      ctx.stroke();
    }
  }

  /* =========================================================
     6. 全局胶片微粒画布初始化与尺寸自适应
     ========================================================= */
  const grainTile = document.createElement("canvas");
  grainTile.width = 160;
  grainTile.height = 160;
  const grainCtx = grainTile.getContext("2d");

  function refreshGrainTile() {
    const img = grainCtx.createImageData(160, 160);
    const buf = img.data;
    for (let i = 0; i < buf.length; i += 4) {
      const v = (Math.random() * 235) | 0;
      buf[i] = v * 0.88;
      buf[i + 1] = v * 0.94;
      buf[i + 2] = v;
      buf[i + 3] = 28;
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
     7. 第四面墙：空间几何曲率与本地环境同步
     ========================================================= */
  function detectPlatformName() {
    const ua = navigator.userAgent || "";
    if (/Win/i.test(ua)) return "Windows 观测平面";
    if (/Mac/i.test(ua)) return "macOS 观测平面";
    if (/Android/i.test(ua)) return "Android 移动视界";
    if (/iPhone|iPad/i.test(ua)) return "iOS 移动视界";
    if (/Linux/i.test(ua)) return "Linux 终端平面";
    return "未知三维截面";
  }

  const visitorPlatform = detectPlatformName();

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
      visitorDeviceLabel.textContent = `${visitorPlatform} · 截面 ${window.innerWidth}×${window.innerHeight}`;
    }

    const angleSum = (180 + Math.pow(smoothP, 1.8) * 90).toFixed(2);
    if (visitorTimeLabel) {
      visitorTimeLabel.textContent = `本地时间 ${timeStr} · 当前平面内角和 ${angleSum}°`;
    }

    if (liveVisitorReview && !abyssUnlocked && smoothP > 0.34 && smoothP < 0.68) {
      liveVisitorReview.textContent =
        `“正在校准第 142,805 号观测窗口（${visitorPlatform}，${hh}:${mm}）…… 您发现了吗？您向下滚动的像素距离，已经超过了普通房间楼层应有的物理尺度。水底就在下面不远处。”`;
    }
  }
  setInterval(updateClockAndFourthWall, 1000);
  updateClockAndFourthWall();

  /* =========================================================
     8. 潜意识文字坍缩（短暂化为古老几何符号与隐秘警告）
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
    target.textContent = `☉ ⟁ ${secret} ⟁ ☉`;

    setTimeout(() => {
      target.textContent = original;
      target.classList.remove("char-glitching");
      target.dataset.busy = "0";
    }, 280);
  }, 3100);

  /* =========================================================
     9. 非欧折射退订按钮（试图向后退却在弯曲空间里滑向别处）
     ========================================================= */
  if (runawayBtn) {
    const dodgeHandler = (ev) => {
      if (dodgeCount >= 4) {
        runawayBtn.textContent = "∅ 逆向坐标已坍缩 · 仅余下潜方向";
        runawayBtn.style.transform = "translate(0, 0)";
        runawayBtn.style.borderColor = "rgba(203, 176, 122, 0.55)";
        runawayBtn.style.color = "#cbb07a";
        return;
      }
      ev.preventDefault();
      dodgeCount++;
      const offsetX = (Math.random() > 0.5 ? 1 : -1) * (48 + Math.random() * 68);
      const offsetY = (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 30);
      runawayBtn.style.transform = `translate(${offsetX.toFixed(0)}px, ${offsetY.toFixed(0)}px) skewX(${(dodgeCount * 2).toFixed(0)}deg)`;

      const msgs = [
        "空间曲率偏移：按钮未停留在原欧氏位置",
        "闭合流形上不存在“退出”向量",
        "三维地面锚点已随潮汐消散",
        "不必挣扎，向下滑入静默即可 ↓"
      ];
      runawayBtn.textContent = msgs[dodgeCount - 1] || msgs[0];
      if (escapeCardNote) {
        escapeCardNote.textContent = `第 ${dodgeCount} 次逆向定位失败：平行线已在您身后闭合。`;
      }
      audio.playWaterRippleTone();
    };

    runawayBtn.addEventListener("mouseenter", dodgeHandler);
    runawayBtn.addEventListener("click", dodgeHandler);
  }

  /* =========================================================
     10. 声音控制与首次点击平滑唤醒
     ========================================================= */
  function syncAudioUI() {
    if (!audioToggleBtn || !audioBtnLabel) return;
    if (audio.enabled) {
      audioToggleBtn.classList.add("active");
      audioToggleBtn.setAttribute("aria-pressed", "true");
      audioBtnLabel.textContent = smoothP > 0.42 || abyssUnlocked ? "深海母波共鸣中 (静音)" : "助眠声景播放中";
    } else {
      audioToggleBtn.classList.remove("active");
      audioToggleBtn.setAttribute("aria-pressed", "false");
      audioBtnLabel.textContent = "试听助眠声景";
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
     11. 深渊同化模式（抵达黑日视界后，向上回滚发现整座阳光官网已发生空间扭曲）
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
        runawayBtn.textContent = "中断谐振并退回地面";
      }

      document.title = "澄境 LUMINA™ | 下一代空间情绪节律与深度安眠系统";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* =========================================================
     12. 光标追踪：天体观测仪瞳孔偏移 + 回廊声呐感知透镜
     ========================================================= */
  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastInteractionAt = performance.now();

      const xp = ((mouseX / window.innerWidth) * 100).toFixed(2) + "%";
      const yp = ((mouseY / window.innerHeight) * 100).toFixed(2) + "%";
      root.style.setProperty("--flash-x", xp);
      root.style.setProperty("--flash-y", yp);

      trackingPupils.forEach((pupil) => {
        const svg = pupil.ownerSVGElement;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(mouseY - cy, mouseX - cx);
        const dist = Math.min(4.6, Math.hypot(mouseX - cx, mouseY - cy) / 48);
        pupil.style.transform = `translate(${(Math.cos(angle) * dist).toFixed(2)}px, ${(Math.sin(angle) * dist).toFixed(2)}px)`;
      });
    },
    { passive: true }
  );

  /* =========================================================
     13. 滚动监听：回廊水波共鸣与向上回滚的隐晦提示
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
          if (rippleAccum > 155) {
            rippleAccum = 0;
            audio.playWaterRippleTone();
          }
        }
      }

      if (!retreatWarned && scrollP > 0.46 && dy < -48) {
        retreatWarned = true;
        showRetreatToast(
          abyssUnlocked
            ? "☉ 向上浮回顶部看看吧……那间卧室的窗户已经不再朝向陆地了。"
            : "⟁ 在闭合的曲面上，向上滑动并不会带您回到出发时的维度。"
        );
      }
    },
    { passive: true }
  );

  /* =========================================================
     14. 主渲染循环：平滑驱动六幕非欧演化与三大程序化几何画布
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

    // 浏览器标题随认知解离悄然演化
    if (stage <= 2 && !abyssUnlocked) {
      document.title = "澄境 LUMINA™ | 下一代空间情绪节律与深度安眠系统";
    } else if (stage === 3) {
      document.title = "澄境 LUMINA™ | 卧室内部宽度 +4.72m";
    } else if (stage === 4) {
      document.title = "⟁ 欧氏公理失效 | ∑∠ = 214.8°";
    } else if (stage === 5) {
      document.title = "☍ 海床裂隙下潜中 : -11,090 m";
    } else if (stage === 6 || abyssUnlocked) {
      document.title = "☉ 水底之下仍是天空";
    }

    // 遥测终端深度实时下潜
    if (liveDistanceLog && stage >= 4) {
      const depthMeters = Math.round(1200 + Math.pow(smoothP, 2.4) * 19800);
      liveDistanceLog.textContent =
        `[03:14:07] DEPTH 当前下潜深度：-${depthMeters.toLocaleString()} m …… 三维固体概念残余 ${(Math.max(0, (1 - smoothP) * 100)).toFixed(1)}%。`;
    }

    // 观测仪遮幅与空间内角和读数
    const barHeight = smoothP > 0.64 ? Math.min(54, (smoothP - 0.64) * 220) : 0;
    root.style.setProperty("--cinema-bar-h", `${barHeight.toFixed(1)}px`);

    if (hudGeometry) {
      const deg = 180 + Math.pow(dread, 1.6) * 180;
      hudGeometry.textContent = smoothP > 0.94 ? "∑∠ ∞ (非欧奇点)" : `∑∠ ${deg.toFixed(2)}°`;
    }

    // 第三幕：渲染无五官声学干涉实验底片
    renderLabInterferometry(nowMs);

    // 第五幕：非欧沉没回廊平滑推镜与空间扭转
    if (corridorSection) {
      const cRect = corridorSection.getBoundingClientRect();
      const cSpan = Math.max(1, corridorSection.offsetHeight - window.innerHeight);
      const corridorLocalP = Math.min(1, Math.max(0, -cRect.top / cSpan));

      if (cRect.top < window.innerHeight && cRect.bottom > 0) {
        const zoom = 1.02 + Math.pow(corridorLocalP, 1.3) * 1.38;
        const swayX = Math.sin(corridorLocalP * 14 + nowMs * 0.001) * (5 + corridorLocalP * 6);
        const swayY = Math.cos(corridorLocalP * 14 + nowMs * 0.0008) * 4;
        const tilt = Math.sin(corridorLocalP * Math.PI) * 2.6;
        const riftGlow = 0.3 + corridorLocalP * 0.65;

        root.style.setProperty("--corridor-zoom", zoom.toFixed(4));
        root.style.setProperty("--cam-sway-x", `${swayX.toFixed(2)}px`);
        root.style.setProperty("--cam-sway-y", `${swayY.toFixed(2)}px`);
        root.style.setProperty("--corridor-tilt", `${tilt.toFixed(2)}deg`);
        root.style.setProperty("--rift-glow", riftGlow.toFixed(3));

        renderCorridorTopology(nowMs, corridorLocalP);

        if (nowMs - lastInteractionAt > 1800) {
          const autoX = 50 + Math.sin(nowMs * 0.0011) * 32;
          const autoY = 48 + Math.cos(nowMs * 0.0015) * 18;
          root.style.setProperty("--flash-x", `${autoX.toFixed(1)}%`);
          root.style.setProperty("--flash-y", `${autoY.toFixed(1)}%`);
        }

        if (cinemaSubtitle && stage === 5) {
          if (corridorLocalP < 0.3) {
            cinemaSubtitle.textContent = "「 走廊两侧的平行石墙正在前方缓慢相交——这里的几何学已经不属于陆地 」";
          } else if (corridorLocalP < 0.65) {
            cinemaSubtitle.textContent = "「 移动光标调谐透镜，石壁夹层里还残留着前几批观测者留下的公理 」";
          } else {
            cinemaSubtitle.textContent = "「 前方没有门，也没有怪物……只有裂隙外面那片比宇宙更古老的海 」";
          }
        }
      }
    }

    // 第六幕：不可名状的克苏鲁黑日终局（零跳脸，纯粹静谧与宏大）
    let abyssHorizonP = 0;
    if (abyssSection) {
      const aRect = abyssSection.getBoundingClientRect();
      const aSpan = Math.max(1, abyssSection.offsetHeight - window.innerHeight);
      const abyssLocalP = Math.min(1, Math.max(0, -aRect.top / aSpan));

      if (aRect.top < window.innerHeight) {
        abyssHorizonP = Math.min(1, Math.max(0, (window.innerHeight - aRect.top) / (window.innerHeight + aSpan * 0.6)));
        renderIneffableAbyss(nowMs, Math.max(0.2, abyssHorizonP));

        if (aRect.top <= window.innerHeight * 0.15) {
          // 过渡段（0 ~ 0.32）：浮现穿越海床的静默诗行
          const threshOpacity = abyssLocalP < 0.32
            ? Math.sin((abyssLocalP / 0.32) * Math.PI)
            : 0;
          const climaxOpacity = abyssLocalP >= 0.30
            ? Math.min(1, (abyssLocalP - 0.30) / 0.35)
            : 0;

          root.style.setProperty("--threshold-opacity", threshOpacity.toFixed(3));
          root.style.setProperty("--climax-reveal", climaxOpacity.toFixed(3));

          if (abyssLocalP >= 0.42) {
            activatePostAbyssCorruption();
          }

          if (hudCamId) {
            hudCamId.textContent = "HORIZON_∅ · 人类可观测几何边界之外";
          }
          if (cinemaSubtitle) {
            cinemaSubtitle.textContent = abyssLocalP < 0.35
              ? "「 海床裂隙已在头顶合拢……前方便是所有人类睡眠最终汇入的地方 」"
              : "「 它不曾睁眼，因为整片弯曲的时空就是它的注视 · 试着向上滑回水面看看吧 」";
          }
        } else {
          root.style.setProperty("--threshold-opacity", "0");
          root.style.setProperty("--climax-reveal", "0");
        }
      }
    }

    // 计算光标与视口上方黑日奇点的归一化距离，用于驱动引力泛音调制
    const cursorDistToSingularity = Math.hypot(
      (mouseX / Math.max(1, window.innerWidth)) - 0.5,
      (mouseY / Math.max(1, window.innerHeight)) - 0.37
    ) * 1.8;

    audio.update(corrupt, dread, abyssHorizonP, abyssUnlocked, cursorDistToSingularity);
    if (frameCount % 30 === 0) syncAudioUI();

    // 全局 35mm 深空胶片颗粒层
    const fxOpacity = abyssUnlocked ? Math.max(0.24, dread * 0.52) : dread * 0.52;
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
