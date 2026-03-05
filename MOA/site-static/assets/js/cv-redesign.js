/* ========================================
   CV REDESIGN - INTERACTIVE ANIMATIONS
   ======================================== */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    counterDuration: 1500, // milliseconds
    revealThreshold: 0.1,
    revealRootMargin: '0px 0px -50px 0px',
    skillsThreshold: 0.2,
    skillsStaggerDelay: 100 // milliseconds
  };

  // ========================================
  // 1. SCROLL REVEAL ANIMATIONS
  // ========================================

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin
    }
  );

  // Observe all reveal elements
  function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal-element');
    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  }

  // ========================================
  // 2. COUNTER ANIMATIONS FOR STATS
  // ========================================

  function animateCounter(element, target, suffix = '', duration = CONFIG.counterDuration) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * target);

      element.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // Observe stats section for counter trigger
  function initCounterAnimations() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;

    let hasAnimated = false;

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;

            const counters = entry.target.querySelectorAll('.cv-stat-number');
            counters.forEach((counter, index) => {
              const target = parseInt(counter.dataset.target, 10);
              const suffix = counter.dataset.suffix || '';

              if (!isNaN(target)) {
                // Add slight delay for sequential effect
                setTimeout(() => {
                  animateCounter(counter, target, suffix);
                }, index * 150);
              }
            });

            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    statsObserver.observe(statsSection);
  }

  // ========================================
  // 3. SKILL BAR ANIMATIONS
  // ========================================

  function animateSkillBars(bars, isLanguageBar = false) {
    bars.forEach((bar, index) => {
      setTimeout(() => {
        const width = isLanguageBar
          ? getComputedStyle(bar.parentElement).getPropertyValue('--lang-width')
          : getComputedStyle(bar.parentElement).getPropertyValue('--skill-width');

        if (width) {
          bar.style.width = width.trim();
        }
      }, index * CONFIG.skillsStaggerDelay);
    });
  }

  function initSkillAnimations() {
    const skillsSection = document.getElementById('skills');
    if (!skillsSection) return;

    let hasAnimated = false;

    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;

            const skillBars = entry.target.querySelectorAll('.cv-skill-fill');
            animateSkillBars(skillBars, false);

            skillsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: CONFIG.skillsThreshold }
    );

    skillsObserver.observe(skillsSection);
  }

  // ========================================
  // 4. LANGUAGE BAR ANIMATIONS
  // ========================================

  function initLanguageAnimations() {
    const languagesSection = document.getElementById('languages');
    if (!languagesSection) return;

    let hasAnimated = false;

    const languagesObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;

            const langBars = entry.target.querySelectorAll('.cv-lang-fill');
            animateSkillBars(langBars, true);

            languagesObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: CONFIG.skillsThreshold }
    );

    languagesObserver.observe(languagesSection);
  }

  // ========================================
  // 5. TIMELINE ACCORDION (OPTIONAL)
  // ========================================

  function initTimelineAccordion() {
    const timelineItems = document.querySelectorAll('.cv-timeline-item');

    timelineItems.forEach(item => {
      const content = item.querySelector('.cv-timeline-content');
      if (!content) return;

      // Store original max-height
      const originalHeight = content.scrollHeight;

      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on a link
        if (e.target.tagName === 'A') return;

        const isExpanded = item.classList.contains('expanded');

        if (isExpanded) {
          item.classList.remove('expanded');
          content.style.maxHeight = null;
        } else {
          item.classList.add('expanded');
          content.style.maxHeight = originalHeight + 'px';
        }
      });
    });
  }

  // ========================================
  // 6. SMOOTH SCROLL TO SECTIONS
  // ========================================

  function initSmoothScroll() {
    // Find all anchor links that point to sections
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '') return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();

          // Calculate offset for fixed navbar
          const navbar = document.querySelector('.navbar');
          const offset = navbar ? navbar.offsetHeight + 20 : 80;

          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ========================================
  // 7. PERFORMANCE MONITORING
  // ========================================

  function logPerformanceMetrics() {
    if (!window.performance || !window.console) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;
        const renderTime = perfData.domComplete - perfData.domLoading;

        console.log('🚀 CV Page Performance Metrics:');
        console.log(`  ⏱ Total Load Time: ${pageLoadTime}ms`);
        console.log(`  🌐 Connection Time: ${connectTime}ms`);
        console.log(`  🎨 Render Time: ${renderTime}ms`);
      }, 0);
    });
  }

  // ========================================
  // 8. INITIALIZATION
  // ========================================

  function init() {
    // Check if we're on the CV redesign page
    const isCVPage = document.querySelector('.cv-redesign-page');
    if (!isCVPage) return;

    // Initialize all animations
    initRevealAnimations();
    initCounterAnimations();
    initSkillAnimations();
    initLanguageAnimations();
    // initTimelineAccordion(); // Uncomment if accordion functionality is desired
    initSmoothScroll();

    // Log performance in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      logPerformanceMetrics();
    }

    // Add loaded class for any additional CSS transitions
    document.body.classList.add('cv-loaded');
  }

  // ========================================
  // 9. ERROR HANDLING
  // ========================================

  window.addEventListener('error', (e) => {
    console.error('CV Page Error:', e.message);
  });

  // ========================================
  // 10. EXECUTE ON DOM READY
  // ========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ========================================
  // 11. EXPOSE API FOR DEBUGGING
  // ========================================

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.cvRedesignDebug = {
      reinitAnimations: init,
      config: CONFIG
    };
  }

})();
