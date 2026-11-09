
export function collapseLetterSpacing(text) {
  if (!text) return text;
  return text
    .split("\n")
    .map((line) => {
      const tokens = line.split(" ");
      const out = [];
      let run = [];
      const flushRun = () => {
        if (run.length >= 4) out.push(run.join(""));
        else out.push(...run);
        run = [];
      };
      tokens.forEach((tok) => {
        if (tok.length === 1 && tok !== "-" && tok !== "*") {
          run.push(tok);
        } else {
          flushRun();
          out.push(tok);
        }
      });
      flushRun();
      return out.join(" ").replace(/ {2,}/g, " ");
    })
    .join("\n");
}

export function tokenizeInline(line) {
  const segments = [];
  const regex = /\*([^*\n]+)\*|_([^_\n]+)_/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(line))) {
    if (m.index > lastIndex) segments.push({ text: line.slice(lastIndex, m.index) });
    if (m[1] !== undefined) segments.push({ text: m[1], bold: true });
    else segments.push({ text: m[2], italic: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) segments.push({ text: line.slice(lastIndex) });
  return segments.filter((s) => s.text.length);
}

export function parseRichText(rawText) {
  const text = collapseLetterSpacing((rawText || "").trim());
  if (!text) return [];
  return text.split("\n").map((raw) => {
    const bulletMatch = raw.match(/^\s*[-*]\s+(.*)$/);
    const bullet = !!bulletMatch;
    const line = bullet ? bulletMatch[1] : raw;
    return { bullet, empty: line.trim() === "", segments: tokenizeInline(line) };
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function richTextToHtml(rawText) {
  const lines = parseRichText(rawText);
  if (!lines.length) return "<p>—</p>";

  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) { html += "</ul>"; inList = false; }
  };

  lines.forEach((line) => {
    if (line.empty) { closeList(); return; }
    const inner = line.segments
      .map((s) => {
        const t = escapeHtml(s.text);
        if (s.bold) return `<strong>${t}</strong>`;
        if (s.italic) return `<em>${t}</em>`;
        return t;
      })
      .join("");
    if (line.bullet) {
      if (!inList) { html += '<ul style="margin:0 0 10px 18px;padding:0;list-style:disc;font-size:13.5px;color:var(--ink);line-height:1.6;">'; inList = true; }
      html += `<li style="margin-bottom:4px;font-size:inherit;color:inherit;line-height:inherit;">${inner}</li>`;
    } else {
      closeList();
      html += `<p style="margin:0 0 10px;font-size:13.5px;color:var(--ink);line-height:1.6;">${inner}</p>`;
    }
  });
  closeList();
  return html || "<p>—</p>";
}