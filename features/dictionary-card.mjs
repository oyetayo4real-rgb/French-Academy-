// Stage D: French-first short card for imported dictionary entries.
// The English glosses (Stage A data) stay; labels are French and a French "En bref" line is added
// from the French layer (data/dictionary/fr) once it has loaded.
import { loadLayerEntry } from "./dictionary-rich-view.mjs";

const POS_FR = { noun: "nom", verb: "verbe", adjective: "adjectif", adverb: "adverbe", interjection: "interjection", preposition: "pr\u00e9position", conjunction: "conjonction", pronoun: "pronom", determiner: "d\u00e9terminant", numeral: "num\u00e9ral", "proper noun": "nom propre", phrase: "locution", particle: "particule", onomatopoeia: "onomatop\u00e9e" };
const GENDER_FR = { m: "masculin", f: "f\u00e9minin", mf: "masculin et f\u00e9minin" };

export const posLabelFr = pos => POS_FR[String(pos || "").toLowerCase()] || String(pos || "");

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const validForm = value => /^[\p{L}]+(?:[-'\u2019][\p{L}]+)*$/u.test(String(value || ""));

export function renderImportedCardHtml(d) {
  const esc = escapeHtml;
  const matches = Array.isArray(d.matches) && d.matches.length > 1 ? d.matches : [d];
  return '<div class="fi-answer fi-imported-dictionary">' + matches.map(item => {
    const groups = Array.isArray(item.posGroups) && item.posGroups.length ? item.posGroups : [{ pos: item.part, meanings: (item.senses || []).map(s => ({ meaning: s.meaning, register: s.label || "neutral" })), forms: item.forms || { feminine: [], plural: [] } }];
    const headword = String(item.word || d.word || "").toLocaleLowerCase("fr");
    const groupHtml = groups.map(group => {
      const legacySenses = Array.isArray(group.senses) ? group.senses : (Array.isArray(item.senses) ? item.senses : []);
      const rawMeanings = Array.isArray(group.meanings) && group.meanings.length ? group.meanings : legacySenses;
      const meanings = rawMeanings.map(s => typeof s === "string"
        ? { meaning: s, register: "neutral" }
        : { meaning: s?.meaning || s?.gloss || "", register: s?.register || s?.label || "neutral" }).filter(s => s.meaning).slice(0, 3);
      const meaningHtml = meanings.length ? "<ol>" + meanings.map(s => {
        const register = s.register && s.register !== "neutral" ? '<span class="fi-tag">(' + esc(s.register) + ")</span> " : "";
        return "<li>" + register + esc(s.meaning) + "</li>";
      }).join("") + "</ol>" : ((item.meaning || d.meaning) ? "<p>" + esc(item.meaning || d.meaning) + "</p>" : "");
      const pos = String(group.pos || item.part || d.part || "").toLocaleLowerCase("fr");
      const forms = group.forms || item.forms || {};
      const isVerb = pos === "verb";
      const isNoun = pos === "noun";
      const showForms = isNoun || pos === "adjective";
      const plural = showForms ? (forms.plural || []).filter(validForm) : [];
      // a "feminine" form identical to the headword or to a plural form is a data artefact (merde -> merdes)
      const feminine = showForms ? (forms.feminine || []).filter(v => validForm(v) && String(v).toLocaleLowerCase("fr") !== headword && !plural.includes(v)) : [];
      const gender = isNoun ? (group.gender || item.gender || d.gender || "") : "";
      return '<section class="fi-pos-group"><h4>' + esc(posLabelFr(group.pos || item.part || d.part || "Part of speech")) + "</h4>" +
        (gender && GENDER_FR[gender] ? '<p class="fi-muted">Genre : ' + esc(GENDER_FR[gender]) + "</p>" : "") +
        meaningHtml +
        (isVerb ? '<p class="fi-muted">Voir l\u2019outil de conjugaison (Conjugate) pour les formes.</p>' : "") +
        (feminine.length ? '<p class="fi-muted">F\u00e9minin : ' + esc(feminine.join(", ")) + "</p>" : "") +
        (plural.length ? '<p class="fi-muted">Pluriel : ' + esc(plural.join(", ")) + "</p>" : "") + "</section>";
    }).join("");
    return '<section class="fi-imported-entry"><h3>' + esc(item.word || d.word) + "</h3>" + '<div data-fi-brief></div>' + groupHtml +
      '<span class="fi-tag">' + (item.importedStatus === "curated-draft" ? "Brouillon \u00b7 \u00e0 faire relire par un francophone" : "Entr\u00e9e import\u00e9e \u00b7 pas encore relue") + '</span><p style="font-size:.85em">Sources : <a href="https://en.wiktionary.org/wiki/' + encodeURIComponent(String(item.word || d.word)) + '?action=history" target="_blank" rel="noopener noreferrer">Wiktionary</a> (CC BY-SA 4.0) \u00b7 <a href="https://fr.wiktionary.org/wiki/' + encodeURIComponent(String(item.word || d.word)) + '?action=history" target="_blank" rel="noopener noreferrer">Wiktionnaire</a> (CC BY-SA 3.0)</p></section>';
  }).join("") + "</div>";
}

const cut = (text, max) => { const t = String(text || ""); return t.length > max ? t.slice(0, max - 1).replace(/[\s,;:]+\S*$/, "") + "\u2026" : t; };

export function renderBriefHtml(entry) {
  if (!entry || !Array.isArray(entry.groups) || !entry.groups.length) return "";
  const seen = new Set();
  const lines = entry.groups.map(group => {
    const sense = (group.senses || [])[0];
    if (!sense || !sense.d) return "";
    const label = group.pos === "noun" && group.gender && GENDER_FR[group.gender] ? posLabelFr("noun") + " " + GENDER_FR[group.gender] : posLabelFr(group.pos);
    const tags = [...(sense.reg || []), ...(sense.ctx || [])].filter(Boolean).slice(0, 3);
    if (seen.has(label)) return "";
    seen.add(label);
    return "<li><b>" + escapeHtml(label) + "</b> \u2014 " + (tags.length ? '<span class="fi-tag">(' + escapeHtml(tags.join(", ")) + ")</span> " : "") + escapeHtml(cut(sense.d, 140)) + "</li>";
  }).filter(Boolean).slice(0, 4);
  if (!lines.length) return "";
  return '<div lang="fr"><p class="fi-muted"><b>En bref (fran\u00e7ais)</b></p><ul>' + lines.join("") + "</ul></div>";
}

export async function attachFrenchBrief(container, word, fetchImpl = globalThis.fetch) {
  try {
    if (!container || !word) return;
    let entry;
    try { entry = await loadLayerEntry("fr", word, fetchImpl); }
    catch { await new Promise(resolve => setTimeout(resolve, 2500)); entry = await loadLayerEntry("fr", word, fetchImpl); }
    const html = renderBriefHtml(entry);
    if (!html) return;
    for (const section of container.querySelectorAll(".fi-imported-entry")) {
      if (String(section.querySelector("h3")?.textContent || "").toLocaleLowerCase("fr") !== String(word).toLocaleLowerCase("fr")) continue;
      const slot = section.querySelector("[data-fi-brief]");
      if (slot && !slot.hasChildNodes()) slot.innerHTML = html;
    }
  } catch { /* the English card is already shown; the French brief is optional */ }
}
