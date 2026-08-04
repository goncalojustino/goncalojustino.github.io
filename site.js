(() => {
  const header = `<header class="site-shell"><a class="site-brand" href="index.html">Justino <span>Research Group</span></a><nav class="site-nav" aria-label="Main navigation"><a href="index.html">Home</a><a href="About-me.html">About</a><a href="Research.html">Research</a><a href="Team.html?view=current">Team</a><a href="Publications.html?category=highlights">Publications</a></nav></header>`;
  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', '<footer class="site-footer">© Gonçalo C. Justino</footer>');
})();
