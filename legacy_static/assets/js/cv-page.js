/* ========================================
   CV PAGE JAVASCRIPT
   - Scroll animations (IntersectionObserver)
   - Counter animations for stats
   ======================================== */

(function() {
  'use strict';

  // ========================================
  // INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  // ========================================

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };

  const fadeInObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        // Once animated, stop observing
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all fade-in elements
  function observeFadeInElements() {
    const fadeElements = document.querySelectorAll('.fade-in-element');
    fadeElements.forEach(function(el) {
      fadeInObserver.observe(el);
    });
  }

  // ========================================
  // COUNTER ANIMATION
  // ========================================

  function animateCounter(element, target, duration) {
    const start = 0;
    const increment = target / (duration / 16); // ~60fps
    let current = start;

    const timer = setInterval(function() {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      // Format number (handle decimals if needed)
      const displayValue = Math.floor(current);
      element.textContent = displayValue + (element.dataset.suffix || '+');
    }, 16);
  }

  // Observer for stats section
  function observeStatsSection() {
    const statsSection = document.getElementById('cv-stats');
    if (!statsSection) return;

    let hasAnimated = false;

    const statsObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          
          // Animate all counters
          const counters = statsSection.querySelectorAll('.cv-stat-number');
          counters.forEach(function(counter) {
            const target = parseInt(counter.dataset.target, 10);
            const hasSuffix = counter.textContent.includes('+');
            counter.dataset.suffix = hasSuffix ? '+' : '';
            
            // Duration: 1.5 seconds
            animateCounter(counter, target, 1500);
          });

          // Stop observing after animation
          statsObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    statsObserver.observe(statsSection);
  }

  // ========================================
  // SKILL BAR ANIMATION
  // ========================================

  function animateSkillBars() {
    const skillsSection = document.getElementById('cv-skills');
    if (!skillsSection) return;

    let hasAnimated = false;

    const skillsObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;

          const skillBars = skillsSection.querySelectorAll('.cv-skill-bar-fill');
          skillBars.forEach(function(bar, index) {
            // Stagger the animation
            setTimeout(function() {
              const width = bar.style.width;
              bar.style.width = '0';
              setTimeout(function() {
                bar.style.width = width;
              }, 50);
            }, index * 200);
          });

          skillsObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    skillsObserver.observe(skillsSection);
  }

  // ========================================
  // INITIALIZE
  // ========================================

  function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        observeFadeInElements();
        observeStatsSection();
        animateSkillBars();
      });
    } else {
      // DOM is already loaded
      observeFadeInElements();
      observeStatsSection();
      animateSkillBars();
    }
  }

  // Start initialization
  init();

})();
