/* ============================================================
   Vintage Letter — behaviour
   You shouldn't need to edit this file. Content lives in index.html.
   ============================================================ */
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const cfg = $("#letter-config").dataset;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speed = Math.max(0.1, parseFloat(cfg.typingSpeed) || 1);

  const intro = $("#intro");
  const seal = $("#seal");
  const view = $("#letter-view");
  const paper = $("#paper");
  const skipBtn = $("#skip");
  const replayBtn = $("#replay");
  const soundBtn = $("#sound-toggle");

  /* ---------- Apply envelope settings ---------- */
  document.querySelectorAll(".seal-initial").forEach((el) => (el.textContent = cfg.sealInitial || ""));
  $("#envelope-to").textContent = cfg.envelopeTo || "";
  $("#intro-kicker").textContent = cfg.kicker || "";

  /* ---------- Sound (synthesised, no audio files needed) ---------- */
  const Sound = (() => {
    let ctx = null, on = false, noise = null;

    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        const len = ctx.sampleRate;
        noise = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }

    function burst(dur, freq, q, gain, when = 0, type = "bandpass") {
      const t = ctx.currentTime + when;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t, Math.random() * 0.8);
      src.stop(t + dur + 0.05);
    }

    function tone(freq, dur, gain, when = 0) {
      const t = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    }

    return {
      get on() { return on; },
      toggle() { on = !on && ensure(); return on; },
      key() {
        if (!on) return;
        burst(0.03, 1600 + Math.random() * 1600, 1.4, 0.45);
        burst(0.05, 220 + Math.random() * 80, 2, 0.35, 0.004);
      },
      space() { if (on) burst(0.05, 700, 0.8, 0.25); },
      carriage() {
        if (!on) return;
        tone(2350, 1.1, 0.12); tone(4700, 0.6, 0.04);
        burst(0.35, 1200, 0.5, 0.12, 0.08, "lowpass");
        burst(0.06, 300, 2, 0.4, 0.42);
      },
      crack() {
        if (!on) return;
        burst(0.08, 900, 0.7, 0.9);
        burst(0.12, 2400, 1, 0.35, 0.03);
      },
      rustle() {
        if (!on) return;
        for (let i = 0; i < 9; i++) burst(0.22, 2500 + Math.random() * 3500, 0.5, 0.07, i * 0.09);
      },
      thump() { if (on) burst(0.18, 160, 1, 0.9, 0, "lowpass"); },
    };
  })();

  soundBtn.addEventListener("click", () => {
    const on = Sound.toggle();
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
  });

  /* ---------- Build the letter from the template ---------- */
  paper.appendChild($("#letter-source").content.cloneNode(true));

  let stampEl = null;
  if (cfg.stampSeal !== "false") {
    stampEl = document.createElement("div");
    stampEl.className = "paper-seal";
    stampEl.setAttribute("aria-hidden", "true");
    stampEl.innerHTML = `<span class="seal-face"><span class="seal-initial"></span></span>`;
    stampEl.querySelector(".seal-initial").textContent = cfg.sealInitial || "";
    paper.appendChild(stampEl);
  }

  // Turn every character into a span so it can be "struck" one at a time.
  const BLOCKS = /^(P|DIV|LI|H1|H2|H3|H4|BLOCKQUOTE)$/;
  const queue = [];
  (function prepare(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.COMMENT_NODE) { child.remove(); continue; }
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.classList.contains("paper-seal")) continue;
        if (child.classList.contains("signature")) {
          child.classList.add("sig-hidden");
          queue.push({ sig: child });
          continue;
        }
        prepare(child);
        if (BLOCKS.test(child.tagName)) queue.push({ block: true });
        continue;
      }
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const text = child.textContent;
      if (!text.trim()) continue; // whitespace between tags
      const frag = document.createDocumentFragment();
      const tokens = text.match(/\s+|\S/gu) || [];
      for (const c of tokens) {
        if (/^\s/.test(c)) {
          frag.appendChild(document.createTextNode(c));
          queue.push({ space: true });
        } else {
          const s = document.createElement("span");
          s.className = "ch pending";
          s.textContent = c;
          // uneven ink + slightly misaligned type bars, like a real machine
          s.style.setProperty("--o", (0.74 + Math.random() * 0.26).toFixed(2));
          s.style.setProperty("--y", ((Math.random() - 0.5) * 1.1).toFixed(2) + "px");
          frag.appendChild(s);
          queue.push({ ch: s, c });
        }
      }
      child.replaceWith(frag);
    }
  })(paper);

  /* ---------- Typewriter ---------- */
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.setAttribute("aria-hidden", "true");

  let idx = 0, timer = null, done = false;
  let userScrolledAt = 0;
  ["wheel", "touchmove", "keydown"].forEach((ev) =>
    window.addEventListener(ev, () => (userScrolledAt = Date.now()), { passive: true })
  );

  function follow() {
    if (Date.now() - userScrolledAt < 2500) return;
    const r = caret.getBoundingClientRect();
    const limit = window.innerHeight * 0.72;
    if (r.bottom > limit) window.scrollBy({ top: r.bottom - limit + 40, behavior: "smooth" });
  }

  function step() {
    if (idx >= queue.length) return finish();
    const item = queue[idx++];
    let delay = (38 + Math.random() * 42) / speed;

    if (item.ch) {
      item.ch.classList.remove("pending");
      item.ch.classList.add("struck");
      item.ch.after(caret);
      Sound.key();
      if (/[.!?]/.test(item.c)) delay += 260 / speed;
      else if (/[,;:—–]/.test(item.c)) delay += 140 / speed;
      if (idx % 6 === 0) follow();
    } else if (item.space) {
      Sound.space();
      delay *= 0.8;
    } else if (item.block) {
      Sound.carriage();
      delay = 520 / speed;
      follow();
    } else if (item.sig) {
      caret.remove();
      drawSignature(item.sig);
      delay = 1900;
      follow();
    }
    timer = setTimeout(step, delay);
  }

  function drawSignature(el) {
    el.classList.remove("sig-hidden");
    el.classList.add("sig-drawn");
    Sound.rustle();
  }

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    caret.remove();
    queue.forEach((q) => {
      if (q.ch) q.ch.classList.remove("pending");
      if (q.sig && !q.sig.classList.contains("sig-drawn")) drawSignature(q.sig);
    });
    paper.classList.remove("typing");
    skipBtn.hidden = true;
    if (stampEl) {
      setTimeout(() => { stampEl.classList.add("stamped"); Sound.thump(); }, reduceMotion ? 0 : 500);
    }
    setTimeout(() => (replayBtn.hidden = false), reduceMotion ? 0 : 1200);
  }

  skipBtn.addEventListener("click", finish);
  paper.addEventListener("click", () => { if (!done && paper.classList.contains("typing")) finish(); });
  replayBtn.addEventListener("click", () => { window.scrollTo(0, 0); location.reload(); });

  /* ---------- Opening sequence ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function open() {
    seal.disabled = true;

    if (reduceMotion) {
      intro.hidden = true;
      view.hidden = false;
      finish();
      return;
    }

    Sound.crack();
    intro.classList.add("opening");        // seal breaks, flap lifts
    await wait(450);
    intro.classList.add("flap-behind");    // flap tucks behind the letter
    await wait(350);
    Sound.rustle();
    intro.classList.add("letter-out");     // letter slides up
    await wait(1300);
    intro.classList.add("leaving");        // whole scene fades
    await wait(850);
    intro.hidden = true;
    view.hidden = false;
    window.scrollTo(0, 0);
    await wait(900);
    paper.classList.add("typing");
    skipBtn.hidden = false;
    step();
  }

  seal.addEventListener("click", open);
})();
