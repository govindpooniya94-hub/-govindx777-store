(function() {
  'use strict';

  function toast(msg, type) {
    const c = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div'); el.id = 'toast-container'; el.className = 'toast-container';
      document.body.appendChild(el); return el;
    })();
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    t.innerHTML = `<span>${icons[type]||icons.info}</span><span style="flex:1">${msg}</span><button class="close">&times;</button>`;
    t.querySelector('.close').onclick = (e) => { e.stopPropagation(); t.classList.add('out'); setTimeout(() => t.remove(), 350); };
    t.onclick = () => { t.classList.add('out'); setTimeout(() => t.remove(), 350); };
    c.appendChild(t);
    setTimeout(() => { if (t.parentNode) { t.classList.add('out'); setTimeout(() => t.remove(), 350); } }, 4000);
  }

  function animateNum(el, target, suffix) {
    let current = 0;
    const start = performance.now();
    const duration = 1200;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      current = Math.round(e * target);
      el.textContent = current.toLocaleString() + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initStats() {
    API.getStats().then(s => {
      const map = { 'stat-downloads': s.totalDownloads, 'stat-products': s.totalProducts, 'stat-users': s.onlineUsers, 'stat-visits': s.totalVisits };
      Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = '0';
          const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { animateNum(el, val, id === 'stat-users' ? '+' : ''); obs.unobserve(el); } }, { threshold: .5 });
          obs.observe(el);
        }
      });
    }).catch(() => {});
  }

  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth, h = canvas.height = window.innerHeight;
    const count = Math.min(40, Math.floor(w * h / 25000));
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2,
      r: Math.random() * 1.5 + .5, a: Math.random() * .2 + .03
    }));
    function draw() {
      ctx.clearRect(0, 0, w, h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,106,51,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(255,106,51,${.025 * (1 - dist / 100)})`; ctx.lineWidth = .5; ctx.stroke();
          }
        }
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
  }

  function getUSD(price, price_usd) {
    if (price_usd) return price_usd;
    var n = parseInt(price.replace(/[^0-9]/g, ''));
    if (!n) return '';
    var usd = (n * 0.012).toFixed(2);
    return '$' + usd + ' USD';
  }

  function renderProducts(products, id) {
    const c = document.getElementById(id); if (!c) return;
    c.innerHTML = '';
    products.forEach(p => {
      const free = p.type === 'free';
      const card = document.createElement('div'); card.className = 'card reveal';
      const features = Array.isArray(p.features) ? p.features : [];
      const usd = getUSD(p.price, p.price_usd);
      let icon = '📦';
      if (p.name.toLowerCase().includes('panel')) icon = '⚡';
      else if (p.name.toLowerCase().includes('optimization') || p.name.toLowerCase().includes('boost')) icon = '🚀';
      else if (p.name.toLowerCase().includes('error') || p.name.toLowerCase().includes('fix')) icon = '🔧';
      else if (p.name.toLowerCase().includes('apk')) icon = '📱';
      else if (p.name.toLowerCase().includes('bluestacks') || p.name.toLowerCase().includes('msi')) icon = '🖥️';

      card.innerHTML = `
        <span class="tag ${free?'free':'paid'}">${p.badge || (free?'FREE':'PAID')}</span>
        <div class="icon">${icon}</div>
        <h3>${p.name}</h3>
        <div class="desc">${p.short_description || p.description?.slice(0,100) || ''}</div>
        ${features.length ? `<ul>${features.slice(0,4).map(f => `<li>${f.replace(/^[✅❌]\s*/, '')}</li>`).join('')}</ul>` : ''}
        <div class="price-row"><span class="price">${p.price}</span>${usd ? `<span class="price-usd">${usd}</span>` : ''}${p.original_price ? `<span class="orig">${p.original_price}</span>` : ''}</div>
        <div class="price-label">${free ? 'Free Download' : p.version ? `v${p.version}` : 'One-time'}</div>
        <div class="product-actions">
          <button class="btn ${free?'btn-primary':'btn-outline'} btn-sm" data-slug="${p.slug}">${free ? '⬇ Download' : '🛒 Buy Now'}</button>
          ${p.video_url ? `<button class="btn btn-outline btn-sm video-btn" data-video="${p.video_url}">🎬 Setup Video</button>` : ''}
        </div>`;
      c.appendChild(card);
    });
    c.querySelectorAll('[data-slug]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = products.find(x => x.slug === btn.dataset.slug);
        if (!p) return;
        if (p.type === 'paid') {
          window.location.href = '/checkout.html?slug=' + p.slug;
          return;
        }
        API.getProduct(p.slug).then(full => {
          if (full.download_links && full.download_links.length) {
            const link = full.download_links[0];
            toast(`⬇ Opening download link for ${p.name}...`, 'info');
            window.open(link.url, '_blank');
          } else {
            toast(`⬇ ${p.name} — No download links configured yet. Admin will add them.`, 'info');
          }
        }).catch(() => {
          toast(`⬇ ${p.name} — Click to download (configure in admin)`, 'success');
        });
      });
    });
    c.querySelectorAll('.video-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openVideoModal(btn.dataset.video);
      });
    });
  }

  function renderPricing(products, id) {
    const c = document.getElementById(id); if (!c) return;
    c.innerHTML = ''; c.className = 'pricing-grid';
    products.forEach((p, i) => {
      const feat = Array.isArray(p.features) ? p.features : [];
      const featd = p.is_featured || i === 1;
      const card = document.createElement('div');
      card.className = 'pricing-card reveal' + (featd ? ' featured' : '');
      const usd = getUSD(p.price, p.price_usd);
      card.innerHTML = `
        ${featd ? '<div class="popular">★ BEST SELLER</div>' : ''}
        <div style="font-size:30px;margin-bottom:10px;line-height:1">${i===0?'🌱':i===1?'⚡':'👑'}</div>
        <div class="plan-name">${p.name}</div>
        <div class="plan-price">${p.price}${usd ? `<span style="font-size:14px;color:var(--text3);font-weight:500;margin-left:4px">(${usd})</span>` : ''}${p.original_price ? `<span class="orig">${p.original_price}</span>` : ''}</div>
        <div class="plan-desc">${p.short_description || ''}</div>
        <ul>${feat.map(f => {
          const check = f.startsWith('✅'); const cross = f.startsWith('❌');
          return `<li><span class="${check?'check':cross?'cross':''}">${check?'✓':cross?'✕':'▸'}</span> ${f.replace(/^[✅❌]\s*/, '')}</li>`;
        }).join('')}</ul>
        <button class="btn ${featd?'btn-primary':'btn-outline'}" data-name="${p.name}" data-price="${p.price}">${featd?'🚀 Get Started':'Choose Plan'}</button>`;
      c.appendChild(card);
    });
      c.querySelectorAll('button[data-name]').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = products.find(x => x.name === btn.dataset.name);
          if (p) window.location.href = '/checkout.html?slug=' + p.slug;
        });
      });
  }

  function renderEmulators(products, id) {
    const c = document.getElementById(id); if (!c) return;
    c.innerHTML = '';
    const icons = { 'Free Fire APK': '📱', 'BlueStacks 5 Modded': '🟦', 'MSI App Player 5': '🎮' };
    products.forEach(p => {
      const features = Array.isArray(p.features) ? p.features : [];
      const card = document.createElement('div'); card.className = 'emulator-card reveal';
      card.innerHTML = `
        <div class="em-icon">${icons[p.name] || '📦'}</div>
        <div class="em-info">
          <h3>${p.name}</h3>
          <div class="meta">${p.version ? `<span>📌 v${p.version}</span>` : ''}${p.file_size ? `<span>💾 ${p.file_size}</span>` : ''}</div>
          <p>${p.short_description || p.description?.slice(0,120) || ''}</p>
          <div class="tags">${features.slice(0,4).map(f => `<span>${f.replace(/^[✅❌]\s*/, '')}</span>`).join('')}</div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button class="btn btn-primary btn-sm" data-slug="${p.slug}">⬇ Download</button>
            ${p.video_url ? `<button class="btn btn-outline btn-sm video-btn" data-video="${p.video_url}">🎬 Setup Video</button>` : ''}
          </div>
        </div>`;
      c.appendChild(card);
      card.querySelector('button').addEventListener('click', () => {
        API.getProduct(p.slug).then(full => {
          if (full.download_links && full.download_links.length) {
            window.open(full.download_links[0].url, '_blank');
          } else {
            toast(`⬇ ${p.name} — No links configured yet`, 'info');
          }
        }).catch(() => toast(`⬇ ${p.name}`, 'success'));
      });
    });
  }

  function renderTestimonials(items, id) {
    const c = document.getElementById(id); if (!c) return;
    c.innerHTML = items.map(t => {
      const initials = t.name.split(' ').map(n => n[0]).join('').slice(0,2);
      return `<div class="testimonial-card reveal">
        <div class="quote">"</div>
        <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
        <div class="content">${t.content}</div>
        <div class="author"><div class="avatar">${initials}</div><div class="info"><div class="name">${t.name}</div><div class="role">${t.role || 'Verified Buyer'}</div></div></div>
      </div>`;
    }).join('');
  }

  function renderFaqs(items, id) {
    const c = document.getElementById(id); if (!c) return;
    c.innerHTML = items.map(f => `
      <div class="faq-item reveal">
        <button class="faq-q"><span>${f.question}</span><span class="icon">+</span></button>
        <div class="faq-a"><p>${f.answer}</p></div>
      </div>
    `).join('');
    c.querySelectorAll('.faq-q').forEach(btn => btn.addEventListener('click', () => btn.parentElement.classList.toggle('open')));
  }

  function renderComparison(products, id) {
    const c = document.getElementById(id); if (!c) return;
    const paid = products.filter(p => p.type === 'paid');
    if (paid.length < 2) { c.innerHTML = ''; return; }
    const features = new Set();
    paid.forEach(p => { if (Array.isArray(p.features)) p.features.forEach(f => features.add(f.replace(/^[✅❌]\s*/, ''))); });
    let html = `<div class="compare-wrap reveal"><table class="compare-table"><thead><tr><th>Feature</th>`;
    paid.forEach(p => { html += `<th>${p.name}<br><small style="color:var(--text3);font-weight:400">${p.price}</small></th>`; });
    html += `</tr></thead><tbody>`;
    features.forEach(f => {
      html += `<tr><td class="feature-name">${f}</td>`;
      paid.forEach(p => {
        const match = Array.isArray(p.features) ? p.features.find(x => x.includes(f)) : '';
        const has = match && match.startsWith('✅'); const cross = match && match.startsWith('❌');
        html += `<td>${has?'<span class="check">✓</span>':cross?'<span class="cross">✕</span>':'<span class="check">✓</span>'}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    c.innerHTML = html;
  }

  function renderBlog(posts, id) {
    const c = document.getElementById(id); if (!c) return;
    if (!posts || !posts.length) { c.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text3);font-size:13px">No posts yet. Stay tuned!</p>'; return; }
    c.innerHTML = posts.slice(0,3).map(p => {
      const d = p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'}) : '';
      return `<div class="blog-card reveal"><div class="date">${d||'Latest'}</div><h3>${p.title}</h3><div class="excerpt">${p.excerpt || p.content?.slice(0,150) || ''}</div><a href="#" class="read">Read More →</a></div>`;
    }).join('');
    c.querySelectorAll('.read').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('📝 Full article coming soon!', 'info'); }));
  }

  function renderVideos(products, id) {
    const c = document.getElementById(id); if (!c) return;
    const withVideos = products.filter(p => p.video_url && (p.video_url.toLowerCase().includes('youtube') || p.video_url.toLowerCase().includes('youtu.be')));
    if (!withVideos.length) { c.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text3);font-size:13px">No tutorial videos available yet.</p>'; return; }
    c.innerHTML = withVideos.map(p => {
      let videoId = '';
      const match = p.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
      return `<div class="video-card reveal">
        <div class="thumb" data-video="${videoId}">
          <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" loading="lazy" />
          <div class="play">▶</div>
        </div>
        <div class="v-info"><h4>${p.name} Setup Guide</h4><p>Watch tutorial for ${p.name}</p></div>
      </div>`;
    }).join('');
    c.addEventListener('click', function(e) {
      const thumb = e.target.closest('.thumb');
      if (!thumb) return;
      const vid = thumb.dataset.video;
      if (!vid || thumb.classList.contains('playing')) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&origin=${encodeURIComponent(window.location.origin)}`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
      thumb.innerHTML = '';
      thumb.appendChild(iframe);
      thumb.classList.add('playing');
    });
  }

  function initVideoPopup() {
    API.req('GET', '/videonotif').then(data => {
      if (!data) return;
      setTimeout(() => {
        const vid = data.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        var thumbUrl = data.thumbnail_url;
        if (!thumbUrl && vid) {
          thumbUrl = 'https://img.youtube.com/vi/'+vid[1]+'/hqdefault.jpg';
        }
        const pop = document.createElement('div');
        pop.id = 'video-popup';
        pop.style.cssText = 'position:fixed;top:80px;right:20px;z-index:99998;width:320px;background:var(--bg3,#10101d);border:1px solid var(--border,rgba(255,255,255,.06));border-radius:14px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.6);animation:popupSlide .5s cubic-bezier(.16,1,.3,1);transform-origin:top right';
        pop.innerHTML = `
          <style>
            @keyframes popupSlide{from{opacity:0;transform:translateX(60px) scale(.92)}to{opacity:1;transform:translateX(0) scale(1)}}
            @keyframes popupPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
          </style>
          <div style="position:relative;background:linear-gradient(135deg,rgba(255,106,51,.12),transparent);padding:14px 16px 10px;display:flex;align-items:flex-start;gap:10px">
            <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:var(--grad,#ff6a33);display:flex;align-items:center;justify-content:center;font-size:16px;animation:popupPulse 2s ease-in-out infinite">🔔</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:10px;font-weight:700;color:var(--accent,#ff6a33);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">New Video!</div>
              <div style="font-size:13px;font-weight:600;color:var(--text,#e8e8f0);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${data.title}</div>
            </div>
            <button class="vp-close" style="flex-shrink:0;width:24px;height:24px;border:none;border-radius:50%;background:rgba(255,255,255,.08);color:var(--text2,#8888aa);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">&times;</button>
          </div>
          <div class="vp-watch" style="cursor:pointer">
            ${thumbUrl ? '<img src="'+thumbUrl+'" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block" alt="'+data.title+'" loading="lazy" onerror="this.style.display=\'none\'" />' : ''}
            <div style="padding:10px 16px 14px;display:flex;align-items:center;gap:8px;color:var(--accent,#ff6a33);font-size:12px;font-weight:600">
              <span style="font-size:18px">▶</span> Watch Now
            </div>
          </div>`;
        document.body.appendChild(pop);
        setTimeout(() => { const el = document.getElementById('video-popup'); if (el) el.remove(); }, 15000);
        pop.querySelector('.vp-close')?.addEventListener('click', function(){pop.remove()});
        pop.querySelector('.vp-watch')?.addEventListener('click', function(){
          pop.remove();
          window.openVideoModal(data.video_url);
        });
      }, 3000);
    }).catch(function(){});
  }

  function openVideoModal(url) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    const videoId = match ? match[1] : null;
    if (!videoId) { toast('Invalid video URL', 'error'); return; }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    const box = document.createElement('div');
    box.style.cssText = 'width:90%;max-width:720px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;height:100%;border:none';
    box.appendChild(iframe);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });
  }
  window.openVideoModal = openVideoModal;

  function initNav() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
    if (hamburger) {
      hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); navLinks.classList.toggle('open'); });
      navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { hamburger.classList.remove('open'); navLinks.classList.remove('open'); }));
    }
  }

  function initReveal() {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); obs.unobserve(e.target); } });
      }, { threshold: .05, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    } else { document.querySelectorAll('.reveal').forEach(el => el.classList.add('show')); }
  }

  function blockCopy() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U')) e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J')) e.preventDefault();
    });
  }

  function initBgVideo() {
    const video = document.querySelector('.hero-bg-video video');
    if (!video) return;
    let stallCount = 0;
    video.addEventListener('stalled', () => { stallCount < 3 && (stallCount++, video.play().catch(()=>{})); });
    video.addEventListener('canplay', () => { video.play().catch(()=>{}); });
    video.addEventListener('suspend', () => { video.paused && video.play().catch(()=>{}); });
  }

  async function init() {
    initNav(); initParticles(); blockCopy(); initBgVideo();
    API.trackVisit(window.location.pathname).catch(() => {});

    initVideoPopup();

    try {
      const [products, testimonials, faqs, posts] = await Promise.all([
        API.getProducts(), API.getTestimonials().catch(() => []), API.getFaqs().catch(() => []), API.getBlog().catch(() => [])
      ]);

      const free = products.filter(p => p.type === 'free');
      const paid = products.filter(p => p.type === 'paid');
      const emus = products.filter(p => p.category_slug === 'emulators' || p.name.toLowerCase().includes('apk') || p.name.toLowerCase().includes('bluestacks') || p.name.toLowerCase().includes('msi'));

      renderProducts(free, 'free-products');
      renderProducts(emus.length ? emus : free.slice(0,3), 'emulator-products');
      renderPricing(paid, 'pricing-grid');
      renderTestimonials(testimonials, 'testimonials-grid');
      renderFaqs(faqs, 'faq-accordion');
      renderComparison(products, 'comparison-table');
      renderBlog(posts, 'blog-grid');
      renderVideos(products, 'videos-grid');
      initStats();
      setTimeout(initReveal, 50);
    } catch (err) { console.error('Load error:', err); }

    document.querySelector('.contact-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try { await API.sendContact({ name: f.name.value, email: f.email.value, subject: f.subject?.value||'', message: f.message.value }); toast('✅ Message sent!', 'success'); f.reset(); }
      catch(err) { toast('❌ ' + err.message, 'error'); }
    });

    document.querySelector('.nl-form')?.addEventListener('submit', (e) => { e.preventDefault(); const v = e.target.querySelector('input').value; if (v) { toast('✅ Subscribed!', 'success'); e.target.reset(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
