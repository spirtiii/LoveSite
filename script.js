(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const screens = document.querySelectorAll('.screen');
  let current = 0;

  function showScreen(i) {
    screens.forEach((s, idx) => s.classList.toggle('active', idx === i));
    current = i;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'next') {
      showScreen(Math.min(current + 1, screens.length - 1));
      if (screens[current].id === 'screen-level1') startLevel1();
      if (screens[current].id === 'screen-level2') startLevel2();
      if (screens[current].id === 'screen-level3') startLevel3();
      if (screens[current].id === 'screen-level4') startLevel4();
      if (screens[current].id === 'screen-finale') startFinale();
    }
    if (btn.dataset.action === 'restart') location.reload();
  });

  const rand = (min, max) => Math.random() * (max - min) + min;

  // ---------- Фоновые сердечки ----------
  const bg = $('#bg-hearts');
  const bgCtx = bg.getContext('2d');
  let bgHearts = [];

  function resizeBg() {
    bg.width = innerWidth;
    bg.height = innerHeight;
  }
  resizeBg();
  addEventListener('resize', resizeBg);

  function spawnBgHeart() {
    bgHearts.push({
      x: rand(0, bg.width),
      y: bg.height + 20,
      size: rand(8, 22),
      speed: rand(0.4, 1.4),
      sway: rand(0, Math.PI * 2),
      alpha: rand(0.15, 0.5),
    });
  }

  function drawHeart(ctx, x, y, size, alpha, color) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.beginPath();
    const s = size / 16;
    ctx.moveTo(0, 4 * s);
    ctx.bezierCurveTo(0, 0, -8 * s, 0, -8 * s, 5 * s);
    ctx.bezierCurveTo(-8 * s, 10 * s, 0, 13 * s, 0, 17 * s);
    ctx.bezierCurveTo(0, 13 * s, 8 * s, 10 * s, 8 * s, 5 * s);
    ctx.bezierCurveTo(8 * s, 0, 0, 0, 0, 4 * s);
    ctx.fill();
    ctx.restore();
  }

  function bgLoop() {
    bgCtx.clearRect(0, 0, bg.width, bg.height);
    if (Math.random() < 0.03 && bgHearts.length < 40) spawnBgHeart();
    bgHearts = bgHearts.filter((h) => h.y > -30);
    for (const h of bgHearts) {
      h.y -= h.speed;
      h.sway += 0.02;
      drawHeart(bgCtx, h.x + Math.sin(h.sway) * 20, h.y, h.size, h.alpha, '#ff6b9d');
    }
    requestAnimationFrame(bgLoop);
  }
  bgLoop();

  // ---------- Уровень 1: собери сердечки ----------
  function startLevel1() {
    const field = $('#l1-field');
    const scoreEl = $('#l1-score');
    const timerEl = $('#l1-timer');
    const msg = $('#l1-msg');
    const GOAL = 10, TIME = 20;
    let score = 0, running = true;

    const tick = setInterval(() => {
      if (!running) return clearInterval(tick);
      timerEl.textContent = `⏳ ${Math.max(0, TIME - Math.floor((Date.now() - start) / 1000))}`;
    }, 250);
    const start = Date.now();

    const spawn = setInterval(() => {
      if (!running) return clearInterval(spawn);
      const el = document.createElement('div');
      el.className = 'falling-heart';
      el.textContent = ['❤️', '💖', '💕', '🩷'][Math.floor(rand(0, 4))];
      el.style.left = `${rand(2, 88)}%`;
      field.appendChild(el);

      const dur = rand(2400, 4200);
      const anim = el.animate(
        [{ transform: 'translateY(-50px)' }, { transform: `translateY(${field.offsetHeight + 60}px)` }],
        { duration: dur }
      );
      anim.onfinish = () => el.remove();

      el.addEventListener('click', () => {
        if (el.classList.contains('pop')) return;
        el.classList.add('pop');
        setTimeout(() => el.remove(), 120);
        score++;
        scoreEl.textContent = `❤️ ${score} / ${GOAL}`;
        if (score >= GOAL) {
          running = false;
          field.querySelectorAll('.falling-heart').forEach((h) => h.remove());
          msg.textContent = 'Ты справилась! Ты самая ловкая 💖';
          msg.classList.remove('hidden');
          $('#screen-level1 .btn').classList.remove('hidden');
        }
      });
    }, 420);

    setTimeout(() => {
      if (!running) return;
      running = false;
      clearInterval(spawn);
      msg.textContent = 'Почти! Давай ещё разочек, ты сможешь ❤️';
      msg.classList.remove('hidden');
      setTimeout(() => startLevel1(), 1600);
    }, TIME * 1000);
  }

  // ---------- Уровень 2: найди пары ----------
  function startLevel2() {
    const grid = $('#l2-grid');
    const msg = $('#l2-msg');
    const faces = ['❤️', '💖', '🩷', '💌', '🌹', '✨', '😘', '🥰'];
    const deck = [...faces, ...faces].sort(() => Math.random() - 0.5);
    let first = null, lock = false, matched = 0;

    grid.innerHTML = '';
    deck.forEach((face) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-face back">❓</div>
          <div class="memory-face front">${face}</div>
        </div>`;
      card.addEventListener('click', () => {
        if (lock || card.classList.contains('flipped')) return;
        card.classList.add('flipped');
        if (!first) { first = card; return; }
        const a = first, b = card;
        first = null;
        if (a.querySelector('.front').textContent === b.querySelector('.front').textContent) {
          a.classList.add('done');
          b.classList.add('done');
          matched++;
          if (matched === faces.length) {
            msg.textContent = 'Все пары найдены! У тебя отличная память 💕';
            msg.classList.remove('hidden');
            $('#screen-level2 .btn').classList.remove('hidden');
          }
        } else {
          lock = true;
          setTimeout(() => {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            lock = false;
          }, 700);
        }
      });
      grid.appendChild(card);
    });
  }

  // ---------- Уровень 3: поймай комплименты ----------
  function startLevel3() {
    const field = $('#l3-field');
    const scoreEl = $('#l3-score');
    const missEl = $('#l3-misses');
    const msg = $('#l3-msg');
    const good = ['милая', 'самая лучшая', 'красотка', 'умница', 'солнышко', 'чудо', 'любимая', 'нежная', 'волшебница'];
    const bad = ['нет', 'зачем', 'плохо', 'уйди', 'грусть'];
    const GOAL = 7, MAX_MISS = 3;
    let score = 0, misses = 0, running = true;

    const spawn = setInterval(() => {
      if (!running) return clearInterval(spawn);
      const isGood = Math.random() > 0.3;
      const el = document.createElement('div');
      el.className = `falling-word ${isGood ? 'good' : 'bad'}`;
      el.textContent = isGood ? good[Math.floor(rand(0, good.length))] : bad[Math.floor(rand(0, bad.length))];
      el.style.left = `${rand(2, 70)}%`;
      field.appendChild(el);

      const dur = rand(3200, 5500);
      const anim = el.animate(
        [{ transform: 'translateY(-50px)' }, { transform: `translateY(${field.offsetHeight + 60}px)` }],
        { duration: dur }
      );
      anim.onfinish = () => el.remove();

      el.addEventListener('click', () => {
        if (el.classList.contains('pop')) return;
        el.classList.add('pop');
        setTimeout(() => el.remove(), 120);
        if (isGood) {
          score++;
          scoreEl.textContent = `💬 ${score} / ${GOAL}`;
          if (score >= GOAL) {
            running = false;
            field.innerHTML = '';
            msg.textContent = 'Все комплименты твои! Потому что все они про тебя 💖';
            msg.classList.remove('hidden');
            $('#screen-level3 .btn').classList.remove('hidden');
          }
        } else {
          misses++;
          missEl.textContent = `Мимо: ${misses}/${MAX_MISS}`;
          if (misses >= MAX_MISS) {
            running = false;
            clearInterval(spawn);
            field.innerHTML = '';
            msg.textContent = 'Ой, не те слова! Попробуем ещё раз 💫';
            msg.classList.remove('hidden');
            setTimeout(() => startLevel3(), 1600);
          }
        }
      });
    }, 550);
  }

  // ---------- Уровень 4: убегающая кнопка ----------
  function startLevel4() {
    const runaway = $('#l4-runaway');
    const zone = $('#screen-level4');
    const msg = $('#l4-msg');
    const phrases = ['Хм...', 'Не-а 😜', 'Не поймаешь!', 'А вот и нет!', 'Почти!', 'Мимо 😄'];
    let tries = 0;

    runaway.addEventListener('mouseenter', dodge);
    runaway.addEventListener('click', dodge);

    function dodge() {
      tries++;
      runaway.textContent = phrases[Math.min(tries - 1, phrases.length - 1)];
      const maxX = Math.max(0, zone.clientWidth - runaway.offsetWidth - 40);
      const maxY = Math.max(0, zone.clientHeight - runaway.offsetHeight - 40);
      runaway.style.position = 'fixed';
      runaway.style.left = `${rand(20, Math.max(30, maxX))}px`;
      runaway.style.top = `${rand(60, Math.max(80, maxY))}px`;
      if (tries === 5) {
        msg.textContent = 'Ладно-ладно, она права, эта кнопка 😄 Нажимай на красную!';
        msg.classList.remove('hidden');
      }
    }
  }

  // ---------- Финал: салют + письмо + счётчик ----------
  const DAYS_TOGETHER = 156;
  const startDate = Date.now() - DAYS_TOGETHER * 24 * 60 * 60 * 1000;

  function startFinale() {
    launchFireworks(6000);
    setTimeout(startCounter, 500);
  }

  function startCounter() {
    const big = $('#together-counter');
    const small = $('#together-counter-small');
    function update() {
      let ms = Date.now() - startDate;
      const days = Math.floor(ms / 86400000);
      const hours = Math.floor(ms / 3600000) % 24;
      const minutes = Math.floor(ms / 60000) % 60;
      const seconds = Math.floor(ms / 1000) % 60;
      big.textContent = `${days} дней`;
      small.textContent = `${hours} ч ${minutes} мин ${seconds} сек — и это только начало ❤️`;
    }
    update();
    setInterval(update, 1000);
  }

  const letter = $('#letter');
  letter.addEventListener('click', () => {
    if (letter.classList.contains('closed')) {
      letter.classList.remove('closed');
      letter.classList.add('open');
      launchFireworks(3500);
      $('#btn-restart').classList.remove('hidden');
    }
  });
  letter.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') letter.click();
  });

  const fw = $('#fireworks');
  const fwCtx = fw.getContext('2d');
  let particles = [];
  let fwActive = false;

  function resizeFw() {
    fw.width = innerWidth;
    fw.height = innerHeight;
  }
  resizeFw();
  addEventListener('resize', resizeFw);

  function burst(x, y) {
    const colors = ['#ff6b9d', '#ffa8c5', '#ffd1dc', '#ff8fab', '#ffffff'];
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + rand(-0.1, 0.1);
      const speed = rand(2, 6);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(rand(0, colors.length))],
        size: rand(1.5, 3.5),
      });
    }
  }

  function fwLoop() {
    fwCtx.clearRect(0, 0, fw.width, fw.height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 0.012;
      fwCtx.globalAlpha = Math.max(0, p.life);
      fwCtx.fillStyle = p.color;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fwCtx.fill();
    }
    fwCtx.globalAlpha = 1;
    requestAnimationFrame(fwLoop);
  }
  fwLoop();

  function launchFireworks(duration) {
    if (fwActive) return;
    fwActive = true;
    const end = Date.now() + duration;
    (function fire() {
      if (Date.now() > end) { fwActive = false; return; }
      burst(rand(fw.width * 0.15, fw.width * 0.85), rand(fw.height * 0.1, fw.height * 0.45));
      setTimeout(fire, rand(250, 600));
    })();
  }
})();
