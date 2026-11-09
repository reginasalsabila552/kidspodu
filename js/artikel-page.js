import { getArticles, getArticleById } from "./data.js";

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderArticleContent(content) {
  content = content || "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (looksLikeHtml) return content;
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function formatTanggal(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

async function renderArtikelGrid() {
  const grid = document.getElementById("artikel-grid-full");
  if (!grid) return;

  let articles = [];
  try {
    articles = await getArticles(100);
  } catch (err) {
    console.error("Gagal memuat artikel:", err);
  }

  if (!articles.length) {
    grid.innerHTML = '<p class="artikel-empty">Belum ada artikel yang dipublikasikan. Cek lagi nanti ya!</p>';
    return;
  }

  grid.innerHTML = articles
    .map(
      (a) => `
    <article class="artikel-card">
      <img class="artikel-cover" src="${a.coverImageUrl || ""}" alt="${escapeHtml(a.title)}" loading="lazy" />
      <div class="artikel-body">
        <h3>${escapeHtml(a.title)}</h3>
        <p class="artikel-date">${formatTanggal(a.createdAt)}</p>
        <p class="excerpt">${escapeHtml(a.excerpt)}</p>
        <a class="artikel-readmore" href="/artikel-detail?id=${a.id}">Baca selengkapnya →</a>
      </div>
    </article>`
    )
    .join("");
}

async function renderArtikelDetail() {
  const wrap = document.getElementById("artikel-detail-content");
  if (!wrap) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    wrap.innerHTML = '<p class="artikel-loading">Artikel tidak ditemukan.</p>';
    return;
  }

  let article = null;
  try {
    article = await getArticleById(id);
  } catch (err) {
    console.error("Gagal memuat artikel:", err);
  }

  if (!article || article.published === false) {
    wrap.innerHTML = '<p class="artikel-loading">Artikel tidak ditemukan atau belum dipublikasikan.</p>';
    return;
  }

  document.title = `${article.title} — KidsPodu`;
  const pageTitleEl = document.getElementById("page-title");
  if (pageTitleEl) pageTitleEl.textContent = `${article.title} — KidsPodu`;

  const desc = article.excerpt || "Tips, cerita kegiatan, dan info seputar tumbuh kembang anak dari tim KidsPodu.";
  const url = `https://kidspodu.web.app/artikel-detail?id=${id}`;
  const img = article.coverImageUrl || "https://kidspodu.web.app/assets/images/logo.png";
  const setAttr = (elId, attr, value) => {
    const el = document.getElementById(elId);
    if (el) el.setAttribute(attr, value);
  };
  setAttr("page-description", "content", desc);
  setAttr("page-canonical", "href", url);
  setAttr("og-title", "content", article.title);
  setAttr("og-description", "content", desc);
  setAttr("og-url", "content", url);
  setAttr("og-image", "content", img);
  setAttr("twitter-title", "content", article.title);
  setAttr("twitter-description", "content", desc);
  setAttr("twitter-image", "content", img);

  wrap.innerHTML = `
    <h1>${escapeHtml(article.title)}</h1>
    <p class="artikel-date">${formatTanggal(article.createdAt)}</p>
    ${article.coverImageUrl ? `<img class="artikel-cover-full" src="${article.coverImageUrl}" alt="${escapeHtml(article.title)}" />` : ""}
    <div class="artikel-content">${renderArticleContent(article.content)}</div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderArtikelGrid();
  renderArtikelDetail();
});