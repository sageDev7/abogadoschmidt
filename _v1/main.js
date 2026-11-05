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
    document.querySelectorAll("#contacto, #ftr").forEach(function (el) { fio.observe(el); });
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

