const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Bookmarks
  saveBookmark: (id, projectId, url, title, time) =>
    ipcRenderer.send('save-bookmark', { id, projectId, url, title, time }),

  
  loadBookmarks: (projectId) => ipcRenderer.invoke('load-bookmarks', projectId),
  clearBookmarks: (projectId) => ipcRenderer.send('clear-bookmarks', projectId),
  deleteBookmark: (id) => ipcRenderer.send('delete-bookmark', id),

  // Notizen
  saveNotes: (content, projectId) => ipcRenderer.send('save-notes', { content, projectId }),
  loadNotes: (projectId) => ipcRenderer.invoke('load-notes', projectId),

  // Projekte
  createProject: (name) => ipcRenderer.invoke('create-project', name),
  loadProjects: () => ipcRenderer.invoke('load-projects'),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),

  // Erste Bookmark + Zähler
  getFirstBookmark: (projectId) => ipcRenderer.invoke('get-first-bookmark', projectId),
  countBookmarks: (projectId) => ipcRenderer.invoke('count-bookmarks', projectId),

  // Projekte öffnen
  openProject: (projectId) => ipcRenderer.send('open-project', projectId),

  // Vom Mainprozess gesetzte Projekt-ID empfangen
  receiveProjectId: (callback) => ipcRenderer.on('set-project-id', (event, id) => callback(event, id)),

  openProjectsPage: () => ipcRenderer.send('open-projects-page'),
  openProjectsWindow: () => ipcRenderer.send('open-projects-window'),

});
