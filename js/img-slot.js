
export function imgOrSlot(filename, { alt = "", aspect = "1/1", icon = "🖼️", label = "Foto/ilustrasi", extraClass = "", extraStyle = "" } = {}) {
  const classAttr = `img-slot${extraClass ? " " + extraClass : ""}`;
  if (!filename) {
    return `<div class="${classAttr}" style="aspect-ratio:${aspect};${extraStyle}"><span>${icon} ${label}</span></div>`;
  }

  const isAbsoluteUrl = /^(https?:)?\/\//i.test(filename);
  const src = isAbsoluteUrl ? filename : `assets/images/${filename}`;

  return `<img class="${classAttr}" src="${src}" alt="${alt}"
    data-fallback-icon="${icon}" data-fallback-label="${label}" data-fallback-name="${filename}"
    data-fallback-aspect="${aspect}" data-fallback-style="${extraStyle}" data-fallback-class="${classAttr}"
    style="aspect-ratio:${aspect};object-fit:cover;border:none;padding:0;background:none;${extraStyle}" />`;
}

export function wireImageFallbacks(root = document) {
  root.querySelectorAll("img[data-fallback-name]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const div = document.createElement("div");
        div.className = img.dataset.fallbackClass;
        div.setAttribute("style", `aspect-ratio:${img.dataset.fallbackAspect};${img.dataset.fallbackStyle}`);
        div.innerHTML = `<span>${img.dataset.fallbackIcon} ${img.dataset.fallbackLabel}<br><strong>${img.dataset.fallbackName}</strong></span>`;
        img.replaceWith(div);
      },
      { once: true }
    );
  });
}