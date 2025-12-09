(function initTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;

  const stored = localStorage.getItem("mf-theme");
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  }

  toggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("mf-theme", next);
  });
})();

(function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
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
  }, { threshold: 0.15 });
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
        el.style.width = value + "%";
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  fills.forEach(f => observer.observe(f));
})();

(function highlightNav() {
  const links = document.querySelectorAll(".nav-links a");
  if (!links.length) return;
  const path = window.location.pathname.split("/").pop() || "index.html";
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const normalized = href.split("/").pop();
    if (normalized === path) {
      link.classList.add("active");
    }
  });
})();
