/* Kit base sageDev — main.js (sirve para el index y las páginas internas: todo está protegido con «if»). */
(function () {
  "use strict";

  /* ---------- WhatsApp: número único; cada botón .js-wa trae su propio data-msg ---------- */
  var WA_NUMBER = "5491126583978";
  function waUrl(msg) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg); }
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waUrl(a.getAttribute("data-msg") || "Hola, quisiera hacer una consulta.");
    a.target = "_blank"; a.rel = "noopener";
  });
  /* links a páginas que todavía no existen */
  document.querySelectorAll("[data-soon]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); });

  var body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header: transparente arriba, sólido al scrollear ---------- */
  var hdr = document.getElementById("hdr");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("sc", window.scrollY > 40); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- menú mobile: la hamburguesa se transforma en cruz (un solo botón) ---------- */
  var burger = document.getElementById("burger");
  function setNav(open) {
    body.classList.toggle("nav-open", open);
    if (!burger) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  if (burger) {
    burger.addEventListener("click", function () { setNav(!body.classList.contains("nav-open")); });
    var ov = document.getElementById("mnavOv"); if (ov) ov.addEventListener("click", function () { setNav(false); });
    document.querySelectorAll(".mnav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  }

  /* ---------- reveals (usar .on, no .in, para otros estados) ---------- */
  var items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- flotante de WhatsApp: se oculta en contacto y footer ---------- */
  var fab = document.getElementById("waFloat");
  if (fab && "IntersectionObserver" in window) {
    var hidden = new Set();
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) hidden.add(en.target); else hidden.delete(en.target); });
      fab.classList.toggle("hide", hidden.size > 0);
    });
    // en mobile también mientras se ve el escudo del hero (si no, tapa la punta)
    document.querySelectorAll("#contacto, #ftr, .escudo-m").forEach(function (el) { fio.observe(el); });
  }

  /* ---------- formulario: se envía por email (FormSubmit) o por WhatsApp ----------
     Si el proyecto no lleva el botón de WhatsApp, borrar #formWaBtn del HTML: el resto sigue andando.
     El email es obligatorio solo para el envío por email. */
  var form = document.getElementById("contactForm");
  var modal = document.getElementById("okModal");
  if (form) {
    var btn = document.getElementById("formSubmitBtn"), waBtn = document.getElementById("formWaBtn");
    var email = document.getElementById("fEmail");
    var btnTxt = btn ? btn.textContent : "", sending = false;
    var valid = function (input, porEmail) {
      var v = input.value.trim();
      var ok = input === email ? (v === "" ? !porEmail : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) : v !== "";
      input.closest(".field").classList.toggle("err", !ok);
      return ok;
    };
    var check = function (porEmail) {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (i) { if (!valid(i, porEmail)) ok = false; });
      if (email && !valid(email, porEmail)) ok = false;
      if (!ok) { var f = form.querySelector(".field.err input,.field.err select,.field.err textarea"); if (f) f.focus(); }
      return ok;
    };
    var reset = function (txt) { sending = false; btn.disabled = false; btn.textContent = txt || btnTxt; };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!btn) { if (waBtn) waBtn.click(); return; } // formulario solo WhatsApp (sin #formSubmitBtn): Enter envía por WhatsApp
      if (sending || !check(true)) return;
      sending = true; btn.disabled = true; btn.textContent = "Enviando...";
      // endpoint AJAX de FormSubmit: responde JSON y permite saber si el envío salió de verdad
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) { return r.json(); }).then(function (d) {
        clearTimeout(t);
        if (String(d.success) !== "true") throw new Error(d.message || "error");
        form.reset(); reset();
        if (modal) modal.classList.add("show");
      }).catch(function () {
        clearTimeout(t); reset("Error al enviar, probá de nuevo");
        setTimeout(function () { if (!sending) btn.textContent = btnTxt; }, 6000);
      });
    });
    if (waBtn) waBtn.addEventListener("click", function () {
      if (!check(false)) return;
      var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var txt = "Hola, soy " + val("fNombre") + "." + (val("fArea") ? " Quisiera hacer una consulta sobre " + val("fArea") + "." : "") +
        "\n\n" + val("fMsg") + "\n\nTeléfono: " + val("fTel") + (val("fEmail") ? "\nEmail: " + val("fEmail") : "");
      window.open(waUrl(txt), "_blank", "noopener");
    });
    form.querySelectorAll("input:not([type=hidden]),select,textarea").forEach(function (i) {
      var re = function () { var f = i.closest(".field"); if (f && f.classList.contains("err")) valid(i, false); };
      i.addEventListener("input", re); i.addEventListener("change", re);
    });
  }
  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal || e.target.hasAttribute("data-close")) modal.classList.remove("show"); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setNav(false); if (modal) modal.classList.remove("show");
  });

  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
})();

/* ---------- chispas doradas del hero (salen del amolado, dentro del escudo) ---------- */
(function () {
  var cv = document.getElementById("sparks");
  if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ctx = cv.getContext("2d"), hero = cv.parentElement, W = 0, H = 0, dpr = 1, parts = [], run = true;
  var size = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  // origen: zona del amolado en desktop; en mobile, el escudo de abajo
  var origin = function () {
    // la amoladora está al 70% del ancho y 49% del alto del escudo (mismo encuadre en desktop y mobile)
    var el = hero.querySelector(window.innerWidth <= 768 ? ".escudo-m" : ".hm-shield");
    if (!el) return { x: W * .8, y: H * .55 };
    var r = el.getBoundingClientRect(), h = hero.getBoundingClientRect();
    var m = window.innerWidth <= 768;   // en mobile la foto es una franja a sangre: la amoladora queda más al centro
    return { x: r.left - h.left + r.width * (m ? .62 : .7), y: r.top - h.top + r.height * (m ? .6 : .49) };
  };
  var spawn = function (o, ember) {
    var a = ember ? -Math.PI / 2 + (Math.random() - .5) * .6 : (Math.random() < .75 ? .35 + Math.random() * 1.0 : -Math.PI / 2 + (Math.random() - .5) * 1.4);
    var v = ember ? .25 + Math.random() * .4 : .6 + Math.random() * 1.3;
    parts.push({
      x: ember ? Math.random() * W : o.x + (Math.random() - .5) * 26,
      y: ember ? H + 10 : o.y + (Math.random() - .5) * 16,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: 0, max: ember ? 300 + Math.random() * 200 : 60 + Math.random() * 50,
      r: ember ? .5 + Math.random() * .9 : .5 + Math.random() * .9, ember: ember
    });
  };
  var tick = function () {
    if (!run) return;
    ctx.clearRect(0, 0, W, H);
    var o = origin();
    if (Math.random() < .2) spawn(o, false);   // pocas, lentas y nítidas
    if (Math.random() < .12) spawn(o, true);
    ctx.globalCompositeOperation = "lighter";
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life++;
      if (!p.ember) { p.vy += .022; p.vx *= .992; } else { p.vx += (Math.random() - .5) * .04; }
      var px = p.x, py = p.y; p.x += p.vx; p.y += p.vy;
      var t = 1 - p.life / p.max;
      if (t <= 0 || p.y > H + 20 || p.x < -20 || p.x > W + 20) { parts.splice(i, 1); continue; }
      ctx.strokeStyle = "rgba(240," + (180 + 50 * t | 0) + ",120," + (t * (p.ember ? .6 : .9)).toFixed(3) + ")";
      ctx.lineWidth = p.r; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(px - p.vx * (p.ember ? 0 : 1.6), py - p.vy * (p.ember ? 0 : 1.6)); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(tick);
  };
  size(); window.addEventListener("resize", size);
  // pausa cuando el hero sale de pantalla
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !run) { run = true; tick(); } else if (!v) run = false; }).observe(hero);
  }
  tick();
})();

/* ---------- montos de los casos que cuentan al aparecer ---------- */
(function () {
  var els = document.querySelectorAll(".count");
  if (!els.length || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var fmt = function (n, d) { return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, to = parseFloat(el.dataset.to), d = parseInt(el.dataset.dec || "0", 10), t0 = null, dur = 1800;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var k = Math.min((ts - t0) / dur, 1), ease = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(k < 1 ? to * ease : to, k < 1 ? 0 : d);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- FAQ: abrir y cerrar con transición suave (nunca instantánea; ~0,35 s) ---------- */
(function () {
  if (!("animate" in Element.prototype)) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".faq details").forEach(function (d) {
    var sum = d.querySelector("summary"), anim = null;
    if (!sum) return;
    sum.addEventListener("click", function (e) {
      if (reduce) return;
      e.preventDefault();
      if (anim) anim.cancel();
      var closing = d.open, start = d.offsetHeight + "px", end;
      d.style.overflow = "hidden";
      if (closing) end = sum.offsetHeight + "px";
      else { d.open = true; end = d.offsetHeight + "px"; }
      anim = d.animate({ height: [start, end] }, { duration: 340, easing: "cubic-bezier(.2,.7,.2,1)" });
      anim.onfinish = function () { if (closing) d.open = false; d.style.overflow = ""; anim = null; };
      anim.oncancel = function () { d.style.overflow = ""; };
      var body = d.querySelector("summary ~ *");
      if (body && !closing) body.animate({ opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: 340, easing: "ease-out" });
    });
  });
})();
