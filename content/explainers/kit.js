// Набор для сцен объяснялки: палитра, шрифты, движение, примитивы рисования.
// Один на все ролики — по нему их узнают как одну серию. Канон — docs/explainers.md.
// Сцена — функция (ctx, s): s.t — время сцены в секундах, s.m — её метки,
// s.p(откуда, длительность) — плавный прогресс 0..1. Кадр — функция времени:
// одно и то же t всегда даёт одну и ту же картинку.

(function () {
  const W = 1920;
  const H = 1080;

  const C = {
    bg0: "#090D17",
    bg1: "#141B2C",
    panel: "#101626",
    line: "#28304A",
    ink: "#E9ECF4",
    muted: "#8A93A8",
    dim: "#454E66",
    gold: "#F2C14E",
    teal: "#4FD1C5",
    red: "#F07178",
    blue: "#7B93FF",
  };

  const F = {
    serif: '"Literata", Georgia, serif',
    sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
    mono: '"JetBrains Mono", Menlo, monospace',
  };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const back = (k) => {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
  };

  function rgba(hex, a = 1) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a)})`;
  }

  function mixHex(a, b, k) {
    const x = parseInt(a.slice(1), 16);
    const y = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map((sh) => Math.round(lerp((x >> sh) & 255, (y >> sh) & 255, clamp(k))));
    return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  /** Детерминированный случай: одно зерно — одна и та же последовательность. */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  }

  function font(size, kind = "sans", weight = 400, italic = false) {
    return `${italic ? "italic " : ""}${weight} ${size}px ${F[kind] || kind}`;
  }

  function background(ctx) {
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, C.bg1);
    g.addColorStop(1, C.bg0);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function text(ctx, str, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(o.size ?? 40, o.font ?? "sans", o.weight ?? 400, o.italic);
    ctx.fillStyle = o.color ?? C.ink;
    ctx.textAlign = o.align ?? "left";
    ctx.textBaseline = o.baseline ?? "alphabetic";
    if (o.glow) {
      ctx.shadowColor = rgba(o.glowColor ?? o.color ?? C.gold, o.glow);
      ctx.shadowBlur = o.blur ?? 24;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function measure(ctx, str, size, kind = "sans", weight = 400, italic = false) {
    ctx.save();
    ctx.font = font(size, kind, weight, italic);
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  }

  /**
   * Подпись сверху по центру, как у 3b1b: короткая, серифом. Части — список
   * {t, c}: так одно слово подписи можно подсветить своим цветом.
   */
  function caption(ctx, parts, alpha = 1, y = 112) {
    if (alpha <= 0) return;
    const list = typeof parts === "string" ? [{ t: parts }] : parts;
    const size = 46;
    const widths = list.map((p) => measure(ctx, p.t, size, "serif", 400, true));
    let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2;
    list.forEach((p, i) => {
      text(ctx, p.t, x, y, {
        size,
        font: "serif",
        italic: true,
        color: p.c ?? C.muted,
        alpha,
        glow: p.c === C.gold ? 0.35 : 0,
      });
      x += widths[i];
    });
  }

  /** Смена подписей по времени: [[с какого t, части], …], мягкий переход. */
  function captions(ctx, t, steps, fade = 0.35) {
    for (let i = 0; i < steps.length; i += 1) {
      const [from, parts] = steps[i];
      const to = i + 1 < steps.length ? steps[i + 1][0] : Infinity;
      if (from === null || from === undefined) continue;
      const a = clamp((t - from) / fade) * clamp((to - t) / fade + (to === Infinity ? 1 : 0));
      if (a > 0) caption(ctx, parts, easeInOut(a));
    }
  }

  function roundRect(ctx, x, y, w, h, r, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.beginPath();
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    if (o.glow) {
      ctx.shadowColor = rgba(o.glowColor ?? o.stroke ?? C.gold, o.glow);
      ctx.shadowBlur = o.blur ?? 28;
    }
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.fill();
    }
    if (o.stroke) {
      ctx.shadowBlur = 0;
      ctx.lineWidth = o.lw ?? 2;
      ctx.strokeStyle = o.stroke;
      ctx.stroke();
    }
    ctx.restore();
  }

  function glowDot(ctx, x, y, r, color = C.gold, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, rgba(color, 0.55 * alpha));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(color, alpha);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color ?? C.line;
    ctx.lineWidth = o.lw ?? 2;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Раскладка слов строками в ширину. Слово — строка; пробел перед словом
   * пишется в самом слове (как у токенов). Ответ — [{w, x, y, width}].
   */
  function layoutWords(ctx, words, x, y, maxW, lineH, size, kind = "sans", weight = 400) {
    const out = [];
    let cx = x;
    let cy = y;
    for (const w of words) {
      const width = measure(ctx, w, size, kind, weight);
      const bare = w.replace(/^\s+/, "");
      if (cx + width > x + maxW && cx > x) {
        cx = x;
        cy += lineH;
        const bw = measure(ctx, bare, size, kind, weight);
        out.push({ w: bare, x: cx, y: cy, width: bw });
        cx += bw;
        continue;
      }
      out.push({ w, x: cx, y: cy, width });
      cx += width;
    }
    return out;
  }

  /**
   * Столбики кандидатов: [{label, p}] — строки сверху вниз. grow 0..1 растит
   * столбики по очереди, pick — какую строку подсветить золотом (pickA — сила).
   */
  function bars(ctx, items, o) {
    const { x, y, w, rowH = 78, grow = 1, pick = -1, pickA = 0, alpha = 1 } = o;
    const labelW = o.labelW ?? 280;
    const maxP = o.maxP ?? 1;
    const barColor = o.color ?? C.blue;
    items.forEach((it, i) => {
      const k = easeOut(clamp(grow * items.length - i * 0.6));
      if (k <= 0) return;
      const ry = y + i * rowH;
      const chosen = i === pick ? pickA : 0;
      const others = pick >= 0 && i !== pick ? pickA : 0;
      const a = alpha * k * (1 - 0.55 * others);
      const labelColor = mixHex(C.ink, C.gold, chosen);
      text(ctx, it.label, x + labelW - 24, ry + rowH * 0.5 + 14, {
        size: 40,
        align: "right",
        color: labelColor,
        alpha: a,
        glow: chosen * 0.5,
      });
      const bw = Math.max(6, (w - labelW - 150) * (it.p / maxP) * k);
      roundRect(ctx, x + labelW, ry + rowH * 0.22, bw, rowH * 0.56, 6, {
        fill: rgba(mixHex(barColor, C.gold, chosen), 0.9),
        alpha: a,
        glow: chosen * 0.6,
        glowColor: C.gold,
      });
      const pct = it.p >= 0.1 ? Math.round(it.p * 100) : Math.round(it.p * 1000) / 10;
      text(ctx, `${String(pct).replace(".", ",")}%`, x + labelW + bw + 18, ry + rowH * 0.5 + 12, {
        size: 32,
        font: "mono",
        color: mixHex(C.muted, C.gold, chosen),
        alpha: a,
      });
    });
  }

  /** Мигающий прямоугольник курсора: там встанет следующее слово. */
  function cursorBox(ctx, x, y, w, h, t, alpha = 1, color = C.gold) {
    const blink = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 0.9);
    roundRect(ctx, x, y, w, h, 10, {
      stroke: rgba(color, 0.9 * blink),
      fill: rgba(color, 0.08 * blink),
      lw: 3,
      alpha,
    });
  }

  /** Сборка кадра: сцены по таймлайну, перекрёстная смена на швах. */
  function run(scenes, timeline) {
    const canvas = document.getElementById("stage");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const half = timeline.crossfade / 2;

    function drawScene(spec, t, alpha) {
      const fn = scenes[spec.id];
      if (!fn || alpha <= 0) return;
      const local = Math.max(0, t - spec.start);
      const m = {};
      for (const [k, v] of Object.entries(spec.marks)) m[k] = v;
      const s = {
        t: local,
        d: spec.end - spec.start,
        m,
        W,
        H,
        p(from, dur = 0.6, ease = easeInOut) {
          const at = typeof from === "string" ? (m[from] ?? Infinity) : from;
          return ease(clamp((local - at) / dur));
        },
      };
      ctx.save();
      ctx.globalAlpha = alpha;
      fn(ctx, s);
      ctx.restore();
    }

    window.drawFrame = (t) => {
      background(ctx);
      const list = timeline.scenes;
      const i = Math.max(
        0,
        list.findIndex((s) => t >= s.start && t < s.end),
      );
      const cur = list[i] || list[list.length - 1];
      const next = list[i + 1];
      const prev = list[i - 1];
      let a = 1;
      if (next && t > cur.end - half) {
        const k = clamp((t - (cur.end - half)) / timeline.crossfade);
        a = 1 - k;
        drawScene(cur, t, a);
        drawScene(next, t, k);
        return;
      }
      if (prev && t < cur.start + half) {
        const k = clamp((t - (cur.start - half)) / timeline.crossfade);
        drawScene(prev, t, 1 - k);
        drawScene(cur, t, k);
        return;
      }
      if (i === 0) a = clamp(t / 0.4);
      drawScene(cur, t, a);
    };
  }

  window.K = {
    W,
    H,
    C,
    F,
    clamp,
    lerp,
    easeInOut,
    easeOut,
    back,
    rgba,
    mixHex,
    rng,
    font,
    text,
    measure,
    caption,
    captions,
    roundRect,
    glowDot,
    line,
    layoutWords,
    bars,
    cursorBox,
    run,
  };
})();
