(function () {
  const sections = document.querySelectorAll("[data-section]");
  const navLinks = document.querySelectorAll(".side-nav a");

  function setActiveNav(id) {
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
    });
  }

  if (navLinks.length && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  document.querySelectorAll(".lang button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lang button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
})();
