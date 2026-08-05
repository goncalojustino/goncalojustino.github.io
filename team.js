(() => {
  const view = new URLSearchParams(location.search).get('view') === 'alumni' ? 'alumni' : 'current';
  const title = document.querySelector('#team-title');
  const grid = document.querySelector('#team-grid');
  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const isPhdStudent = (member) => /\bphd\b/i.test(member.role || '');
  const profileLink = (member, reserveSpace = false) => /^https?:\/\//i.test(member.link || '')
    ? `<a class="button member-link" href="${escape(member.link)}" target="_blank" rel="noreferrer">${escape(member.linkLabel || 'View linked work')} <span aria-hidden="true">↗</span></a>`
    : reserveSpace ? '<span class="member-link-placeholder" aria-hidden="true"></span>' : '';
  const memberCard = (member, alumniView) => {
    const phd = isPhdStudent(member);
    const nonPhdAlumnus = alumniView && !phd;
    const showImage = member.image && (!alumniView || phd);
    return `<article class="member-card${phd ? ' is-phd' : ' not-phd'}">
      ${showImage ? `<img src="${escape(member.image)}" alt="Portrait of ${escape(member.name)}">` : ''}
      <div class="member-card-content">
        <h2>${escape(member.name)}</h2>
        <p class="member-role"><strong>${escape(member.role)}</strong></p>
        <p class="member-bio">${member.bio ? escape(member.bio) : '&nbsp;'}</p>
        ${alumniView && phd && member.nowAt ? `<p><strong>Now at:</strong> ${escape(member.nowAt)}</p>` : ''}
        ${profileLink(member, nonPhdAlumnus)}
      </div>
    </article>`;
  };

  title.textContent = view === 'alumni' ? 'Alumni' : 'Current members';
  document.querySelector(`.team-tabs a[href="Team.html?view=${view}"]`).setAttribute('aria-current', 'page');
  grid.classList.toggle('alumni-grid', view === 'alumni');

  fetch('data/team.json')
    .then((response) => {
      if (!response.ok) throw new Error('Team data could not be loaded.');
      return response.json();
    })
    .then(({ members = [] }) => {
      const shown = members.filter((member) => member.status === view);
      if (!shown.length) {
        grid.innerHTML = '<p class="team-empty">Alumni profiles will appear here as they are added.</p>';
        return;
      }
      if (view !== 'alumni') {
        grid.innerHTML = shown.map((member) => memberCard(member, false)).join('');
        return;
      }
      const phdStudents = shown.filter(isPhdStudent);
      const otherAlumni = shown.filter((member) => !isPhdStudent(member));
      grid.innerHTML = [
        phdStudents.length && `<div class="alumni-group phd-alumni">${phdStudents.map((member) => memberCard(member, true)).join('')}</div>`,
        otherAlumni.length && `<div class="alumni-group other-alumni">${otherAlumni.map((member) => memberCard(member, true)).join('')}</div>`
      ].filter(Boolean).join('');
    })
    .catch(() => {
      grid.innerHTML = '<p class="team-empty">Team information is currently unavailable.</p>';
    });
})();
