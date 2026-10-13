/* Académie Française feature bridge. Additive changes only; existing lessons, progress, and landing page stay in place. */
(function () {
  "use strict";
  let FA_DAILY_CALL = null, FA_DAILY_META = null, FA_DAILY_SDK_PROMISE = null;
  const FA_AI = { level: "A1", mode: "chat", messages: [], pending: false, error: "" };
  const FA_DICT = { level: "A1", mode: "dict", query: "", result: null, error: "", pending: false };
  const faEl = (id) => document.getElementById(id);
  const faSafe = (value) => esc(String(value == null ? "" : value));
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
        ? '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="g" data-fa-audio="' + escA(p.session_id) + '" data-fa-enabled="' + (audioOn ? "1" : "0") + '">' + (audioOn ? "Mute" : "Unmute") + '</button><button class="g" style="color:var(--bad)" data-fa-eject="' + escA(p.session_id) + '">Remove</button></div>' : "";
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
      (meta.owner ? '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h2>👥 Participants</h2><span class="pill" id="faParticipantCount">Loading…</span></div><details><summary>Open lecturer controls</summary><p class="mu">Mute, request unmute, or remove a participant from this call. This does not change class enrolment.</p><input class="inp" id="faRosterSearch" placeholder="Find a student by name"><div id="faDailyRoster"></div></details></div>' : "") +
      '<button id="faEndCall" style="width:100%;background:var(--bad)">Leave live class</button>';
    if (typeof bindTop === "function") bindTop(); faRefreshRoster();
  }
  startCall = faStartCall; callView = faCallView; endCall = () => faExitCall(false);

  function faTutorView() {
    if (!AUTH || !AUTH.user) { $.innerHTML = '<button class="g" id="faHome">← Home</button><h1>🤖 AI French tutor</h1><div class="card"><p>Sign in to use the tutor and keep your learning progress.</p><button id="faSignIn" style="width:100%">Sign in / Create account</button></div>'; return; }
    const messageHtml = FA_AI.messages.map((m) => '<div class="card" style="margin:8px 0"><b>' + (m.role === "user" ? "You" : "Académie AI") + '</b><div style="white-space:pre-wrap;margin-top:6px">' + faSafe(m.content) + "</div></div>").join("");
    $.innerHTML = (typeof topbar === "function" ? topbar() : "") + '<button class="g" id="faHome">← Home</button><h1>🤖 AI French tutor</h1><p class="mu">Ask grammar questions, practise a conversation, translate a sentence or get gentle corrections at your CEFR level.</p>' +
      '<div class="card"><label for="faTutorLevel"><b>Your level</b></label><select class="inp" id="faTutorLevel">' + ["A1","A2","B1","B2","C1","C2"].map((l) => '<option value="' + l + '"' + (l === FA_AI.level ? " selected" : "") + ">" + l + "</option>").join("") +
      '</select><label for="faTutorMode"><b>Practice mode</b></label><select class="inp" id="faTutorMode">' + [["chat","Ask the tutor"],["practice","Conversation practice"],["correct","Correct my French"],["translate","Translate French ↔ English"]].map((o) => '<option value="' + o[0] + '"' + (o[0] === FA_AI.mode ? " selected" : "") + ">" + o[1] + "</option>").join("") +
      "</select></div><div id=\"faTutorMessages\">" + (messageHtml || '<div class="card mu">Bonjour ! Ask me a French question, or choose a practice mode above.</div>') + "</div>" +
      (FA_AI.pending ? '<div class="card mu">The tutor is thinking…</div>' : "") + (FA_AI.error ? '<div class="err">' + faSafe(FA_AI.error) + "</div>" : "") +
      '<div class="card"><textarea class="inp" id="faTutorInput" rows="3" placeholder="E.g. Explain when to use passé composé instead of imparfait…"></textarea><button id="faTutorSend" style="width:100%"' + (FA_AI.pending ? " disabled" : "") + ">" + (FA_AI.pending ? "Please wait…" : "Send to tutor") + '</button><p class="mu">AI explanations can make mistakes. Check important language details.</p></div>';
    if (typeof bindTop === "function") bindTop();
  }
  async function faTutorSend() {
    if (!faNeedSignIn()) return;
    const input = faEl("faTutorInput"), text = input ? input.value.trim() : "";
    if (!text || FA_AI.pending) return;
    FA_AI.level = faEl("faTutorLevel")?.value || FA_AI.level; FA_AI.mode = faEl("faTutorMode")?.value || FA_AI.mode;
    const history = FA_AI.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    FA_AI.messages.push({ role: "user", content: text }); FA_AI.pending = true; FA_AI.error = ""; faTutorView();
    try {
      const response = await faTutorRequest({ mode: FA_AI.mode, level: FA_AI.level, text, history });
      FA_AI.messages.push({ role: "assistant", content: response && typeof response.text === "string" ? response.text : "I could not prepare an answer. Please try again." });
      FA_AI.messages = FA_AI.messages.slice(-20);
    } catch (error) { FA_AI.error = (error && error.message) || "The tutor could not answer just now."; }
    finally { FA_AI.pending = false; render(true); const messages = faEl("faTutorMessages"); if (messages) messages.scrollIntoView({ block: "end", behavior: "smooth" }); }
  }

  function faDictionaryView() {
    if (!AUTH || !AUTH.user) { $.innerHTML = '<button class="g" id="faHome">← Home</button><h1>📖 French dictionary</h1><div class="card"><p>Sign in to use the dictionary and translator.</p><button id="faSignIn" style="width:100%">Sign in / Create account</button></div>'; return; }
    let output = ""; const result = FA_DICT.result;
    if (result && FA_DICT.mode === "translate") output = '<div class="card"><h2>Translation</h2><div style="white-space:pre-wrap">' + faSafe(result.text || "") + "</div></div>";
    else if (result && result.data) {
      const d = result.data;
      output = '<div class="card"><h2>' + faSafe(d.headword || FA_DICT.query) + (d.gender ? ' <span class="pill">' + faSafe(d.gender) + "</span>" : "") + '</h2><div class="mu">' + faSafe(d.pos || "Word or phrase") + (d.ipa ? " · " + faSafe(d.ipa) : "") + "</div>" +
        (Array.isArray(d.meanings) ? "<h3>Meaning</h3><ul>" + d.meanings.map((x) => "<li>" + faSafe(x) + "</li>").join("") + "</ul>" : "") + (d.notes ? "<p><b>Usage note:</b> " + faSafe(d.notes) + "</p>" : "") +
        (Array.isArray(d.examples) ? "<h3>Examples</h3>" + d.examples.map((x) => '<div style="margin:10px 0"><div class="fr">' + faSafe(x.fr || "") + '</div><div class="en">' + faSafe(x.en || "") + "</div></div>").join("") : "") +
        (Array.isArray(d.related) ? "<p><b>Related:</b> " + d.related.map(faSafe).join(" · ") + "</p>" : "") + "</div>";
    }
    $.innerHTML = (typeof topbar === "function" ? topbar() : "") + '<button class="g" id="faHome">← Home</button><h1>📖 Dictionary & translation</h1><p class="mu">Look up French or English words for meanings, usage notes and examples, or translate a complete sentence.</p><div class="card">' +
      '<label for="faDictMode"><b>Tool</b></label><select id="faDictMode" class="inp"><option value="dict"' + (FA_DICT.mode === "dict" ? " selected" : "") + '>Dictionary lookup</option><option value="translate"' + (FA_DICT.mode === "translate" ? " selected" : "") + '>Translate a sentence</option></select>' +
      '<label for="faDictLevel"><b>CEFR level for examples</b></label><select id="faDictLevel" class="inp">' + ["A1","A2","B1","B2","C1","C2"].map((l) => '<option value="' + l + '"' + (l === FA_DICT.level ? " selected" : "") + ">" + l + "</option>").join("") + "</select>" +
      '<input class="inp" id="faDictInput" value="' + escA(FA_DICT.query) + '" placeholder="E.g. pourtant, apprendre, or I am looking for the station…"><button id="faDictLookup" style="width:100%"' + (FA_DICT.pending ? " disabled" : "") + ">" + (FA_DICT.pending ? "Working…" : "Look up / translate") + "</button>" + (FA_DICT.error ? '<div class="err">' + faSafe(FA_DICT.error) + "</div>" : "") + "</div>" + output;
    if (typeof bindTop === "function") bindTop();
  }
  async function faDictionaryLookup() {
    if (!faNeedSignIn()) return;
    FA_DICT.query = (faEl("faDictInput")?.value || "").trim(); FA_DICT.mode = faEl("faDictMode")?.value || "dict"; FA_DICT.level = faEl("faDictLevel")?.value || "A1";
    if (!FA_DICT.query || FA_DICT.pending) return;
    FA_DICT.pending = true; FA_DICT.error = ""; FA_DICT.result = null; faDictionaryView();
    try { FA_DICT.result = await faTutorRequest({ mode: FA_DICT.mode, level: FA_DICT.level, text: FA_DICT.query }); if (FA_DICT.result && FA_DICT.result.raw) FA_DICT.error = String(FA_DICT.result.raw); }
    catch (error) { FA_DICT.error = (error && error.message) || "The dictionary could not answer just now."; }
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

  document.addEventListener("click", async (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null; if (!button) return;
    if (button.id === "htutor") { FA_AI.error = ""; view = "tutor"; render(); }
    else if (button.id === "hdict") { FA_DICT.error = ""; view = "dict"; render(); }
    else if (button.id === "faHome") { view = "home"; render(); }
    else if (button.id === "faCallBack") await faExitCall(false);
    else if (button.id === "faSignIn") { view = "auth"; render(); }
    else if (button.id === "faTutorSend") await faTutorSend();
    else if (button.id === "faDictLookup") await faDictionaryLookup();
    else if (button.id === "faExpandLesson") await faLessonRequest("expand");
    else if (button.id === "faMoreExamples") await faLessonRequest("examples");
    else if (button.id === "faEndCall") await faExitCall(false);
    else if (button.hasAttribute("data-fa-audio") && FA_DAILY_CALL && FA_DAILY_META && FA_DAILY_META.owner) {
      const session = button.getAttribute("data-fa-audio"), wasOn = button.getAttribute("data-fa-enabled") === "1";
      if (!wasOn && !confirm("Request to unmute this student's microphone? Only the meeting owner can do this; browser and device permissions still apply.")) return;
      try { FA_DAILY_CALL.updateParticipant(session, { setAudio: !wasOn }); faSetStatus(wasOn ? "Mute command sent." : "Unmute request sent."); }
      catch (error) { alert((error && error.message) || "Could not change this participant's microphone."); }
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