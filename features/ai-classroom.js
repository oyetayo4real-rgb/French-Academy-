/* Académie Française feature bridge. Additive changes only; existing lessons, progress, and landing page stay in place. */
(function () {
  "use strict";
  let FA_DAILY_CALL = null, FA_DAILY_META = null, FA_DAILY_SDK_PROMISE = null;
  const FA_AI = { level: "A1", mode: "chat", messages: [], pending: false, error: "" };
  const FA_DICT = { level: "A1", mode: "dict", query: "", result: null, error: "", pending: false };
  const faEl = (id) => document.getElementById(id);
  const faSafe = (value) => esc(String(value == null ? "" : value));
  // Display Tutor answers with consistent headings, paragraphs, lists and emphasis.
  function faMarkdown(value) {
    const escaped = faSafe(value);
    const inline = (line) => line.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    const lines = escaped.split(/\r?\n/), out = []; let list = "", paragraph = [];
    const flush = () => { if (paragraph.length) { out.push("<p>" + inline(paragraph.join(" ")) + "</p>"); paragraph = []; } };
    const close = () => { if (list) { out.push("</" + list + ">"); list = ""; } };
    for (const raw of lines) {
      const line = raw.trim(); if (!line) { flush(); close(); continue; }
      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) { flush(); close(); const n = Math.min(heading[1].length + 1, 5); out.push("<h" + n + ">" + inline(heading[2]) + "</h" + n + ">"); continue; }
      const bullet = line.match(/^[-*•]\s+(.+)$/);
      if (bullet) { flush(); if (list !== "ul") { close(); list = "ul"; out.push("<ul>"); } out.push("<li>" + inline(bullet[1]) + "</li>"); continue; }
      const numbered = line.match(/^\d+[.)]\s+(.+)$/);
      if (numbered) { flush(); if (list !== "ol") { close(); list = "ol"; out.push("<ol>"); } out.push("<li>" + inline(numbered[1]) + "</li>"); continue; }
      paragraph.push(line);
    }
    flush(); close(); return out.join("");
  }
  // Explicit entry points let the home-page buttons work even if event delegation changes.
  window.FAOpenTutor = async function () {
    if (!(await faRestoreAuthUser())) { view = "auth"; render(); return; }
    FA_AI.error = "";
    view = "tutor";
    render();
  };
  window.FAOpenDictionary = async function () {
    if (!(await faRestoreAuthUser())) { view = "auth"; render(); return; }
    FA_DICT.error = "";
    FA_DICT.mode = "dict";
    view = "dict";
    render();
  };
  function faNeedSignIn() { if (typeof AUTH !== "undefined" && AUTH && AUTH.user) return true; view = "auth"; render(); return false; }
  async function faTutorRequest(payload) { return api("/functions/v1/tutor", { m: "POST", body: payload }); }
  async function faLoadDailySdk() {
    const available = window.DailyIframe || window.Daily;
    if (available && typeof available.createFrame === "function") return available;
    if (!FA_DAILY_SDK_PROMISE) FA_DAILY_SDK_PROMISE = new Promise((resolve, reject) => {
      const script = document.createElement("script"); script.src = "https://unpkg.com/@daily-co/daily-js"; script.crossOrigin = "anonymous";
      script.onload = () => { const sdk = window.DailyIframe || window.Daily; if (sdk && typeof sdk.createFrame === "function") resolve(sdk); else reject(new Error("The live-class interface did not load correctly.")); };
      script.onerror = () => reject(new Error("Could not load the live-class interface. Check your connection and try again."));
      document.head.appendChild(script);
    });
    return FA_DAILY_SDK_PROMISE;
  }
  function faParticipants() {
    if (!FA_DAILY_CALL || typeof FA_DAILY_CALL.participants !== "function") return [];
    return Object.values(FA_DAILY_CALL.participants() || {}).filter((p) => p && !p.local && p.session_id);
  }
  function faRefreshRoster() {
    const count = faEl("faParticipantCount"), list = faEl("faDailyRoster"), participants = faParticipants();
    if (count) count.textContent = participants.length + " student" + (participants.length === 1 ? "" : "s") + " connected";
    if (!list) return;
    const search = (faEl("faRosterSearch")?.value || "").trim().toLowerCase();
    const filtered = participants.filter((p) => String(p.user_name || p.user_id || "Student").toLowerCase().includes(search));
    if (!filtered.length) { list.innerHTML = '<p class="mu">' + (participants.length ? "No participant matches that search." : "Students will appear here as they join.") + "</p>"; return; }
    list.innerHTML = filtered.map((p) => {
      const name = String(p.user_name || p.user_id || "Student").slice(0, 80), audioOn = !!(p.audio && p.audio.state === "playable");
      const actions = FA_DAILY_META && FA_DAILY_META.owner
        ? '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
          (audioOn ? '<button class="g" data-fa-audio="' + escA(p.session_id) + '" data-fa-enabled="1">Mute</button>' : '<span class="mu">Student controls microphone</span>') +
          '<button class="g" style="color:var(--bad)" data-fa-eject="' + escA(p.session_id) + '">Remove</button></div>' : "";
      return '<div class="asg" style="cursor:default;align-items:center"><span style="min-width:0"><b>' + faSafe(name) + '</b><div class="mu">' + (audioOn ? "Microphone active" : "Microphone muted or unavailable") + "</div></span>" + actions + "</div>";
    }).join("");
  }
  function faSetStatus(message) { const node = faEl("faDailyStatus"); if (node) node.textContent = message; if (FA_DAILY_META) FA_DAILY_META.status = message; }
  async function faStartCall(room, name, host, voice) {
    if (!faNeedSignIn()) return;
    if (typeof stopPl === "function") stopPl(); if (typeof stopClip === "function") stopClip();
    FA_DAILY_META = { classId: room, name: name || "French class", host: !!host, owner: false, voice: !!voice, returnView: host ? "cls" : "home", status: "Preparing your classroom…" };
    view = "call"; render();
    try {
      const ticket = await api("/functions/v1/live-room", { m: "POST", body: { class_id: room, voice: !!voice } });
      if (!ticket || !ticket.url || !ticket.token) throw new Error((ticket && ticket.message) || "The classroom service did not return an entry ticket.");
      FA_DAILY_META.owner = !!ticket.owner;
      const sdk = await faLoadDailySdk(), mount = faEl("faDailyFrame");
      if (!mount) throw new Error("The classroom panel could not be opened. Please try again.");
      FA_DAILY_CALL = sdk.createFrame(mount, { showLeaveButton: true, showFullscreenButton: true,
        iframeStyle: { width: "100%", height: "min(72vh, 760px)", minHeight: "420px", border: "0", borderRadius: "12px" },
        layoutConfig: { grid: { maxTilesPerPage: 9, minTilesPerPage: 1 } } });
      FA_DAILY_CALL.on("joined-meeting", () => { faSetStatus("Connected"); faRefreshRoster(); });
      FA_DAILY_CALL.on("participant-joined", faRefreshRoster); FA_DAILY_CALL.on("participant-left", faRefreshRoster); FA_DAILY_CALL.on("participant-updated", faRefreshRoster);
      FA_DAILY_CALL.on("left-meeting", () => { if (FA_DAILY_CALL) faExitCall(true); });
      FA_DAILY_CALL.on("error", (event) => faSetStatus((event && event.errorMsg) || "The call reported an error."));
      await FA_DAILY_CALL.join({ url: ticket.url, token: ticket.token });
      faSetStatus("Connected"); faRefreshRoster();
    } catch (error) { const message = (error && error.message) || "Could not join this live class."; await faExitCall(true); alert(message); }
  }
  async function faExitCall(fromDailyEvent) {
    const call = FA_DAILY_CALL, meta = FA_DAILY_META; FA_DAILY_CALL = null; FA_DAILY_META = null;
    if (call) { try { if (!fromDailyEvent && typeof call.leave === "function") await call.leave(); } catch (_) {} try { if (typeof call.destroy === "function") call.destroy(); } catch (_) {} }
    view = meta && meta.returnView === "cls" ? "cls" : "home"; render();
  }
  function faCallView() {
    if (!FA_DAILY_META) { $.innerHTML = '<button class="g" id="faCallBack">← Home</button><div class="card">No active live class.</div>'; return; }
    const meta = FA_DAILY_META;
    $.innerHTML = (typeof topbar === "function" ? topbar() : "") + '<button class="g" id="faCallBack">← Back</button><h1>📹 ' + faSafe(meta.name) + '</h1><div class="mu" id="faDailyStatus">' + faSafe(meta.status || "Preparing your classroom…") + '</div>' +
      '<div class="card" style="padding:8px"><div id="faDailyFrame" style="width:100%;min-height:420px;border-radius:12px;overflow:hidden;background:#080d18"></div></div>' +
      (meta.owner ? '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h2>👥 Participants</h2><span class="pill" id="faParticipantCount">Loading…</span></div><details><summary>Open lecturer controls</summary><p class="mu">Mute an active microphone or remove a participant. Students must enable their own microphone; lecturers cannot remotely unmute them. This does not change class enrolment.</p><input class="inp" id="faRosterSearch" placeholder="Find a student by name"><div id="faDailyRoster"></div></details></div>' : "") +
      '<button id="faEndCall" style="width:100%;background:var(--bad)">Leave live class</button>';
    if (typeof bindTop === "function") bindTop(); faRefreshRoster();
  }
  startCall = faStartCall; callView = faCallView; endCall = () => faExitCall(false);

  function faTutorView() {
    if (!AUTH || !AUTH.user) { $.innerHTML = '<button class="g" id="faHome">← Home</button><h1>🤖 AI French tutor</h1><div class="card"><p>Sign in to use the tutor and keep your learning progress.</p><button id="faSignIn" style="width:100%">Sign in / Create account</button></div>'; return; }
    const messageHtml = FA_AI.messages.map((m) => '<div class="card" style="margin:8px 0"><b>' + (m.role === "user" ? "You" : "Académie AI") + '</b><div class="fa-answer" style="margin-top:8px;line-height:1.75">' + (m.role === "assistant" ? faMarkdown(m.content) : '<div style="white-space:pre-wrap">' + faSafe(m.content) + "</div>") + "</div></div>").join("");
    $.innerHTML = (typeof topbar === "function" ? topbar() : "") + '<button class="g" id="faHome">← Home</button><h1>🤖 Académie French Intelligence</h1><p class="mu">A deep French-language research assistant for grammar, syntax, semantics, literature, history, translation, writing and contemporary usage. CEFR level is optional guidance, never a ceiling on answer depth.</p>' +
      '<div class="card"><label for="faTutorLevel"><b>Optional explanation style</b></label><select class="inp" id="faTutorLevel"><option value="none"' + (FA_AI.level === "none" ? " selected" : "") + '>No level restriction · full-depth answer</option>' + ["A1","A2","B1","B2","C1","C2"].map((l) => '<option value="' + l + '"' + (l === FA_AI.level ? " selected" : "") + '>' + l + ' · optional learner scaffolding</option>').join("") + '</select><label for="faTutorMode"><b>Tool</b></label><select class="inp" id="faTutorMode">' + [["chat","Deep answer / research"],["practice","Conversation practice"],["correct","Correct and analyse my French"],["translate","Translate French ↔ English"]].map((o) => '<option value="' + o[0] + '"' + (o[0] === FA_AI.mode ? " selected" : "") + '>' + o[1] + '</option>').join("") + "</select></div><div id=\"faTutorMessages\">" + (messageHtml || '<div class="card mu">Ask a question of any depth. For complex questions, I should explain the reasoning, alternatives, exceptions, examples and sources where available.</div>') + "</div>" +
      (FA_AI.pending ? '<div class="card mu">Researching and preparing an answer…</div>' : "") + (FA_AI.error ? '<div class="err">' + faSafe(FA_AI.error) + "</div>" : "") +
      '<div class="card"><textarea class="inp" id="faTutorInput" rows="5" placeholder="Ask anything about French: a complex grammar question, literary passage, idiom, translation, essay, etymology or language research…"></textarea><button id="faTutorSend" style="width:100%"' + (FA_AI.pending ? " disabled" : "") + ">" + (FA_AI.pending ? "Please wait…" : "Ask Académie") + '</button><p class="mu">Answers should distinguish verified source material from analysis and uncertainty. Live AI answers require a configured provider.</p></div>';
    if (typeof bindTop === "function") bindTop();
  }
  async function faTutorSend() {
    if (!faNeedSignIn()) return;
    const input = faEl("faTutorInput"), text = input ? input.value.trim() : "";
    if (!text || FA_AI.pending) return;
    FA_AI.level = faEl("faTutorLevel")?.value || "none"; FA_AI.mode = faEl("faTutorMode")?.value || "chat";
    const history = FA_AI.messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
    FA_AI.messages.push({ role: "user", content: text }); FA_AI.pending = true; FA_AI.error = ""; faTutorView();
    try {
      const response = await faTutorRequest({ mode: FA_AI.mode, level: FA_AI.level, text, history, depth: "comprehensive", research: true });
      if (response && response.error === "not_configured") throw new Error("The AI provider is not configured yet. The sourced dictionary works independently; add an AI provider key in Supabase Edge Function Secrets to enable deep AI answers.");
      FA_AI.messages.push({ role: "assistant", content: response && typeof response.text === "string" ? response.text : "I could not prepare an answer. Please try again." });
      FA_AI.messages = FA_AI.messages.slice(-24);
    } catch (error) { FA_AI.error = (error && error.message) || "The tutor could not answer just now."; }
    finally { FA_AI.pending = false; render(true); const messages = faEl("faTutorMessages"); if (messages) messages.scrollIntoView({ block: "end", behavior: "smooth" }); }
  }

  function faDictSourceLinks() {
    return '<div class="card"><h3>Dictionary sources</h3><p class="mu">The in-app entry loads French-language Wiktionnaire definitions live. The app also resolves matching Académie française article links and checks CNRTL/TLFi page availability live; protected CNRTL/TLFi editorial text stays on its original site.</p><p class="mu">Wiktionnaire data is licensed CC BY-SA and attributed. Protected dictionary text is not copied from CNRTL/TLFi.</p></div>';
  }
  function faDictHtml(d) {
    const word = faSafe(d.headword || FA_DICT.query);
    if (d.notFound) {
      const unavailable = d.sourceStatus === 'unavailable';
      const aiUnavailable = d.sourceStatus === 'ai_unavailable';
      const heading = unavailable ? 'Dictionary source unavailable' : (aiUnavailable ? 'AI enrichment temporarily unavailable' : 'French dictionary entry not found');
      const message = unavailable
        ? 'The live French dictionary source could not be reached. This does not mean the word is missing.'
        : (aiUnavailable ? 'No source-backed entry was found for this spelling, and the optional AI explanation could not be generated. The reference sources are still available below.' : 'No verified French-language entry was returned for this spelling.');
      return '<div class="card fa-dictionary-entry"><div class="mu" style="font-size:.82em;text-transform:uppercase;letter-spacing:.08em">French dictionary</div><h2>' + word + '</h2><h3>' + heading + '</h3><p>' + message + '</p>' +
        (d.sourceError ? '<p class="mu">' + faSafe(d.sourceError) + '</p>' : '') +
        (d.notes ? '<p class="mu">' + faSafe(d.notes) + '</p>' : '') +
        '<p class="mu">Try an accented spelling, an infinitive, or a singular form. You can also compare the editorial and historical references below.</p></div>';
    }
    const groups = Array.isArray(d.entries) ? d.entries : [];
    const hasSourceEntry = groups.length > 0 && !d.generated;
    const list = (items) => Array.isArray(items) ? items.filter(x => x != null && String(typeof x === 'object' ? (x.text || x.form || x.value || '') : x).trim()).map(x => typeof x === 'object' ? (x.text || x.form || x.value || '') : x) : [];
    const section = (title, body, note) => body ? '<section style="margin-top:20px;padding-top:15px;border-top:1px solid var(--line,rgba(127,127,127,.22))"><h3 style="margin:0 0 10px">' + title + '</h3>' + body + (note ? '<p class="mu" style="font-size:.84em;margin-top:8px">' + note + '</p>' : '') + '</section>' : '';
    const definitions = groups.map((group, gi) => {
      const senses = Array.isArray(group.definitions) ? group.definitions : [];
      if (!senses.length) return '';
      return '<div style="margin:0 0 18px"><h3 style="font-size:1.03em;margin:0 0 10px;color:var(--ac,#1d4ed8)">' + faSafe(group.partOfSpeech || 'Meaning') + '</h3><ol style="padding-left:24px;line-height:1.75;margin:0">' + senses.map((sense) => {
        const def = faSafe(sense.definition || '');
        const englishDefinition = sense.translationEn ? '<div class="en" style="margin-top:5px;line-height:1.65"><b>English translation' + (sense.translationSource ? ' · ' + faSafe(sense.translationSource) : '') + ':</b> ' + faSafe(sense.translationEn) + '</div>' : '';
        const label = sense.register || sense.label || sense.usage || sense.region || '';
        const examples = list(sense.examples);
        const exampleHtml = examples.length ? '<div style="margin-top:10px;padding:10px 12px;border-left:3px solid var(--ac,#1d4ed8);background:rgba(127,127,127,.06);border-radius:0 8px 8px 0">' + examples.map(ex => '<div class="fr" style="line-height:1.65;margin:3px 0">' + faSafe(ex) + '</div>').join('') + '</div>' : '';
        return '<li style="padding:0 0 14px 4px"><div>' + def + '</div>' + englishDefinition + (label ? '<div class="mu" style="font-size:.83em;margin-top:4px">' + faSafe(label) + '</div>' : '') + exampleHtml + '</li>';
      }).join('') + '</ol></div>';
    }).join('');
    const meanings = list(d.meanings).map(x => typeof x === 'object' ? (x.definition || x.text || '') : x).filter(Boolean);
    const meaningsHtml = meanings.length ? '<ol style="padding-left:24px;line-height:1.75">' + meanings.map(x => '<li style="padding:0 0 9px 4px">' + faSafe(x) + '</li>').join('') + '</ol>' : '';
    const pronunciation = d.ipa ? '<div style="margin-top:8px;font-size:1.03em"><b>Pronunciation</b> <span style="font-family:ui-monospace,monospace">/' + faSafe(String(d.ipa).replace(/^\/+|\/+$/g,'')) + '/</span></div>' : '';
    const grammarParts = [];
    if (d.gender) grammarParts.push('<b>Gender:</b> ' + faSafe(d.gender));
    if (d.pos) grammarParts.push('<b>Part of speech:</b> ' + faSafe(d.pos));
    if (d.grammar) grammarParts.push('<b>Grammar:</b> ' + faSafe(d.grammar));
    const grammar = grammarParts.length ? '<p style="margin:10px 0 0;line-height:1.7">' + grammarParts.join(' <span class="mu">·</span> ') + '</p>' : '';
    const forms = list(d.forms || d.inflections || d.wordForms);
    const formsHtml = forms.length ? '<div style="display:flex;flex-wrap:wrap;gap:7px">' + forms.map(x => '<span class="pill">' + faSafe(x) + '</span>').join('') + '</div>' : (d.conjugation ? '<p style="line-height:1.7">' + faSafe(d.conjugation) + '</p>' : '');
    const examples = Array.isArray(d.examples) ? d.examples.filter(ex => ex && (ex.fr || ex.text)) : [];
    const examplesHtml = examples.length ? examples.map((ex,i) => '<div style="margin:10px 0;padding:12px;border:1px solid var(--line,rgba(127,127,127,.22));border-radius:10px"><div class="mu" style="font-size:.82em;margin-bottom:5px">Example ' + (i+1) + (ex.source ? ' · ' + faSafe(ex.source) : '') + '</div><div class="fr" style="line-height:1.7">' + faSafe(ex.fr || ex.text || '') + '</div>' + ((ex.en || ex.translation) ? '<div class="en" style="margin-top:5px;line-height:1.65">' + faSafe(ex.en || ex.translation) + '</div>' : '') + '</div>').join('') : '';
    const related = [];
    [['Synonyms',d.synonyms],['Antonyms',d.antonyms],['Collocations',d.collocations],['Related expressions',d.related]].forEach(([label,items]) => {
      const values = list(items);
      if (values.length) related.push(section(label, '<div style="display:flex;flex-wrap:wrap;gap:7px">' + values.map(x => '<span class="pill">' + faSafe(x) + '</span>').join('') + '</div>'));
    });
    const sources = Array.isArray(d.sources) && d.sources.length ? '<ul style="padding-left:20px;line-height:1.6">' + d.sources.map(src => { const name = typeof src === 'string' ? src : src.name || 'Reference'; const url = typeof src === 'object' && src ? src.url : null; return '<li style="margin:0 0 9px">' + (url ? '<a href="' + escA(url) + '" target="_blank" rel="noopener noreferrer">' + faSafe(name) + '</a>' : faSafe(name)) + (src && src.licence ? '<div class="mu" style="font-size:.83em;margin-top:2px">' + faSafe(src.licence) + '</div>' : '') + '</li>'; }).join('') + '</ul>' : '';
    const sourceLabel = d.generated ? 'AI-assisted lexical explanation · not an official quotation' : (hasSourceEntry ? 'Source-backed French entry' : 'French dictionary entry');
    return '<div class="card fa-dictionary-entry"><div class="mu" style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">' + sourceLabel + '</div><h2 style="font-size:1.8em;margin:0 0 5px;line-height:1.2">' + word + (d.gender ? ' <span class="pill">' + faSafe(d.gender) + '</span>' : '') + '</h2>' + (d.headwordTranslation ? '<p class="en" style="margin:0 0 10px;line-height:1.65"><b>English translation:</b> ' + faSafe(d.headwordTranslation) + '</p>' : '') + grammar + pronunciation +
      section('Meanings', definitions || meaningsHtml, hasSourceEntry ? 'Definitions are adapted from the linked community-edited source; follow the entry link for full context and attribution.' : '') +
      section('Grammar and word forms', formsHtml) +
      section('Examples in context', examplesHtml, examples.some(ex => !(ex.en || ex.translation)) ? 'The source does not provide English translations for every example.' : '') +
      related.join('') +
      section('Usage and nuance', d.notes ? '<p style="line-height:1.75;margin:0">' + faSafe(d.notes) + '</p>' : '') +
      section('Etymology', d.etymology ? '<p style="line-height:1.75;margin:0">' + faSafe(d.etymology) + '</p>' : '') +
      section('References and attribution', sources) +
      '</div>';
  }
  function faDictionaryView() {
    if (!AUTH || !AUTH.user) { $.innerHTML = '<button class="g" id="faHome">← Home</button><h1>📖 French reference dictionary</h1><div class="card"><p>Sign in to use the dictionary and translator.</p><button id="faSignIn" style="width:100%">Sign in / Create account</button></div>'; return; }
    let output = '', result = FA_DICT.result;
    if (result && FA_DICT.mode === 'translate' && result.text) output = '<div class="card"><h2>Translation</h2><div style="white-space:pre-wrap">' + faSafe(result.text) + '</div></div>';
    else if (result && result.data) output = faDictHtml(result.data);
    else if (result && result.error) output = '<div class="card"><h2>Dictionary lookup unavailable</h2><p>' + faSafe(result.message || 'The lookup could not be completed.') + '</p><p class="mu">You can still open the reference links below. A failed lookup is not presented as a dictionary definition.</p></div>';
    else if (result && result.error === 'not_found') output = '<div class="card">No structured lexical entry was returned. Use the reference links below to compare the sources.</div>';
    $.innerHTML = (typeof topbar === 'function' ? topbar() : '') + '<button class="g" id="faHome">← Home</button><h1>📖 French Modern Dictionary</h1><p class="mu">Built-in dictionary: definitions, parts of speech, examples and usage notes displayed here. No need to leave the app.</p><div class="card"><label for="faDictMode"><b>Tool</b></label><select id="faDictMode" class="inp"><option value="dict"' + (FA_DICT.mode === 'dict' ? ' selected' : '') + '>Dictionary lookup</option><option value="translate"' + (FA_DICT.mode === 'translate' ? ' selected' : '') + '>AI translation (requires provider setup)</option></select><input class="inp" id="faDictInput" value="' + escA(FA_DICT.query) + '" placeholder="French or English word / expression…"><button id="faDictLookup" style="width:100%"' + (FA_DICT.pending ? ' disabled' : '') + '>' + (FA_DICT.pending ? 'Searching dictionary…' : 'Search dictionary') + '</button>' + (FA_DICT.error ? '<div class="err">' + faSafe(FA_DICT.error) + '</div>' : '') + '</div>' + output + (FA_DICT.query && FA_DICT.mode === 'dict' ? faDictSourceLinks() : '') + '<div class="card"><p class="mu">Sources: Wiktionnaire (CC BY-SA), Académie française (progressively updated 10th edition), CNRTL/TLFi (historical reference). This UI links to sources; it does not imply an API affiliation with the Académie or ATILF.</p></div>';
    if (typeof bindTop === 'function') bindTop();
  }
  async function faDictionaryLookup() {
    if (!faNeedSignIn()) return;
    FA_DICT.query = (faEl('faDictInput')?.value || '').trim(); FA_DICT.mode = faEl('faDictMode')?.value || 'dict';
    if (!FA_DICT.query || FA_DICT.pending) return;
    FA_DICT.pending = true; FA_DICT.error = ''; FA_DICT.result = null; faDictionaryView();
    try {
      FA_DICT.result = await faTutorRequest({ mode: FA_DICT.mode, level: 'none', text: FA_DICT.query, sources: true });
      if (FA_DICT.result && FA_DICT.result.error === 'not_configured' && FA_DICT.mode === 'dict') {
        FA_DICT.result = await faTutorRequest({ mode: 'sources', level: 'none', text: FA_DICT.query });
      }
      if (FA_DICT.result && FA_DICT.result.error === 'not_configured') throw new Error('The AI provider is not configured. Dictionary lookup is independent and should be available; if this message persists, reload the page after the backend deploy finishes.');
    } catch (error) { FA_DICT.error = (error && error.message) || 'The dictionary could not answer just now.'; }
    finally { FA_DICT.pending = false; render(true); }
  }

  async function faLessonRequest(kind) {
    if (!faNeedSignIn()) return;
    const box = faEl("faLessonAI"), lesson = cl(); if (!box || !lesson) return;
    const examplesOnly = kind === "examples", button = faEl(examplesOnly ? "faMoreExamples" : "faExpandLesson");
    if (button) { button.disabled = true; button.textContent = "Preparing extra teaching…"; }
    box.innerHTML = '<div class="card mu">Generating ' + faSafe(L[cur].id) + ' teaching material…</div>';
    try {
      let response;
      if (examplesOnly) {
        response = await faTutorRequest({ mode: "examples", level: L[cur].id, key: key(cur, cj), title: lesson.t,
          focus: String(lesson.grammar || "").replace(/<[^>]*>/g, " ").slice(0, 700),
          phrases: (lesson.scenes || []).slice(0, 8).map((s) => s[1]).join("; ").slice(0, 600) });
        const data = response && response.data;
        if (!data || !Array.isArray(data.examples)) throw new Error("The tutor returned examples in an unexpected format.");
        box.innerHTML = '<div class="card"><h2>📝 Extra examples · ' + faSafe(L[cur].id) + "</h2>" +
          data.examples.map((x, i) => '<div style="margin:12px 0"><b>' + (i + 1) + '.</b><div class="fr">' + faSafe(x.fr || "") + '</div><div class="en">' + faSafe(x.en || "") + "</div></div>").join("") +
          (data.tip ? '<p class="mu"><b>Study tip:</b> ' + faSafe(data.tip) + "</p>" : "") + "</div>";
      } else {
        const prompt = "Create a detailed but clear lesson expansion for a CEFR " + L[cur].id + " student. Topic: " + lesson.t +
          ". Current explanation: " + String(lesson.grammar || "").replace(/<[^>]*>/g, " ").slice(0, 700) +
          ". Existing phrases: " + (lesson.scenes || []).slice(0, 8).map((s) => s[1]).join("; ").slice(0, 500) +
          ". Teach step by step in English, add French examples with English translations, explain common mistakes, and finish with a short practice exercise and answer key. Make it substantially more detailed than a quick summary.";
        response = await faTutorRequest({ mode: "chat", level: L[cur].id, text: prompt });
        if (!response || typeof response.text !== "string") throw new Error("The tutor returned an unexpected lesson format.");
        box.innerHTML = '<div class="card"><h2>📘 Expanded lesson · ' + faSafe(L[cur].id) + '</h2><div style="white-space:pre-wrap;line-height:1.7">' + faSafe(response.text) + "</div></div>";
      }
    } catch (error) { box.innerHTML = '<div class="card"><div class="err">' + faSafe((error && error.message) || "Could not generate extra teaching just now.") + "</div></div>"; }
    finally { if (button) { button.disabled = false; button.textContent = examplesOnly ? "📝 Generate 8 extra examples" : "📘 Expand this lesson with AI"; } }
  }

  // Recover a saved Supabase session whose user object was not persisted.
  // Keep the existing auth gate: only a valid Supabase user session may open these tools.
  async function faRestoreAuthUser() {
    if (typeof AUTH !== "undefined" && AUTH && AUTH.user) return true;
    if (typeof AUTH === "undefined" || !AUTH || !AUTH.access_token) return false;
    async function fetchUser() {
      return fetch(SBURL + "/auth/v1/user", {
        headers: { apikey: SBKEY, Authorization: "Bearer " + AUTH.access_token }
      });
    }
    try {
      let response = await fetchUser();
      if (response.status === 401 && AUTH.refresh_token && typeof refreshTok === "function") {
        await refreshTok();
        if (!AUTH || !AUTH.access_token) return false;
        response = await fetchUser();
      }
      if (!response.ok) return false;
      const user = await response.json();
      if (!user || !user.id) return false;
      AUTH.user = user;
      if (typeof store === "function") store("fa_auth", AUTH);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Export view renderers because index.html owns the global render() dispatcher.
  window.FATutorView = faTutorView;
  window.FADictionaryView = faDictionaryView;

  document.addEventListener("click", async (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null; if (!button) return;
    if (button.id === "htutor") { if (!(await faRestoreAuthUser())) { view = "auth"; render(); return; } FA_AI.error = ""; view = "tutor"; render(); }
    else if (button.id === "hdict") { if (!(await faRestoreAuthUser())) { view = "auth"; render(); return; } FA_DICT.error = ""; view = "dict"; render(); }
    else if (button.id === "faHome") { view = "home"; render(); }
    else if (button.id === "faCallBack") await faExitCall(false);
    else if (button.id === "faSignIn") { view = "auth"; render(); }
    else if (button.id === "faTutorSend") await faTutorSend();
    else if (button.id === "faDictLookup") await faDictionaryLookup();
    else if (button.id === "faExpandLesson") await faLessonRequest("expand");
    else if (button.id === "faMoreExamples") await faLessonRequest("examples");
    else if (button.id === "faEndCall") await faExitCall(false);
    else if (button.hasAttribute("data-fa-audio") && FA_DAILY_CALL && FA_DAILY_META && FA_DAILY_META.owner) {
      const session = button.getAttribute("data-fa-audio");
      // Remote unmute is intentionally prohibited; students control their own microphone.
      if (button.getAttribute("data-fa-enabled") !== "1") return;
      try { FA_DAILY_CALL.updateParticipant(session, { setAudio: false }); faSetStatus("Mute command sent."); }
      catch (error) { alert((error && error.message) || "Could not mute this participant."); }
    } else if (button.hasAttribute("data-fa-eject") && FA_DAILY_CALL && FA_DAILY_META && FA_DAILY_META.owner) {
      const session = button.getAttribute("data-fa-eject");
      if (!confirm("Remove this student from the live call? Their class enrolment will remain unchanged.")) return;
      try { FA_DAILY_CALL.updateParticipant(session, { eject: true }); faSetStatus("Removal requested."); }
      catch (error) { alert((error && error.message) || "Could not remove this participant."); }
    }
  });
  document.addEventListener("input", (event) => { if (event.target && event.target.id === "faRosterSearch") faRefreshRoster(); });
  document.addEventListener("keydown", (event) => {
    if (event.target && event.target.id === "faTutorInput" && event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); faTutorSend(); }
    if (event.target && event.target.id === "faDictInput" && event.key === "Enter") { event.preventDefault(); faDictionaryLookup(); }
  });
})();