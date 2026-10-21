const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

/* ---------- Eigen cursor ---------- */
if (finePointer && !reduceMotion) {
  const dot = document.querySelector(".cursor");
  const ring = document.querySelector(".cursor-ring");
  const label = document.querySelector(".cursor-label");
  let mx = -100, my = -100, rx = -100, ry = -100;

  document.documentElement.classList.add("has-cursor");

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  // De ring volgt met wat vertraging
  (function follow() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();

  document.addEventListener("mouseover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    const link = e.target.closest("a, button");
    ring.classList.toggle("hover", !!labelled);
    ring.classList.toggle("link", !labelled && !!link);
    label.textContent = labelled ? labelled.dataset.cursor : "";
  });

  window.addEventListener("mousedown", () => ring.classList.add("down"));
  window.addEventListener("mouseup", () => ring.classList.remove("down"));
  document.addEventListener("mouseleave", () => (ring.style.opacity = dot.style.opacity = 0));
  document.addEventListener("mouseenter", () => (ring.style.opacity = dot.style.opacity = ""));
}

/* ---------- Magnetische knoppen ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.4;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  });
}

/* ---------- Wiebelende letters in titels ---------- */
document.querySelectorAll(".wobble").forEach((el) => {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.textContent = "";
  text.split(/(\s+)/).forEach((word) => {
    if (/^\s+$/.test(word)) {
      el.append(" ");
      return;
    }
    const w = document.createElement("span");
    w.style.whiteSpace = "nowrap";
    w.setAttribute("aria-hidden", "true");
    [...word].forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      w.append(s);
    });
    el.append(w);
  });

  el.addEventListener("mouseover", (e) => {
    const ch = e.target.closest(".ch");
    if (!ch) return;
    ch.classList.add("hit");
    setTimeout(() => ch.classList.remove("hit"), 500);
  });
});

/* ---------- Hero: varianten ---------- */
const pairs = [
  ["#5E1742", "#FFE4D9"], ["#5E1742", "#FF5E35"],
  ["#962E40", "#FFE4D9"],
  ["#C9463D", "#FFFFFF"], ["#C9463D", "#330136"],
  ["#FF5E35", "#330136"],
  ["#FFE4D9", "#330136"], ["#FFE4D9", "#C9463D"],
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function applyVariant(tile) {
  let pair;
  do pair = pick(pairs);
  while (pair[0] === tile.dataset.bg);
  tile.dataset.bg = pair[0];
  tile.style.setProperty("--tile-bg", pair[0]);
  tile.style.setProperty("--tile-fg", pair[1]);
  tile.style.setProperty("--tile-wdth", pick([75, 82, 90, 100]));
  tile.style.setProperty("--tile-wght", pick([300, 500, 700, 800]));
  tile.classList.remove("pop");
  void tile.offsetWidth;
  tile.classList.add("pop");
}

// Lettergrootte zodat de titel in elk formaat past (gemeten met de breedste variant)
function fitTile(tile) {
  const span = tile.querySelector("span");
  const isBanner = tile.classList.contains("t-banner");
  const box = tile.getBoundingClientRect();
  let size = isBanner ? box.height * 0.5 : Math.min(box.width * 0.2, box.height * 0.22);

  span.style.transition = "none";
  span.style.fontVariationSettings = '"wdth" 100';
  span.style.fontWeight = "800";
  span.style.whiteSpace = isBanner ? "nowrap" : "normal";
  span.style.fontSize = size + "px";
  const room = tile.clientWidth - parseFloat(getComputedStyle(tile).paddingLeft) * 2;
  while (size > 12 && span.scrollWidth > room) {
    size *= 0.94;
    span.style.fontSize = size + "px";
  }
  span.style.fontVariationSettings = "";
  span.style.fontWeight = "";
  span.style.transition = "";
}

const tiles = [...document.querySelectorAll(".tile")];

tiles.forEach((tile) => {
  applyVariant(tile);
  tile.classList.remove("pop");
  tile.addEventListener("click", (e) => {
    e.stopPropagation();
    applyVariant(tile);
  });

  // Kantelen met de muis
  if (finePointer && !reduceMotion) {
    tile.addEventListener("mousemove", (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 16 + "deg");
      tile.style.setProperty("--rx", ((e.clientY - r.top) / r.height - 0.5) * -16 + "deg");
    });
    tile.addEventListener("mouseleave", () => {
      tile.style.setProperty("--rx", "0deg");
      tile.style.setProperty("--ry", "0deg");
    });
  }
});

document.fonts.ready.then(() => tiles.forEach(fitTile));
tiles.forEach(fitTile);
window.addEventListener("resize", () => tiles.forEach(fitTile));

// Laadmoment: de batch verschijnt tile per tile
tiles.forEach((tile, i) => {
  setTimeout(() => tile.classList.add("stamped"), reduceMotion ? 0 : 200 + i * 120);
});

document.querySelector(".regen").addEventListener("click", () => {
  tiles.forEach((tile, i) => setTimeout(() => applyVariant(tile), reduceMotion ? 0 : i * 80));
});

// Klik ergens in de hero: een stempel
const hero = document.querySelector(".hero");
hero.addEventListener("click", (e) => {
  if (reduceMotion || e.target.closest("a, button, .tile")) return;
  const r = hero.getBoundingClientRect();
  const [bg, fg] = pick(pairs);
  const s = document.createElement("span");
  s.className = "stamp";
  s.textContent = "C/A";
  s.style.left = e.clientX - r.left + "px";
  s.style.top = e.clientY - r.top + "px";
  s.style.background = bg;
  s.style.color = fg;
  s.style.setProperty("--rot", Math.random() * 30 - 15 + "deg");
  hero.append(s);
  s.addEventListener("animationend", () => s.remove());
});

/* ---------- Navigatie en paginakleur ---------- */
const chapters = [...document.querySelectorAll(".chapter")];
const navLinks = [...document.querySelectorAll(".nav a")];
const nav = document.querySelector(".nav");

function setActive(id) {
  document.body.dataset.tone = document.getElementById(id).dataset.tone;
  navLinks.forEach((link) => {
    const on = link.getAttribute("href") === "#" + id;
    link.classList.toggle("active", on);
    if (on) {
      link.setAttribute("aria-current", "true");
      if (nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
      }
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

const chapterObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
  { rootMargin: "-45% 0px -50% 0px" }
);
chapters.forEach((c) => chapterObserver.observe(c));

new IntersectionObserver(
  ([entry]) => {
    if (!entry.isIntersecting) return;
    document.body.dataset.tone = "plum";
    navLinks.forEach((l) => {
      l.classList.remove("active");
      l.removeAttribute("aria-current");
    });
  },
  { threshold: 0.4 }
).observe(hero);

// Voortgangsbalk onder de navigatie
const bar = document.querySelector(".progress span");
function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
}
addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);
updateProgress();

/* ---------- Processtroken ---------- */
async function playFlow(flow) {
  const steps = flow.querySelectorAll(".flow-step");
  steps.forEach((s) => s.classList.remove("lit"));
  for (const step of steps) {
    await wait(280);
    step.classList.add("lit");
  }
}

const flowObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      playFlow(entry.target);
      flowObserver.unobserve(entry.target);
    }),
  { threshold: 0.6 }
);

document.querySelectorAll(".flow").forEach((flow) => {
  flowObserver.observe(flow);
  flow.setAttribute("data-cursor", "Replay");
  flow.addEventListener("click", () => playFlow(flow));
});

/* ---------- Demo: batch van productfoto's ---------- */
const photosEl = document.querySelector(".photos");
const productColors = ["#FFE4D9", "#C9463D", "#330136", "#962E40", "#5E1742", "#FF5E35"];
const photos = [];
for (let i = 0; i < 12; i++) {
  const p = document.createElement("div");
  p.className = "photo";
  p.style.setProperty("--prod", productColors[i % productColors.length]);
  p.innerHTML = "<i></i><b></b>";
  photosEl.append(p);
  photos.push(p);
}

const playBtn = document.querySelector(".play-batch");
const countEl = document.querySelector(".batch-count");
let batchRunning = false;

playBtn.addEventListener("click", async () => {
  if (batchRunning) return;
  batchRunning = true;
  photos.forEach((p) => (p.className = "photo"));
  countEl.textContent = `0 van ${photos.length} verwerkt`;
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    p.classList.add("resized");
    await wait(90);
    p.classList.add("filled");
    await wait(90);
    p.classList.add("branded");
    await wait(90);
    p.classList.add("done");
    countEl.textContent = `${i + 1} van ${photos.length} verwerkt`;
  }
  playBtn.textContent = "Nog een keer";
  batchRunning = false;
});

/* ---------- Demo: één template, drie formaten ---------- */
const frame = document.querySelector(".format-frame");
const formatButtons = [...document.querySelectorAll(".format-switch button")];
const formats = ["post", "story", "banner"];

function setFormat(f) {
  frame.dataset.format = f;
  formatButtons.forEach((b) => {
    b.classList.toggle("active", b.dataset.format === f);
    b.setAttribute("aria-pressed", b.dataset.format === f);
  });
}

formatButtons.forEach((b) => b.addEventListener("click", () => setFormat(b.dataset.format)));
frame.addEventListener("click", () => {
  setFormat(formats[(formats.indexOf(frame.dataset.format) + 1) % formats.length]);
});

/* ---------- Demo: AI-beelden in één stijl ---------- */
const gen = document.querySelector(".gen-grid");
const genTiles = [...gen.querySelectorAll("span")];
const styleButtons = [...document.querySelectorAll(".style-chips button")];
const rand = (min, max) => Math.round(min + Math.random() * (max - min)) + "%";

function generate() {
  genTiles.forEach((t) => {
    t.style.setProperty("--s1", rand(40, 70));
    t.style.setProperty("--x1", rand(0, 40));
    t.style.setProperty("--y1", rand(0, 40));
    t.style.setProperty("--s2", rand(20, 40));
    t.style.setProperty("--x2", rand(40, 70));
    t.style.setProperty("--y2", rand(30, 60));
  });
  gen.classList.remove("shuffle");
  void gen.offsetWidth;
  gen.classList.add("shuffle");
}

styleButtons.forEach((b) =>
  b.addEventListener("click", () => {
    gen.dataset.style = b.dataset.style;
    styleButtons.forEach((x) => {
      x.classList.toggle("active", x === b);
      x.setAttribute("aria-pressed", x === b);
    });
    generate();
  })
);
gen.addEventListener("click", generate);
generate();

/* ---------- Demo: prompt bouwt een pagina ---------- */
const codeDemo = document.querySelector(".demo-code");
const termText = codeDemo.querySelector(".term-text");
const siteParts = codeDemo.querySelectorAll(".ms-bar, .ms-hero, .ms-row span, .ms-line");
let building = false;

async function buildSite() {
  if (building) return;
  building = true;
  siteParts.forEach((p) => p.classList.remove("built"));
  termText.textContent = "";
  for (const c of termText.dataset.text) {
    termText.textContent += c;
    await wait(35);
  }
  await wait(250);
  for (const part of siteParts) {
    part.classList.add("built");
    await wait(160);
  }
  building = false;
}

new IntersectionObserver(
  ([entry], obs) => {
    if (!entry.isIntersecting) return;
    buildSite();
    obs.disconnect();
  },
  { threshold: 0.5 }
).observe(codeDemo);
codeDemo.addEventListener("click", buildSite);

/* ---------- Demo: inschrijven en welkomstmails ---------- */
const subBtn = document.querySelector(".subscribe-btn");
const subsCount = document.querySelector(".subs-count");
const inbox = document.querySelector(".inbox");
const mails = ["Welkom!", "Dit kan je verwachten", "Tot snel"];
let subscribers = 0;

subBtn.addEventListener("click", async () => {
  subscribers++;
  subsCount.textContent = subscribers;
  subsCount.classList.remove("bump");
  void subsCount.offsetWidth;
  subsCount.classList.add("bump");

  inbox.innerHTML = "";
  for (let i = 0; i < mails.length; i++) {
    await wait(600);
    const li = document.createElement("li");
    li.innerHTML = `${mails[i]} <small>Welkomstmail ${i + 1}</small>`;
    inbox.append(li);
  }
});
