const Database = require('better-sqlite3');
const path = require('path');

// Verbindung zur Datenbank herstellen
const db = new Database(path.join(__dirname, 'bookmarks.db'));

// Tabelle: Projekte
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

// Tabelle: Bookmarks (mit TEXT id für Hotkey-Verknüpfung)
db.prepare(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotkey TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    time REAL NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )
`).run();


// Tabelle: Notizen
db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    content TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )
`).run();

// Bookmark speichern oder aktualisieren
function saveBookmark(hotkey, projectId, url, title, time) {
  db.prepare(`
    INSERT OR REPLACE INTO bookmarks (hotkey, project_id, url, title, time)
    VALUES (?, ?, ?, ?, ?)
  `).run(hotkey, projectId, url, title, time);
}



// Alle Bookmarks für ein Projekt laden
function loadBookmarks(projectId) {
  return db.prepare(`SELECT * FROM bookmarks WHERE project_id = ?`).all(projectId);
}

// Alle Bookmarks eines Projekts löschen
function clearBookmarks(projectId) {
  db.prepare(`DELETE FROM bookmarks WHERE hotkey = ?`).run(projectId);
}

// Einzelnes Bookmark löschen
function deleteBookmark(id) {
  db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
}


// Notizen speichern
function saveNotes(content, projectId) {
  const existing = db.prepare(`SELECT id FROM notes WHERE project_id = ?`).get(projectId);
  if (existing) {
    db.prepare(`UPDATE notes SET content = ? WHERE project_id = ?`).run(content, projectId);
  } else {
    db.prepare(`INSERT INTO notes (project_id, content) VALUES (?, ?)`).run(projectId, content);
  }
}

// Notizen laden
function loadNotes(projectId) {
  const note = db.prepare(`SELECT content FROM notes WHERE project_id = ?`).get(projectId);
  return note ? note.content : '';
}

// Neues Projekt erstellen
function createProject(name) {
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO projects (name, created_at) VALUES (?, ?)`);
  const info = stmt.run(name, createdAt);
  return info.lastInsertRowid;
}

// Alle Projekte laden
function loadProjects() {
  return db.prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all();
}

// Projekt löschen (inklusive aller zugehörigen Bookmarks und Notizen)
function deleteProject(projectId) {
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);
}

// Erste Bookmark eines Projekts holen
function getFirstBookmark(projectId) {
  return db.prepare(`SELECT title FROM bookmarks WHERE project_id = ? ORDER BY time ASC LIMIT 1`).get(projectId);
}

// Anzahl der Bookmarks eines Projekts zählen
function countBookmarks(projectId) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM bookmarks WHERE project_id = ?`).get(projectId);
  return row ? row.count : 0;
}

// Funktionen exportieren
module.exports = {
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
};
