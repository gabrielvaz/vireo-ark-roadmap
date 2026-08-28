/* ============================================================================
   Cardioline — motor de apresentação
   Palco fixo 1280x720 escalado por transform. Um slide visível por vez.

   Teclado
     → ␣ PageDown N        próximo
     ← PageUp  P B         anterior
     Home / End            primeiro / último
     1..9 (dígitos)        digite o número e Enter — ou espere 900ms
     G ou O                grade de visão geral
     S                     notas do orador
     F                     tela cheia
     ? ou H                ajuda
     Esc                   fecha overlay
   Mouse/toque
     clique no contador    abre "ir para slide"
     clique na grade       salta para o slide
     swipe horizontal      navega
   ========================================================================= */
(function () {
  "use strict";

  var STAGE_W = 1280, STAGE_H = 720;

  var I18N = {
    "pt-BR": {
      of: "de", jumpLabel: "Ir para o slide", jumpHint: "Enter para confirmar · Esc para cancelar",
      overview: "Visão geral", slides: "slides", help: "Atalhos do teclado",
      kNext: "Próximo slide", kPrev: "Slide anterior", kEnds: "Primeiro / último",
      kJump: "Ir para o slide", kOverview: "Grade de slides", kNotes: "Notas do orador",
      kFull: "Tela cheia", kClose: "Fechar", prev: "Anterior", next: "Próximo",
      restart: "Reiniciar", grid: "Grade",
      zoomHint: "Toque duas vezes para ampliar \u00b7 arraste para navegar"
    },
    en: {
      of: "of", jumpLabel: "Go to slide", jumpHint: "Enter to confirm · Esc to cancel",
      overview: "Overview", slides: "slides", help: "Keyboard shortcuts",
      kNext: "Next slide", kPrev: "Previous slide", kEnds: "First / last",
      kJump: "Go to slide", kOverview: "Slide grid", kNotes: "Speaker notes",
      kFull: "Full screen", kClose: "Close", prev: "Previous", next: "Next",
      restart: "Restart", grid: "Grid",
      zoomHint: "Double-tap to zoom \u00b7 drag to pan"
    }
  };

  var lang = (document.body.getAttribute("data-lang") || document.documentElement.lang || "pt-BR");
  var t = I18N[lang] || I18N[lang.slice(0, 2)] || I18N["pt-BR"];

  var deck = document.getElementById("deck");
  if (!deck) return;
  var slides = Array.prototype.slice.call(deck.querySelectorAll(".slide"));
  if (!slides.length) return;

  var idx = 0;
  var buffer = "";
  var bufferTimer = null;

  /* ---------- chrome injetado ------------------------------------------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var progress = el("div", "progress");
  progress.style.width = "0%";

  var hud = el("div", "hud");
  hud.innerHTML =
    '<button type="button" data-act="prev" title="' + t.kPrev + '" aria-label="' + t.prev + '">&#8592;</button>' +
    '<button type="button" class="hud-count" data-act="jump" title="' + t.kJump + '">1 ' + t.of + ' ' + slides.length + '</button>' +
    '<button type="button" data-act="next" title="' + t.kNext + '" aria-label="' + t.next + '">&#8594;</button>' +
    '<button type="button" data-act="overview" title="' + t.kOverview + '" aria-label="' + t.grid + '">&#9638;</button>';

  var jump = el("div", "jump");
  jump.innerHTML =
    '<label for="jumpInput">' + t.jumpLabel + '</label>' +
    '<input id="jumpInput" type="text" inputmode="numeric" autocomplete="off" maxlength="4">' +
    '<div class="jump-hint">1 &ndash; ' + slides.length + ' &middot; ' + t.jumpHint + '</div>';

  var overview = el("div", "overview");
  overview.innerHTML =
    '<div class="overview-head"><h4>' + t.overview + '</h4>' +
    '<span>' + slides.length + " " + t.slides + '</span></div>' +
    '<div class="overview-grid"></div>';

  var help = el("div", "help");
  help.innerHTML =
    '<div class="help-card"><h4>' + t.help + '</h4><dl>' +
    "<dt>" + t.kNext + "</dt><dd><kbd>&rarr;</kbd><kbd>Space</kbd><kbd>PgDn</kbd></dd>" +
    "<dt>" + t.kPrev + "</dt><dd><kbd>&larr;</kbd><kbd>PgUp</kbd></dd>" +
    "<dt>" + t.kEnds + "</dt><dd><kbd>Home</kbd><kbd>End</kbd></dd>" +
    "<dt>" + t.kJump + "</dt><dd><kbd>1</kbd>&hellip;<kbd>9</kbd> + <kbd>Enter</kbd></dd>" +
    "<dt>" + t.kOverview + "</dt><dd><kbd>G</kbd></dd>" +
    "<dt>" + t.kNotes + "</dt><dd><kbd>S</kbd></dd>" +
    "<dt>" + t.kFull + "</dt><dd><kbd>F</kbd></dd>" +
    "<dt>" + t.kClose + "</dt><dd><kbd>Esc</kbd></dd>" +
    "</dl></div>";

  /* Pré-carga dos logos: o Chrome não busca `background-image` de elementos em
     `display:none`, e só um slide fica visível. Sem isto o logo branco (usado
     apenas nos slides de tom escuro) chega vazio no PDF/PPTX. */
  var preload = el("div", "logo-preload", "<i></i><i></i><i></i>");
  document.body.appendChild(preload);
  ["--logo-orange", "--logo-white", "--logo-navy"].forEach(function (name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    var m = /url\((["']?)(.*?)\1\)/.exec(v);
    if (m) { var im = new Image(); im.src = m[2]; }
  });

  document.body.appendChild(progress);
  document.body.appendChild(hud);
  document.body.appendChild(jump);
  document.body.appendChild(overview);
  document.body.appendChild(help);

  var count = hud.querySelector(".hud-count");
  var jumpInput = jump.querySelector("input");
  var ovGrid = overview.querySelector(".overview-grid");

  /* ---------- rodapé automático ----------------------------------------- */
  slides.forEach(function (s, i) {
    if (!s.id) s.id = "s" + (i + 1);
    var stage = s.querySelector(".stage");
    if (!stage) return;
    var ft = stage.querySelector(".ft");
    if (s.getAttribute("data-footer") === "off") return;
    if (!ft) {
      ft = el("div", "ft", '<span class="ft-kicker"></span><span class="ft-num"></span>');
      stage.appendChild(ft);
    }
    var kicker = ft.querySelector(".ft-kicker");
    var num = ft.querySelector(".ft-num");
    if (kicker && !kicker.textContent.trim()) {
      kicker.textContent = s.getAttribute("data-kicker") || deck.getAttribute("data-kicker") || "";
    }
    if (num && !num.textContent.trim()) {
      num.textContent = (i + 1) + " / " + slides.length;
    }
  });

  /* ---------- escala ---------------------------------------------------- */
  var baseScale = 1;

  function fit() {
    var w = deck.clientWidth, h = deck.clientHeight;
    var s = Math.min(w / STAGE_W, h / STAGE_H);
    baseScale = s;
    document.documentElement.style.setProperty("--scale", String(s));
    syncOvScale();
    clampPan();
    applyZoom();
  }

  /* A miniatura do overview e um palco de 1280px encaixado numa coluna da
     grade. A escala tem de sair da largura real da caixa, medida depois do
     layout -- um valor fixo no CSS quebra em qualquer largura de coluna
     diferente da prevista. */
  function syncOvScale() {
    var first = ovGrid.firstElementChild;
    var thumb = first && first.querySelector(".ov-thumb");
    if (!thumb) return;
    var w = thumb.clientWidth;
    if (w > 0) ovGrid.style.setProperty("--ov-scale", String(w / STAGE_W));
  }

  /* ---------- navegação ------------------------------------------------- */
  function show(i, pushHash) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i !== idx) resetZoom();
    idx = i;
    slides.forEach(function (s, k) {
      s.classList.toggle("is-active", k === i);
      var n = s.querySelector(".notes");
      if (n) n.classList.toggle("is-active", k === i);
    });
    count.textContent = (i + 1) + " " + t.of + " " + slides.length;
    progress.style.width = (slides.length < 2 ? 100 : (i / (slides.length - 1)) * 100) + "%";
    Array.prototype.forEach.call(ovGrid.children, function (c, k) {
      c.classList.toggle("is-current", k === i);
    });
    if (pushHash !== false) {
      try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) { /* file:// */ }
    }
  }

  function next() { if (idx < slides.length - 1) show(idx + 1); }
  function prev() { if (idx > 0) show(idx - 1); }

  /* ---------- overlays -------------------------------------------------- */
  function closeAll() {
    jump.classList.remove("is-open");
    overview.classList.remove("is-open");
    help.classList.remove("is-open");
  }
  function openJump() {
    closeAll();
    jump.classList.add("is-open");
    jumpInput.value = "";
    jumpInput.focus();
  }
  function openOverview() {
    closeAll();
    buildOverview();
    overview.classList.add("is-open");
    /* so agora a grade tem largura: `display: none` mede zero */
    syncOvScale();
  }
  function toggleHelp() {
    var open = help.classList.contains("is-open");
    closeAll();
    if (!open) help.classList.add("is-open");
  }

  var overviewBuilt = false;
  function buildOverview() {
    if (overviewBuilt) return;
    slides.forEach(function (s, i) {
      var btn = el("button", "ov-item");
      btn.type = "button";
      var thumb = el("div", "ov-thumb");
      var mini = el("div", "ov-mini");
      var clone = s.querySelector(".stage").cloneNode(true);
      mini.appendChild(clone);
      thumb.appendChild(mini);
      var title = s.getAttribute("data-title") || s.querySelector("h1, h2") ;
      var label = typeof title === "string" ? title : (title ? title.textContent.trim() : "");
      btn.appendChild(thumb);
      btn.appendChild(el("div", "ov-meta", "<b>" + (i + 1) + "</b><span>" +
        escapeHtml(label.length > 42 ? label.slice(0, 42) + "…" : label) + "</span>"));
      btn.addEventListener("click", function () { closeAll(); show(i); });
      ovGrid.appendChild(btn);
    });
    overviewBuilt = true;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- buffer de dígitos ---------------------------------------- */
  function pushDigit(d) {
    buffer += d;
    count.textContent = buffer + " →";
    clearTimeout(bufferTimer);
    bufferTimer = setTimeout(commitBuffer, 900);
  }
  function commitBuffer() {
    clearTimeout(bufferTimer);
    if (!buffer) return;
    var n = parseInt(buffer, 10);
    buffer = "";
    if (!isNaN(n) && n >= 1 && n <= slides.length) show(n - 1);
    else show(idx);
  }

  /* ---------- eventos --------------------------------------------------- */
  hud.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "prev") prev();
    else if (a === "next") next();
    else if (a === "jump") openJump();
    else if (a === "overview") openOverview();
  });

  jumpInput.addEventListener("keydown", function (e) {
    e.stopPropagation();
    if (e.key === "Enter") {
      var n = parseInt(jumpInput.value, 10);
      closeAll();
      if (!isNaN(n)) show(n - 1);
    } else if (e.key === "Escape") {
      closeAll();
    }
  });
  jump.addEventListener("click", function (e) { if (e.target === jump) closeAll(); });
  overview.addEventListener("click", function (e) { if (e.target === overview) closeAll(); });
  help.addEventListener("click", function (e) { if (e.target === help) closeAll(); });

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && e.target.closest("input, textarea, select, [contenteditable]")) return;

    var k = e.key;

    if (k === "Escape") { e.preventDefault(); buffer = ""; closeAll(); show(idx); return; }

    if (/^[0-9]$/.test(k)) { e.preventDefault(); pushDigit(k); return; }
    if (k === "Enter") { e.preventDefault(); commitBuffer(); return; }

    if (k === "ArrowRight" || k === "PageDown" || k === " " || k === "Spacebar" ||
        k === "n" || k === "N") { e.preventDefault(); closeAll(); next(); return; }
    if (k === "ArrowLeft" || k === "PageUp" ||
        k === "p" || k === "P" || k === "b" || k === "B") { e.preventDefault(); closeAll(); prev(); return; }
    if (k === "Home") { e.preventDefault(); show(0); return; }
    if (k === "End") { e.preventDefault(); show(slides.length - 1); return; }

    if (k === "g" || k === "G" || k === "o" || k === "O") { e.preventDefault(); openOverview(); return; }
    if (k === "s" || k === "S") { e.preventDefault(); document.body.classList.toggle("presenter"); return; }
    if (k === "f" || k === "F") {
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      return;
    }
    if (k === "?" || k === "h" || k === "H") { e.preventDefault(); toggleHelp(); return; }
  });

  /* ---------- zoom e arrasto por toque ---------------------------------- */
  /* Num celular em retrato o palco encaixa na largura (412px de 1280px), e o
     corpo de texto cai para ~6px. Duplo toque amplia no ponto tocado ate o
     tamanho nativo, pinca ajusta a mao, e arrastar navega pelo slide. */

  var ZOOM_MAX = 4;
  var zoom = 1, panX = 0, panY = 0;

  function nativeZoom() {
    /* zoom que devolve o texto ao tamanho de projecao, sem passar do teto */
    if (!(baseScale > 0)) return 2;
    return Math.max(1.6, Math.min(ZOOM_MAX, 1 / baseScale));
  }

  function clampPan() {
    /* o palco nunca desgruda das bordas: pan limitado ao excedente real */
    var over = STAGE_W * baseScale * zoom - deck.clientWidth;
    var overY = STAGE_H * baseScale * zoom - deck.clientHeight;
    var mx = Math.max(0, over / 2), my = Math.max(0, overY / 2);
    panX = Math.min(mx, Math.max(-mx, panX));
    panY = Math.min(my, Math.max(-my, panY));
  }

  function applyZoom() {
    var st = document.documentElement.style;
    st.setProperty("--zoom", String(zoom));
    st.setProperty("--pan-x", panX.toFixed(1) + "px");
    st.setProperty("--pan-y", panY.toFixed(1) + "px");
    document.body.classList.toggle("is-zoomed", zoom > 1.02);
  }

  function resetZoom() {
    zoom = 1; panX = 0; panY = 0;
    applyZoom();
  }

  /* Amplia mantendo fixo o ponto do palco que esta sob (fx, fy).
     Na tela, um ponto p do palco cai em centro + pan + p*S. Igualando antes e
     depois: pan1 = f - (f - pan0) * (z1 / z0). */
  function setZoom(z, fx, fy) {
    var z1 = Math.max(1, Math.min(ZOOM_MAX, z));
    var z0 = zoom;
    if (z1 === z0) return;
    var cx = deck.clientWidth / 2, cy = deck.clientHeight / 2;
    var f = { x: (fx == null ? cx : fx) - cx, y: (fy == null ? cy : fy) - cy };
    var k = z1 / z0;
    panX = f.x - (f.x - panX) * k;
    panY = f.y - (f.y - panY) * k;
    zoom = z1;
    clampPan();
    applyZoom();
  }

  /* toque */
  var coarse = false;
  try { coarse = window.matchMedia("(pointer: coarse)").matches; } catch (e) { /* IE */ }

  var tx = 0, ty = 0, tT = 0, panX0 = 0, panY0 = 0;
  var pinching = false, dragging = false;
  var pinchD0 = 0, pinchZ0 = 1, pinchFX = 0, pinchFY = 0;
  var lastTapT = 0, lastTapX = 0, lastTapY = 0;

  function touchDist(a, b) {
    var dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  deck.addEventListener("touchstart", function (e) {
    if (e.touches.length >= 2) {
      pinching = true; dragging = false;
      pinchD0 = touchDist(e.touches[0], e.touches[1]);
      pinchZ0 = zoom;
      pinchFX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      pinchFY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      return;
    }
    var t0 = e.changedTouches[0];
    tx = t0.clientX; ty = t0.clientY; tT = Date.now();
    panX0 = panX; panY0 = panY;
    dragging = zoom > 1.02;
  }, { passive: true });

  deck.addEventListener("touchmove", function (e) {
    if (pinching && e.touches.length >= 2) {
      e.preventDefault();
      var d = touchDist(e.touches[0], e.touches[1]);
      if (pinchD0 > 0) setZoom(pinchZ0 * (d / pinchD0), pinchFX, pinchFY);
      return;
    }
    if (dragging && e.touches.length === 1) {
      e.preventDefault();
      panX = panX0 + (e.touches[0].clientX - tx);
      panY = panY0 + (e.touches[0].clientY - ty);
      clampPan();
      applyZoom();
    }
  }, { passive: false });

  deck.addEventListener("touchcancel", function () {
    pinching = false; dragging = false;
  }, { passive: true });

  deck.addEventListener("touchend", function (e) {
    if (pinching) {
      if (e.touches.length === 0) {
        pinching = false;
        if (zoom < 1.1) resetZoom();   /* pinca curta de volta: encaixa de novo */
      }
      return;
    }

    var ch = e.changedTouches[0];
    var dx = ch.clientX - tx, dy = ch.clientY - ty;
    var far = Math.sqrt(dx * dx + dy * dy);
    var quick = Date.now() - tT < 260;

    /* duplo toque: amplia no ponto tocado, ou volta ao encaixe */
    if (quick && far < 14) {
      var now = Date.now();
      var near = Math.abs(ch.clientX - lastTapX) < 40 && Math.abs(ch.clientY - lastTapY) < 40;
      if (now - lastTapT < 320 && near) {
        lastTapT = 0;
        hideZoomHint();
        if (zoom > 1.02) resetZoom();
        else setZoom(nativeZoom(), ch.clientX, ch.clientY);
        return;
      }
      lastTapT = now; lastTapX = ch.clientX; lastTapY = ch.clientY;
    }

    if (dragging) { dragging = false; return; }

    /* swipe: so quando encaixado, senao o arrasto e do zoom.
       56px e 1.6:1 vinham de tela grande; num celular de 412px o gesto
       raramente passava do limite. */
    var TH = coarse ? 38 : 56;
    var RATIO = coarse ? 1.15 : 1.6;
    if (zoom <= 1.02 && Math.abs(dx) > TH && Math.abs(dx) > Math.abs(dy) * RATIO) {
      hideZoomHint();
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  /* ---------- dica de zoom (uma vez por sessao, so em aparelho de toque) -- */
  var zhint = el("div", "zhint", escapeHtml(t.zoomHint));
  document.body.appendChild(zhint);

  function hideZoomHint() { zhint.classList.remove("is-on"); }

  if (coarse) {
    var seen = false;
    try { seen = sessionStorage.getItem("deckZoomHint") === "1"; } catch (e) { /* modo privado */ }
    if (!seen) {
      try { sessionStorage.setItem("deckZoomHint", "1"); } catch (e) { /* idem */ }
      setTimeout(function () { zhint.classList.add("is-on"); }, 900);
      setTimeout(hideZoomHint, 5200);
    }
  }

  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  /* ---------- API para o exportador ------------------------------------ */
  window.CardiolineDeck = {
    stageWidth: STAGE_W,
    stageHeight: STAGE_H,
    total: slides.length,
    go: function (n) { show(n - 1); },
    current: function () { return idx + 1; },
    /* usado por export-pptx.mjs: isola um slide sem escala para captura */
    capture: function (n) {
      document.body.classList.add("capture");
      slides.forEach(function (s, k) { s.classList.toggle("is-capture", k === n - 1); });
    },
    /* Rasteriza um SVG inline para PNG base64 (o PowerPoint não lê SVG de
       forma confiável). Chamado pelo export-pptx.mjs. */
    rasterizeSvg: function (markup, w, h, scale) {
      scale = scale || 2;
      return new Promise(function (res, rej) {
        var svg = markup;
        if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        var url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        var img = new Image();
        img.onload = function () {
          var cv = document.createElement("canvas");
          cv.width = Math.round(w * scale);
          cv.height = Math.round(h * scale);
          var cx = cv.getContext("2d");
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          res(cv.toDataURL("image/png"));
        };
        img.onerror = function () { rej(new Error("falha ao rasterizar o SVG")); };
        img.src = url;
      });
    },

    /* Extrai o conteúdo estruturado de cada slide para o PPTX nativo.
       Cada slide é tornado visível e sem escala antes de ser medido — em
       `display:none` toda a geometria vem zerada. */
    outline: function () {
      var prev = idx;
      var body = document.body;
      var hadCapture = body.classList.contains("capture");
      body.classList.add("capture");

      var res = slides.map(function (s, i) {
        slides.forEach(function (x, k) { x.classList.toggle("is-capture", k === i); });
        var stage = s.querySelector(".stage");
        void stage.offsetHeight;                  /* força o reflow */
        var tpl = (s.className.match(/\bt-([a-z-]+)/) || [, "custom"])[1];
        var tone = (s.className.match(/\btone-([a-z-]+)/) || [, "white"])[1];
        var notes = s.querySelector(".notes");
        return {
          n: i + 1,
          id: s.id,
          template: tpl,
          tone: tone,
          title: s.getAttribute("data-title") || "",
          kicker: s.getAttribute("data-kicker") || "",
          notes: notes ? notes.textContent.replace(/\s+/g, " ").trim() : "",
          boxes: harvest(stage)
        };
      });

      slides.forEach(function (x) { x.classList.remove("is-capture"); });
      if (!hadCapture) body.classList.remove("capture");
      show(prev, false);
      return res;
    }
  };

  /* Percorre o palco renderizado e devolve caixas de texto, superfícies e
     imagens com geometria e estilo já resolvidos pelo navegador. O
     export-pptx converte isso em shapes nativos do PowerPoint.

     Coordenadas em px do palco (1280x720). O exportador multiplica por
     0.0104167 para polegadas e por 0.75 para pontos de fonte. */
  var INLINE = /^(EM|STRONG|B|I|SPAN|SUP|SUB|A|CODE|KBD|SMALL|U)$/;

  /* `color-mix()` — usado em todos os derivados da paleta — resolve para
     `color(srgb 0.88 0.89 0.91)`, que nenhum consumidor de PPTX entende.
     Tudo sai daqui como rgb()/rgba(). O canvas cobre qualquer outro espaço
     de cor que o navegador venha a devolver (oklch, lab...). */
  /* Um valor só é invisível se o ALFA for zero. Testar o fim da string
     (`, 0)`) confunde canal azul zero — rgb(238, 91, 0) é laranja opaco. */
  function isInvisible(c) {
    if (!c || c === "transparent" || c === "none") return true;
    var m = /^rgba?\(([^)]+)\)$/.exec(String(c).trim());
    if (!m) return false;
    var parts = m[1].split(/[,/]/).map(function (x) { return x.trim(); });
    if (parts.length < 4) return false;
    var a = parts[3].slice(-1) === "%" ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return !(a > 0);
  }

  var colorProbe = null;
  function normColor(c) {
    if (!c) return c;
    c = String(c).trim();
    if (c.charAt(0) === "#" || c.indexOf("rgb") === 0 || c === "transparent") return c;
    var m = /^color\(srgb\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(c);
    if (m) {
      var a = m[4] == null ? 1
        : (String(m[4]).slice(-1) === "%" ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      var ch = [1, 2, 3].map(function (i) {
        return Math.round(Math.min(1, Math.max(0, parseFloat(m[i]))) * 255);
      });
      return "rgba(" + ch.join(", ") + ", " + a + ")";
    }
    try {
      if (!colorProbe) colorProbe = document.createElement("canvas").getContext("2d");
      colorProbe.fillStyle = "#000";
      colorProbe.fillStyle = c;
      var v = colorProbe.fillStyle;
      return v && v !== "#000000" ? v : c;
    } catch (e) { return c; }
  }

  /* TreeWalker não tem "pular subárvore": marcamos os descendentes e o laço
     principal os descarta. Usado para <svg>, que é exportado inteiro. */
  var skipSet = new WeakSet();
  function skipSubtree(node) {
    var kids = node.querySelectorAll("*");
    for (var i = 0; i < kids.length; i++) skipSet.add(kids[i]);
  }

  function harvest(stage) {
    var base = stage.getBoundingClientRect();
    var sc = base.width / STAGE_W || 1;
    var out = [];
    var consumed = new WeakSet();

    function rect(n) {
      var r = n.getBoundingClientRect();
      return {
        x: +((r.left - base.left) / sc).toFixed(2),
        y: +((r.top - base.top) / sc).toFixed(2),
        w: +(r.width / sc).toFixed(2),
        h: +(r.height / sc).toFixed(2)
      };
    }

    /* Retângulo do CONTEÚDO: sem borda e sem padding. A caixa de texto do
       PowerPoint não tem padding, então usar a caixa de borda joga o texto
       para a esquerda (dá para ver no marcador de bullet colado na letra). */
    function contentRect(n, cs) {
      var r = rect(n);
      var pl = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0);
      var pr = (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderRightWidth) || 0);
      var pt = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.borderTopWidth) || 0);
      var pb = (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
      return {
        x: +(r.x + pl).toFixed(2),
        y: +(r.y + pt).toFixed(2),
        w: +Math.max(1, r.w - pl - pr).toFixed(2),
        h: +Math.max(1, r.h - pt - pb).toFixed(2)
      };
    }

    /* runs: preserva a cor/peso de <em>, <strong> etc. dentro do bloco */
    function runsOf(n) {
      var runs = [];
      var pcs = getComputedStyle(n);
      function push(text, cs) {
        if (!text) return;
        var last = runs[runs.length - 1];
        var r = {
          text: text,
          color: normColor(cs.color),
          size: +parseFloat(cs.fontSize).toFixed(2),
          bold: (parseInt(cs.fontWeight, 10) || 400) >= 600,
          italic: cs.fontStyle === "italic"
        };
        if (last && last.color === r.color && last.bold === r.bold &&
            last.italic === r.italic && last.size === r.size) {
          last.text += r.text;
        } else {
          runs.push(r);
        }
      }
      for (var i = 0; i < n.childNodes.length; i++) {
        var c = n.childNodes[i];
        if (c.nodeType === 3) {
          push(c.nodeValue.replace(/\s+/g, " "), pcs);
        } else if (c.nodeType === 1 && INLINE.test(c.tagName)) {
          /* Só absorve o filho se ele for realmente inline. Um <span> que é
             item de flex/grid vira bloco e tem geometria própria — absorvê-lo
             juntaria colunas separadas numa única caixa de texto no PPTX. */
          var ccs = getComputedStyle(c);
          if (ccs.display !== "inline") continue;
          push(c.textContent.replace(/\s+/g, " "), ccs);
          consumed.add(c);
          c.querySelectorAll("*").forEach(function (d) { consumed.add(d); });
        }
      }
      if (!runs.length) return null;
      runs[0].text = runs[0].text.replace(/^\s+/, "");
      runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
      var kept = runs.filter(function (r) { return r.text.length; });
      return kept.length ? kept : null;   /* [] é truthy — devolver null */
    }

    var walker = document.createTreeWalker(stage, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (/^(SCRIPT|STYLE|BR)$/.test(n.tagName)) return NodeFilter.FILTER_REJECT;
        if (n.classList.contains("notes")) return NodeFilter.FILTER_REJECT;
        /* tabelas são exportadas inteiras: não descer nas células */
        if (n.parentElement && n.parentElement.closest("table")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var n;
    while ((n = walker.nextNode())) {
      if (skipSet.has(n)) continue;
      var cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
      var r = rect(n);
      if (r.w < 1 || r.h < 1) continue;

      if (n.tagName === "IMG") {
        out.push({ kind: "image", src: n.currentSrc || n.src, alt: n.alt || "", rect: r });
        continue;
      }
      if (n.tagName === "TABLE") {
        out.push({ kind: "table", rect: r, rows: readTable(n) });
        continue;
      }
      /* SVG inline (gráficos desenhados à mão) — o exportador rasteriza */
      if (n.tagName.toLowerCase() === "svg") {
        out.push({ kind: "svg", rect: r, markup: n.outerHTML });
        skipSubtree(n);
        continue;
      }

      /* superfície: fundo e/ou borda visível */
      var bg = normColor(cs.backgroundColor);
      var hasBg = !isInvisible(bg);
      var sides = ["Top", "Right", "Bottom", "Left"].map(function (side) {
        var w = Math.round(parseFloat(cs["border" + side + "Width"]) || 0);
        var st = cs["border" + side + "Style"];
        var co = normColor(cs["border" + side + "Color"]);
        var on = w > 0 && st !== "none" && st !== "hidden" && !isInvisible(co);
        return { side: side.toLowerCase(), w: w, color: co, on: on };
      });
      var onSides = sides.filter(function (x) { return x.on; });
      /* uniforme = contorno único; parcial = uma régua por lado (a grade da
         matriz e da tabela usa borda de um lado só) */
      var uniform = onSides.length === 4 &&
        onSides.every(function (x) { return x.w === onSides[0].w && x.color === onSides[0].color; });

      if (hasBg || onSides.length) {
        out.push({
          kind: "shape",
          rect: r,
          fill: hasBg ? bg : null,
          line: uniform ? { color: onSides[0].color, w: onSides[0].w } : null,
          rules: uniform ? null : onSides.map(function (x) {
            return { side: x.side, color: x.color, w: x.w };
          }),
          radius: Math.round(parseFloat(cs.borderTopLeftRadius) || 0)
        });
      }

      /* Pseudo-elementos posicionados com fundo próprio: marcador de bullet,
         conector de passo. São decoração, mas decoração que carrega leitura. */
      ["::before", "::after"].forEach(function (pe) {
        var ps = getComputedStyle(n, pe);
        if (!ps || ps.content === "none" || ps.display === "none") return;
        if (ps.position !== "absolute") return;
        var pbg = normColor(ps.backgroundColor);
        if (isInvisible(pbg)) return;
        var pw = parseFloat(ps.width), ph = parseFloat(ps.height);
        var pl = parseFloat(ps.left), ptp = parseFloat(ps.top);
        if (!(pw > 0 && ph > 0) || isNaN(pl) || isNaN(ptp)) return;
        out.push({
          kind: "shape",
          rect: { x: +(r.x + pl).toFixed(2), y: +(r.y + ptp).toFixed(2), w: pw, h: ph },
          fill: pbg,
          line: null,
          rules: null,
          radius: Math.round(parseFloat(ps.borderTopLeftRadius) || 0)
        });
      });

      /* imagem de fundo (marca de capa, marca de encerramento) */
      if (cs.backgroundImage && cs.backgroundImage !== "none" && !/gradient/.test(cs.backgroundImage)) {
        var m = /url\((["']?)(.*?)\1\)/.exec(cs.backgroundImage);
        if (m) out.push({ kind: "image", role: "logo", src: m[2], alt: "Cardioline", rect: r });
      }

      /* texto — só se o conteúdo não foi absorvido por um ancestral inline */
      if (!consumed.has(n)) {
        var runs = runsOf(n);
        if (runs) {
          out.push({
            kind: "text",
            runs: runs,
            text: runs.map(function (x) { return x.text; }).join(""),
            rect: contentRect(n, cs),
            font: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
            size: +parseFloat(cs.fontSize).toFixed(2),
            weight: parseInt(cs.fontWeight, 10) || 400,
            color: normColor(cs.color),
            align: cs.textAlign === "start" ? "left" : cs.textAlign,
            lineHeight: +(parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6).toFixed(2),
            tracking: +(parseFloat(cs.letterSpacing) || 0).toFixed(3),
            upper: cs.textTransform === "uppercase",
            italic: cs.fontStyle === "italic"
          });
        }
      }
    }

    /* ::before do palco = logo do header (pseudo-elemento não entra no walker) */
    var pb = getComputedStyle(stage, "::before");
    if (pb && pb.backgroundImage && pb.backgroundImage !== "none" && pb.display !== "none") {
      var mm = /url\((["']?)(.*?)\1\)/.exec(pb.backgroundImage);
      var lw = parseFloat(pb.width) || 132;
      if (mm) {
        out.push({
          kind: "image", role: "logo", src: mm[2], alt: "Cardioline",
          rect: {
            x: parseFloat(pb.left) || 44,
            y: parseFloat(pb.top) || 30,
            w: lw,
            h: +(lw * 38 / 600).toFixed(2)
          }
        });
      }
    }
    return out;
  }

  function readTable(tbl) {
    return Array.prototype.map.call(tbl.querySelectorAll("tr"), function (tr) {
      return Array.prototype.map.call(tr.children, function (td) {
        var cs = getComputedStyle(td);
        return {
          text: td.textContent.replace(/\s+/g, " ").trim(),
          head: td.tagName === "TH",
          align: cs.textAlign === "start" ? "left" : cs.textAlign,
          bold: (parseInt(cs.fontWeight, 10) || 400) >= 600,
          size: +parseFloat(cs.fontSize).toFixed(2),
          color: normColor(cs.color),
          fill: normColor(cs.backgroundColor),
          upper: cs.textTransform === "uppercase"
        };
      });
    });
  }

  /* ---------- arranque -------------------------------------------------- */
  fit();

  /* Sinal para export-pdf.mjs / export-pptx.mjs: só exporte depois que fontes
     e imagens estiverem prontas, senão o logo e os devices saem em branco. */
  function markReady() {
    var imgs = Array.prototype.slice.call(document.images);
    var pending = imgs.filter(function (im) { return !im.complete; });
    Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      Promise.all(pending.map(function (im) {
        return new Promise(function (res) { im.addEventListener("load", res); im.addEventListener("error", res); });
      }))
    ]).then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.documentElement.setAttribute("data-deck-ready", "1");
          fit();
        });
      });
    });
  }
  markReady();

  var fromHash = parseInt((location.hash || "").replace("#", ""), 10);
  show(!isNaN(fromHash) && fromHash >= 1 && fromHash <= slides.length ? fromHash - 1 : 0, false);
  window.addEventListener("hashchange", function () {
    var n = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(n) && n >= 1 && n <= slides.length && n - 1 !== idx) show(n - 1, false);
  });
})();

/* ============================================================================
   Vestido de folheto  (body.skin-brochure)
   A skin é um preset de tons: escurece as três peças de moldura — capa, divisória
   e encerramento — pondo .tone-dark nelas. Fazer isso aqui, e não no CSS, faz a
   skin reusar o sistema de tons inteiro (cor de texto, troca do logo, contraste
   do rodapé) em vez de reimplementá-lo e divergir dele com o tempo.

   Slide que já declara um tom no HTML é respeitado: a escolha explícita ganha.
   ========================================================================= */
(function () {
  "use strict";
  if (!document.body.classList.contains("skin-brochure")) return;
  var moldura = document.querySelectorAll(".slide.t-cover, .slide.t-section, .slide.t-end");
  [].forEach.call(moldura, function (s) {
    if (/tone-/.test(s.className)) return;
    s.classList.add("tone-dark");
  });
})();

/* ============================================================================
   Controles preenchidos ao vivo  (.dial)
   Liga o campo numérico e o slider do mesmo `data-dial` no mesmo valor, e avisa
   o deck a cada mudança. A FÓRMULA não vive aqui: cada deck calcula o que é seu
   ouvindo o evento, porque a conta muda de deck para deck e o motor não deve
   saber de nenhuma.

     document.addEventListener("deck:dials", function (e) {
       var v = e.detail;                       // { exames: 1000, custo: 15, ... }
       document.getElementById("economia").textContent = fmt(v.exames * v.custo);
     });

   Nada persiste: recarregar volta aos valores do HTML, de propósito, para o deck
   começar limpo na reunião seguinte.
   ========================================================================= */
(function () {
  "use strict";
  var campos = [].slice.call(document.querySelectorAll("[data-dial]"));
  if (!campos.length) return;

  function valores() {
    var v = {};
    campos.forEach(function (el) {
      var n = parseFloat(el.value);
      if (!isNaN(n)) v[el.getAttribute("data-dial")] = n;
    });
    return v;
  }

  function avisa() {
    document.dispatchEvent(new CustomEvent("deck:dials", { detail: valores() }));
  }

  campos.forEach(function (el) {
    el.addEventListener("input", function () {
      var nome = el.getAttribute("data-dial");
      campos.forEach(function (outro) {
        if (outro !== el && outro.getAttribute("data-dial") === nome) outro.value = el.value;
      });
      avisa();
    });
  });

  avisa();   // primeira pintura com os valores que vieram no HTML
})();
