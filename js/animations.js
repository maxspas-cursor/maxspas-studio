(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const reveal = document.querySelectorAll(".reveal, .card, .price-card, .quick-link, .trust-badge");
  if (!reveal.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  reveal.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(i * 60, 360)}ms`);
    io.observe(el);
  });
})();
