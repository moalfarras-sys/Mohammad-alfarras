/* ================================
   THEME SYSTEM - Light/Dark Mode
   UNIFIED: data-theme + body classes
   ================================ */
(function initTheme() {
  const html = document.documentElement;
  const body = document.body;
  const toggle = document.querySelector(".theme-toggle");
  
  if (!toggle) {
    console.warn("Theme toggle button not found");
    return;
  }

  // Get current theme from multiple sources
  const getCurrentTheme = () => {
    const stored = localStorage.getItem("mf-theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    
    // Check data-theme attribute
    const dataTheme = html.getAttribute("data-theme");
    if (dataTheme === "dark" || dataTheme === "light") {
      return dataTheme;
    }
    
    // Check body classes
    if (body.classList.contains('dark-mode') || body.classList.contains('theme-dark')) {
      return 'dark';
    }
    
    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    return prefersDark.matches ? "dark" : "light";
  };

  // Apply theme consistently everywhere
  const applyTheme = (theme) => {
    // Remove all theme-related classes and attributes
    body.classList.remove('light-mode', 'dark-mode', 'theme-light', 'theme-dark');
    
    // Apply new theme in all formats for maximum compatibility
    html.setAttribute('data-theme', theme);
    body.classList.add(`${theme}-mode`, `theme-${theme}`);
    
    // Save to localStorage
    localStorage.setItem("mf-theme", theme);
    
    // Update toggle icon
    updateToggleIcon(theme);
    
    console.log(`Theme applied: ${theme}`);
  };

  // Update toggle button icon
  const updateToggleIcon = (theme) => {
    if (theme === 'light') {
      toggle.innerHTML = '☀️'; // Sun icon for light mode
      toggle.setAttribute('aria-label', 'Switch to dark mode');
      toggle.setAttribute('title', 'Switch to dark mode');
    } else {
      toggle.innerHTML = '🌒'; // Moon icon for dark mode
      toggle.setAttribute('aria-label', 'Switch to light mode');
      toggle.setAttribute('title', 'Switch to light mode');
    }
  };

  // Initialize theme on page load
  const initializeTheme = () => {
    const theme = getCurrentTheme();
    applyTheme(theme);
  };

  initializeTheme();

  // Toggle theme with smooth transition
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    const current = getCurrentTheme();
    const next = current === "dark" ? "light" : "dark";
    
    console.log(`Switching theme: ${current} → ${next}`);
    
    // Apply smooth transition
    body.style.transition = "background-color 0.4s ease, color 0.4s ease";
    
    // Apply new theme
    applyTheme(next);
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    
    // Remove transition after complete
    setTimeout(() => {
      body.style.transition = "";
    }, 400);
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem("mf-theme")) {
        const theme = e.matches ? "dark" : "light";
        applyTheme(theme);
      }
    });
  }
})();

// ========================================
// NAVBAR: MOBILE TOGGLE + GLASS INTERACTION
// ========================================
(function initNavbarToggle() {
  const navbar = document.querySelector('.navbar');
  const navLinks = navbar?.querySelector('.nav-links');
  if (!navbar || !navLinks) return;

  // Keep links always visible; no burger menu required.
  navbar.classList.remove('nav-open');
})();

// ========================================
// GLOBAL DYNAMIC BACKGROUND (Canvas)
// Light: flowing waves | Dark: stars + clouds
// ========================================
(function initDynamicBackground() {
  // Disabled entirely to unblock scrolling on devices with weak GPUs or when page first loads
  return;

  const canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  document.body.prepend(canvas);

  let reduceMotion = prefersReducedMotion.matches;

  let width = 0;
  let height = 0;
  let theme = document.documentElement.getAttribute("data-theme") || "light";

  const starCount = 90;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 1.5 + 0.6,
    speed: Math.random() * 0.0006 + 0.0002,
    alpha: Math.random() * 0.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
    twinkle: Math.random() * 0.5 + 0.35
  }));

  let targetFps = reduceMotion ? 24 : 30;
  let frameInterval = 1000 / targetFps;
  let lastFrame = 0;

  const refreshFrameBudget = () => {
    targetFps = reduceMotion || isMobileScreen() ? 24 : 30;
    frameInterval = 1000 / targetFps;
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const pixelRatio = reduceMotion || isMobileScreen() ? 1 : Math.min(window.devicePixelRatio || 1, 1.2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    refreshFrameBudget();
  };

  const drawLight = (t) => {
    ctx.clearRect(0, 0, width, height);

    // Soft vertical gradient base
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "rgba(245, 253, 255, 0.95)");
    sky.addColorStop(1, "rgba(220, 245, 255, 0.78)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Moving glow orbs
    const orb = (x, y, r, c) => {
      const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, c);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const t1 = t * 0.00015;
    orb(width * 0.25 + Math.sin(t1) * 28, height * 0.25, 200, "rgba(59, 130, 246, 0.16)");
    orb(width * 0.75 + Math.cos(t1 * 1.1) * 30, height * 0.3, 210, "rgba(16, 185, 129, 0.14)");
    orb(width * 0.5 + Math.sin(t1 * 0.85) * 22, height * 0.7, 220, "rgba(14, 165, 233, 0.12)");

    // Animated wave bands (stronger presence)
    const waves = [
      { amp: 26, freq: 0.0014, speed: 0.0011, color: "rgba(56, 189, 248, 0.28)" },
      { amp: 18, freq: 0.0011, speed: 0.0014, color: "rgba(34, 211, 238, 0.24)" },
      { amp: 14, freq: 0.00095, speed: 0.0017, color: "rgba(16, 185, 129, 0.22)" }
    ];

    const waveStep = reduceMotion || isMobileScreen() ? 24 : 18;

    waves.forEach((wave, idx) => {
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += waveStep) {
        const y = height * 0.55 + Math.sin((x * wave.freq) + (t * wave.speed) + idx) * wave.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = wave.color;
      ctx.fill();
    });
  };

  const drawDark = (t) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#020305";
    ctx.fillRect(0, 0, width, height);

    // drifting soft clouds
    const cloudGradient = ctx.createRadialGradient(width * 0.3, height * 0.35, 80, width * 0.35, height * 0.4, width * 0.55);
    cloudGradient.addColorStop(0, "rgba(255,255,255,0.08)");
    cloudGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cloudGradient;
    ctx.globalCompositeOperation = "screen";
    ctx.beginPath();
    ctx.ellipse(width * 0.35 + Math.sin(t * 0.00022) * 26, height * 0.45, width * 0.28, height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    const cloudGradient2 = ctx.createRadialGradient(width * 0.7, height * 0.55, 60, width * 0.68, height * 0.55, width * 0.48);
    cloudGradient2.addColorStop(0, "rgba(148,163,184,0.08)");
    cloudGradient2.addColorStop(1, "rgba(148,163,184,0)");
    ctx.fillStyle = cloudGradient2;
    ctx.beginPath();
    ctx.ellipse(width * 0.7 + Math.cos(t * 0.00018) * 22, height * 0.6, width * 0.22, height * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // star field
    stars.forEach((star) => {
      star.y += star.speed * height;
      star.x += star.speed * 0.6;
      if (star.y * height > height + 8) star.y = 0;
      if (star.x * width > width + 8) star.x = 0;
      const x = star.x * width;
      const y = star.y * height;
      const twinkle = 0.55 + 0.45 * Math.sin(t * 0.004 + star.phase);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, star.alpha * star.twinkle * twinkle)})`;
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  let rafId = 0;

  const render = (time = 0) => {
    if (time - lastFrame < frameInterval) {
      rafId = requestAnimationFrame(render);
      return;
    }

    lastFrame = time;

    if (theme === "dark") {
      drawDark(time);
    } else {
      drawLight(time);
    }

    rafId = requestAnimationFrame(render);
  };

  const restartAnimation = () => {
    if (rafId) cancelAnimationFrame(rafId);
    lastFrame = 0;
    rafId = requestAnimationFrame(render);
  };

  resize();
  restartAnimation();

  window.addEventListener("resize", () => {
    resize();
    restartAnimation();
  });

  window.addEventListener("themechange", (e) => {
    theme = e.detail?.theme || document.documentElement.getAttribute("data-theme") || "light";
    restartAnimation();
  });

  prefersReducedMotion.addEventListener("change", (e) => {
    reduceMotion = e.matches;
    refreshFrameBudget();
    resize();
    restartAnimation();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      return;
    }
    restartAnimation();
  });

  window.addEventListener("unload", () => cancelAnimationFrame(rafId));
})();

// Safety: always re-enable page scrolling in case any modal or script left overflow hidden
(function ensureScrollUnlock() {
  const unlock = () => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  };

  unlock();
  window.addEventListener('load', () => setTimeout(unlock, 120));
})();

// Extra guard: in case any script briefly sets overflow:hidden on page load (e.g., images/modals)
(function forceScrollUnlock() {
  let attempts = 0;
  const unlock = () => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  };

  const interval = setInterval(() => {
    unlock();
    attempts += 1;
    if (attempts > 40) { // run for ~6s
      clearInterval(interval);
    }
  }, 150);

  window.addEventListener('pageshow', unlock);
})();

// Gentle parallax for dark-mode stars tied to scroll (no canvas)
(function initStarParallax() {
  const root = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) return;

  let ticking = false;

  const update = () => {
    const y = window.scrollY || 0;
    const xShift = (y * 0.04).toFixed(2);
    const yShift = (y * 0.02).toFixed(2);
    root.style.setProperty('--star-pos', `${xShift}px ${yShift}px`);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('themechange', update);
})();

// Micro hover/touch lift for buttons and cards
(function initMicroHovers() {
  const selectors = [
    '.hero-btn',
    '.pill-button',
    '.feature-card',
    '.yt-card',
    '.card',
    '.cta-button',
    '.cv-service-card',
    '.cv-lang-card',
    '.cv-neo-item',
    '.cv-stat-card',
    '.testimonial',
    '.nav-links a'
  ];

  const elements = Array.from(document.querySelectorAll(selectors.join(',')));
  if (!elements.length) return;

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = !finePointer;

  const maybeWiggle = (el) => {
    if (prefersReducedMotion) return;
    const now = performance.now();
    if (el._lastWiggle && now - el._lastWiggle < 700) return;
    el._lastWiggle = now;
    el.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1)' },
        { transform: 'translate3d(1px, -1px, 0) scale(1.015) rotate(-0.4deg)' },
        { transform: 'translate3d(-1px, 1px, 0) scale(1.01) rotate(0.35deg)' },
        { transform: 'translate3d(0, 0, 0) scale(1)' }
      ],
      { duration: 260, easing: 'ease-out' }
    );
  };

  const addPressHandlers = (node) => {
    const add = () => node.classList.add('micro-press');
    const remove = () => node.classList.remove('micro-press');
    node.addEventListener('pointerdown', add);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) => {
      node.addEventListener(evt, remove);
    });
  };

  elements.forEach((el) => {
    el.classList.add('micro-interactive');
    addPressHandlers(el);
    el.addEventListener('pointerenter', () => maybeWiggle(el), { passive: true });

    if (finePointer) {
      let rafId = null;

      const reset = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        el.style.transform = '';
      };

      const onMove = (e) => 
        {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            const tx = (x * 10).toFixed(2);
            const ty = (y * 10).toFixed(2);
            el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.02)`;
          });
        };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', reset);
    } else {
      const reset = () => {
        el.style.transform = '';
      };

      el.addEventListener('touchstart', () => {
        el.style.transform = 'scale(0.985)';
      }, { passive: true });
      el.addEventListener('touchend', reset, { passive: true });
      el.addEventListener('touchcancel', reset, { passive: true });
    }
  });
})();

// ========================================
// NAVBAR STATE (active link + compact on scroll)
// ========================================
(function initNavbarState() {
  const header = document.querySelector("header.navbar");
  const navLinks = document.querySelectorAll(".nav-links a");
  if (!header || !navLinks.length) return;

  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  navLinks.forEach((link) => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === current || (current === "" && href.includes("index"))) {
      link.classList.add("active");
    }
  });

  const setCompact = () => {
    if (window.scrollY > 32) {
      header.classList.add("navbar-compact");
    } else {
      header.classList.remove("navbar-compact");
    }
  };

  setCompact();
  window.addEventListener("scroll", setCompact, { passive: true });
})();

(function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// ========================================
// LANGUAGE SELECTOR - Dropdown Toggle
// ========================================
(function initLanguageSelector() {
  const toggle = document.querySelector(".language-toggle-glass");
  const dropdown = document.querySelector(".language-dropdown");
  
  if (!toggle || !dropdown) return;

  // Toggle dropdown on button click
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = dropdown.hasAttribute("hidden");
    
    if (isHidden) {
      dropdown.removeAttribute("hidden");
    } else {
      dropdown.setAttribute("hidden", "");
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.setAttribute("hidden", "");
    }
  });

  // Close dropdown on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.setAttribute("hidden", "");
    }
  });

  // Prevent dropdown from closing when clicking inside it
  dropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });
})();

(function initSectionAnimations() {
  if (!("IntersectionObserver" in window)) return;

  // Observe all sections for entrance animations
  const sections = document.querySelectorAll("section");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("section-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -100px 0px" });

  sections.forEach(section => {
    section.classList.add("section-animated");
    observer.observe(section);
  });
})();

(function initCards() {
  const cards = document.querySelectorAll(".card");
  if (!("IntersectionObserver" in window) || !cards.length) {
    cards.forEach(c => c.classList.add("card-visible"));
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("card-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
  
  cards.forEach(c => observer.observe(c));
})();

(function initSkillBars() {
  const fills = document.querySelectorAll("[data-skill]");
  if (!fills.length || !("IntersectionObserver" in window)) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const value = el.getAttribute("data-skill");
        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
          el.style.width = value + "%";
        });
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4, rootMargin: "0px 0px -50px 0px" });
  
  fills.forEach(f => observer.observe(f));
})();

(function highlightNav() {
  const links = document.querySelectorAll(".nav-links a");
  if (!links.length) return;

  // Highlight based on current page
  const updateActiveLink = () => {
    const path = window.location.pathname.split("/").pop() || "index.html";
    links.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (!href) return;
      const normalized = href.split("/").pop();
      if (normalized === path) {
        link.classList.add("active");
      }
    });
  };

  updateActiveLink();

  // Handle smooth scroll for anchor links
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // Update active state
          setTimeout(() => updateActiveLink(), 100);
        }
      }
    });
  });

  // Update active link on scroll
  window.addEventListener("scroll", updateActiveLink, { passive: true });
})();

(function initYouTubeGrid() {
  // Dynamic loader and renderer for the YouTube grid.
  // Behavior:
  // 1. Load `data/videos.json` as fallback/sample data.
  // 2. If `window.YT_API_CONFIG` has CHANNEL_ID and API_KEY, try to fetch recent videos
  //    from the YouTube Data API v3 and normalize them into the canonical shape.
  // 3. Render the grid into `#video-grid` and wire up modal playback.

  const modal = document.getElementById('yt-modal');
  const gridEl = document.getElementById('video-grid');
  if (!gridEl || !modal) return;

  const playerWrap = modal.querySelector('.player');
  const backdrop = modal.querySelector('.backdrop');
  let lastActive = null;

  const getLang = () => {
    const html = document.documentElement;
    const dir = html.getAttribute('dir') || 'ltr';
    return dir === 'rtl' || html.lang === 'ar' ? 'ar' : 'en';
  };

  const formatDate = (iso, lang) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  };

  const truncate = (text, n = 120) => (text && text.length > n ? text.slice(0, n - 1) + '…' : text || '');

  const fetchLocalVideos = () => {
    return fetch('data/videos.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);
  };

  const fetchYouTubeApi = async (cfg) => {
    if (!cfg || !cfg.API_KEY) return null;
    
    const max = cfg.MAX_RESULTS || 20;
    const apiKey = cfg.API_KEY;
    
    try {
      // Step 1: Resolve channel handle to channel ID
      let channelId = cfg.CHANNEL_ID;
      const channelHandle = cfg.CHANNEL_HANDLE || '@moalfarras';
      
      if (!channelId) {
        const handleClean = channelHandle.replace('@', '');
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(handleClean)}&key=${encodeURIComponent(apiKey)}`;
        const channelRes = await fetch(channelUrl);
        if (!channelRes.ok) return null;
        const channelData = await channelRes.json();
        if (!channelData.items || !channelData.items.length) return null;
        channelId = channelData.items[0].id;
      }
      
      // Step 2: Get uploads playlist ID
      const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
      const detailsRes = await fetch(channelDetailsUrl);
      if (!detailsRes.ok) return null;
      const detailsData = await detailsRes.json();
      if (!detailsData.items || !detailsData.items.length) return null;
      const uploadsPlaylistId = detailsData.items[0].contentDetails.relatedPlaylists.uploads;
      
      // Step 3: Fetch videos from uploads playlist
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${max}&playlistId=${encodeURIComponent(uploadsPlaylistId)}&key=${encodeURIComponent(apiKey)}`;
      const playlistRes = await fetch(playlistUrl);
      if (!playlistRes.ok) return null;
      const playlistData = await playlistRes.json();
      if (!playlistData.items) return null;
      
      // Step 4: Normalize to site schema
      const items = playlistData.items.map(it => {
        const sn = it.snippet || {};
        const vid = sn.resourceId && sn.resourceId.videoId ? sn.resourceId.videoId : null;
        if (!vid) return null;
        
        const thumb = (sn.thumbnails && (sn.thumbnails.high || sn.thumbnails.medium || sn.thumbnails.default))
          ? (sn.thumbnails.high || sn.thumbnails.medium || sn.thumbnails.default).url
          : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        
        return {
          id: vid,
          title_en: sn.title || '',
          title_ar: '',
          description_en: sn.description || '',
          description_ar: '',
          thumbnail: thumb,
          publishedAt: sn.publishedAt || '',
          url: `https://www.youtube.com/watch?v=${vid}`
        };
      }).filter(Boolean);
      
      return items;
    } catch (e) {
      console.error('YouTube API fetch error:', e);
      return null;
    }
  };

  const mergeLocalAndApi = (local = [], api = []) => {
    const map = new Map();
    // put local first so that localized fields (title_ar/description_ar) are preserved
    local.forEach(v => map.set(v.id, Object.assign({}, v)));
    api.forEach(v => {
      const existing = map.get(v.id) || {};
      // keep Arabic fields from local if present
      const title_ar = existing.title_ar || v.title_ar || '';
      const description_ar = existing.description_ar || v.description_ar || '';
      map.set(v.id, Object.assign({}, v, { title_ar, description_ar }));
    });
    // return array sorted by publishedAt desc
    return Array.from(map.values()).sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  };

  const openModal = (id, triggerEl) => {
    if (!id) return;
    lastActive = triggerEl || document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.title = 'YouTube player';
    iframe.loading = 'lazy';
    iframe.setAttribute('frameborder', '0');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    playerWrap.innerHTML = '';
    playerWrap.appendChild(iframe);
    playerWrap.focus();
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    playerWrap.innerHTML = '';
    document.body.style.overflow = '';
    if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
    lastActive = null;
  };

  const renderVideoGrid = (videos) => {
    const featuredEl = document.getElementById('featured-video-card');
    gridEl.innerHTML = '';
    
    if (!videos || !videos.length) {
      const msg = getLang() === 'ar' ? 'لا توجد فيديوهات متاحة حالياً.' : 'No videos available right now.';
      gridEl.innerHTML = `<div class="card">${msg}</div>`;
      if (featuredEl) featuredEl.innerHTML = `<div class="loader">${msg}</div>`;
      return;
    }

    const lang = getLang();

    // Render featured video (first video)
    if (featuredEl && videos.length > 0) {
      const featured = videos[0];
      const title = lang === 'ar' ? (featured.title_ar || featured.title_en) : (featured.title_en || featured.title_ar);
      const desc = lang === 'ar' ? (featured.description_ar || featured.description_en) : (featured.description_en || featured.description_ar);
      const ctaText = lang === 'ar' ? 'شاهد على يوتيوب' : 'Watch on YouTube';
      
      featuredEl.innerHTML = `
        <div class="yt-featured-thumb" data-youtube-id="${featured.id}" style="cursor: pointer;">
          <img src="${featured.thumbnail || `https://i.ytimg.com/vi/${featured.id}/hqdefault.jpg`}" alt="${title}">
          <button class="yt-play-btn" aria-label="Play video">▶</button>
        </div>
        <div class="yt-featured-info">
          <h3 class="yt-featured-title">${title}</h3>
          <p class="yt-featured-desc">${truncate(desc, 180)}</p>
          <a href="${featured.url}" target="_blank" rel="noopener noreferrer" class="yt-featured-cta">
            ${ctaText}
          </a>
        </div>
      `;

      // Bind click to featured thumbnail
      const featThumb = featuredEl.querySelector('.yt-featured-thumb');
      if (featThumb) {
        featThumb.addEventListener('click', () => openModal(featured.id, featThumb));
      }
    }

    // Render remaining videos in grid (skip first one)
    const gridVideos = videos.slice(1);
    
    if (gridVideos.length === 0) {
      gridEl.innerHTML = '<div class="loader">No more videos to display.</div>';
      return;
    }

    const frag = document.createDocumentFragment();
    gridVideos.forEach(v => {
      const article = document.createElement('article');
      article.className = 'yt-card glass';
      article.setAttribute('data-youtube-id', v.id);
      article.setAttribute('tabindex', '0');
      article.style.cursor = 'pointer';

      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'yt-thumb';

      const img = document.createElement('img');
      img.src = v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
      img.alt = (lang === 'ar' ? (v.title_ar || v.title_en) : (v.title_en || v.title_ar)) || 'thumbnail';

      // Add duration if available
      if (v.duration) {
        const durationSpan = document.createElement('span');
        durationSpan.className = 'yt-duration';
        durationSpan.textContent = v.duration;
        thumbDiv.appendChild(img);
        thumbDiv.appendChild(durationSpan);
      } else {
        thumbDiv.appendChild(img);
      }

      const meta = document.createElement('div');
      meta.className = 'yt-meta';

      const h4 = document.createElement('h4');
      h4.className = 'yt-title';
      h4.textContent = lang === 'ar' ? (v.title_ar || v.title_en) : (v.title_en || v.title_ar);

      meta.appendChild(h4);
      article.appendChild(thumbDiv);
      article.appendChild(meta);

      // Bind interactions
      article.addEventListener('click', () => openModal(v.id, article));
      article.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(v.id, article);
        }
      });

      frag.appendChild(article);
    });

    gridEl.appendChild(frag);
  };

  // Close bindings
  backdrop.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  // bootstrap: load local file, then try API and re-render if API returns
  (async () => {
    const local = await fetchLocalVideos();
    // initial render from local data
    renderVideoGrid(local);

    // try API if config present
    let apiResults = null;
    try {
      const cfg = window.YT_API_CONFIG || {};
      if (cfg && cfg.CHANNEL_ID && cfg.API_KEY) {
        apiResults = await fetchYouTubeApi(cfg);
      }
    } catch (e) {
      apiResults = null;
    }

    if (apiResults && apiResults.length) {
      const merged = mergeLocalAndApi(local, apiResults);
      renderVideoGrid(merged);
    }
  })();

})();

// ========================================
// MICRO INTERACTIONS (LIGHT PARALLAX TILT)
// ========================================
// Micro-interactions removed per user request.

(function initStatCounters() {
  // Animate stat numbers when visible
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  if (!("IntersectionObserver" in window)) {
    counters.forEach(c => {
      const target = parseInt(c.getAttribute('data-count'), 10);
      c.textContent = target;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      
      entry.target.dataset.counted = 'true';
      const target = parseInt(entry.target.getAttribute('data-count'), 10);
      const duration = 1000; // 1 second
      const start = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - start) / duration, 1);
        const current = Math.floor(progress * target);
        entry.target.textContent = current;
        
        if (progress < 1) requestAnimationFrame(animate);
      };
      
      animate();
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
})();

// ========================================
// DYNAMIC CONTENT SYSTEM
// ========================================
(function initDynamicContent() {
  const ROTATION_INTERVAL = 10000; // 10 seconds
  const FADE_DURATION = 400; // ms
  
  // Detect language from HTML lang attribute or directory
  function detectLanguage() {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === 'ar') return 'ar';
    if (htmlLang === 'en') return 'en';
    
    // Fallback: check path
    const path = window.location.pathname;
    return path.includes('/en/') ? 'en' : 'ar';
  }
  
  const currentLang = detectLanguage();
  let dynamicData = null;
  let rotationTimers = {};
  
  // Fade out → change text → fade in
  function rotateText(element, newText) {
    if (!element) return;
    
    element.classList.add('fade-out');
    
    setTimeout(() => {
      element.textContent = newText;
      element.classList.remove('fade-out');
      element.classList.add('fade-in');
      
      setTimeout(() => {
        element.classList.remove('fade-in');
      }, FADE_DURATION);
    }, FADE_DURATION);
  }
  
  // Start rotation for a specific element
  function startRotation(elementId, contentArray) {
    const element = document.getElementById(elementId);
    if (!element || !contentArray || contentArray.length === 0) return;
    
    let currentIndex = 0;
    
    // Set initial content
    element.textContent = contentArray[currentIndex];
    element.classList.add('dynamic-text');
    
    // Rotate through array
    rotationTimers[elementId] = setInterval(() => {
      currentIndex = (currentIndex + 1) % contentArray.length;
      rotateText(element, contentArray[currentIndex]);
    }, ROTATION_INTERVAL);
  }
  
  // Load JSON and initialize rotations
  const pathPrefix = window.location.pathname.includes('/en/') ? '../' : '';
  fetch(`${pathPrefix}data/dynamic-content.json`)
    .then(response => response.json())
    .then(data => {
      dynamicData = data;
      
      // Initialize each dynamic element
      if (data.hero_taglines && data.hero_taglines[currentLang]) {
        startRotation('hero-dynamic-text', data.hero_taglines[currentLang]);
      }
      
      if (data.cv_highlights && data.cv_highlights[currentLang]) {
        startRotation('cv-dynamic-note', data.cv_highlights[currentLang]);
      }
      
      if (data.youtube_notes && data.youtube_notes[currentLang]) {
        startRotation('youtube-dynamic-note', data.youtube_notes[currentLang]);
      }
    })
    .catch(error => {
      console.warn('Dynamic content not loaded:', error);
    });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    Object.values(rotationTimers).forEach(timer => clearInterval(timer));
  });
})();

// CONTACT FORM TEMPLATE AUTO-FILL SYSTEM
(function initContactForm() {
  const templates = {
    ar: {
      product: 'مرحباً محمد، عندي منتج/خدمة جديدة وأبحث عن طريقة احترافية لعرضه وتجهيزه.\nحاب أعرف رأيك وكيف ممكن نتعاون.',
      logistics: 'مرحباً محمد، عندي استفسار بخصوص اللوجستيات/التوصيل.\nحاب أفهم طريقة التخطيط، إدارة السائقين، أو تنظيم الرحلات بشكل أفضل.',
      website: 'مرحباً محمد، أفكر أعمل موقع بسيط وعملي يكون واجهة للمشروع أو البزنس الخاص فيني.\nحابب أعرف كيف نبدأ.',
      content: 'مرحباً محمد، أتابع محتواك وأرغب في تنسيق تعاون أو فيديو مشترك.',
      consultation: 'مرحباً محمد، أحتاج استشارة بخصوص [اكتب الموضوع هنا]...',
      other: ''
    },
    en: {
      product: "Hi Mohammad, I'm launching a new product/service and I'm looking for someone who can present it professionally.\nI'd like to discuss ideas and explore collaboration.",
      logistics: "Hi Mohammad, I have a question regarding logistics/Disposition.\nI'd like to understand planning, driver coordination, or route optimization.",
      website: "Hi Mohammad, I'd like to create a simple, clean website for my business/project.\nI want to know how we can start.",
      content: "Hi Mohammad, I follow your content and I'm interested in exploring a collaboration or joint video idea.",
      consultation: "Hi Mohammad, I need consultation about [write your topic here]...",
      other: ''
    }
  };

  // Detect language
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  
  // Arabic form
  const topicSelectAr = document.getElementById('topicSelect');
  const messageAreaAr = document.getElementById('messageArea');
  
  if (topicSelectAr && messageAreaAr) {
    topicSelectAr.addEventListener('change', function() {
      const topic = this.value;
      if (topic && templates.ar[topic]) {
        messageAreaAr.value = templates.ar[topic];
        messageAreaAr.focus();
        // Animate the fill
        messageAreaAr.style.transition = 'all 0.3s ease';
        messageAreaAr.style.transform = 'scale(1.02)';
        setTimeout(() => {
          messageAreaAr.style.transform = 'scale(1)';
        }, 300);
      }
    });
  }
  
  // English form
  const topicSelectEn = document.getElementById('topicSelectEn');
  const messageAreaEn = document.getElementById('messageAreaEn');
  
  if (topicSelectEn && messageAreaEn) {
    topicSelectEn.addEventListener('change', function() {
      const topic = this.value;
      if (topic && templates.en[topic]) {
        messageAreaEn.value = templates.en[topic];
        messageAreaEn.focus();
        // Animate the fill
        messageAreaEn.style.transition = 'all 0.3s ease';
        messageAreaEn.style.transform = 'scale(1.02)';
        setTimeout(() => {
          messageAreaEn.style.transform = 'scale(1)';
        }, 300);
      }
    });
  }

  const attachQuickChoices = (selector, targetSelect, messageArea, langKey) => {
    const radios = document.querySelectorAll(selector);
    if (!radios.length || !targetSelect) return;

    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const topic = radio.value;
        if (!topic) return;
        targetSelect.value = topic;
        targetSelect.dispatchEvent(new Event('change'));
        if (messageArea && templates[langKey] && templates[langKey][topic]) {
          messageArea.value = templates[langKey][topic];
          messageArea.focus();
        }
      });
    });
  };

  attachQuickChoices('.contact-quick-choices input[name="topic_quick"]', topicSelectAr, messageAreaAr, 'ar');
  attachQuickChoices('.contact-quick-choices input[name="topic_quick_en"]', topicSelectEn, messageAreaEn, 'en');
})();

/* ================================
   SCROLL REVEAL ANIMATIONS
   ================================ */
(function initScrollReveal() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // Skip animations if user prefers reduced motion
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  // Create IntersectionObserver for scroll reveal
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Optionally unobserve after revealing
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with reveal-on-scroll class
  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    observer.observe(el);
  });
})();

/* ================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Skip if href is just "#"
      if (href === '#' || !href) return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without triggering scroll
        history.pushState(null, null, href);
      }
    });
  });
})();

/* ================================
   GLASS HIGHLIGHT CURSOR EFFECT
   ================================ */
(function initGlassHighlight() {
  // Only on desktop
  if (window.innerWidth < 1024) return;
  
  const hero = document.querySelector('.cinematic-hero');
  if (!hero) return;
  
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  
  function animate() {
    // Smooth follow
    currentX += (mouseX - currentX) * 0.1;
    currentY += (mouseY - currentY) * 0.1;
    
    hero.style.setProperty('--mouse-x', `${currentX}px`);
    hero.style.setProperty('--mouse-y', `${currentY}px`);
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Add subtle radial gradient that follows cursor
  hero.style.background = `
    radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
      rgba(102, 126, 234, 0.05), 
      transparent 40%)
  `;
})();

/* ================================
   AUTO-SCROLL YEAR IN FOOTER
   ================================ */
(function updateYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
})();

/* ================================
   FAQ ACCORDION ENHANCEMENTS
   ================================ */
(function enhanceFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const summary = item.querySelector('summary');
    if (!summary) return;
    
    summary.addEventListener('click', (e) => {
      // Close other open FAQs (optional - for accordion behavior)
      const wasOpen = item.hasAttribute('open');
      
      // Uncomment below to close other FAQs when opening one (single-open accordion)
      // faqItems.forEach(otherItem => {
      //   if (otherItem !== item) {
      //     otherItem.removeAttribute('open');
      //   }
      // });
    });
  });
})();

/* ================================
   PERFORMANCE: LAZY LOAD ANIMATIONS
   ================================ */
(function initLazyAnimations() {
  // Pause animations for elements not in viewport to save resources
  const animatedElements = document.querySelectorAll('.floating-icon, .gallery-item');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      } else {
        entry.target.style.animationPlayState = 'paused';
      }
    });
  }, { threshold: 0.1 });
  
  animatedElements.forEach(el => {
    observer.observe(el);
  });
})();

/* ================================
   SCROLL TO TOP BUTTON
   ================================ */
(function initScrollToTop() {
  const btn = document.querySelector('.scroll-to-top');
  if (!btn) return;

  // Show/hide button based on scroll position
  function toggleButtonVisibility() {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  // Scroll to top smoothly
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Event listeners
  window.addEventListener('scroll', toggleButtonVisibility);
  btn.addEventListener('click', scrollToTop);

  // Check initial scroll position
  toggleButtonVisibility();
})();


/* ================================
   FAQ ACCORDION (NEW SYSTEM)
   ================================ */
(function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    
    question.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      
      // Close all other FAQs (single-open accordion)
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });
      
      // Toggle current FAQ
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });
})();

/* ================================
   ANIMATED COUNTERS (YouTube stats, etc.)
   FIXED: Prevent NaN and ensure proper number display
   ================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length === 0) return;
  
  function animateCounter(element) {
    const targetStr = element.getAttribute('data-count-to');
    const target = parseInt(targetStr, 10);
    
    // Validate target is a number
    if (isNaN(target) || target < 0) {
      console.error('Invalid data-count-to value:', targetStr);
      element.textContent = '0';
      return;
    }
    
    const duration = parseInt(element.getAttribute('data-duration'), 10) || 2000;
    const suffix = element.getAttribute('data-suffix') || '';
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    const startTime = Date.now();
    let current = start;
    
    function updateCounter() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(progress * target);
      
      element.textContent = current + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target + suffix;
      }
    }
    
    requestAnimationFrame(updateCounter);
  }
  
  // Use Intersection Observer to trigger when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  counters.forEach(counter => observer.observe(counter));
})();

/* ================================
   REVEAL ON SCROLL ANIMATIONS
   ================================ */
(function initRevealOnScroll() {
  const reveals = document.querySelectorAll('.reveal-on-scroll');
  if (reveals.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1, rootMargin: '50px' });
  
  reveals.forEach(reveal => observer.observe(reveal));
})();

/* ================================
   MOBILE NAV WRAP (Prevent Overflow)
   ================================ */
(function handleNavWrap() {
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');
  
  if (!navbar || !navLinks) return;
  
  function checkNavOverflow() {
    const navWidth = navLinks.scrollWidth;
    const containerWidth = navLinks.clientWidth;
    
    if (navWidth > containerWidth) {
      navLinks.classList.add('wrapped');
    } else {
      navLinks.classList.remove('wrapped');
    }
  }
  
  window.addEventListener('resize', checkNavOverflow);
  checkNavOverflow();
})();

/* ================================
   ENHANCED SCROLL REVEAL SYSTEM
   ================================ */
(function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-element, .glass-card');
  
  if (!revealElements.length) return;
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // For progress bars in CV
        if (entry.target.classList.contains('cv-lang-item') || entry.target.classList.contains('cv-language-item')) {
          const fill = entry.target.querySelector('.cv-lang-fill, .cv-language-progress');
          if (fill) {
            const width = fill.style.getPropertyValue('--lang-width') || fill.dataset.width || '100%';
            setTimeout(() => {
              fill.style.width = width;
            }, 200);
          }
        }
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
})();

/* ================================
   BACK TO TOP BUTTON (GLOBAL)
   ================================ */
(function initBackToTop() {
  // Create button if it doesn't exist
  let backToTopBtn = document.querySelector('.back-to-top');
  
  if (!backToTopBtn) {
    backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(backToTopBtn);
  }
  
  // Show/hide on scroll
  function toggleBackToTop() {
    if (window.pageYOffset > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }
  
  // Smooth scroll to top
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
})();

/* ================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
})();

/* ================================
   CARD HOVER GLOW EFFECTS
   ================================ */
(function initCardGlows() {
  const cards = document.querySelectorAll('.feature-card, .cv-service-card, .timeline-card, .yt-stat-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.setProperty('--hover-x', '50%');
      this.style.setProperty('--hover-y', '50%');
    });
    
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      this.style.setProperty('--hover-x', x + '%');
      this.style.setProperty('--hover-y', y + '%');
    });
  });
})();

/* ================================
   MOBILE NAVIGATION MENU TOGGLE
   ================================ */
(function initMobileNav() {
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');
  
  if (!burger || !navLinks) {
    console.log('Mobile nav elements not found');
    return;
  }
  
  // Toggle menu on burger click
  burger.addEventListener('click', function(e) {
    e.stopPropagation();
    burger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!navLinks.contains(e.target) && !burger.contains(e.target)) {
      burger.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
  
  // Close menu when clicking on a link
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      burger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
  
  // Close menu on window resize if going to desktop size
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 960) {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
      }
    }, 250);
  });
})();

