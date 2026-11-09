
export function wrapSelectionInTextarea(textarea, marker) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const hasSelection = end > start;
  const selected = hasSelection ? val.slice(start, end) : "teks";
  const insert = marker + selected + marker;
  textarea.value = val.slice(0, start) + insert + val.slice(end);
  textarea.focus();
  textarea.setSelectionRange(start + marker.length, start + marker.length + selected.length);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

export function toggleBulletInTextarea(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = val.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = val.length;
  const block = val.slice(lineStart, lineEnd);
  const newBlock = block.split("\n").map((l) => (/^\s*[-*]\s/.test(l) ? l : `- ${l}`)).join("\n");
  textarea.value = val.slice(0, lineStart) + newBlock + val.slice(lineEnd);
  textarea.focus();
  textarea.setSelectionRange(lineStart, lineStart + newBlock.length);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

export function attachRichTextToolbar(toolbar, textarea) {
  if (!toolbar || !textarea) return;
  toolbar.querySelectorAll("[data-wrap]").forEach((btn) => {
    btn.addEventListener("click", () => wrapSelectionInTextarea(textarea, btn.dataset.wrap));
  });
  const bulletBtn = toolbar.querySelector("[data-bullet]");
  if (bulletBtn) bulletBtn.addEventListener("click", () => toggleBulletInTextarea(textarea));
}
