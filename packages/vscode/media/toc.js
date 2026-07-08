/*
 * ChromaMark preview outline. Injected into the built-in Markdown preview via
 * the `markdown.previewScripts` contribution point. Builds a left-hand header
 * tree with click-to-jump, scroll-spy highlighting, and a collapse toggle.
 * Rebuilds itself when the preview content updates.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var NAV_ID = 'cm-toc';
  var SHOW_ID = 'cm-toc-show';
  var MIN_HEADERS = 2;
  var observer;
  var rebuildTimer;

  function headings() {
    var nodes = document.body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    var out = [];
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest && el.closest('#' + NAV_ID)) return;
      var text = (el.textContent || '').trim();
      if (!text) return;
      out.push({ el: el, level: parseInt(el.tagName.substring(1), 10), text: text });
    });
    return out;
  }

  function setActive(links, idx) {
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('cm-active', i === idx);
    }
  }

  function attachSpy(items, links) {
    function onScroll() {
      var active = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top <= 100) active = i;
        else break;
      }
      setActive(links, active);
    }
    if (window.__cmTocScroll) window.removeEventListener('scroll', window.__cmTocScroll);
    window.__cmTocScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function ensureShowButton() {
    var btn = document.getElementById(SHOW_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = SHOW_ID;
      btn.type = 'button';
      btn.title = 'Show outline';
      btn.textContent = '\u2630';
      btn.addEventListener('click', function () {
        document.body.classList.remove('cm-toc-collapsed');
      });
      document.body.appendChild(btn);
    }
    return btn;
  }

  function build() {
    var items = headings();
    var existing = document.getElementById(NAV_ID);

    if (items.length < MIN_HEADERS) {
      if (existing) existing.remove();
      document.body.classList.remove('cm-has-toc');
      return;
    }

    var nav = existing || document.createElement('nav');
    nav.id = NAV_ID;
    nav.setAttribute('aria-label', 'Document outline');
    nav.innerHTML = '';

    var head = document.createElement('div');
    head.className = 'cm-toc-head';
    var title = document.createElement('span');
    title.textContent = 'Outline';
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'cm-toc-toggle';
    toggle.title = 'Hide outline';
    toggle.textContent = '\u2039';
    toggle.addEventListener('click', function () {
      document.body.classList.add('cm-toc-collapsed');
    });
    head.appendChild(title);
    head.appendChild(toggle);
    nav.appendChild(head);

    var list = document.createElement('ul');
    list.className = 'cm-toc-list';
    var minLevel = items.reduce(function (m, h) { return Math.min(m, h.level); }, 6);
    var links = [];

    items.forEach(function (item, i) {
      var li = document.createElement('li');
      li.className = 'cm-toc-item cm-toc-l' + Math.min(item.level - minLevel, 5);
      var a = document.createElement('a');
      a.className = 'cm-toc-link';
      a.href = '#';
      a.textContent = item.text;
      a.title = item.text;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (item.el.scrollIntoView) item.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(links, i);
      });
      li.appendChild(a);
      list.appendChild(li);
      links.push(a);
    });
    nav.appendChild(list);

    if (!existing) document.body.appendChild(nav);
    document.body.classList.add('cm-has-toc');
    ensureShowButton();
    attachSpy(items, links);
  }

  function scheduleBuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(safeBuild, 150);
  }

  function safeBuild() {
    if (observer) observer.disconnect();
    try {
      build();
    } finally {
      if (observer) observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var t = mutations[i].target;
        if (t && t.closest && t.closest('#' + NAV_ID)) continue;
        scheduleBuild();
        return;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeBuild);
  } else {
    safeBuild();
  }
})();
