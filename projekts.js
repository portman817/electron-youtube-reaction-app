document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('#project-grid');

  // Projekte laden
  const projects = await window.electronAPI.loadProjects();

  projects.forEach(async (project) => {
    const card = document.createElement('div');
    card.classList.add('card');

    // Projektname
    const projectName = document.createElement('div');
    projectName.classList.add('project-name');
    projectName.textContent = project.name;

    // Projektinfo (Datum + Bookmark-Anzahl)
    const count = await window.electronAPI.countBookmarks(project.id);
    const info = document.createElement('div');
    info.classList.add('project-info');
    info.textContent = `Erstellt am ${new Date(project.created_at).toLocaleDateString()}    Bookmarks: ${count}`;

    // Löschen-Button
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Löschen';
    deleteButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Willst du dieses Projekt wirklich löschen?')) {
        await window.electronAPI.deleteProject(project.id);
        card.remove(); // Entferne die Karte ohne reload
      }
    });

    // Projekt öffnen
    card.addEventListener('click', () => {
      window.electronAPI.openProject(project.id); // Öffne das Projekt
      document.body.focus();
    });

    // Karten-Footer
    const footer = document.createElement('div');
    footer.classList.add('card-footer');
    footer.appendChild(info);
    footer.appendChild(deleteButton);

    // Karte zusammensetzen
    card.appendChild(projectName);
    card.appendChild(footer);
    grid.appendChild(card);
  });

  // Neues Projekt erstellen
  const dialog = document.getElementById('project-dialog');
  const inputField = document.getElementById('project-name-input');
  const confirmBtn = document.getElementById('confirm-create');
  const cancelBtn = document.getElementById('cancel-create');
  
  document.getElementById('create-project').addEventListener('click', () => {
    inputField.value = '';
    dialog.style.display = 'flex';
  });
  
  cancelBtn.addEventListener('click', () => {
    dialog.style.display = 'none';
  });
  
  confirmBtn.addEventListener('click', async () => {
    const name = inputField.value.trim();
    if (!name) return;
  
    dialog.style.display = 'none';
    const newProjectId = await window.electronAPI.createProject(name);
    alert(`Projekt "${name}" wurde erstellt.`);
    window.electronAPI.openProject(newProjectId);
  });
  
});
