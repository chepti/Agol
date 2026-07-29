/* עורך עוגני ניקוד מקומי — לא חלק מהאתר */
(() => {
  const SIZE = 520;
  const PAD = 0.18; // שוליים יחסיים בתוך הקנבס

  const el = {
    letters: document.getElementById("letters"),
    classes: document.getElementById("classes"),
    sampleMark: document.getElementById("sampleMark"),
    cv: document.getElementById("cv"),
    hint: document.getElementById("hint"),
    status: document.getElementById("status"),
    live: document.getElementById("livePreview"),
    btnSave: document.getElementById("btnSave"),
    btnReset: document.getElementById("btnReset"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
  };

  const ctx = el.cv.getContext("2d");
  let meta = null;
  let anchors = {};
  let font = null;
  let letter = "א";
  let cls = "0";
  let dragging = false;
  let touched = new Set(JSON.parse(localStorage.getItem("nikud_touched") || "[]"));

  const CLASS_SAMPLES = {
    "0": ["ַ", "ָ", "ֶ", "ֵ", "ִ", "ֹ", "ֻ", "ְ", "ֱ", "ֲ", "ֳ", "ׇ"], // below — holam listed but filtered by class
    "1": ["ּ"],
    "2": ["ֹ", "ֺ", "ׁ", "ׂ"],
  };

  // תווי ניקוד לפי codepoint מה־meta
  function marksForClass(c) {
    return Object.entries(meta.marks)
      .filter(([, info]) => String(info.class) === String(c))
      .map(([gname, info]) => ({ gname, ch: info.ch, cp: info.cp, anchor: info.anchor }));
  }

  async function loadJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("נכשל לטעון " + url);
    return r.json();
  }

  async function init() {
    meta = await loadJson("font-meta.json");
    try {
      anchors = await loadJson("anchors.json");
    } catch {
      anchors = structuredClone(meta.defaultAnchors || {});
    }
    // שחזור מ־localStorage אם יש
    const ls = localStorage.getItem("nikud_anchors");
    if (ls) {
      try {
        anchors = { ...anchors, ...JSON.parse(ls) };
        el.status.textContent = "נטען מ־localStorage";
      } catch { /* ignore */ }
    }

    font = await new Promise((resolve, reject) => {
      opentype.load(meta.font, (err, f) => (err ? reject(err) : resolve(f)));
    });

    buildLetterButtons();
    buildClassButtons();
    fillSampleMarks();
    bind();
    redraw();
    updateLive();
  }

  function letterList() {
    return Object.keys(meta.letters);
  }

  function buildLetterButtons() {
    el.letters.innerHTML = "";
    for (const ch of letterList()) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = ch;
      b.dataset.ch = ch;
      if (ch === letter) b.classList.add("active");
      if (touched.has(ch)) b.classList.add("touched");
      b.addEventListener("click", () => {
        letter = ch;
        [...el.letters.children].forEach((x) => x.classList.toggle("active", x.dataset.ch === ch));
        fillSampleMarks();
        redraw();
        updateLive();
      });
      el.letters.appendChild(b);
    }
  }

  function buildClassButtons() {
    el.classes.innerHTML = "";
    for (const [id, label] of Object.entries(meta.classLabels)) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.dataset.cls = id;
      if (id === cls) b.classList.add("active");
      b.addEventListener("click", () => {
        cls = id;
        [...el.classes.children].forEach((x) => x.classList.toggle("active", x.dataset.cls === id));
        fillSampleMarks();
        redraw();
        updateLive();
      });
      el.classes.appendChild(b);
    }
  }

  function fillSampleMarks() {
    const marks = marksForClass(cls);
    el.sampleMark.innerHTML = "";
    for (const m of marks) {
      const opt = document.createElement("option");
      opt.value = m.gname;
      opt.textContent = `${m.ch}  (U+${m.cp.toString(16).toUpperCase()})`;
      el.sampleMark.appendChild(opt);
    }
  }

  function ensureAnchor() {
    if (!anchors[letter]) anchors[letter] = structuredClone(meta.defaultAnchors[letter] || { "0": [0, 0], "1": [0, 0], "2": [0, 0] });
    if (!anchors[letter][cls]) {
      anchors[letter][cls] = structuredClone(meta.defaultAnchors[letter]?.[cls] || [0, 0]);
    }
    return anchors[letter][cls];
  }

  function glyphByName(name) {
    for (let i = 0; i < font.glyphs.length; i++) {
      const g = font.glyphs.get(i);
      if (g && g.name === name) return g;
    }
    return null;
  }

  function layout() {
    const glyph = font.charToGlyph(letter);
    const upm = font.unitsPerEm;
    const box = glyph.getBoundingBox();
    // מרחב ציור: כולל מקום לניקוד מעל/מתחת
    const minX = Math.min(box.x1, 0) - upm * 0.05;
    const maxX = Math.max(box.x2, glyph.advanceWidth) + upm * 0.05;
    const minY = Math.min(box.y1, -upm * 0.25);
    const maxY = Math.max(box.y2, upm * 0.15);
    const gw = maxX - minX;
    const gh = maxY - minY;
    const scale = (SIZE * (1 - 2 * PAD)) / Math.max(gw, gh);
    const ox = SIZE / 2 - ((minX + maxX) / 2) * scale;
    const oy = SIZE / 2 + ((minY + maxY) / 2) * scale; // flip later
    return { glyph, scale, ox, oy, upm, box, minX, maxX, minY, maxY };
  }

  function fontToCanvas(x, y, L) {
    return {
      x: L.ox + x * L.scale,
      y: L.oy - y * L.scale,
    };
  }

  function canvasToFont(px, py, L) {
    return {
      x: Math.round((px - L.ox) / L.scale),
      y: Math.round((L.oy - py) / L.scale),
    };
  }

  function redraw() {
    const L = layout();
    const anchor = ensureAnchor();
    ctx.clearRect(0, 0, SIZE, SIZE);

    // קווי עזר
    ctx.strokeStyle = "#b7d7e8";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    for (const y of [0, L.box.y1, L.box.y2]) {
      const p = fontToCanvas(0, y, L);
      ctx.beginPath();
      ctx.moveTo(40, p.y);
      ctx.lineTo(SIZE - 40, p.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // האות
    ctx.save();
    ctx.translate(L.ox, L.oy);
    ctx.scale(L.scale, -L.scale);
    const pxPath = L.glyph.getPath(0, 0, L.upm);
    pxPath.fill = "#0f766e";
    pxPath.draw(ctx);
    ctx.restore();

    // סימן הדוגמה ממוקם לפי עוגן
    const sampleName = el.sampleMark.value;
    const markInfo = meta.marks[sampleName];
    if (markInfo) {
      const mg = glyphByName(sampleName) || font.charToGlyph(markInfo.ch);
      const [bx, by] = anchor;
      const [mx, my] = markInfo.anchor;
      const markOriginX = bx - mx;
      const markOriginY = by - my;

      ctx.save();
      ctx.translate(L.ox, L.oy);
      ctx.scale(L.scale, -L.scale);
      ctx.translate(markOriginX, markOriginY);
      const mp = mg.getPath(0, 0, L.upm);
      mp.fill = "#d97706";
      mp.draw(ctx);
      ctx.restore();
    }

    // נקודת עוגן לגרירה
    const ap = fontToCanvas(anchor[0], anchor[1], L);
    ctx.beginPath();
    ctx.arc(ap.x, ap.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#16a34a";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`(${anchor[0]}, ${anchor[1]})`, ap.x, ap.y - 22);
  }

  function pointerPos(e) {
    const r = el.cv.getBoundingClientRect();
    const scaleX = SIZE / r.width;
    const scaleY = SIZE / r.height;
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY,
    };
  }

  function nearAnchor(p) {
    const L = layout();
    const a = ensureAnchor();
    const ap = fontToCanvas(a[0], a[1], L);
    const dx = p.x - ap.x;
    const dy = p.y - ap.y;
    return dx * dx + dy * dy < 28 * 28;
  }

  function bind() {
    el.cv.addEventListener("pointerdown", (e) => {
      el.cv.setPointerCapture(e.pointerId);
      const p = pointerPos(e);
      if (nearAnchor(p) || true) {
        // תמיד מאפשרים לגרור למיקום הלחיצה
        dragging = true;
        moveAnchor(p);
      }
    });
    el.cv.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      moveAnchor(pointerPos(e));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      touched.add(letter);
      localStorage.setItem("nikud_touched", JSON.stringify([...touched]));
      localStorage.setItem("nikud_anchors", JSON.stringify(anchors));
      [...el.letters.children].forEach((x) => {
        if (touched.has(x.dataset.ch)) x.classList.add("touched");
      });
      el.status.textContent = `נשמר זמנית · ${letter} · מחלקה ${cls}`;
      updateLive();
    };
    el.cv.addEventListener("pointerup", end);
    el.cv.addEventListener("pointercancel", end);

    el.sampleMark.addEventListener("change", () => {
      redraw();
      updateLive();
    });

    el.btnSave.addEventListener("click", () => {
      localStorage.setItem("nikud_anchors", JSON.stringify(anchors));
      const blob = new Blob([JSON.stringify(anchors, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "anchors.json";
      a.click();
      el.status.textContent = "הקובץ ירד — שימו אותו בתיקיית tools/nikud כ־anchors.json ואז py build_gpos.py";
    });

    el.btnReset.addEventListener("click", () => {
      anchors[letter] = structuredClone(meta.defaultAnchors[letter]);
      redraw();
      updateLive();
    });

    el.btnPrev.addEventListener("click", () => step(-1));
    el.btnNext.addEventListener("click", () => step(1));
  }

  function step(dir) {
    const list = letterList();
    const i = list.indexOf(letter);
    letter = list[(i + dir + list.length) % list.length];
    [...el.letters.children].forEach((x) => x.classList.toggle("active", x.dataset.ch === letter));
    fillSampleMarks();
    redraw();
    updateLive();
  }

  function moveAnchor(p) {
    const L = layout();
    const f = canvasToFont(p.x, p.y, L);
    ensureAnchor();
    anchors[letter][cls] = [f.x, f.y];
    redraw();
  }

  function updateLive() {
    const marks = marksForClass(cls);
    const sample = marks.find((m) => m.gname === el.sampleMark.value) || marks[0];
    // תצוגה טקסטואלית — הדפדפן עדיין בלי GPOS שלנו; מראה את הצירוף
    el.live.textContent = sample ? letter + sample.ch : letter;
    el.live.style.fontFamily = "AgolWork, serif";
  }

  // טעינת הגופן גם ל־CSS לתצוגה חיה (בלי GPOS עדיין)
  const face = new FontFace("AgolWork", "url(work/agol-work.ttf)");
  face.load().then((f) => document.fonts.add(f)).catch(() => {});

  init().catch((err) => {
    console.error(err);
    el.status.textContent = "שגיאה: " + err.message + " — הריצו serve מתוך tools/nikud אחרי prepare_marks.py";
  });
})();
