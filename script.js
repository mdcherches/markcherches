const contentRoot = document.querySelector("#content");
const menuToggle = document.querySelector(".menu-toggle");
const menuPanel = document.querySelector("#menu-panel");

const routes = ["home", "about", "experience", "projects", "research", "contact"];
let siteData = null;

const icons = {
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4"/><path d="M8 19c-3 .9-3-1.5-4.2-2"/>',
  linkedin:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11v6M8 7.5v.01M12 17v-6M12 14a3 3 0 0 1 6 0v3"/>',
  email:
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
};

function escapeHTML(value = "") {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function safeURL(value = "#") {
  const url = String(value).trim();
  if (
    url.startsWith("/") ||
    url.startsWith("#") ||
    url.startsWith("mailto:") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  ) {
    return escapeHTML(url);
  }
  return "#";
}

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.link}</svg>`;
}

function imageMarkup(src, alt, className) {
  const path = src || "/assets/images/portrait-placeholder.png";
  return `
    <div class="media-frame ${className}">
      <img src="${safeURL(path)}" alt="${escapeHTML(alt || "")}">
    </div>
  `;
}

function externalAttributes(url) {
  return /^https?:\/\//.test(url || "") ? ' target="_blank" rel="noreferrer"' : "";
}

function homePage(data) {
  return `
    <section class="page page-home" aria-labelledby="home-title">
      <div class="home-copy">
        <h1 class="home-name" id="home-title">
          ${escapeHTML(data.firstName)}<br>${escapeHTML(data.lastName)}
        </h1>
        <p class="home-eyebrow">${escapeHTML(data.eyebrow)}</p>
        <p class="home-summary mono-copy">${escapeHTML(data.summary)}</p>
        <a class="inline-link" href="${safeURL(data.ctaTarget || "#about")}">${escapeHTML(data.ctaLabel)}</a>
      </div>
      ${imageMarkup(data.image, data.imageAlt, "home-portrait")}
    </section>
  `;
}

function aboutPage(data) {
  const paragraphs = (data.paragraphs || [])
    .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
    .join("");

  return `
    <section class="page page-about" aria-labelledby="about-title">
      <div class="about-copy">
        <h1 class="page-heading" id="about-title">${escapeHTML(data.heading)}</h1>
        <div class="about-paragraphs mono-copy">${paragraphs}</div>
        <a class="resume-link" href="${safeURL(data.resumeUrl || "#about")}"${externalAttributes(data.resumeUrl)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14m-5-5 5 5-5 5"/>
          </svg>
          ${escapeHTML(data.resumeLabel)}
        </a>
      </div>
      ${imageMarkup(data.image, data.imageAlt, "about-image")}
    </section>
  `;
}

function projectsPage(data) {
  const items = (data.items || [])
    .map(
      (project) => `
        <a class="project-row" href="${safeURL(project.url)}"${externalAttributes(project.url)}>
          ${imageMarkup(project.image, "", "project-thumbnail")}
          <div class="project-info">
            <h2>${escapeHTML(project.title)}</h2>
            <p>${escapeHTML(project.description)}</p>
            <p class="project-meta">${escapeHTML(project.meta)}</p>
          </div>
          <span class="external-arrow" aria-hidden="true">→</span>
        </a>
      `
    )
    .join("");

  return `
    <section class="page page-list" aria-labelledby="projects-title">
      <header class="section-header">
        <h1 class="page-heading" id="projects-title">${escapeHTML(data.heading)}</h1>
        <p class="section-intro">${escapeHTML(data.intro)}</p>
      </header>
      <div class="project-list">${items}</div>
      <a class="inline-link list-footer-link" href="${safeURL(data.footerUrl)}"${externalAttributes(data.footerUrl)}>
        ${escapeHTML(data.footerLabel)}
      </a>
    </section>
  `;
}

function experiencePage(data) {
  const items = (data.items || [])
    .map(
      (entry, index) => {
        const detailsId = `experience-details-${index}`;
        const details = (entry.details || [])
          .map((detail) => `<li>${escapeHTML(detail)}</li>`)
          .join("");

        return `
        <article class="experience-row">
          <span class="timeline-dot" aria-hidden="true"></span>
          <p class="experience-period">${escapeHTML(entry.period)}</p>
          <div class="experience-main">
            <h2>${escapeHTML(entry.role)}</h2>
            <p>${escapeHTML(entry.organization)}</p>
            <p class="experience-detail">${escapeHTML(entry.detail)}</p>
          </div>
          <button
            class="experience-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="${detailsId}"
          >
            <span class="experience-toggle-label">View role</span>
            <span class="experience-toggle-icon" aria-hidden="true">+</span>
          </button>
          <div class="experience-panel" id="${detailsId}" hidden>
            <ul>${details}</ul>
          </div>
        </article>
      `
      }
    )
    .join("");

  return `
    <section class="page page-list" aria-labelledby="experience-title">
      <header class="section-header">
        <h1 class="page-heading" id="experience-title">${escapeHTML(data.heading)}</h1>
        <p class="section-intro">${escapeHTML(data.intro)}</p>
      </header>
      <div class="experience-timeline">${items}</div>
      <a class="inline-link list-footer-link" href="${safeURL(data.footerUrl)}"${externalAttributes(data.footerUrl)}>
        ${escapeHTML(data.footerLabel)}
      </a>
    </section>
  `;
}

function researchPage(data) {
  const items = (data.items || [])
    .map(
      (item) => `
        <a class="research-row" href="${safeURL(item.url)}"${externalAttributes(item.url)}>
          <span class="research-year">${escapeHTML(item.year)}</span>
          <div class="research-info">
            <h2>${escapeHTML(item.title)}</h2>
            <p class="research-meta">${escapeHTML(item.topic)}</p>
          </div>
          <p class="research-publication">${escapeHTML(item.description)}</p>
          <span class="external-arrow" aria-hidden="true">→</span>
        </a>
      `
    )
    .join("");

  return `
    <section class="page page-list" aria-labelledby="research-title">
      <header class="section-header">
        <h1 class="page-heading" id="research-title">${escapeHTML(data.heading)}</h1>
        <p class="section-intro">${escapeHTML(data.intro)}</p>
      </header>
      <div class="research-list">${items}</div>
    </section>
  `;
}

function contactPage(data) {
  const items = (data.items || [])
    .map(
      (item) => `
        <a class="contact-link" href="${safeURL(item.url)}"${externalAttributes(item.url)}>
          ${icon(item.icon)}
          <span>${escapeHTML(item.label)}</span>
          <span class="external-arrow" aria-hidden="true">→</span>
        </a>
      `
    )
    .join("");

  return `
    <section class="page page-contact" aria-labelledby="contact-title">
      <div class="contact-content">
        <h1 class="page-heading" id="contact-title">${escapeHTML(data.heading)}</h1>
        <p class="section-intro">${escapeHTML(data.intro)}</p>
        <div class="contact-links">${items}</div>
      </div>
      <div class="topography" aria-hidden="true"></div>
    </section>
  `;
}

function renderSocials(socials = []) {
  const root = document.querySelector("#social-links");
  root.innerHTML = socials
    .map(
      (item) => `
        <a
          class="social-link"
          href="${safeURL(item.url)}"
          aria-label="${escapeHTML(item.label)}"
          ${externalAttributes(item.url)}
        >
          ${icon(item.icon)}
        </a>
      `
    )
    .join("");
}

function currentRoute() {
  const hash = window.location.hash.slice(1).toLowerCase();
  return routes.includes(hash) ? hash : "home";
}

function updateActiveNavigation(route) {
  document.querySelectorAll("[data-route-link]").forEach((link) => {
    if (link.dataset.routeLink === route) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  menuPanel.hidden = true;
}

function renderRoute({ focus = false } = {}) {
  if (!siteData) return;

  const route = currentRoute();
  const renderers = {
    home: () => homePage(siteData.home),
    about: () => aboutPage(siteData.about),
    projects: () => projectsPage(siteData.projects),
    experience: () => experiencePage(siteData.experience),
    research: () => researchPage(siteData.research),
    contact: () => contactPage(siteData.contact),
  };

  contentRoot.innerHTML = renderers[route]();
  updateActiveNavigation(route);
  closeMenu();
  document.title = route === "home"
    ? siteData.meta.siteTitle
    : `${siteData[route].heading} — ${siteData.meta.siteTitle}`;

  if (focus) {
    contentRoot.focus({ preventScroll: true });
  }
}

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
  menuPanel.hidden = open;
});

document.addEventListener("click", (event) => {
  if (
    !menuPanel.hidden &&
    !menuPanel.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

contentRoot.addEventListener("click", (event) => {
  const button = event.target.closest(".experience-toggle");
  if (!button) return;

  const panel = document.getElementById(button.getAttribute("aria-controls"));
  if (!panel) return;

  const isOpen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isOpen));
  button.querySelector(".experience-toggle-label").textContent = isOpen
    ? "View role"
    : "Close role";
  panel.hidden = isOpen;
});

window.addEventListener("hashchange", () => renderRoute({ focus: true }));

fetch("content/site.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    return response.json();
  })
  .then((data) => {
    siteData = data;
    document.querySelector(".monogram").textContent = data.meta.initials;
    document.querySelector("#footer-year").textContent = data.meta.year;
    document.querySelector("#footer-name").textContent = data.meta.ownerName;
    document.querySelector('meta[name="description"]').content = data.meta.description;
    renderSocials(data.socials);
    renderRoute();
  })
  .catch((error) => {
    console.error(error);
    contentRoot.innerHTML = `
      <div class="error-state">
        <p>The portfolio content could not be loaded. Please try refreshing the page.</p>
      </div>
    `;
  });
