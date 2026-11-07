(() => {
  const prefix = location.pathname.includes('/cv/') ? '../' : '';
  const href = (path) => `${prefix}${path}`;
  const header = `<header class="site-shell"><a class="site-brand" href="${href('index.html')}">Justino <span>Research Group</span></a><nav class="site-nav" aria-label="Main navigation"><a href="${href('index.html')}">Home</a><div class="site-nav-menu"><a href="${href('About-me.html')}">About</a><div class="site-subnav"><a href="${href('cv/index.html')}">Detailed CV</a></div></div><a href="${href('Research.html')}">Research</a><a href="${href('Team.html?view=current')}">Team</a><a href="${href('Publications.html?category=highlights')}">Publications</a><a href="${href('Resources.html')}">Resources</a></nav></header>`;
  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', '<footer class="site-footer">© Gonçalo C. Justino</footer>');
})();
