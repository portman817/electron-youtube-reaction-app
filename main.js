const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const prompt = require('electron-prompt');

let mainWindow = null;
let projectsWindow = null;

const {
  saveBookmark,
  loadBookmarks,
  clearBookmarks,
  deleteBookmark,
  saveNotes,
  loadNotes,
  createProject,
  loadProjects,
  deleteProject,
  getFirstBookmark,
  countBookmarks
} = require('./backend/db');

//Funktion zum Öffnen des Hauptfensters (Projekt)
function openMainWindow(projectId) {
  if (projectsWindow) {
    projectsWindow.close();
    projectsWindow = null;
  }

  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('set-project-id', projectId);
  });
}

//Funktion zum Öffnen der Projektverwaltungsseite
function openProjectsWindow() {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }

  if (projectsWindow) {
    projectsWindow.focus();
    return;
  }

  projectsWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  projectsWindow.loadFile('projekts.html');
}

// Beim Start der App: Prüfe, ob Projekte existieren
app.whenReady().then(async () => {
  const projects = loadProjects();

  if (projects.length === 0) {
    await dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Neues Projekt',
      message: 'Kein Projekt gefunden. Bitte erstellen Sie ein neues Projekt.'
    });

    let projectName = null;
    while (!projectName) {
      projectName = await prompt({
        title: 'Neues Projekt',
        label: 'Bitte Projektnamen eingeben:',
        inputAttrs: {
          type: 'text'
        },
        type: 'input'
      });

      if (!projectName) {
        await dialog.showMessageBox({
          type: 'error',
          buttons: ['OK'],
          title: 'Fehler',
          message: 'Ein Projektname ist erforderlich!'
        });
      }
    }

    const newProjectId = createProject(projectName);
    openMainWindow(newProjectId);
  } else {
    const latestProject = projects[0];
    openMainWindow(latestProject.id);
  }
});

// === IPC-Kommunikation ===

// Projekt öffnen
ipcMain.on('open-project', (event, projectId) => {
  openMainWindow(projectId);
});

// Projektübersicht öffnen
ipcMain.on('open-projects-window', () => {
  openProjectsWindow();
});

// Bookmark speichern
ipcMain.on('save-bookmark', (event, { id, projectId, url, title, time }) => {
  saveBookmark(id, projectId, url, title, time);
});

// Alle Bookmarks laden
ipcMain.handle('load-bookmarks', (event, projectId) => {
  return loadBookmarks(projectId);
});

// Alle Bookmarks löschen
ipcMain.on('clear-bookmarks', (event, projectId) => {
  clearBookmarks(projectId);
});

// Einzelnes Bookmark löschen
ipcMain.on('delete-bookmark', (event, id) => {
  deleteBookmark(id);
});

// Notizen speichern
ipcMain.on('save-notes', (event, { content, projectId }) => {
  saveNotes(content, projectId);
});

// Notizen laden
ipcMain.handle('load-notes', (event, projectId) => {
  return loadNotes(projectId);
});

// Neues Projekt erstellen
ipcMain.handle('create-project', (event, name) => {
  return createProject(name);
});

// Alle Projekte laden
ipcMain.handle('load-projects', () => {
  return loadProjects();
});

// Projekt löschen
ipcMain.handle('delete-project', (event, projectId) => {
  return deleteProject(projectId);
});

// Erste Bookmark anzeigen
ipcMain.handle('get-first-bookmark', (event, projectId) => {
  return getFirstBookmark(projectId);
});

// Anzahl der Bookmarks
ipcMain.handle('count-bookmarks', (event, projectId) => {
  return countBookmarks(projectId);
});
