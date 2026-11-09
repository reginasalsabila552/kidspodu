
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initDropdown();
  initTestimonialCarousel();
  initArtikelCarousel();
  initHeaderScrollState();
  initSmoothAnchorScroll();
  initScrollSpy();
  initScrollReveal();
  initParallax();
});

function initHeaderScrollState() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
  });
}

function initDropdown() {
  document.querySelectorAll(".has-dropdown").forEach((item) => {
    const trigger = item.querySelector(".dropdown-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".has-dropdown.open").forEach((el) => el.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".has-dropdown")) {
      document.querySelectorAll(".has-dropdown.open").forEach((el) => el.classList.remove("open"));
    }
  });
}

function initTestimonialCarousel() {
  const track = document.querySelector(".testi-track");
  const prevBtn = document.querySelector(".testi-prev");
  const nextBtn = document.querySelector(".testi-next");
  if (!track || !prevBtn || !nextBtn) return;

  const scrollByCard = (direction) => {
    const card = track.querySelector(".testi-card");
    if (!card) return;
    const gap = 22;
    const amount = card.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  prevBtn.addEventListener("click", () => scrollByCard(-1));
  nextBtn.addEventListener("click", () => scrollByCard(1));
}

function initArtikelCarousel() {
  const track = document.getElementById("artikel-track");
  const prevBtn = document.querySelector(".artikel-prev");
  const nextBtn = document.querySelector(".artikel-next");
  if (!track || !prevBtn || !nextBtn) return;

  const scrollByCard = (direction) => {
    const card = track.querySelector(".artikel-card");
    if (!card) return;
    const gap = 22;
    const amount = card.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  prevBtn.addEventListener("click", () => scrollByCard(-1));
  nextBtn.addEventListener("click", () => scrollByCard(1));
}
function initSmoothAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute("href");
    if (!id || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector(".main-nav")?.classList.remove("open");
    });
  });
}

function initScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  if (!navLinks.length) return;

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
    if (window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
  };

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach((sec) => observer.observe(sec));
}

function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function initParallax() {
  const mascot = document.querySelector(".cta-banner .cta-mascot");
  if (!mascot) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const section = mascot.closest(".cta-banner");
  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    const shift = (progress - 0.5) * 26;
    mascot.style.setProperty("--parallax-y", `${shift.toFixed(1)}px`);
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
}