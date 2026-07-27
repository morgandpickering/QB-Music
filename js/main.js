// Quattlebaum Music — shared behavior

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
});
