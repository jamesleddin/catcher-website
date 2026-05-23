(function(){
  const canvas = document.getElementById('constellation');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, points = [];
  const COUNT = 42;
  const MAX_DIST = 160;
  const GREEN = [16, 185, 129];

  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    points.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.004 + Math.random() * 0.008
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let p of points) {
      p.x += p.vx; p.y += p.vy; p.pulse += p.pulseSpeed;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.08;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.strokeStyle = 'rgba(' + GREEN[0] + ',' + GREEN[1] + ',' + GREEN[2] + ',' + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    for (let p of points) {
      const glow = 0.18 + Math.sin(p.pulse) * 0.1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + GREEN[0] + ',' + GREEN[1] + ',' + GREEN[2] + ',' + glow + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-up').forEach(function(el) { observer.observe(el); });

function toggleFaq(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
  if (!wasOpen) el.classList.add('open');
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input[type="email"]');
  const btn = form.querySelector('button');
  const email = input.value.trim();
  if (!email) return;

  const originalBtnText = btn.textContent;
  btn.textContent = 'Joining...';
  btn.disabled = true;

  const resetButton = function(text, bgColor, delay) {
    btn.textContent = text;
    if (bgColor) btn.style.background = bgColor;
    setTimeout(function() {
      btn.textContent = originalBtnText;
      btn.style.background = '';
      btn.disabled = false;
      input.placeholder = 'your@email.com';
    }, delay);
  };

  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, source: window.location.pathname })
    });

    if (response.ok) {
      btn.textContent = "You're in! 🎉";
      btn.style.background = 'var(--green)';
      input.value = '';
      input.placeholder = 'Check your inbox';
      setTimeout(function() {
        btn.textContent = originalBtnText;
        btn.style.background = '';
        btn.disabled = false;
        input.placeholder = 'your@email.com';
      }, 4000);
    } else if (response.status === 429) {
      resetButton('Slow down — try again', 'var(--orange)', 3000);
    } else if (response.status === 400) {
      resetButton('Invalid email', 'var(--red)', 3000);
    } else {
      throw new Error('Submission failed');
    }
  } catch (err) {
    resetButton('Try again', 'var(--red)', 3000);
  }
}

function cookieConsent(accepted) {
  localStorage.setItem('catcher_cookie_consent', accepted ? 'accepted' : 'essential');
  document.getElementById('cookieBanner').classList.add('hidden');
}
if (localStorage.getItem('catcher_cookie_consent')) {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.add('hidden');
}
