const contentRoot = document.querySelector('#content');

function escapeHTML(value = '') {
  const element = document.createElement('div');
  element.textContent = value ?? '';
  return element.innerHTML;
}

function safeURL(value = '') {
  const url = String(value).trim();
  if (/^(https?:\/\/|mailto:|#|\/(?!\/))/.test(url)) return escapeHTML(url);
  return '';
}

function linkMarkup(label, url, className = '') {
  const href = safeURL(url);
  if (!href) return escapeHTML(label);
  const external = /^https?:\/\//.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a class="${className}" href="${href}"${external}>${escapeHTML(label)}<span class="link-arrow" aria-hidden="true">↗</span></a>`;
}

function homeSection(data, socials) {
  const image = safeURL(data.image);
  return `<section class="home-section ${image ? '' : 'without-portrait'}" id="home" aria-labelledby="home-title" tabindex="-1">
    <div class="home-copy">
      <h1 id="home-title">${escapeHTML(data.firstName)} ${escapeHTML(data.lastName)}</h1>
      <p class="home-eyebrow">${escapeHTML(data.eyebrow)}</p>
      <div class="home-intro"><p>${escapeHTML(data.summary)}</p>${data.current ? `<p>${escapeHTML(data.current)}</p>` : ''}</div>
      <div class="social-links" aria-label="Social links">${socials.map(item => linkMarkup(item.label, item.url)).join('')}</div>
    </div>
    ${image ? `<img class="home-portrait" src="${image}" alt="${escapeHTML(data.imageAlt)}" width="1254" height="1254" fetchpriority="high" decoding="async">` : ''}
  </section>`;
}

function sectionHeader(data) {
  return `<div class="section-heading"><h2>${escapeHTML(data.heading)}</h2>${data.intro ? `<p class="section-intro">${escapeHTML(data.intro)}</p>` : ''}</div>`;
}

function workSection(data) {
  return `<section class="content-section" id="work" aria-label="Work" tabindex="-1">${sectionHeader(data)}
    <div class="work-list">${(data.items || []).map(item => `<article class="work-row">
      <h3>${item.url ? linkMarkup(item.title, item.url) : escapeHTML(item.title)}</h3>
      ${item.context ? `<p class="work-context">${escapeHTML(item.context)}</p>` : ''}
      <p>${escapeHTML(item.description)}</p>
    </article>`).join('')}</div></section>`;
}

function projectsSection(data) {
  return `<section class="content-section" id="projects" aria-label="Projects" tabindex="-1">${sectionHeader(data)}
    <div class="project-list">${(data.items || []).map((project, index) => {
      // Self-links used by the old site aren't useful project destinations.
      const hasLink = project.url && !['#', '#projects'].includes(project.url);
      const title = hasLink && !project.demo ? linkMarkup(project.title, project.url, 'project-title-link') : escapeHTML(project.title);
      return `<article class="project-entry">
        <div class="project-row"><div class="project-info"><h3>${title}</h3><p>${escapeHTML(project.description)}</p></div>
        ${project.demo === 'snapchat-lenses' ? `<button type="button" class="lens-try-button" data-lens-demo aria-expanded="false" aria-controls="lens-panel-${index}">Try it live <span aria-hidden="true">↗</span></button>` : ''}</div>
        ${project.demo === 'snapchat-lenses' ? `<div class="lens-panel" id="lens-panel-${index}" hidden></div>` : ''}
      </article>`;
    }).join('')}</div></section>`;
}

function aboutSection(data) {
  return `<section class="content-section about-section" id="about" aria-label="About" tabindex="-1">${sectionHeader(data)}
    <div class="about-paragraphs">${(data.paragraphs || []).map(p => `<p>${escapeHTML(p)}</p>`).join('')}</div></section>`;
}

function experienceSection(data) {
  return `<section class="content-section" id="experience" aria-label="Experience" tabindex="-1">${sectionHeader(data)}
    ${(data.items || []).map(entry => `<article class="work-row experience-role"><p class="work-context">${escapeHTML(entry.period)}</p><h3>${escapeHTML(entry.role)}</h3><p>${escapeHTML(entry.organization)}</p><p>${escapeHTML(entry.detail)}</p>
      ${(entry.details || []).length ? `<ul class="role-bullets">${entry.details.map(detail => `<li>${escapeHTML(detail)}</li>`).join('')}</ul>` : ''}</article>`).join('')}</section>`;
}

function researchSection(data) {
  return `<section class="content-section" id="research" aria-label="Research" tabindex="-1">${sectionHeader(data)}
    ${(data.items || []).map(item => `<article class="work-row"><h3>${item.url && item.url !== '#research' ? linkMarkup(item.title, item.url) : escapeHTML(item.title)}</h3><p class="work-context">${escapeHTML([item.year, item.topic].filter(Boolean).join(' · '))}</p><p>${escapeHTML(item.description)}</p></article>`).join('')}</section>`;
}

function setupScrollReveal() {
  // Animate coherent blocks, never individual bullet points or nested elements.
  const items = [...document.querySelectorAll(
    '.site-header, .home-section, #experience > .section-heading, .experience-role, ' +
    '#work > .section-heading, #work .work-row, #projects > .section-heading, .project-entry, ' +
    '.about-section, #research > .section-heading, #research .work-row, .site-footer'
  )];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  items.forEach(item => item.classList.add('reveal-item'));
  function update() {
    frame = null;
    if (reducedMotion.matches) return;
    const revealLine = window.innerHeight * 0.90;
    for (const item of items) {
      item.classList.toggle('is-revealed', item.getBoundingClientRect().top < revealLine);
    }
  }
  function schedule() {
    if (!reducedMotion.matches && frame === null) frame = requestAnimationFrame(update);
  }
  function configure() {
    document.body.classList.toggle('scroll-reveals', !reducedMotion.matches);
    if (reducedMotion.matches) {
      items.forEach(item => item.classList.add('is-revealed'));
    } else {
      // Paint the initial state before revealing the header and introduction.
      requestAnimationFrame(() => requestAnimationFrame(schedule));
    }
  }
  configure();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', configure);
}

function stopDemo() {
  window.dispatchEvent(new Event('portfolio:navigate'));
}

function resolveSection(hash) {
  const id = hash.replace(/^#/, '') || 'home';
  const aliases = { work: 'experience', projects: 'experience', research: 'experience' };
  return document.getElementById(id) || document.getElementById(aliases[id] || 'home');
}

function navigateToHash({ focus = false, initial = false } = {}) {
  stopDemo();
  const section = resolveSection(window.location.hash);
  if (!section) return;
  if (focus) section.focus({ preventScroll: true });
  section.scrollIntoView({ behavior: initial ? 'instant' : 'auto', block: 'start' });
}

contentRoot.addEventListener('click', async event => {
  const button = event.target.closest('[data-lens-demo]');
  if (!button) return;
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  button.disabled = true;
  try {
    const { toggleLensPanel } = await import('./lenses.js');
    if (panel.isConnected) await toggleLensPanel(panel, button);
  } catch {
    panel.hidden = false;
    panel.textContent = 'The demo could not open. Please refresh and try again.';
    button.setAttribute('aria-expanded', 'true');
  } finally { button.disabled = false; }
});

// Links remain ordinary anchors: opening a section in a new tab still works.
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  stopDemo();
  if (anchor.hash === window.location.hash) {
    event.preventDefault();
    navigateToHash({ focus: true });
  }
});
window.addEventListener('hashchange', () => navigateToHash({ focus: true }));

fetch('content/site.json?v=20261014-blocks', { cache: 'no-cache' })
  .then(response => {
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    return response.json();
  })
  .then(data => {
    contentRoot.innerHTML = homeSection(data.home, data.socials || [])
      + (data.experience?.visible !== false ? experienceSection(data.experience) : '')
      + (data.work?.visible ? workSection(data.work) : '')
      + (data.projects?.visible ? projectsSection(data.projects) : '')
      + (data.research?.visible ? researchSection(data.research) : '');
    setupScrollReveal();
    document.title = data.meta.siteTitle;
    document.querySelector('meta[name="description"]').content = data.meta.description;
    document.querySelector('.monogram').textContent = data.meta.initials;
    document.querySelector('.monogram').setAttribute('aria-label', `${data.meta.ownerName}, home`);
    document.querySelector('#footer-year').textContent = data.meta.year;
    document.querySelector('#footer-name').textContent = data.meta.ownerName;
    document.querySelector('#contact-links').innerHTML = `<p class="contact-heading">${escapeHTML(data.contact.heading)}</p>${data.contact.intro ? `<p>${escapeHTML(data.contact.intro)}</p>` : ''}${(data.contact.items || []).map(item => linkMarkup(item.label, item.url, 'contact-link')).join('')}`;
    if (window.location.hash) requestAnimationFrame(() => navigateToHash({ initial: true }));
    // Release any camera session when visitors scroll away from the demo, too.
    if ('IntersectionObserver' in window && document.getElementById('projects')) {
      const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) stopDemo();
      });
      observer.observe(document.getElementById('projects'));
    }
  })
  .catch(error => {
    console.error(error);
    contentRoot.innerHTML = '<p class="error-state">The portfolio could not load. Please refresh, or <a href="mailto:cherches@stanford.edu">get in touch by email</a>.</p>';
  });
