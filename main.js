// Simple, offline-friendly communication board for touch devices.
// Features: categories, big emoji cards, sentence strip, TTS speech,
// quick phrases, high contrast, font scaling, basic settings.

// Content: customize labels/emojis to your child's preferences.
const CONTENT = {
  needs: [
    { label: "I want", emoji: "🟢" },
    { label: "I need", emoji: "🔵" },
    { label: "Food", emoji: "🍎" },
    { label: "Drink", emoji: "🥤" },
    { label: "Bathroom", emoji: "🚽" },
    { label: "Help", emoji: "🆘" },
    { label: "More", emoji: "➕" },
    { label: "All done", emoji: "✅" },
    { label: "Break", emoji: "⏸️" },
    { label: "Stop", emoji: "🛑" },
  ],
  feelings: [
    { label: "Happy", emoji: "😊" },
    { label: "Sad", emoji: "😢" },
    { label: "Mad", emoji: "😡" },
    { label: "Scared", emoji: "😨" },
    { label: "Tired", emoji: "😴" },
    { label: "Excited", emoji: "🤩" },
    { label: "Okay", emoji: "🙂" },
    { label: "Sick", emoji: "🤒" },
  ],
  actions: [
    { label: "Play", emoji: "🎲" },
    { label: "Go", emoji: "🏃" },
    { label: "Look", emoji: "👀" },
    { label: "Listen", emoji: "👂" },
    { label: "Read", emoji: "📖" },
    { label: "Watch", emoji: "📺" },
    { label: "Open", emoji: "👐" },
    { label: "Close", emoji: "✋" },
  ],
  people: [
    { label: "Mom", emoji: "👩" },
    { label: "Dad", emoji: "👨" },
    { label: "Me", emoji: "🧒" },
    { label: "Teacher", emoji: "👩‍🏫" },
    { label: "Friend", emoji: "🧑‍🤝‍🧑" },
    { label: "Baby", emoji: "👶" },
  ],
  places: [
    { label: "Home", emoji: "🏠" },
    { label: "School", emoji: "🏫" },
    { label: "Park", emoji: "🏞️" },
    { label: "Store", emoji: "🏪" },
    { label: "Car", emoji: "🚗" },
    { label: "Doctor", emoji: "🏥" },
  ],
  favorites: [
    { label: "Balls", emoji: "⚽" },
    { label: "Blocks", emoji: "🧱" },
    { label: "Cars", emoji: "🚙" },
    { label: "Animals", emoji: "🐶" },
    { label: "Music", emoji: "🎶" },
    { label: "Drawing", emoji: "✏️" },
  ],
};

// Quick phrases: whole sentences in one tap
const QUICK_PHRASES = [
  "I want more.",
  "Help please.",
  "All done.",
  "I need a break.",
  "Hello!",
  "Thank you.",
];

const sentenceWordsEl = document.getElementById("sentenceWords");
const gridEl = document.querySelector("main.grid");
const tabsEl = document.querySelector(".tabs");
const quickListEl = document.getElementById("quickList");

const speakBtn = document.getElementById("speakBtn");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const repeatBtn = document.getElementById("repeatBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettings");
const highContrastToggle = document.getElementById("highContrastToggle");
const voiceSelect = document.getElementById("voiceSelect");

const biggerBtn = document.getElementById("biggerBtn");
const smallerBtn = document.getElementById("smallerBtn");

let currentTab = "needs";
let sentence = [];
let lastSpoken = "";
let voices = [];
let selectedVoiceName = localStorage.getItem("voiceName") || null;

// Render helpers
function renderTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === currentTab);
    btn.setAttribute("aria-selected", btn.dataset.tab === currentTab ? "true" : "false");
  });
}

function renderGrid() {
  gridEl.innerHTML = "";
  const items = CONTENT[currentTab] || [];
  for (const item of items) {
    const card = document.createElement("button");
    card.className = "card";
    card.setAttribute("aria-label", item.label);
    card.innerHTML = `
      <div class="emoji">${item.emoji}</div>
      <div class="label">${item.label}</div>
    `;
    card.addEventListener("click", () => addWord(item));
    gridEl.appendChild(card);
  }
}

function renderSentence() {
  sentenceWordsEl.innerHTML = "";
  sentence.forEach((w, idx) => {
    const chip = document.createElement("div");
    chip.className = "word-chip";
    chip.innerHTML = `<span class="emoji">${w.emoji || ""}</span><span>${w.label}</span>`;
    chip.addEventListener("click", () => {
      // Remove word by tap
      sentence.splice(idx, 1);
      renderSentence();
    });
    sentenceWordsEl.appendChild(chip);
  });
}

function renderQuickPhrases() {
  quickListEl.innerHTML = "";
  QUICK_PHRASES.forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "quick-item";
    btn.textContent = text;
    btn.addEventListener("click", () => speakText(text));
    quickListEl.appendChild(btn);
  });
}

// Sentence actions
function addWord(item) {
  sentence.push(item);
  renderSentence();
  // Short audio feedback
  clickHaptic();
  speakText(item.label, { immediate: false, short: true });
}

function speakSentence() {
  const text = sentence.map((w) => w.label).join(" ");
  if (!text) return;
  speakText(text);
  lastSpoken = text;
}

function clearSentence() {
  sentence = [];
  renderSentence();
}

function undoWord() {
  sentence.pop();
  renderSentence();
}

function repeatLast() {
  if (lastSpoken) speakText(lastSpoken);
}

// Speech synthesis
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });
  if (selectedVoiceName) {
    voiceSelect.value = selectedVoiceName;
  }
}

function speakText(text, opts = {}) {
  if (!("speechSynthesis" in window)) {
    // Fallback: simple beep via AudioContext
    try { beep(); } catch {}
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  const preferred = voices.find((v) => v.name === voiceSelect.value);
  if (preferred) utter.voice = preferred;
  utter.rate = opts.short ? 1.2 : 0.95; // slightly slower for clarity
  utter.pitch = 1.0;
  utter.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  g.gain.value = 0.05;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), 120);
}

function clickHaptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

// Settings & accessibility
settingsBtn.addEventListener("click", () => {
  settingsModal.setAttribute("aria-hidden", "false");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.setAttribute("aria-hidden", "true");
});

highContrastToggle.addEventListener("change", (e) => {
  document.body.classList.toggle("high-contrast", e.target.checked);
  localStorage.setItem("highContrast", e.target.checked ? "1" : "0");
});

voiceSelect.addEventListener("change", () => {
  selectedVoiceName = voiceSelect.value;
  localStorage.setItem("voiceName", selectedVoiceName);
});

biggerBtn.addEventListener("click", () => adjustFont(0.05));
smallerBtn.addEventListener("click", () => adjustFont(-0.05));

function adjustFont(delta) {
  const style = getComputedStyle(document.documentElement);
  const current = parseFloat(style.getPropertyValue("--size"));
  const next = Math.min(Math.max(current + delta, 0.75), 1.4);
  document.documentElement.style.setProperty("--size", `${next}rem`);
  localStorage.setItem("fontSize", `${next}`);
}

// Tabs & interactions
tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  currentTab = btn.dataset.tab;
  renderTabs();
  renderGrid();
  clickHaptic();
});

speakBtn.addEventListener("click", speakSentence);
clearBtn.addEventListener("click", clearSentence);
undoBtn.addEventListener("click", undoWord);
repeatBtn.addEventListener("click", repeatLast);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Restore preferences
  const hc = localStorage.getItem("highContrast") === "1";
  if (hc) {
    document.body.classList.add("high-contrast");
    highContrastToggle.checked = true;
  }
  const savedSize = parseFloat(localStorage.getItem("fontSize"));
  if (!isNaN(savedSize)) {
    document.documentElement.style.setProperty("--size", `${savedSize}rem`);
  }

  renderTabs();
  renderGrid();
  renderSentence();
  renderQuickPhrases();

  // Load voices (async on some browsers)
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  // Prevent double-tap zoom
  document.addEventListener("touchend", (e) => {
    e.preventDefault();
  }, { passive: false });
});
