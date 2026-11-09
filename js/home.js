import { getFounder, getTeamPreview, getTestimonials, getSosmed, getStats, getArticles, getTotalAnak } from "./data.js";
import { imgOrSlot, wireImageFallbacks } from "./img-slot.js";

function formatTanggal(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

async function renderTeamPreview() {
  const founderWrap = document.getElementById("founder-slot");
  const memberGrid = document.getElementById("member-grid");
  if (founderWrap) {
    const f = await getFounder();
    if (f) {
      founderWrap.innerHTML = `
        ${imgOrSlot(f.imageSlot, { alt: `${f.name1} & ${f.name2}`, aspect: "3/4", icon: "📷", label: "Foto founder" })}
        <h4>${f.name1}</h4>
        <h4>${f.name2}</h4>
        <blockquote>&ldquo;${f.quote}&rdquo;</blockquote>`;
      wireImageFallbacks(founderWrap);
    } else {
      founderWrap.innerHTML = `
        ${imgOrSlot("", { alt: "Foto founder", aspect: "3/4", icon: "📷", label: "Foto founder" })}
        <p class="team-empty-note">Profil founder belum diisi.</p>`;
    }
  }
  if (memberGrid) {
    const members = await getTeamPreview();
    if (!members.length) {
      memberGrid.innerHTML = '<p class="team-empty-note">Anggota tim belum ditambahkan.</p>';
      return;
    }
    memberGrid.innerHTML = members
      .map(
        (m) => `
      <div class="member-card">
        ${imgOrSlot(m.imageSlot, { alt: m.name, aspect: "3/4", extraClass: "member-photo", extraStyle: "font-size:9px;", label: "Foto" })}
        <strong>${m.name}</strong>
        ${m.role ? `<span class="member-role">${m.role}</span>` : ""}
      </div>`
      )
      .join("");
    wireImageFallbacks(memberGrid);
  }
}

async function renderTestimonials() {
  const track = document.querySelector(".testi-track");
  if (!track) return;
  const testimonials = await getTestimonials();
  if (!testimonials.length) {
    track.innerHTML = '<p class="artikel-empty">Belum ada testimoni yang dipublikasikan.</p>';
    return;
  }
  track.innerHTML = testimonials
    .filter((t) => t.screenshotUrl)
    .map(
      (t) => `
    <div class="testi-card">
      <button type="button" class="testi-shot-btn" data-full="${t.screenshotUrl}" aria-label="Perbesar tangkapan layar testimoni">
        <img class="testi-shot" src="${t.screenshotUrl}" alt="Tangkapan layar testimoni" loading="lazy" />
        <span class="testi-zoom-hint">🔍 Ketuk untuk memperbesar</span>
      </button>
    </div>`
    )
    .join("");
  initTestiLightbox();
}

let testiLightboxWired = false;
function initTestiLightbox() {
  const lightbox = document.getElementById("testi-lightbox");
  const lightboxImg = document.getElementById("testi-lightbox-img");
  const closeBtn = document.getElementById("testi-lightbox-close");
  if (!lightbox || !lightboxImg) return;

  const track = document.querySelector(".testi-track");
  const openLightbox = (url) => {
    lightboxImg.src = url;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxImg.src = "";
  };

  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".testi-shot-btn");
    if (!btn) return;
    openLightbox(btn.dataset.full);
  });

  if (!testiLightboxWired) {
    testiLightboxWired = true;
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
  }
}


const _loadedScripts = {};
function loadScriptOnce(src) {
  if (_loadedScripts[src]) return _loadedScripts[src];
  _loadedScripts[src] = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
  return _loadedScripts[src];
}

async function tiktokEmbedHtml(url) {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`oEmbed HTTP ${res.status}`);
    const data = await res.json();
    if (!data.html) throw new Error("oEmbed tanpa html");
    return data.html;
  } catch (err) {
    console.error("TikTok oEmbed gagal untuk", url, err);
    return `<a href="${url}" target="_blank" rel="noopener" class="sosmed-fallback-link">🎵 Lihat postingan ini di TikTok →</a>`;
  }
}

async function renderSosmed() {
  const igReelsGrid = document.getElementById("sosmed-grid-instagram-reels");
  const igFeedGrid = document.getElementById("sosmed-grid-instagram-feed");
  const ttGrid = document.getElementById("sosmed-grid-tiktok");
  if (!igReelsGrid || !igFeedGrid || !ttGrid) return;

  const sosmed = await getSosmed();

  const igCard = (post) => `
    <div class="sosmed-card sosmed-card--ig">
      <blockquote class="instagram-media" data-instgrm-permalink="${post.url}" data-instgrm-version="14">
        <a href="${post.url}" target="_blank" rel="noopener" class="sosmed-fallback-link">📸 Lihat postingan ini di Instagram →</a>
      </blockquote>
    </div>`;

  igReelsGrid.innerHTML = sosmed.instagramReels.length
    ? sosmed.instagramReels.map(igCard).join("")
    : '<p class="artikel-empty">Belum ada reels yang dipublikasikan.</p>';

  igFeedGrid.innerHTML = sosmed.instagramFeed.length
    ? sosmed.instagramFeed.map(igCard).join("")
    : '<p class="artikel-empty">Belum ada feed yang dipublikasikan.</p>';

  let ttHtml = '<p class="artikel-empty">Belum ada video yang dipublikasikan.</p>';
  const ttCards = [];
  if (sosmed.tiktok.length) {
    for (const post of sosmed.tiktok) {
      const embedHtml = await tiktokEmbedHtml(post.url);
      ttCards.push({ url: post.url, embedHtml });
      await new Promise((r) => setTimeout(r, 300));
    }
    ttHtml = ttCards
      .map((c) => `<div class="sosmed-card sosmed-card--tt" data-tt-url="${c.url.replace(/"/g, "&quot;")}">${c.embedHtml}</div>`)
      .join("");
  }
  ttGrid.innerHTML = ttHtml;

  loadScriptOnce("https://www.instagram.com/embed.js").then(() => {
    if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
  });

  loadScriptOnce("https://www.tiktok.com/embed.js");

  if (ttCards.length) retryFailedTiktokEmbeds(ttGrid, ttCards);
}

function retryFailedTiktokEmbeds(ttGrid, cards, attempt = 1) {
  const maxAttempts = 2;
  setTimeout(() => {
    const failedEls = Array.from(ttGrid.querySelectorAll(".sosmed-card--tt")).filter(
      (card) => !card.querySelector("iframe")
    );
    if (!failedEls.length) return;

    failedEls.forEach((card) => {
      const original = cards.find((c) => c.url === card.dataset.ttUrl);
      if (original) card.innerHTML = original.embedHtml;
    });

    const s = document.createElement("script");
    s.src = "https://www.tiktok.com/embed.js";
    s.async = true;
    document.body.appendChild(s);

    if (attempt < maxAttempts) retryFailedTiktokEmbeds(ttGrid, cards, attempt + 1);
  }, attempt * 3000);
}

function initSosmedTabs() {
  const tabs = document.querySelectorAll(".sosmed-tab");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;

      document.querySelectorAll(".sosmed-tab").forEach((t) => {
        const isActive = t.dataset.target === target;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      document.querySelectorAll(".sosmed-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === target);
        p.hidden = p.dataset.panel !== target;
      });
    });
  });
}

async function renderArtikelPreview() {
  const track = document.getElementById("artikel-track");
  const section = document.getElementById("artikel");
  if (!track || !section) return;

  let articles = [];
  try {
    articles = await getArticles(8);
  } catch (err) {
    console.error("Gagal memuat artikel:", err);
  }

  if (!articles.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  track.innerHTML = articles
    .map(
      (a) => `
    <article class="artikel-card">
      <img class="artikel-cover" src="${a.coverImageUrl || ""}" alt="${a.title}" loading="lazy" />
      <div class="artikel-body">
        <h3>${a.title}</h3>
        <p class="artikel-date">${formatTanggal(a.createdAt)}</p>
        <p class="excerpt">${a.excerpt}</p>
        <a class="artikel-readmore" href="/artikel-detail?id=${a.id}">Baca selengkapnya →</a>
      </div>
    </article>`
    )
    .join("");
}

function animateCount(el, target, duration = 1600) {
  if (!target) { el.textContent = "0"; return; }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString("id-ID");
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString("id-ID");
  }
  requestAnimationFrame(tick);
}

async function renderStudentCount() {
  const el = document.getElementById("hero-student-count");
  if (!el) return;
  const total = await getTotalAnak();

  if (!("IntersectionObserver" in window)) {
    animateCount(el, total);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) animateCount(el, total);
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(el);
}

async function renderStats() {
  const el = document.getElementById("stats-values");
  if (!el) return;
  const s = await getStats();
  el.querySelector('[data-stat="childrenHelped"]').textContent = s.childrenHelped;
  el.querySelector('[data-stat="programs"]').textContent = s.programs;
  el.querySelector('[data-stat="yearsExperience"]').textContent = s.yearsExperience;
}

document.addEventListener("DOMContentLoaded", () => {
  const renderTasks = [
    renderStudentCount(),
    renderTeamPreview(),
    renderTestimonials(),
    renderSosmed(),
    renderArtikelPreview(),
    renderStats(),
  ];
  initSosmedTabs();
  restoreHashScroll(renderTasks);
  revealBackground(renderTasks);
});

function revealBackground(renderTasks) {
  const show = () => document.body.classList.add("bg-ready");
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
  Promise.race([Promise.allSettled(renderTasks), timeout]).then(show);
}

function restoreHashScroll(renderTasks) {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const target = document.querySelector(hash);
  if (!target) return;

  Promise.allSettled(renderTasks).then(() => {
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  });
}