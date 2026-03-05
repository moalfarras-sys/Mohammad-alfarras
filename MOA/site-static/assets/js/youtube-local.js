/**
 * YouTube Video Loader - Static JSON (No API)
 * 
 * Features:
 * - Loads videos from /assets/data/videos.json
 * - Sorts by views (descending)
 * - Top 10 videos only
 * - First video = Featured card
 * - Rest = Grid layout
 * - Language support (AR/EN)
 * - Modal player
 * 
 * NO API dependency | NO API key needed
 */

(function initYouTubeStaticLoader() {
  'use strict';

  // DOM Elements
  const modal = document.getElementById('yt-modal');
  const featuredEl = document.getElementById('featured-video-card');
  const gridEl = document.getElementById('video-grid');

  if (!gridEl || !modal) {
    console.warn('YouTube elements not found');
    return;
  }

  const playerWrap = modal.querySelector('.player');
  const backdrop = modal.querySelector('.backdrop');
  let lastActive = null;

  // Minimal inline fallback to prevent empty pages if fetch fails
  const fallbackVideos = [
    {
      id: "ZRPDkXiXEpw",
      title_ar: "فتح صندوق وتجربة أولية – منتج جديد يلفت الانتباه!",
      title_en: "Unboxing & First Look – A Surprisingly Impressive Gadget",
      description_ar: "فتح صندوق بسيط لكنه ممتع… استعراض سريع وانطباع أول يعطيك فكرة صادقة قبل أي قرار شراء.",
      description_en: "A clean and honest unboxing with a true first impression. Simple, real, and straight to the point.",
      thumbnail: "https://i.ytimg.com/vi/ZRPDkXiXEpw/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=ZRPDkXiXEpw",
      duration: "07:40",
      views: 18900
    },
    {
      id: "N6ZhjrmUNLU",
      title_ar: "تجربة عملية لجهاز مبتكر – هل يستحق؟",
      title_en: "Hands-On Review of an Interesting Device – Worth It?",
      description_ar: "تجربة حقيقية بدون مجاملة… نختبر الأداء ونشوف فعليًا إذا الجهاز عملي أو مجرد شكل.",
      description_en: "A real hands-on test with no hype. Practical results that show what the device can actually do.",
      thumbnail: "https://i.ytimg.com/vi/N6ZhjrmUNLU/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=N6ZhjrmUNLU",
      duration: "09:12",
      views: 22100
    },
    {
      id: "CE_ONNbvi9I",
      title_ar: "منتج تقني جديد… نظرة سريعة وصريحة",
      title_en: "Quick and Honest Look at a New Tech Product",
      description_ar: "استعراض سريع يعطيك خلاصة التجربة: أهم المزايا، العيوب، والانطباع الحقيقي بدون مبالغة.",
      description_en: "A fast, clear, and honest overview. The good, the bad, and the real experience — all in one short video.",
      thumbnail: "https://i.ytimg.com/vi/CE_ONNbvi9I/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=CE_ONNbvi9I",
      duration: "05:58",
      views: 16200
    },
    {
      id: "kNf8kd62OT4",
      title_ar: "أداة صغيرة… لكن فعّالة أكثر مما تتوقع!",
      title_en: "A Small Tool… Surprisingly Powerful!",
      description_ar: "منتج بسيط لكن مفيد جدًا… نشوف عمليًا إذا فعلاً يستحق مكانه ضمن أدواتك اليومية.",
      description_en: "A compact gadget that packs more usefulness than expected. A practical daily-use test.",
      thumbnail: "https://i.ytimg.com/vi/kNf8kd62OT4/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=kNf8kd62OT4",
      duration: "06:45",
      views: 17500
    }
  ];

  // ============================================
  // HELPERS
  // ============================================

  const getLang = () => {
    const html = document.documentElement;
    const dir = html.getAttribute('dir') || 'ltr';
    return dir === 'rtl' || html.lang === 'ar' ? 'ar' : 'en';
  };

  const truncate = (text, max = 120) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  };

  const formatViews = (views) => {
    if (!views) return '';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  // ============================================
  // MODAL
  // ============================================

  const openModal = (videoId, trigger) => {
    if (!videoId) return;
    
    lastActive = trigger || document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.title = 'YouTube video player';
    iframe.loading = 'lazy';
    iframe.setAttribute('frameborder', '0');
    iframe.style.cssText = 'width:100%;height:100%';
    
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
    
    if (lastActive && typeof lastActive.focus === 'function') {
      lastActive.focus();
    }
    lastActive = null;
  };

  // ============================================
  // RENDER
  // ============================================

  const renderFeatured = (video) => {
    if (!featuredEl || !video) return;

    const lang = getLang();
    const title = lang === 'ar' ? video.title_ar : video.title_en;
    const desc = lang === 'ar' ? video.description_ar : video.description_en;
    const cta = lang === 'ar' ? 'شاهد على يوتيوب' : 'Watch on YouTube';

    featuredEl.innerHTML = `
      <div class="yt-featured-thumb" data-id="${video.id}" style="cursor:pointer">
        <img src="${video.thumbnail}" alt="${title}" loading="lazy">
        <button class="yt-play-btn" aria-label="${lang === 'ar' ? 'تشغيل' : 'Play'}">▶</button>
      </div>
      <div class="yt-featured-info">
        <h3 class="yt-featured-title">${title}</h3>
        <p class="yt-featured-desc">${truncate(desc, 180)}</p>
        <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="yt-featured-cta">${cta}</a>
      </div>
    `;

    const thumb = featuredEl.querySelector('.yt-featured-thumb');
    if (thumb) {
      thumb.addEventListener('click', () => openModal(video.id, thumb));
    }
  };

  const renderGrid = (videos) => {
    if (!gridEl || !videos || !videos.length) {
      gridEl.innerHTML = '<div class="loader">No videos</div>';
      return;
    }

    const lang = getLang();
    const frag = document.createDocumentFragment();

    videos.forEach(v => {
      const title = lang === 'ar' ? v.title_ar : v.title_en;

      const article = document.createElement('article');
      article.className = 'yt-card glass';
      article.setAttribute('data-id', v.id);
      article.setAttribute('tabindex', '0');
      article.style.cursor = 'pointer';

      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'yt-thumb';

      const img = document.createElement('img');
      img.src = v.thumbnail;
      img.alt = title;
      img.loading = 'lazy';
      thumbDiv.appendChild(img);

      if (v.duration) {
        const dur = document.createElement('span');
        dur.className = 'yt-duration';
        dur.textContent = v.duration;
        thumbDiv.appendChild(dur);
      }

      const meta = document.createElement('div');
      meta.className = 'yt-meta';

      const h4 = document.createElement('h4');
      h4.className = 'yt-title';
      h4.textContent = title;
      meta.appendChild(h4);

      article.appendChild(thumbDiv);
      article.appendChild(meta);

      article.addEventListener('click', () => openModal(v.id, article));
      article.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(v.id, article);
        }
      });

      frag.appendChild(article);
    });

    gridEl.innerHTML = '';
    gridEl.appendChild(frag);
  };

  const showLoading = () => {
    const lang = getLang();
    const txt = lang === 'ar' ? 'جاري التحميل...' : 'Loading...';
    if (featuredEl) featuredEl.innerHTML = `<div class="loader">${txt}</div>`;
    if (gridEl) gridEl.innerHTML = `<div class="loader">${txt}</div>`;
  };

  const showError = (msg) => {
    const lang = getLang();
    const txt = msg || (lang === 'ar' ? 'خطأ في التحميل' : 'Loading error');
    if (featuredEl) featuredEl.innerHTML = `<div class="loader">${txt}</div>`;
    if (gridEl) gridEl.innerHTML = `<div class="loader">${txt}</div>`;
  };

  // ============================================
  // LOAD DATA
  // ============================================

  const loadVideos = async () => {
    showLoading();

    try {
      // Admin override from localStorage (used by /admin panel)
      let videos = null;
      try {
        const overrideRaw = localStorage.getItem('mf-admin-videos');
        if (overrideRaw) {
          const overrideParsed = JSON.parse(overrideRaw);
          if (Array.isArray(overrideParsed) && overrideParsed.length > 0) {
            videos = overrideParsed;
          }
        }
      } catch (overrideError) {
        console.warn('Invalid mf-admin-videos override:', overrideError);
      }

      // Detect if we're in a subfolder (en/) or root
      if (!videos) {
        const pathPrefix = window.location.pathname.includes('/en/') ? '../' : '';
        const res = await fetch(`${pathPrefix}data/videos.json`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        videos = await res.json();
      }
      if (!Array.isArray(videos) || !videos.length) {
        throw new Error('No videos');
      }

      // Sort by views DESC
      videos.sort((a, b) => (b.views || 0) - (a.views || 0));

      // Top 10
      const top10 = videos.slice(0, 10);

      // Featured = first
      const [featured, ...rest] = top10;
      
      renderFeatured(featured);
      renderGrid(rest);

      console.log(`✓ ${top10.length} videos loaded, sorted by views (top: ${formatViews(featured.views)})`);

    } catch (err) {
      console.error('Video load failed:', err);
      if (fallbackVideos.length) {
        const [featured, ...rest] = fallbackVideos;
        renderFeatured(featured);
        renderGrid(rest);
      } else {
        showError();
      }
    }
  };

  // ============================================
  // EVENTS
  // ============================================

  if (backdrop) backdrop.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // ============================================
  // INIT
  // ============================================

  loadVideos();

})();
