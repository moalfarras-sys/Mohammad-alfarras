(function initTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;

  // Initialize theme from localStorage or system preference
  const initializeTheme = () => {
    const stored = localStorage.getItem("mf-theme");
    let theme = "dark"; // default to dark

    if (stored === "dark" || stored === "light") {
      theme = stored;
    } else if (!stored) {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      theme = prefersDark.matches ? "dark" : "light";
    }

    root.setAttribute("data-theme", theme);
    localStorage.setItem("mf-theme", theme);
  };

  initializeTheme();

  // Toggle theme with smooth transition
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    
    // Add transition animation
    document.body.style.transition = "background-color 0.6s ease, color 0.6s ease";
    
    root.setAttribute("data-theme", next);
    localStorage.setItem("mf-theme", next);
    
    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addListener((e) => {
      if (!localStorage.getItem("mf-theme")) {
        const theme = e.matches ? "dark" : "light";
        root.setAttribute("data-theme", theme);
      }
    });
  }
})();

(function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
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
