/** MAXSPAS Studio — gradient line icons (Flaticon-inspired, custom SVG) */
(function (global) {
  const S = "1.75";
  const R = "round";
  const J = "round";

  const icons = {
    web: `
      <rect x="2.5" y="4" width="19" height="14" rx="2.5" fill="rgba(124,58,237,0.14)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M2.5 8.5h19" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="${R}"/>
      <circle cx="5.5" cy="6.25" r="0.9" fill="#c4b5fd"/><circle cx="8" cy="6.25" r="0.9" fill="#7c3aed"/>
      <path d="M7 12h4M7 15h7" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="${R}" opacity="0.9"/>`,

    bot: `
      <rect x="5" y="7" width="14" height="11" rx="3" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" stroke-width="${S}"/>
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" stroke="#a78bfa" stroke-width="${S}" stroke-linecap="${R}"/>
      <circle cx="9.5" cy="12.5" r="1.25" fill="#7c3aed"/><circle cx="14.5" cy="12.5" r="1.25" fill="#7c3aed"/>
      <path d="M9.5 15.5h5" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="${R}"/>
      <path d="M3 11.5h2M19 11.5h2" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="${R}"/>`,

    bundle: `
      <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3z" fill="rgba(124,58,237,0.12)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M12 3v18M4 7.5l8 4.5 8-4.5" stroke="#7c3aed" stroke-width="1.5" stroke-linejoin="${J}"/>
      <circle cx="12" cy="11.5" r="2" fill="#7c3aed" opacity="0.35"/>`,

    cube: `
      <path d="M12 7 16.9 9.65 12 13 7.1 9.65Z" fill="#a78bfa"/>
      <path d="M7.1 9.65 12 13.05 12 17.95 7.1 15.15Z" fill="#5b21b6"/>
      <path d="M12 13.05 16.9 9.65 16.9 15.15 12 17.95Z" fill="#7c3aed"/>
      <path d="M12 7 16.9 9.65 16.9 15.15 12 17.95 7.1 15.15 7.1 9.65Z M12 13.05 7.1 9.65M12 13.05 16.9 9.65M12 13.05V17.95" stroke="#c4b5fd" stroke-width="1.35" stroke-linejoin="${J}" stroke-linecap="${R}"/>
      <path d="M8.5 18.8h7M9.2 20.2h5.6" stroke="#fb923c" stroke-width="1.15" stroke-linecap="${R}" opacity="0.85"/>`,

    grbnk: `
      <path d="M4 18.5 12 22.25 20 18.5 12 14.75Z" fill="#ef4444"/>
      <path d="M4 18.5 12 14.75 12 22.25Z" fill="#b91c1c" fill-opacity="0.5"/>
      <path d="M12 14.75 20 18.5 12 22.25Z" fill="#dc2626" fill-opacity="0.35"/>
      <path d="M12 5.5 17.25 8.75 12 12.5 6.75 8.75Z" fill="#c4b5fd"/>
      <path d="M6.75 8.75 12 12.5 12 18.75 6.75 16.1Z" fill="#5b21b6"/>
      <path d="M12 12.5 17.25 8.75 17.25 16.1 12 18.75Z" fill="#7c3aed"/>
      <path d="M12 5.5 17.25 8.75 17.25 16.1 12 18.75 6.75 16.1 6.75 8.75Z M12 12.5 6.75 8.75M12 12.5 17.25 8.75M12 12.5V18.75" stroke="#ede9fe" stroke-width="1.2" stroke-linejoin="${J}" stroke-linecap="${R}"/>`,

    pin: `
      <path d="M12 21.5s-5.5-4.2-5.5-9.5a5.5 5.5 0 1 1 11 0c0 5.3-5.5 9.5-5.5 9.5z" fill="rgba(251,146,60,0.12)" stroke="#fb923c" stroke-width="${S}" stroke-linejoin="${J}"/>
      <circle cx="12" cy="12" r="2.25" fill="#7c3aed" stroke="#c4b5fd" stroke-width="1.25"/>`,

    verified: `
      <circle cx="12" cy="12" r="8.5" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" stroke-width="${S}"/>
      <path d="M8.25 12.25 10.75 14.75 16 9.5" stroke="#a78bfa" stroke-width="2" stroke-linecap="${R}" stroke-linejoin="${J}"/>`,

    globe: `
      <circle cx="12" cy="12" r="8.5" fill="rgba(124,58,237,0.08)" stroke="#a78bfa" stroke-width="${S}"/>
      <ellipse cx="12" cy="12" rx="3.5" ry="8.5" stroke="#7c3aed" stroke-width="1.5"/>
      <path d="M3.5 12h17M5 7.5h14M5 16.5h14" stroke="#c4b5fd" stroke-width="1.25" stroke-linecap="${R}" opacity="0.7"/>`,

    package: `
      <path d="M12 3 21 8v8l-9 5-9-5V8l9-5z" fill="rgba(251,146,60,0.08)" stroke="#fb923c" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M12 3v18M3 8l9 5 9-5" stroke="#a78bfa" stroke-width="1.5" stroke-linejoin="${J}"/>
      <path d="M8.5 10.5 12 12.5l3.5-2" stroke="#7c3aed" stroke-width="1.25" stroke-linecap="${R}"/>`,

    receipt: `
      <path d="M7 3h10a2 2 0 0 1 2 2v14l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V5a2 2 0 0 1 2-2z" fill="rgba(124,58,237,0.12)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M9 8h6M9 11.5h6M9 15h4" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="${R}"/>`,

    bolt: `
      <path d="M13 2 6 13h5.5L10 22l8-12h-5.5L13 2z" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" stroke-width="${S}" stroke-linejoin="${J}"/>`,

    chat: `
      <path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3.5V7a2 2 0 0 1 2-2z" fill="rgba(124,58,237,0.12)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M8.5 10.5h7M8.5 13.5h4.5" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="${R}"/>`,

    folder: `
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="rgba(124,58,237,0.1)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M3 9h18" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="${R}"/>`,

    printer: `
      <path d="M7 9V5h10v4M5 11h14a2 2 0 0 1 2 2v4H3v-4a2 2 0 0 1 2-2z" fill="rgba(124,58,237,0.08)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <rect x="7" y="15" width="10" height="5" rx="1" stroke="#7c3aed" stroke-width="1.5" fill="rgba(124,58,237,0.12)"/>
      <circle cx="17" cy="13" r="0.9" fill="#22d3ee"/>`,

    pencil: `
      <path d="M4 20l4-1 9.5-9.5a2.12 2.12 0 0 0 0-3L16.5 4.5a2.12 2.12 0 0 0-3 0L4 14l-1 4 1 2z" fill="rgba(124,58,237,0.1)" stroke="#a78bfa" stroke-width="${S}" stroke-linejoin="${J}"/>
      <path d="M13.5 6.5l4 4" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="${R}"/>
      <path d="M4 16l2 2" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="${R}"/>`,

    sparkle: `
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="${R}"/>
      <path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="${R}"/>
      <circle cx="12" cy="12" r="3.5" fill="rgba(124,58,237,0.2)" stroke="#c4b5fd" stroke-width="${S}"/>`,
  };

  const aliases = { "3d": "grbnk", robot: "bot", box: "bundle", cube: "grbnk" };
  const emojiMap = {
    "\u{1F310}": "web",
    "\u{1F916}": "bot",
    "\u{1F4E6}": "bundle",
    "\u{1F9CA}": "grbnk",
    "\u2728": "sparkle",
  };

  function resolve(name) {
    const raw = String(name || "sparkle");
    const key = (emojiMap[raw] || raw).toLowerCase();
    return icons[aliases[key] || key] ? aliases[key] || key : "sparkle";
  }

  function icon(name, opts) {
    opts = opts || {};
    const key = resolve(name);
    const parts = ["ms-icon"];
    if (opts.lg) parts.push("ms-icon--lg");
    if (opts.xl) parts.push("ms-icon--xl");
    if (opts.sm) parts.push("ms-icon--sm");
    if (opts.class) parts.push(opts.class);
    const aria = opts.label
      ? ` role="img" aria-label="${String(opts.label).replace(/"/g, "&quot;")}"`
      : ' aria-hidden="true"';
    return `<svg class="${parts.join(" ")}" viewBox="0 0 24 24" fill="none"${aria} xmlns="http://www.w3.org/2000/svg">${icons[key]}</svg>`;
  }

  function hydrate(root) {
    (root || document).querySelectorAll("[data-ms-icon]").forEach((el) => {
      const n = el.dataset.msIcon;
      const lg = el.classList.contains("ms-icon-host--lg");
      const xl = el.classList.contains("ms-icon-host--xl");
      const sm = el.classList.contains("ms-icon-wrap") || el.classList.contains("grbnk-brand__icon");
      el.innerHTML = icon(n, { lg, xl, sm, label: el.dataset.msIconLabel });
    });
  }

  global.MSIcons = { icon, hydrate, resolve, names: Object.keys(icons) };
})(window);
