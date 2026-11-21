/* Académie Française feature bridge. Additive changes only; existing lessons, progress, and landing page stay in place. */
(function () {
  "use strict";
  let FA_DAILY_CALL = null, FA_DAILY_META = null, FA_DAILY_SDK_PROMISE = null;
  const FA_TUTOR_FUNCTION_SLUG = "tutor-v2";
  const FA_SCRIPT_URL = document.currentScript && document.currentScript.src;
  const FA_AI = { level: "A1", mode: "chat", depth: "quick", messages: [], pending: false, error: "", lastRequest: null, memoryUserId: null, memoryLoaded: false, memoryLoading: false, memoryBusy: false, memoryEnabled: false, memoryProfile: null, memoryStatus: "", conversations: [], activeConversationId: null, localStorageError: "" };
  const FA_TUTOR_LOCAL_VERSION = 1;
  const FA_TUTOR_LOCAL_PREFIX = "fa_tutor_local_v1:";
  const FA_TUTOR_TOPICS = [
    ["subjunctive", /\b(subjonctif|subjunctive)\b/i], ["past_tenses", /(pass[eé] compos[eé]|imparfait|plus-que-parfait|pass[eé] simple|past tense)/i],
    ["articles", /\b(articles?|article défini|article indéfini)\b/i], ["pronouns", /\b(pronoms?|pronouns?|y and en)\b/i],
    ["agreement", /\b(accord|agreement|genre|gender|plural)\b/i], ["prepositions", /\b(pr[eé]position|preposition|à|de|chez|dans)\b/i],
    ["negation", /\b(n[eé]gation|ne \w+ pas|negation)\b/i], ["vocabulary", /\b(vocabulaire|vocabulary|synonyme|antonyme|meaning)\b/i],
    ["pronunciation", /\b(prononciation|pronunciation|phon[eè]me|liaison)\b/i], ["writing", /\b(r[eé]daction|writing|essay|composition)\b/i],
    ["literature", /\b(litt[eé]rature|literature|po[eè]me|roman|auteur)\b/i], ["idioms", /\b(expression idiomatique|idiom|locution|expression)\b/i],
    ["questions", /\b(question|interrogation|interrogative)\b/i], ["verb_conjugation", /\b(conjugaison|conjugation|conjugate|verbe|verb)\b/i],
    ["listening", /\b(compr[eé]hension orale|listening|[eé]coute)\b/i]
  ];
  function faTutorStorageKey() { return FA_TUTOR_LOCAL_PREFIX + encodeURIComponent(String(AUTH && AUTH.user && AUTH.user.id || "guest")); }
  function faEmptyLearningMemory() { return { enabled: false, cefr_level: null, topic_counts: {}, mode_counts: {}, interaction_count: 0, last_interaction_at: null }; }
  function faLoadTutorLocalData() {
    const empty = { conversations: [], activeConversationId: null, memory: faEmptyLearningMemory() };
    try {
      const raw = localStorage.getItem(faTutorStorageKey());
      if (!raw) return empty;
      const data = JSON.parse(raw);
      if (!data || data.version !== FA_TUTOR_LOCAL_VERSION) return empty;
      const conversations = Array.isArray(data.conversations) ? data.conversations.filter(x => x && typeof x.id === "string" && Array.isArray(x.messages)).slice(-25).map(x => ({
        id: x.id, title: String(x.title || "New conversation").slice(0,80), createdAt: Number(x.createdAt)||Date.now(), updatedAt: Number(x.updatedAt)||Date.now(),
        level: ["none","A1","A2","B1","B2","C1","C2"].includes(x.level) ? x.level : "A1",
        mode: ["chat","practice","correct","translate"].includes(x.mode) ? x.mode : "chat", depth: x.depth === "deep" ? "deep" : "quick",
        messages: x.messages.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-100).map(m => ({role:m.role,content:m.content.slice(0,12000)}))
      })) : [];
      const src = data.memory && typeof data.memory === "object" ? data.memory : {};
      const memory = faEmptyLearningMemory(); memory.enabled = src.enabled === true;
      memory.cefr_level = ["A1","A2","B1","B2","C1","C2"].includes(src.cefr_level) ? src.cefr_level : null;
      for (const [k,v] of Object.entries(src.topic_counts || {})) if (/^[a-z_]{2,32}$/.test(k) && Number.isInteger(v) && v >= 0) memory.topic_counts[k] = Math.min(v,100000);
      for (const [k,v] of Object.entries(src.mode_counts || {})) if (["chat","practice","correct","translate","examples"].includes(k) && Number.isInteger(v) && v >= 0) memory.mode_counts[k] = Math.min(v,100000);
      memory.interaction_count = Number.isInteger(src.interaction_count) && src.interaction_count >= 0 ? Math.min(src.interaction_count,1000000) : 0;
      memory.last_interaction_at = typeof src.last_interaction_at === "string" ? src.last_interaction_at : null;
      return {conversations,activeConversationId:typeof data.activeConversationId==="string"?data.activeConversationId:null,memory};
    } catch (_) { FA_AI.localStorageError = "This browser could not read saved tutor data. The tutor session can still work."; return empty; }
  }
  function faSaveTutorLocalData() {
    try {
      const active = FA_AI.conversations.find(x => x.id === FA_AI.activeConversationId);
      if (active) { active.messages = FA_AI.messages.slice(-100).map(m=>({role:m.role,content:String(m.content||"").slice(0,12000)})); active.updatedAt=Date.now(); active.level=FA_AI.level; active.mode=FA_AI.mode; active.depth=FA_AI.depth; }
      FA_AI.conversations = FA_AI.conversations.slice(-25);
      localStorage.setItem(faTutorStorageKey(),JSON.stringify({version:FA_TUTOR_LOCAL_VERSION,activeConversationId:FA_AI.activeConversationId,conversations:FA_AI.conversations,memory:FA_AI.memoryProfile||faEmptyLearningMemory()}));
      FA_AI.localStorageError=""; return true;
    } catch (_) { FA_AI.localStorageError="Browser storage is full or unavailable. Export or remove older chats before continuing."; return false; }
  }
  function faStartTutorConversation() {
    const now=Date.now(),id="chat_"+now.toString(36)+"_"+Math.random().toString(36).slice(2,8);
    FA_AI.conversations.push({id,title:"New conversation",createdAt:now,updatedAt:now,level:FA_AI.level,mode:FA_AI.mode,depth:FA_AI.depth,messages:[]});
    FA_AI.activeConversationId=id; FA_AI.messages=[]; FA_AI.lastRequest=null; FA_AI.error=""; faSaveTutorLocalData();
  }
  function faActivateTutorConversation(id) {
    const item=FA_AI.conversations.find(x=>x.id===id); if(!item)return;
    FA_AI.activeConversationId=item.id; FA_AI.messages=item.messages.map(m=>({role:m.role,content:m.content}));
    FA_AI.level=item.level; FA_AI.mode=item.mode; FA_AI.depth=item.depth; FA_AI.lastRequest=null; FA_AI.error="";
    faSaveTutorLocalData(); render(true);
  }
  function faUpdateLocalLearningMemory(request) {
    if(!FA_AI.memoryEnabled)return;
    const memory=FA_AI.memoryProfile||faEmptyLearningMemory(),topics=new Set(),value=String(request.text||"");
    for(const [topic,pattern] of FA_TUTOR_TOPICS)if(pattern.test(value))topics.add(topic);
    if(request.mode==="translate")topics.add("translation"); if(request.mode==="correct")topics.add("correction");
    if(request.mode==="practice")topics.add("conversation"); if(request.mode==="examples")topics.add("examples");
    for(const topic of [...topics].slice(0,8))memory.topic_counts[topic]=Math.min(100000,(memory.topic_counts[topic]||0)+1);
    memory.mode_counts[request.mode]=Math.min(100000,(memory.mode_counts[request.mode]||0)+1);
    memory.interaction_count=Math.min(1000000,memory.interaction_count+1);
    memory.cefr_level=["A1","A2","B1","B2","C1","C2"].includes(request.level)?request.level:memory.cefr_level;
    memory.last_interaction_at=new Date().toISOString(); FA_AI.memoryProfile=memory; faSaveTutorLocalData();
  }
  const FA_VOICE = { language: "fr-FR", recognition: null, listening: false, speaking: false };
  function faEnsureTutorStyles() {
    if (document.getElementById("faTutorStyles")) return;
    const link = document.createElement("link");
    link.id = "faTutorStyles";
    link.rel = "stylesheet";
    link.href = FA_SCRIPT_URL ? new URL("ai-classroom.css", FA_SCRIPT_URL).href : "/features/ai-classroom.css";
    document.head.appendChild(link);
  }
  faEnsureTutorStyles();
  const FA_DICT = { level: "A1", mode: "dict", query: "", result: null, error: "", pending: false };
  const faEl = (id) => document.getElementById(id);
  const faSafe = (value) => esc(String(value == null ? "" : value));
  // Normalize model math to readable Unicode/plain text before Markdown rendering.
  function faMathCleanup(value) {
    let text = String(value == null ? "" : value);
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, expression) => String(expression).replace(/\r?\n/g, " ").trim());
    text = text.replace(/\$([^$\n]+)\$/g, "$1");
    text = text.replace(/\\text\{([^{}]*)\}/g, "$1");
    text = text.replace(/\\rightarrow|\\to/g, "→")
      .replace(/\\leftarrow/g, "←")
      .replace(/\\Rightarrow/g, "⇒")
      .replace(/\\leftrightarrow/g, "↔");
    return text;
  }
  // All model text is escaped first; only this renderer's allow-listed tags are emitted.
  function faMarkdown(value) {
    const inline = (value, depth = 0) => {
      let text = String(value == null ? "" : value);
      const tokens = [];
      const hold = (html) => {
        const marker = "\u0000FAINLINE" + tokens.length + "\u0000";
        tokens.push([marker, html]);
        return marker;
      };
      text = text.replace(/\x60([^\x60]+)\x60/g, (_, code) => hold("<code>" + faSafe(code) + "</code>"));
      text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, (_, label, url) => {
        if (depth > 3) return hold(faSafe(label));
        const href = String(url || "").trim();
        if (/^https?:\/\/[^\s"'<>]+$/i.test(href)) {
          return hold('<a href="' + faSafe(href) + '" target="_blank" rel="noopener noreferrer">' + inline(label, depth + 1) + "</a>");
        }
        return hold(inline(label, depth + 1));
      });
      text = faSafe(text);
      text = text.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>");
      text = text.replace(/\*(?=\S)([^*]*?\S)\*/g, "<em>$1</em>");
      text = text.replace(/_(?=\S)([^_]*?\S)_/g, "<em>$1</em>");
      text = text.replace(/\r?\n/g, "<br>");
      for (const [marker, html] of tokens) text = text.split(marker).join(html);
      return text;
    };
    const splitPipeRows = (line) => {
      const cells = [];
      let cell = "", inCode = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === "\x60") { inCode = !inCode; cell += char; continue; }
        if (char === "|" && !inCode) { cells.push(cell); cell = ""; }
        else cell += char;
      }
      cells.push(cell);
      if (cells.length < 3) return [];
      if (!cells[0].trim()) cells.shift();
      if (cells.length && !cells[cells.length - 1].trim()) cells.pop();
      const rows = [];
      let row = [];
      for (const item of cells) {
        if (!item.trim()) {
          if (row.length) rows.push(row);
          row = [];
        } else row.push(item.trim());
      }
      if (row.length) rows.push(row);
      return rows;
    };
    const pipeCells = (line) => {
      const value = String(line || "").trim();
      if (!value.startsWith("|") || !value.endsWith("|")) return [];
      const cells = [];
      let cell = "", inCode = false;
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        if (char === "\x60") { inCode = !inCode; cell += char; continue; }
        if (char === "|" && !inCode) { cells.push(cell.trim()); cell = ""; }
        else cell += char;
      }
      cells.push(cell.trim());
      if (!cells[0]) cells.shift();
      if (!cells[cells.length - 1]) cells.pop();
      return cells;
    };
    const isSeparator = (row) => Array.isArray(row) && row.length > 0 && row.every(cell => /^:?-{3,}:?$/.test(cell.trim()));
    const tableAt = (lines, index) => {
      const compact = splitPipeRows(lines[index] || "");
      if (compact.length >= 3 && isSeparator(compact[1]) && compact[0].length === compact[1].length) {
        return { rows: compact, consumed: 1, hasSeparator: true };
      }
      const header = pipeCells(lines[index] || "");
      if (header.length < 2 || index + 1 >= lines.length) return null;
      const second = pipeCells(lines[index + 1] || "");
      if (second.length < 2) return null;
      if (isSeparator(second) && header.length === second.length) {
        const rows = [header, second];
        let cursor = index + 2;
        while (cursor < lines.length) {
          const next = pipeCells(lines[cursor] || "");
          if (next.length < 2) break;
          rows.push(next);
          cursor++;
        }
        return { rows, consumed: cursor - index, hasSeparator: true };
      }
      if (isSeparator(header) || isSeparator(second) || second.length !== header.length) return null;
      const rows = [header, second];
      let cursor = index + 2;
      while (cursor < lines.length) {
        const next = pipeCells(lines[cursor] || "");
        if (next.length !== header.length || isSeparator(next)) break;
        rows.push(next);
        cursor++;
      }
      return { rows, consumed: cursor - index, hasSeparator: false };
    };
    const renderTable = (rows, hasSeparator = true) => {
      const columns = rows[0].length;
      const header = rows[0].slice(0, columns).map(cell => "<th scope=\"col\">" + inline(cell) + "</th>").join("");
      const body = rows.slice(hasSeparator ? 2 : 1).map(row => {
        const cells = Array.from({ length: columns }, (_, i) => row[i] || "");
        return "<tr>" + cells.map(cell => "<td>" + inline(cell) + "</td>").join("") + "</tr>";
      }).join("");
      return '<div class="fa-table-scroll" role="region" aria-label="Table" tabindex="0"><table><thead><tr>' +
        header + "</tr></thead><tbody>" + body + "</tbody></table></div>";
    };
    const lines = faMathCleanup(value).split(/\r?\n/);
    const out = [];
    let list = "", orderedNext = null, paragraph = [];
    const flush = () => {
      if (paragraph.length) {
        out.push("<p>" + inline(paragraph.join("\n")) + "</p>");
        paragraph = [];
      }
    };
    const close = () => {
      if (list) { out.push("</" + list + ">"); list = ""; }
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) { flush(); close(); continue; }
      const fence = line.match(/^(\x60{3,}|~{3,})/);
      if (fence) {
        flush(); close();
        const marker = fence[1], markerChar = marker[0];
        let cursor = i + 1;
        while (cursor < lines.length) {
          const candidate = lines[cursor].trim();
          const closes = markerChar === "\x60" ? /^\x60{3,}\s*$/.test(candidate) : /^~{3,}\s*$/.test(candidate);
          if (closes && candidate.length >= marker.length) break;
          cursor++;
        }
        out.push("<pre><code>" + faSafe(lines.slice(i + 1, cursor).join("\n")) + "</code></pre>");
        i = cursor < lines.length ? cursor : lines.length - 1;
        orderedNext = null;
        continue;
      }
      const table = tableAt(lines, i);
      if (table) {
        flush(); close(); out.push(renderTable(table.rows, table.hasSeparator)); orderedNext = null;
        i += table.consumed - 1;
        continue;
      }
      if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
        flush(); close(); out.push("<hr>"); orderedNext = null; continue;
      }
      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flush(); close();
        const level = Math.min(heading[1].length + 1, 5);
        out.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        orderedNext = null;
        continue;
      }
      const bullet = line.match(/^[-*•]\s+(.+)$/);
      if (bullet) {
        flush();
        if (list !== "ul") { close(); list = "ul"; out.push("<ul>"); }
        out.push("<li>" + inline(bullet[1]) + "</li>");
        continue;
      }
      const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
      if (numbered) {
        flush();
        const number = Math.max(1, Number(numbered[1]) || 1);
        if (list === "ol" && number === 1 && orderedNext && orderedNext !== 1) close();
        if (list !== "ol") {
          close();
          out.push("<ol" + (number !== 1 ? ' start="' + number + '"' : "") + ">");
          list = "ol";
          orderedNext = number;
        }
        const valueAttribute = number !== orderedNext ? ' value="' + number + '"' : "";
        out.push("<li" + valueAttribute + ">" + inline(numbered[2]) + "</li>");
        orderedNext = number + 1;
        continue;
      }
      close();
      paragraph.push(line);
    }
    flush(); close();
    return out.join("");
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
  async function faTutorRequest(payload) { return api("/functions/v1/" + FA_TUTOR_FUNCTION_SLUG, { m: "POST", body: payload }); }
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

  function faVoiceLanguage() { return FA_VOICE.language === "en-US" ? "en-US" : "fr-FR"; }
  function faVoiceStatus(message) { const status = faEl("faVoiceStatus"); if (status) status.textContent = message; }
  function faStopSpeaking() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); FA_VOICE.speaking = false; }
  function faSpeakTutorAnswer(index) {
    const message = FA_AI.messages[index];
    if (!message || message.role !== "assistant") return;
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") { faVoiceStatus("Spoken answers are not supported by this browser."); return; }
    faStopSpeaking();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = faVoiceLanguage(); utterance.rate = 0.92;
    utterance.onstart = () => { FA_VOICE.speaking = true; faVoiceStatus("Speaking the answer…"); };
    utterance.onend = () => { FA_VOICE.speaking = false; faVoiceStatus("Finished speaking."); };
    utterance.onerror = () => { FA_VOICE.speaking = false; faVoiceStatus("Could not play the spoken answer."); };
    window.speechSynthesis.speak(utterance);
  }
  function faStartVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { faVoiceStatus("Voice input is not supported here. Try Chrome on Android or type your message."); return; }
    if (FA_VOICE.listening && FA_VOICE.recognition) { FA_VOICE.recognition.stop(); return; }
    const input = faEl("faTutorInput"); if (!input) return;
    const recognition = new Recognition(); recognition.lang = faVoiceLanguage();
    recognition.interimResults = true; recognition.continuous = false;
    FA_VOICE.recognition = recognition; FA_VOICE.listening = true;
    const button = faEl("faTutorMic"); if (button) button.textContent = "Stop listening";
    faVoiceStatus("Listening in " + (FA_VOICE.language === "fr-FR" ? "French" : "English") + "…");
    recognition.onresult = (event) => {
      let finalText = "", interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0] && event.results[i][0].transcript || "";
        if (event.results[i].isFinal) finalText += transcript; else interimText += transcript;
      }
      if (finalText) input.value = (input.value ? input.value.trimEnd() + " " : "") + finalText.trim();
      faVoiceStatus(finalText ? "Voice captured. Review the text, then press Ask Académie." : (interimText || "Listening…"));
    };
    recognition.onerror = (event) => {
      FA_VOICE.listening = false; if (button) button.textContent = "Speak";
      faVoiceStatus(event.error === "not-allowed" ? "Microphone permission was denied. Allow microphone access in browser settings." : "Voice input stopped: " + event.error + ".");
    };
    recognition.onend = () => {
      FA_VOICE.listening = false; FA_VOICE.recognition = null;
      const currentButton = faEl("faTutorMic"); if (currentButton) currentButton.textContent = "Speak";
      const status = faEl("faVoiceStatus");
      if (status && status.textContent === "Listening…") faVoiceStatus("No speech detected. Try again or type your message.");
    };
    try { recognition.start(); } catch (_) {
      FA_VOICE.listening = false; FA_VOICE.recognition = null;
      if (button) button.textContent = "Speak";
      faVoiceStatus("Could not start the microphone. Check browser permissions and try again.");
    }
  }

  function faTutorView() {
    if (!AUTH || !AUTH.user) { $.innerHTML = '<button class="g" id="faHome">← Home</button><h1>🤖 AI French tutor</h1><div class="card"><p>Sign in to use the tutor and keep your learning progress.</p><button id="faSignIn" style="width:100%">Sign in / Create account</button></div>'; return; }
    if (FA_AI.memoryUserId !== AUTH.user.id) {
      FA_AI.memoryUserId=AUTH.user.id;
      const saved=faLoadTutorLocalData(); FA_AI.conversations=saved.conversations; FA_AI.activeConversationId=saved.activeConversationId;
      FA_AI.memoryProfile=saved.memory; FA_AI.memoryEnabled=saved.memory.enabled===true; FA_AI.memoryLoaded=true; FA_AI.memoryLoading=false; FA_AI.memoryBusy=false;
      FA_AI.memoryStatus=FA_AI.memoryEnabled?"Learning memory is on for your account.":"Learning memory is off. Turn it on to save progress to your account.";
      const active=FA_AI.conversations.find(x=>x.id===FA_AI.activeConversationId);
      if(active){FA_AI.messages=active.messages.map(m=>({role:m.role,content:m.content}));FA_AI.level=active.level;FA_AI.mode=active.mode;FA_AI.depth=active.depth;}
      else{FA_AI.messages=[];FA_AI.activeConversationId=null;}
    }
    if(!FA_AI.activeConversationId)faStartTutorConversation();
    const messageHtml = FA_AI.messages.map((m, index) => '<div class="card" style="margin:8px 0"><b>' + (m.role === "user" ? "You" : "Académie AI") + '</b><div class="fa-answer" style="margin-top:8px;line-height:1.75">' + (m.role === "assistant" ? faMarkdown(m.content) : '<div style="white-space:pre-wrap">' + faSafe(m.content) + "</div>") + "</div>" + (m.role === "assistant" ? '<button class="g" type="button" data-fa-speak="' + index + '">🔊 Listen</button><p class="fa-tutor-answer-note" role="note">AI answers can contain mistakes. Check important points in a dictionary or grammar reference.</p>' : "") + "</div>").join("");
    const conversationOptions=FA_AI.conversations.slice().sort((a,b)=>b.updatedAt-a.updatedAt).map(item=>'<option value="'+faSafe(item.id)+'"'+(item.id===FA_AI.activeConversationId?" selected":"")+'>'+faSafe(item.title||"New conversation")+'</option>').join("");
    $.innerHTML = (typeof topbar === "function" ? topbar() : "") + '<button class="g" id="faHome">← Home</button><h1>🤖 Académie French Intelligence</h1><p class="mu">A French-language tutor for grammar, syntax, semantics, literature, history, translation, writing and contemporary usage. CEFR level is optional guidance.</p>' +
      '<div class="card fa-conversation-manager"><b>Your conversations</b><select class="inp" id="faConversationSelect" aria-label="Choose a saved conversation">'+conversationOptions+'</select><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="g" id="faNewConversation" type="button">＋ New chat</button><button class="g" id="faRenameConversation" type="button">Rename</button><button class="g" id="faDeleteConversation" type="button">Delete chat</button><button class="g" id="faClearAllConversations" type="button">Clear all chats</button></div><p class="mu">Conversations are stored in this browser. Your messages are still sent to the AI tutor when you ask a question.</p></div>' +
      '<div class="card"><label for="faTutorDepth"><b>Answer depth</b></label><select class="inp" id="faTutorDepth">' +
      '<option value="quick"' + (FA_AI.depth === "quick" ? " selected" : "") + '>Quick answer</option><option value="deep"' + (FA_AI.depth === "deep" ? " selected" : "") + '>Deep answer</option></select>' +
      '<label for="faTutorLevel"><b>Optional explanation style</b></label><select class="inp" id="faTutorLevel"><option value="none"' + (FA_AI.level === "none" ? " selected" : "") + '>No level restriction</option>' + ["A1","A2","B1","B2","C1","C2"].map((l) => '<option value="' + l + '"' + (l === FA_AI.level ? " selected" : "") + '>' + l + ' · optional learner scaffolding</option>').join("") + '</select><label for="faTutorMode"><b>Tool</b></label><select class="inp" id="faTutorMode">' + [["chat","Tutor answer"],["practice","Conversation practice"],["correct","Correct and analyse my French"],["translate","Translate French ↔ English"]].map((o) => '<option value="' + o[0] + '"' + (o[0] === FA_AI.mode ? " selected" : "") + '>' + o[1] + '</option>').join("") + "</select></div><div id=\"faTutorMessages\">" + (messageHtml || '<div class="card mu">Ask a question. Choose Quick answer for a focused explanation or Deep answer for a fuller treatment.</div>') + "</div>" +
      (FA_AI.pending ? '<div class="card mu">Preparing your answer…</div>' : "") + (FA_AI.error ? '<div class="err" role="alert">' + faSafe(FA_AI.error) + '</div>' : "") + (FA_AI.lastRequest ? '<button id="faTutorRetry" class="g" type="button"' + (FA_AI.pending ? ' disabled aria-disabled="true">Trying again...</button>' : ' aria-disabled="false">Try again</button>') : "") +
      '<div class="card fa-memory-panel"><label style="display:flex;align-items:center;gap:10px;font-weight:700"><input id="faMemoryEnabled" type="checkbox"' + (FA_AI.memoryEnabled ? " checked" : "") + (FA_AI.memoryBusy || !FA_AI.memoryLoaded ? " disabled" : "") + '> Remember my learning progress</label><p class="mu">When enabled, a small structured learning profile is saved securely to your account in Supabase. Prompts and chat transcripts are not stored in this profile.</p><p class="mu" id="faMemoryStatus" role="status" aria-live="polite">' + faSafe(FA_AI.memoryStatus || (FA_AI.memoryEnabled ? "Learning memory is on." : "Learning memory is off.")) + '</p>' + (FA_AI.memoryProfile && FA_AI.memoryProfile.interaction_count > 0 ? '<p class="mu">Saved tutor sessions: <b>' + Number(FA_AI.memoryProfile.interaction_count) + '</b>' + (Object.keys(FA_AI.memoryProfile.topic_counts || {}).length ? ' · Topics: ' + faSafe(Object.entries(FA_AI.memoryProfile.topic_counts).sort((a,b) => Number(b[1])-Number(a[1])).slice(0,5).map(([topic,count]) => topic.replace(/_/g," ") + " (" + Number(count) + ")").join(", ")) : "") + '</p>' : '<p class="mu">No learning activity has been saved yet.</p>') + '<button class="g" id="faMemoryClear" type="button"' + (FA_AI.memoryBusy || !FA_AI.memoryLoaded ? " disabled" : "") + '>Clear saved learning memory</button></div>' +
      '<div class="card fa-tutor-panel"><label for="faVoiceLanguage"><b>Voice language</b></label><select class="inp" id="faVoiceLanguage"><option value="fr-FR"' + (FA_VOICE.language === "fr-FR" ? " selected" : "") + '>French</option><option value="en-US"' + (FA_VOICE.language === "en-US" ? " selected" : "") + '>English</option></select><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="g" id="faTutorMic" type="button">Speak</button><button class="g" id="faTutorStopAudio" type="button">Stop audio</button></div><p class="mu" id="faVoiceStatus" role="status" aria-live="polite">Choose French or English, then use Speak to dictate your question.</p><p class="mu">Microphone access is requested only when you tap Speak. Voice recognition may be processed by your browser speech service; check its privacy settings.</p><textarea class="inp" id="faTutorInput" rows="5" placeholder="Ask anything about French: grammar, literature, idioms, translation, writing or language usage…"></textarea><button id="faTutorSend" style="width:100%"' + (FA_AI.pending ? " disabled" : "") + ">" + (FA_AI.pending ? "Please wait…" : "Ask Académie") + '</button><p class="mu">Answers come from an AI service and can contain mistakes. You need to be signed in to use the Tutor.</p></div>';
    if (typeof bindTop === "function") bindTop();
  }
  async function faSetTutorMemory(enabled) {
    const next = enabled === true;
    FA_AI.memoryBusy = true;
    FA_AI.memoryStatus = next ? "Enabling account learning memory…" : "Pausing account learning memory…";
    if (view === "tutor") render(true);
    try {
      const result = await faTutorRequest({ setLearningMemoryEnabled: next });
      if (!result || result.error || result.memoryEnabled !== next) throw new Error("Could not update account learning memory.");
      FA_AI.memoryEnabled = next;
      FA_AI.memoryProfile = FA_AI.memoryProfile || faEmptyLearningMemory();
      FA_AI.memoryProfile.enabled = next;
      FA_AI.memoryStatus = next ? "Learning memory is on for your account. Only structured progress is saved." : "Learning memory is paused. Existing saved progress is retained.";
      faSaveTutorLocalData();
    } catch (error) {
      FA_AI.memoryStatus = (error && error.message) || "Could not update learning memory. Please try again.";
      const checkbox = faEl("faMemoryEnabled"); if (checkbox) checkbox.checked = FA_AI.memoryEnabled;
    } finally { FA_AI.memoryBusy = false; if (view === "tutor") render(true); }
  }
  async function faClearTutorMemory() {
    if (!confirm("Permanently clear your saved learning memory from your account? Your saved conversations will remain.")) return;
    FA_AI.memoryBusy = true; FA_AI.memoryStatus = "Clearing account learning memory…"; if (view === "tutor") render(true);
    try {
      const result = await faTutorRequest({ clearLearningMemory: true });
      if (!result || result.error || result.memoryCleared !== true) throw new Error("Could not clear account learning memory.");
      FA_AI.memoryProfile = faEmptyLearningMemory(); FA_AI.memoryEnabled = false; FA_AI.memoryStatus = "Account learning memory cleared.";
      faSaveTutorLocalData();
    } catch (error) { FA_AI.memoryStatus = (error && error.message) || "Could not clear learning memory. Please try again."; }
    finally { FA_AI.memoryBusy = false; if (view === "tutor") render(true); }
  }
  function faRenameTutorConversation() {
    const item=FA_AI.conversations.find(x=>x.id===FA_AI.activeConversationId); if(!item)return;
    const next=window.prompt("Conversation name",item.title||"New conversation"); if(next===null)return;
    const title=next.trim().slice(0,80); if(!title)return; item.title=title; faSaveTutorLocalData(); render(true);
  }
  function faDeleteTutorConversation() {
    const item=FA_AI.conversations.find(x=>x.id===FA_AI.activeConversationId); if(!item||!confirm("Delete this saved conversation from this device? This cannot be undone."))return;
    FA_AI.conversations=FA_AI.conversations.filter(x=>x.id!==item.id); FA_AI.activeConversationId=null; FA_AI.messages=[]; FA_AI.lastRequest=null;
    if(!FA_AI.conversations.length)faStartTutorConversation(); else faActivateTutorConversation(FA_AI.conversations.slice().sort((a,b)=>b.updatedAt-a.updatedAt)[0].id);
    faSaveTutorLocalData(); if(view==="tutor")render(true);
  }
  function faClearAllTutorConversations() {
    if(!FA_AI.conversations.length||!confirm("Delete every saved tutor conversation from this device? Learning memory will remain."))return;
    FA_AI.conversations=[]; FA_AI.activeConversationId=null; FA_AI.messages=[]; FA_AI.lastRequest=null; FA_AI.error="";
    faStartTutorConversation(); if(view==="tutor")render(true);
  }
  async function faTutorSend(isRetry) {
    if (!faNeedSignIn() || FA_AI.pending) return;
    let request = FA_AI.lastRequest;
    if (!isRetry) {
      const input = faEl("faTutorInput"), text = input ? input.value.trim() : "";
      if (!text) return;
      FA_AI.level = faEl("faTutorLevel")?.value || "none";
      FA_AI.mode = faEl("faTutorMode")?.value || "chat";
      FA_AI.depth = faEl("faTutorDepth")?.value === "deep" ? "deep" : "quick";
      const history = FA_AI.messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
      request = { mode: FA_AI.mode, level: FA_AI.level, depth: FA_AI.depth, text, history, useLearningMemory: FA_AI.memoryEnabled === true };
      FA_AI.lastRequest = request;
      FA_AI.messages.push({ role: "user", content: text });
      FA_AI.messages = FA_AI.messages.slice(-100);
      const activeConversation=FA_AI.conversations.find(x=>x.id===FA_AI.activeConversationId);
      if(activeConversation&&activeConversation.title==="New conversation")activeConversation.title=String(text).replace(/\s+/g," ").slice(0,48);
      faSaveTutorLocalData();
    }
    if (!request) return;
    FA_AI.pending = true;
    FA_AI.error = "";
    faTutorView();
    try {
      const response = await faTutorRequest({
        mode: request.mode, level: request.level, depth: request.depth,
        text: request.text, history: request.history, useLearningMemory: request.useLearningMemory === true
      });
      const answer = response && typeof response.text === "string" ? response.text.trim() : "";
      if (response && response.learningMemory && request.useLearningMemory === true) {
        FA_AI.memoryProfile = response.learningMemory;
        FA_AI.memoryProfile.enabled = true;
        faSaveTutorLocalData();
      }
      if (!answer) {
        const code = response && response.error;
        if (code === "quota_exceeded") throw new Error("You have reached today's Tutor usage limit. Please try again tomorrow.");
        if (code === "quota_unavailable") throw new Error("Académie AI cannot reach the account usage service right now. Your question was not answered. Please try again later; if this continues, the app administrator must check the Supabase Tutor quota function and service-role configuration.");
        if (code === "provider_rate_limit") throw new Error("The AI provider is temporarily rate-limiting requests. Please try again shortly.");
        if (code === "provider_timeout") throw new Error("The Tutor took too long to respond. Please try again.");
        if (code === "provider_unavailable") throw new Error("The Tutor service is temporarily unavailable. Please try again.");
        throw new Error((response && response.message) || "The Tutor could not prepare an answer.");
      }
      FA_AI.messages.push({ role: "assistant", content: answer });
      FA_AI.messages = FA_AI.messages.slice(-100);
      FA_AI.lastRequest = null;
      const activeConversation=FA_AI.conversations.find(x=>x.id===FA_AI.activeConversationId);
      if(activeConversation&&activeConversation.title==="New conversation")activeConversation.title=String(request.text||"French tutor session").replace(/\s+/g," ").slice(0,48);
      faUpdateLocalLearningMemory(request); faSaveTutorLocalData();
    } catch (error) {
      FA_AI.error = (error && error.message) || "The Tutor could not answer just now.";
      faSaveTutorLocalData();
    } finally {
      FA_AI.pending = false;
      render(true);
      const messages = faEl("faTutorMessages");
      if (messages) messages.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }

  function faDictSourceLinks() {
    return '<div class="card fa-dictionary-sources"><h3>Dictionary sources</h3><p class="mu">The in-app entry loads French-language Wiktionnaire definitions live. The app also resolves matching Académie française article links and checks CNRTL/TLFi page availability live; protected CNRTL/TLFi editorial text stays on its original site.</p><p class="mu">Wiktionnaire data is licensed CC BY-SA and attributed. Protected dictionary text is not copied from CNRTL/TLFi.</p></div>';
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
    const section = (title, body, note, className) => body ? '<section' + (className ? ' class="' + faSafe(className) + '"' : '') + ' style="margin-top:20px;padding-top:15px;border-top:1px solid var(--line,rgba(127,127,127,.22))"><h3 style="margin:0 0 10px">' + title + '</h3>' + body + (note ? '<p class="mu" style="font-size:.84em;margin-top:8px">' + note + '</p>' : '') + '</section>' : '';
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
      section('References and attribution', sources, '', 'fa-references-attribution') +
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
    else if (button.id === "faTutorMic") faStartVoiceInput();
    else if (button.id === "faTutorStopAudio") { faStopSpeaking(); faVoiceStatus("Audio stopped."); }
    else if (button.id === "faMemoryClear") faClearTutorMemory();
    else if (button.id === "faNewConversation") { faSaveTutorLocalData(); faStartTutorConversation(); render(true); }
    else if (button.id === "faRenameConversation") faRenameTutorConversation();
    else if (button.id === "faDeleteConversation") faDeleteTutorConversation();
    else if (button.id === "faClearAllConversations") faClearAllTutorConversations();
    else if (button.hasAttribute("data-fa-speak")) faSpeakTutorAnswer(Number(button.getAttribute("data-fa-speak")));
    else if (button.id === "faTutorSend") await faTutorSend();
    else if (button.id === "faTutorRetry") await faTutorSend(true);
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
  document.addEventListener("change", (event) => {
    if (event.target && event.target.id === "faConversationSelect") { faSaveTutorLocalData(); faActivateTutorConversation(event.target.value); return; }
    if (event.target && event.target.id === "faMemoryEnabled") {
      faSetTutorMemory(event.target.checked);
      return;
    }
    if (event.target && event.target.id === "faVoiceLanguage") {
      FA_VOICE.language = event.target.value === "en-US" ? "en-US" : "fr-FR";
      if (FA_VOICE.listening && FA_VOICE.recognition) FA_VOICE.recognition.stop();
      faVoiceStatus("Voice language set to " + (FA_VOICE.language === "fr-FR" ? "French" : "English") + ".");
    }
  });
  document.addEventListener("input", (event) => { if (event.target && event.target.id === "faRosterSearch") faRefreshRoster(); });
  document.addEventListener("keydown", (event) => {
    if (event.target && event.target.id === "faTutorInput" && event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); faTutorSend(); }
    if (event.target && event.target.id === "faDictInput" && event.key === "Enter") { event.preventDefault(); faDictionaryLookup(); }
  });
  // Narrow bridge: the standalone voice module reuses existing auth and learner state.
  window.FA_LIVE_VOICE_CONTEXT = {
    isSignedIn: () => !!(AUTH && AUTH.user),
    level: () => (faEl("faTutorLevel") && faEl("faTutorLevel").value) || FA_AI.level || "none",
    request: (body) => api("/functions/v1/live-voice-session", { m: "POST", body }),
    groqTurn: async (formData) => {
      if (!(formData instanceof FormData)) throw new Error("Invalid voice payload.");
      const response = await fetch(SBURL.replace(/\\/$/, "") + "/functions/v1/live-voice-groq", {
        method: "POST",
        headers: { apikey: SBKEY, Authorization: "Bearer " + AUTH.access_token },
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Groq voice turn failed.");
      return result;
    },
    context: () => ({
      level: (faEl("faTutorLevel") && faEl("faTutorLevel").value) || FA_AI.level || "none",
      topics: FA_AI.memoryEnabled && FA_AI.memoryProfile ? Object.keys(FA_AI.memoryProfile.topic_counts || {}).filter(k => FA_AI.memoryProfile.topic_counts[k] > 0).slice(0, 12) : [],
      recent: FA_AI.messages.slice(-6).map(m => ({ role: m.role, content: String(m.content || "").slice(0, 500) }))
    }),
    appendTranscript: (role, content) => {
      const text = String(content || "").trim().slice(0, 4000);
      if (!text || !FA_AI.activeConversationId) return;
      FA_AI.messages.push({ role, content: text });
      FA_AI.messages = FA_AI.messages.slice(-100);
      const active = FA_AI.conversations.find(x => x.id === FA_AI.activeConversationId);
      if (active && active.title === "New conversation" && role === "user") active.title = text.replace(/\\s+/g, " ").slice(0, 48);
      faSaveTutorLocalData();
    },
    recordVoiceTurn: async (text) => {
      if (!FA_AI.memoryEnabled || !text) return;
      const result = await faTutorRequest({
        recordVoiceLearningInteraction: true,
        useLearningMemory: true,
        level: (faEl("faTutorLevel") && faEl("faTutorLevel").value) || FA_AI.level || "none",
        text: String(text).slice(0, 1800)
      });
      if (result && result.learningMemory) {
        FA_AI.memoryProfile = result.learningMemory;
        FA_AI.memoryEnabled = result.learningMemory.enabled === true;
        faSaveTutorLocalData();
      }
      return result;
    }
  };
  const faLiveVoiceScript = document.createElement("script");
  faLiveVoiceScript.src = new URL("./live-voice.js", FA_SCRIPT_URL || document.baseURI).href;
  faLiveVoiceScript.async = true;
  document.head.appendChild(faLiveVoiceScript);
})();