(() => {
  const view = new URLSearchParams(location.search).get('view') === 'alumni' ? 'alumni' : 'current';
  const title = document.querySelector('#team-title');
  const grid = document.querySelector('#team-grid');
  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

  title.textContent = view === 'alumni' ? 'Alumni' : 'Current members';
  document.querySelector(`.team-tabs a[href="Team.html?view=${view}"]`).setAttribute('aria-current', 'page');

  fetch('data/team.json')
    .then((response) => {
      if (!response.ok) throw new Error('Team data could not be loaded.');
      return response.json();
    })
    .then(({ members = [] }) => {
      const shown = members.filter((member) => member.status === view);
      grid.innerHTML = shown.length
        ? shown.map((member) => `
          <article class="member-card">
            ${member.image ? `<img src="${escape(member.image)}" alt="Portrait of ${escape(member.name)}">` : ''}
            <div>
              <h2>${escape(member.name)}</h2>
              <p><strong>${escape(member.role)}</strong></p>
              ${member.bio ? `<p>${escape(member.bio)}</p>` : ''}
              ${member.nowAt ? `<p><strong>Now at:</strong> ${escape(member.nowAt)}</p>` : ''}
            </div>
          </article>`).join('')
        : '<p class="team-empty">Alumni profiles will appear here as they are added.</p>';
    })
    .catch(() => {
      grid.innerHTML = '<p class="team-empty">Team information is currently unavailable.</p>';
    });
})();
