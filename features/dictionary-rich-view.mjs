// Stage C: "More detail" view for the rich dictionary layer (data/dictionary/rich/<letter>.json).
// Additive: it never changes the Stage A entry HTML. It appends a separate block under the answer.
const SHARD_BASE = new URL("../data/dictionary/rich/", import.meta.url);
const cache = new Map();

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export function shardLetter(word) {
  const letter = String(word || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()[0] || "_";
  return /[a-z]/.test(letter) ? letter : "_";
}

export async function loadRichEntry(word, fetchImpl = globalThis.fetch) {
  const key = String(word || "").toLocaleLowerCase("fr");
  if (!key || typeof fetchImpl !== "function") return null;
  const letter = shardLetter(key);
  if (!cache.has(letter)) {
    cache.set(letter, fetchImpl(new URL(letter + ".json", SHARD_BASE).href).then(res => {
      if (!res.ok) throw new Error("rich shard " + letter + " HTTP " + res.status);
      return res.json();
    }).catch(error => { cache.delete(letter); throw error; }));
  }
  const shard = await cache.get(letter);
  return Object.hasOwn(shard, key) ? shard[key] : null;
}

const SENSITIVE = new Set(["vulgar", "offensive", "derogatory", "slur", "pejorative"]);
const isSensitive = sense => Array.isArray(sense.reg) && sense.reg.some(tag => SENSITIVE.has(String(tag).toLowerCase()));

export function countSensitive(entry) {
  return (entry?.groups || []).reduce((n, g) => n + (g.senses || []).filter(isSensitive).length, 0);
}

function senseHtml(sense) {
  const labels = [...(sense.reg || []), ...(sense.ctx ? [].concat(sense.ctx) : [])].filter(Boolean);
  const tag = labels.length ? '<span class="fi-tag">(' + escapeHtml(labels.join(", ")) + ")</span> " : "";
  const topic = sense.topic?.length ? ' <span class="fi-muted">[' + escapeHtml([].concat(sense.topic).join(", ")) + "]</span>" : "";
  const examples = (sense.ex || []).map(ex => '<div class="fi-muted"><i>' + escapeHtml(ex.fr) + "</i>" + (ex.en ? " \u2014 " + escapeHtml(ex.en) : "") + "</div>").join("");
  const syn = sense.syn?.length ? '<div class="fi-muted">Synonyms: ' + escapeHtml(sense.syn.join(", ")) + "</div>" : "";
  const ant = sense.ant?.length ? '<div class="fi-muted">Antonyms: ' + escapeHtml(sense.ant.join(", ")) + "</div>" : "";
  return "<li>" + tag + escapeHtml(sense.d) + topic + examples + syn + ant + "</li>";
}

export function renderRichHtml(word, entry, { showSensitive = false } = {}) {
  if (!entry) return '<div class="fi-muted">No extended entry is available for <b>' + escapeHtml(word) + "</b> yet.</div>";
  const hidden = countSensitive(entry);
  const groups = (entry.groups || []).map(group => {
    const senses = (group.senses || []).filter(sense => showSensitive || !isSensitive(sense));
    const forms = group.forms ? Object.entries(group.forms).filter(([, list]) => list?.length).map(([name, list]) => escapeHtml(name) + ": " + escapeHtml(list.join(" \u00b7 "))).join(" \u00b7 ") : "";
    const head = escapeHtml(group.pos || "") + (group.gender ? " (" + escapeHtml(group.gender) + ")" : "");
    return '<section class="fi-pos-group"><h4>' + head + "</h4>" +
      (senses.length ? "<ol>" + senses.map(senseHtml).join("") + "</ol>" : '<p class="fi-muted">Only vulgar or offensive senses exist for this part of speech.</p>') +
      (forms ? '<p class="fi-muted">' + forms + "</p>" : "") +
      (group.collocations?.length ? '<p class="fi-muted">Collocations: ' + escapeHtml(group.collocations.join(", ")) + "</p>" : "") +
      (group.etymology ? '<p class="fi-muted">Etymology: ' + escapeHtml(group.etymology) + "</p>" : "") + "</section>";
  }).join("");
  const toggle = hidden ? '<p><label><input type="checkbox" data-firich-sensitive' + (showSensitive ? " checked" : "") + "> Show " + hidden + " vulgar or offensive sense" + (hidden === 1 ? "" : "s") + " (labelled)</label></p>" : "";
  return '<div class="fi-rich-detail">' +
    (entry.ipa ? '<p class="fi-muted">Pronunciation: ' + escapeHtml(entry.ipa) + "</p>" : "") + groups +
    (entry.phrases?.length ? "<p><b>Phrases:</b> " + escapeHtml(entry.phrases.join(" \u00b7 ")) + "</p>" : "") +
    (entry.related?.length ? "<p><b>Related words:</b> " + escapeHtml(entry.related.join(", ")) + "</p>" : "") +
    toggle + '<span class="fi-tag">Wiktionary-derived \u00b7 not yet reviewed by a French speaker</span></div>';
}

export function attachRichDetail(container, word, fetchImpl = globalThis.fetch) {
  if (!container || !word) return null;
  const host = container.ownerDocument.createElement("div");
  host.className = "fi-rich-host";
  host.innerHTML = '<button type="button" class="g" data-firich-open>More detail</button><div data-firich-body></div>';
  container.appendChild(host);
  const body = host.querySelector("[data-firich-body]");
  const button = host.querySelector("[data-firich-open]");
  let entry, loaded = false, showSensitive = false;
  const paint = () => { body.innerHTML = renderRichHtml(word, entry, { showSensitive }); };
  button.addEventListener("click", async () => {
    if (loaded) { body.hidden = !body.hidden; button.textContent = body.hidden ? "More detail" : "Hide detail"; return; }
    button.disabled = true; button.textContent = "Loading\u2026";
    try { entry = await loadRichEntry(word, fetchImpl); loaded = true; paint(); button.textContent = "Hide detail"; }
    catch { body.innerHTML = '<div class="fi-muted">Extended detail could not be loaded. Check your connection and try again.</div>'; button.textContent = "More detail"; }
    button.disabled = false;
  });
  body.addEventListener("change", event => {
    if (event.target?.hasAttribute?.("data-firich-sensitive")) { showSensitive = event.target.checked; paint(); }
  });
  return host;
}