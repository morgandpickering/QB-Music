// Quattlebaum Music — shared behavior

// Marks JS as available so CSS can safely hide-then-reveal content for the
// scroll animations below. If this line never runs (JS blocked/broken),
// the CSS reveal rules stay scoped out and everything stays visible.
document.body.classList.add("js-ready");

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      const expanded = nav.classList.contains("open");
      toggle.setAttribute("aria-expanded", String(expanded));
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("open"));
    });
  }

  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = form.querySelector(".form-status");
      const first = form.first.value.trim();
      const last = form.last.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!first || !last || !email || !message) {
        status.textContent = "Please fill out every field before sending.";
        status.className = "form-status err";
        return;
      }

      const subject = encodeURIComponent(`Website inquiry from ${first} ${last}`);
      const body = encodeURIComponent(
        `${message}\n\n— ${first} ${last}\n${email}`
      );
      window.location.href = `mailto:qmusic1966@gmail.com?subject=${subject}&body=${body}`;

      status.textContent = "Opening your email app to send this message...";
      status.className = "form-status ok";
    });
  }

  // Sliding marquee ticker — inserted right after the hero on every page.
  const heroEl = document.querySelector(".hero, .page-hero");
  if (heroEl) {
    const tickerText =
      "GUITARS ★ AMPS ★ LESSONS ★ SOUND SYSTEMS ★ REPAIRS ★ EST. 1966 ★ SEARCY, ARKANSAS ★ (501) 268-6694 ★ ";
    const ticker = document.createElement("div");
    ticker.className = "ticker";
    ticker.setAttribute("aria-hidden", "true");
    const track = document.createElement("div");
    track.className = "ticker-track";
    track.innerHTML = `<span>${tickerText}</span><span>${tickerText}</span>`;
    ticker.appendChild(track);
    heroEl.insertAdjacentElement("afterend", ticker);
  }

  // Scroll-triggered reveal for cards, sections, and other content blocks.
  const revealEls = document.querySelectorAll(
    [
      ".card",
      ".team-card",
      ".product-card",
      ".service-block",
      ".brand-pillar",
      ".contact-info-item",
      ".banner",
      ".section-head",
      ".photo-banner",
      ".photo-pair figure",
      ".form-card",
    ].join(",")
  );

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    // No IntersectionObserver support — just show everything.
    revealEls.forEach((el) => el.classList.add("in-view"));
  }
});
