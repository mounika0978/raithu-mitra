const $ = (id) => document.getElementById(id);
const messages = $("messages");
const welcome = $("welcome");
const input = $("messageInput");
const language = $("language");
const toast = $("toast");
let selectedPhoto = null;
let toastTimer;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function getProfile() {
  return {
    village: $("village").value.trim(),
    mandal: $("mandal").value.trim(),
    district: $("district").value.trim(),
    crop: $("crop").value,
    sowing_date: $("sowingDate").value,
    growth_stage: $("growthStage").value,
    soil_type: $("soilType").value,
    water_availability: $("waterAvailability").value
  };
}
function showConversation() {
  welcome.style.display = "none";
  messages.classList.add("active");
}
function addMessage(role, text, extras = {}) {
  showConversation();
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "assistant" ? "🌱" : "👩‍🌾";
  const body = document.createElement("div");
  body.className = "message-body";
  if (role === "assistant") {
    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = "RAITHUMITRA AI";
    body.appendChild(label);
  }
  const content = document.createElement("div");
  content.className = "message-text";
  content.textContent = text;
  body.appendChild(content);

  if (extras.sources && extras.sources.length) {
    const sourceBox = document.createElement("div");
    sourceBox.className = "sources";
    sourceBox.textContent = "Suggested knowledge references: ";
    extras.sources.forEach((source, index) => {
      if (index) sourceBox.append(" · ");
      if (source.url) {
        const a = document.createElement("a");
        a.href = source.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.textContent = source.title;
        sourceBox.appendChild(a);
      } else sourceBox.append(document.createTextNode(source.title));
    });
    body.appendChild(sourceBox);
  }
  if (role === "assistant") {
    const note = document.createElement("div");
    note.className = "mode-note";
    note.textContent = extras.mode || "Demo response · verify important decisions with a local agricultural expert.";
    body.appendChild(note);
    const tools = document.createElement("div");
    tools.className = "message-tools";
    const speak = document.createElement("button");
    speak.className = "mini-tool"; speak.type = "button"; speak.textContent = "🔊 Read aloud";
    speak.addEventListener("click", () => speakText(text));
    tools.appendChild(speak);
    const copy = document.createElement("button");
    copy.className = "mini-tool"; copy.type = "button"; copy.textContent = "Copy answer";
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(text); showToast("Answer copied."); }
      catch { showToast("Copy is unavailable in this browser."); }
    });
    tools.appendChild(copy);
    body.appendChild(tools);
  }
  if (role === "user") { body.appendChild(content); row.appendChild(body); row.appendChild(avatar); }
  else { row.appendChild(avatar); row.appendChild(body); }
  messages.appendChild(row);
  row.scrollIntoView({behavior:"smooth", block:"nearest"});
  return row;
}
function speakText(text) {
  if (!("speechSynthesis" in window)) { showToast("Text-to-speech is not supported in this browser."); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language.value === "te" ? "te-IN" : "en-IN";
  window.speechSynthesis.speak(utterance);
}
function addTyping() {
  const row = document.createElement("div");
  row.className = "message assistant";
  row.id = "typingRow";
  row.innerHTML = '<div class="avatar">🌱</div><div class="message-body"><div class="message-label">RAITHUMITRA AI</div><div class="typing"><span></span><span></span><span></span></div></div>';
  messages.appendChild(row);
  row.scrollIntoView({behavior:"smooth", block:"nearest"});
}
async function sendMessage(text) {
  const message = (text ?? input.value).trim();
  if (!message && !selectedPhoto) return;
  if (message) addMessage("user", message);
  input.value = ""; autoResize();
  if (selectedPhoto) {
    const photo = selectedPhoto;
    selectedPhoto = null;
    $("uploadPreview").hidden = true;
    $("cropPhoto").value = "";
    try {
      const formData = new FormData(); formData.append("file", photo);
      const res = await fetch("/api/crop-photo", {method:"POST", body:formData});
      const data = await res.json();
      addMessage("assistant", data.message || "Photo received, but diagnosis is not configured.", {mode:"Image upload demo · no crop-diagnosis model is connected."});
    } catch {
      addMessage("assistant", "The photo could not be sent to the local demo server. Please check that the server is running.");
    }
    if (!message) return;
  }
  addTyping();
  try {
    const res = await fetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message, language:language.value, profile:getProfile()})
    });
    if (!res.ok) throw new Error("Server returned an error.");
    const data = await res.json();
    $("typingRow")?.remove();
    addMessage("assistant", data.answer, {sources:data.sources, mode:data.mode});
  } catch (err) {
    $("typingRow")?.remove();
    addMessage("assistant", "I couldn't connect to the local assistant. Make sure the FastAPI server is running, then try again.", {mode:"Connection error · no answer was generated."});
  }
}
function autoResize() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
}
$("chatForm").addEventListener("submit", e => {e.preventDefault(); sendMessage();});
input.addEventListener("input", autoResize);
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
document.querySelectorAll("[data-prompt]").forEach(btn => btn.addEventListener("click", () => sendMessage(btn.dataset.prompt)));
$("newChat").addEventListener("click", () => {
  messages.replaceChildren();
  messages.classList.remove("active");
  welcome.style.display = "";
  input.value = ""; autoResize();
  if (window.innerWidth <= 850) $("sidebar").classList.remove("open");
  showToast("Started a new conversation.");
});
$("profileForm").addEventListener("submit", e => {
  e.preventDefault();
  $("saveStatus").textContent = "Profile saved for this page session ✓";
  showToast("Farm profile saved for this session.");
});
$("menuToggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.addEventListener("click", e => {
  if (window.innerWidth <= 850 && $("sidebar").classList.contains("open") &&
      !$("sidebar").contains(e.target) && !e.target.closest("#menuToggle")) $("sidebar").classList.remove("open");
});
$("cropPhoto").addEventListener("change", e => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("Please select an image file."); return; }
  selectedPhoto = file;
  $("uploadPreview").hidden = false;
  $("uploadPreview").textContent = `📷 ${file.name} selected. Send a message to upload it. The demo does not diagnose images.`;
});
$("voiceButton").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast("Voice input is not supported here. Please type your question."); return; }
  const recognition = new SpeechRecognition();
  recognition.lang = language.value === "te" ? "te-IN" : "en-IN";
  recognition.interimResults = false;
  recognition.onstart = () => showToast("Listening… speak your question.");
  recognition.onresult = event => {
    input.value = event.results[0][0].transcript;
    autoResize(); input.focus();
  };
  recognition.onerror = () => showToast("Voice input failed. You can type instead.");
  recognition.start();
});
