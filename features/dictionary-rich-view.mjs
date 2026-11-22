// "More detail" view: French definitions first (data/dictionary/fr), English help (data/dictionary/rich).
// Additive: it never changes the Stage A entry HTML. It appends a separate block under the answer.
const BASE = new URL("../data/dictionary/", import.meta.url);
const cache = new Map();

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export function shardLetter(word) {
  const letter = String(word || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()[0] || "_";
  return /[a-z]/.test(letter) ? letter : "_";
}

export async function loadLayerEntry(layer, word, fetchImpl = globalThis.fetch) {
  const key = String(word || "").toLocaleLowerCase("fr");
  if (!key || typeof fetchImpl !== "function") return null;
  const letter = shardLetter(key);
  const id = layer + "/" + letter;
  if (!cache.has(id)) {
    cache.set(id, fetchImpl(new URL(layer + "/" + letter + ".json", BASE).href).then(res => {
      if (!res.ok) throw new Error(id + " HTTP " + res.status);
      return res.json();
    }).catch(error => { cache.delete(id); throw error; }));
  }
  const shard = await cache.get(id);
  return Object.hasOwn(shard, key) ? shard[key] : null;
}

// kept for compatibility with the earlier English-only view
export const loadRichEntry = (word, fetchImpl) => loadLayerEntry("rich", word, fetchImpl);

const SENSITIVE = new Set(["vulgar", "offensive", "derogatory", "slur", "pejorative"]);
const isSensitive = sense => Array.isArray(sense.reg) && sense.reg.some(tag => SENSITIVE.has(String(tag).toLowerCase()));

export function countSensitive(entry) {
  return (entry?.groups || []).reduce((n, g) => n + (g.senses || []).filter(isSensitive).length, 0);
}
const countSensitiveFr = entry => (entry?.groups || []).reduce((n, g) => n + (g.senses || []).filter(s => s.sens).length, 0);

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
    const forms = group.forms ? Object.entries(group.forms).filter(([, list]) => list?.length).map(([name, list]) => escapeHtml(name) + ": " + escapeHtml(list.join(", "))).join(" \u00b7 ") : "";
    const head = escapeHtml(group.pos || "") + (group.gender ? " (" + escapeHtml(group.gender) + ")" : "");
    return '<section class="fi-pos-group"><h4>' + head + "</h4>" +
      (senses.length ? "<ol>" + senses.map(senseHtml).join("") + "</ol>" : '<p class="fi-muted">Only vulgar or offensive senses exist for this part of speech.</p>') +
      (forms ? '<p class="fi-muted">' + forms + "</p>" : "") +
      (group.collocations?.length ? '<p class="fi-muted">Collocations: ' + escapeHtml(group.collocations.join(", ")) + "</p>" : "") +
      (group.etymology ? '<p class="fi-muted">Etymology: ' + escapeHtml(group.etymology) + "</p>" : "") + "</section>";
  }).join("");
  const toggle = hidden ? '<p><label><input type="checkbox" data-firich-sensitive' + (showSensitive ? " checked" : "") + "> Show " + hidden + " vulgar or offensive sense" + (hidden === 1 ? "" : "s") + " (labelled)</label></p>" : "";
  return '<div class="fi-rich-detail" lang="en">' +
    (entry.ipa ? '<p class="fi-muted">Pronunciation: ' + escapeHtml(entry.ipa) + "</p>" : "") + groups +
    (entry.phrases?.length ? "<p><b>Phrases:</b> " + escapeHtml(entry.phrases.join(" \u00b7 ")) + "</p>" : "") +
    (entry.related?.length ? "<p><b>Related words:</b> " + escapeHtml(entry.related.join(", ")) + "</p>" : "") +
    toggle + '<span class="fi-tag">Wiktionary-derived \u00b7 not yet reviewed by a French speaker</span></div>';
}

// ---- French view ----
const POS_FR = { noun: "nom", verb: "verbe", adjective: "adjectif", adverb: "adverbe", interjection: "interjection", preposition: "pr\u00e9position", conjunction: "conjonction", pronoun: "pronom", determiner: "d\u00e9terminant", numeral: "num\u00e9ral", "proper noun": "nom propre", phrase: "locution", particle: "particule", onomatopoeia: "onomatop\u00e9e" };
const GENDER_FR = { m: "masculin", f: "f\u00e9minin", mf: "masculin et f\u00e9minin" };
const FORM_FR = { plural: "pluriel", feminine: "f\u00e9minin" };
const posFr = group => (POS_FR[group.pos] || group.pos || "") + (group.pos === "noun" && group.gender ? " " + GENDER_FR[group.gender] : "");

function senseFrHtml(sense) {
  const labels = [...(sense.reg || []), ...(sense.gram || []), ...(sense.ctx || [])].filter(Boolean);
  const tag = labels.length ? '<span class="fi-tag">(' + escapeHtml(labels.join(", ")) + ")</span> " : "";
  const examples = (sense.ex || []).map(ex => '<div class="fi-muted"><i>\u00ab\u202f' + escapeHtml(ex.t) + "\u202f\u00bb</i>" + (ex.s ? " \u2014 " + escapeHtml(ex.s) : "") + "</div>").join("");
  return "<li>" + tag + escapeHtml(sense.d) + examples + "</li>";
}

export function renderFrenchHtml(word, entry, { showSensitive = false } = {}) {
  if (!entry) return '<div class="fi-muted" lang="fr">Pas encore de d\u00e9finition en fran\u00e7ais pour <b>' + escapeHtml(word) + "</b>.</div>";
  const hidden = countSensitiveFr(entry);
  const list = (label, items) => items?.length ? '<p class="fi-muted">' + label + " : " + escapeHtml(items.join(", ")) + "</p>" : "";
  const groups = (entry.groups || []).map(group => {
    const senses = (group.senses || []).filter(sense => showSensitive || !sense.sens);
    const forms = group.forms ? Object.entries(group.forms).filter(([, items]) => items?.length).map(([name, items]) => (FORM_FR[name] || name) + " : " + escapeHtml(items.join(", "))).join(" \u00b7 ") : "";
    return '<section class="fi-pos-group"><h4>' + escapeHtml(posFr(group)) + "</h4>" +
      (senses.length ? "<ol>" + senses.map(senseFrHtml).join("") + "</ol>" : '<p class="fi-muted">Seuls des sens vulgaires ou injurieux existent pour cette cat\u00e9gorie.</p>') +
      (forms ? '<p class="fi-muted">' + forms + "</p>" : "") +
      list("Synonymes", group.syn) + list("Antonymes", group.ant) +
      (group.etymology ? '<p class="fi-muted">\u00c9tymologie : ' + escapeHtml(group.etymology) + "</p>" : "") + "</section>";
  }).join("");
  const toggle = hidden ? '<p><label><input type="checkbox" data-firich-sensitive' + (showSensitive ? " checked" : "") + "> Afficher les sens vulgaires ou injurieux (signal\u00e9s)</label></p>" : "";
  return '<div class="fi-rich-detail" lang="fr">' +
    (entry.ipa ? '<p class="fi-muted">Prononciation : ' + escapeHtml(entry.ipa) + "</p>" : "") + groups +
    (entry.prov?.length ? "<p><b>Expressions et proverbes :</b> " + escapeHtml(entry.prov.join(" \u00b7 ")) + "</p>" : "") +
    (entry.derived?.length ? "<p><b>Mots d\u00e9riv\u00e9s :</b> " + escapeHtml(entry.derived.join(", ")) + "</p>" : "") +
    (entry.related?.length ? "<p><b>Mots apparent\u00e9s :</b> " + escapeHtml(entry.related.join(", ")) + "</p>" : "") +
    (entry.paro?.length ? "<p><b>\u00c0 ne pas confondre :</b> " + escapeHtml(entry.paro.join(", ")) + "</p>" : "") +
    toggle + '<span class="fi-tag">Source : Wiktionnaire (CC BY-SA) \u00b7 pas encore relu par un francophone</span></div>';
}

// ---- switch between French, English, both ----
const MODES = [["fr", "Fran\u00e7ais"], ["en", "English"], ["both", "Les deux"]];
export function renderDetailHtml(word, data, { mode = "fr", showSensitive = false } = {}) {
  const switcher = '<div class="fi-row" role="group" aria-label="Langue des d\u00e9finitions">' + MODES.map(([id, label]) =>
    '<button type="button" class="g" data-firich-mode="' + id + '" aria-pressed="' + (mode === id) + '"' + (mode === id ? ' style="outline:2px solid currentColor"' : "") + ">" + label + "</button>").join("") + "</div>";
  const fr = () => renderFrenchHtml(word, data.fr, { showSensitive });
  const en = () => renderRichHtml(word, data.en, { showSensitive });
  let body;
  if (mode === "en") body = en();
  else if (mode === "both") body = fr() + en();
  else body = data.fr ? fr() : (data.en ? '<div class="fi-muted" lang="fr">Pas de d\u00e9finition en fran\u00e7ais pour ce mot pour le moment. Voici l\u2019aide en anglais.</div>' + en() : fr());
  return switcher + body;
}

const MODE_KEY = "fi-dict-detail-mode";
const readMode = () => { try { const m = globalThis.localStorage?.getItem(MODE_KEY); return MODES.some(([id]) => id === m) ? m : "fr"; } catch { return "fr"; } };
const saveMode = mode => { try { globalThis.localStorage?.setItem(MODE_KEY, mode); } catch { /* optional convenience */ } };

export function attachRichDetail(container, word, fetchImpl = globalThis.fetch) {
  if (!container || !word) return null;
  const host = container.ownerDocument.createElement("div");
  host.className = "fi-rich-host";
  host.innerHTML = '<button type="button" class="g" data-firich-open>Plus de d\u00e9tails</button><div data-firich-body></div>';
  container.appendChild(host);
  const body = host.querySelector("[data-firich-body]");
  const button = host.querySelector("[data-firich-open]");
  let data, loaded = false, showSensitive = false, mode = readMode();
  const paint = () => { body.innerHTML = renderDetailHtml(word, data, { mode, showSensitive }); };
  button.addEventListener("click", async () => {
    if (loaded) { body.hidden = !body.hidden; button.textContent = body.hidden ? "Plus de d\u00e9tails" : "Masquer les d\u00e9tails"; return; }
    button.disabled = true; button.textContent = "Chargement\u2026";
    try {
      const [fr, en] = await Promise.all([
        loadLayerEntry("fr", word, fetchImpl).catch(() => null),
        loadLayerEntry("rich", word, fetchImpl).catch(() => null)
      ]);
      if (fr === null && en === null) {
        // distinguish "no entry" from "could not load": retry one shard to see whether the network works
        await loadLayerEntry("fr", word, fetchImpl);
      }
      data = { fr, en }; loaded = true; paint(); button.textContent = "Masquer les d\u00e9tails";
    } catch {
      body.innerHTML = '<div class="fi-muted">Impossible de charger les d\u00e9tails. V\u00e9rifiez votre connexion et r\u00e9essayez.</div>'; button.textContent = "Plus de d\u00e9tails";
    }
    button.disabled = false;
  });
  body.addEventListener("click", event => {
    const mode_ = event.target?.closest?.("[data-firich-mode]")?.getAttribute("data-firich-mode");
    if (mode_ && mode_ !== mode) { mode = mode_; saveMode(mode); paint(); }
  });
  body.addEventListener("change", event => {
    if (event.target?.hasAttribute?.("data-firich-sensitive")) { showSensitive = event.target.checked; paint(); }
  });
  return host;
}