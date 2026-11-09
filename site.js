/* ============================================================
   ALPHA DEVELOPS — site.js
   Tilt cards · reveal on scroll · cursor glow · mobile nav ·
   Time Burn live countdown (guarded — only runs on its page)
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 3D tilt cards ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var rx = (0.5 - py) * 9;
          var ry = (px - 0.5) * 11;
          card.style.transform =
            "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
        });
      });
      card.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  /* ---------- custom cursor glow ---------- */
  var glow = document.querySelector(".cursor-glow");
  if (glow && fine && !reduceMotion) {
    var gx = -500, gy = -500, tx = -500, ty = -500, glowRaf = null;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.style.opacity = "1";
      if (!glowRaf) {
        var step = function () {
          gx += (tx - gx) * 0.12;
          gy += (ty - gy) * 0.12;
          glow.style.transform = "translate(" + gx + "px," + gy + "px)";
          if (Math.abs(tx - gx) > 0.6 || Math.abs(ty - gy) > 0.6) {
            glowRaf = requestAnimationFrame(step);
          } else { glowRaf = null; }
        };
        glowRaf = requestAnimationFrame(step);
      }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { glow.style.opacity = "0"; });
  }

  /* ---------- Time Burn: live countdown to next New Year ---------- */
  var cdRoot = document.getElementById("tb-countdown");
  if (cdRoot) {
    var elD = document.getElementById("cd-days"),
        elH = document.getElementById("cd-hours"),
        elM = document.getElementById("cd-mins"),
        elS = document.getElementById("cd-secs"),
        fill = document.getElementById("cd-progress"),
        note = document.getElementById("cd-note"),
        wax = document.getElementById("tb-wax"),
        yearEl = document.getElementById("cd-year");

    var now = new Date();
    var target = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0); // next Jan 1
    var yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    if (yearEl) yearEl.textContent = String(target.getFullYear());

    var pad = function (n) { return (n < 10 ? "0" : "") + n; };

    var tick = function () {
      var t = new Date();
      var diff = target - t;
      if (diff < 0) diff = 0;
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor(diff / 3600000) % 24;
      var mins = Math.floor(diff / 60000) % 60;
      var secs = Math.floor(diff / 1000) % 60;
      if (elD) elD.textContent = String(days);
      if (elH) elH.textContent = pad(hours);
      if (elM) elM.textContent = pad(mins);
      if (elS) elS.textContent = pad(secs);

      // Candle melt: the wax left mirrors the year left.
      var totalYear = target - yearStart;
      var elapsed = t - yearStart;
      var fracLeft = Math.max(0, Math.min(1, 1 - elapsed / totalYear));
      var pctLeft = fracLeft * 100;
      if (fill) fill.style.width = pctLeft.toFixed(2) + "%";
      if (wax) wax.style.height = Math.round(26 + fracLeft * 104) + "px"; // 130px full → 26px stub
      if (note) {
        note.textContent = pctLeft.toFixed(1) + "% of the year is still unburned. " +
          "In Time Burn, every goal gets a candle like this one — watch it melt, and you watch your time.";
      }
    };
    tick();
    setInterval(tick, 1000);
  }
})();
