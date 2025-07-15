let bookmarks = {};
let ytPlayer = null;
let ytPlayerReady = false;
let currentProjectId = null;

const labelMap = {
  Digit1: '1', Digit2: '2', Digit3: '3',
  Digit4: '4', Digit5: '5', Digit6: '6',
  Digit7: '7', Digit8: '8', Digit9: '9'
};

// YouTube API verfügbar
window.onYouTubeIframeAPIReady = function () {
  console.log('YouTube API geladen');
};


// Funktion: Projekte beim Start laden oder erstellen
async function initializeProject() {
  const projects = await window.electronAPI.loadProjects();
  
  if (projects.length === 0) {
    const newProjectId = await window.electronAPI.createProject('Neues Projekt');
    currentProjectId = newProjectId;
    console.log('Neues Projekt erstellt:', currentProjectId);
  } else {
    currentProjectId = projects[0].id; // Neuestes Projekt
    console.log('Projekt geladen:', currentProjectId);
  }

  // Projektname im Interface anzeigen
  const currentProject = projects.find(p => p.id === currentProjectId);
  if (currentProject) {
    const nameElem = document.getElementById('current-project-name');
    if (nameElem) {
      nameElem.textContent = `${currentProject.name}`;
    }
  }

  loadProjectData();
}



document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('video-url');
  const playerContainer = document.getElementById('player');

  // YouTube IFrame API einfügen
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);

  document.getElementById('manage-projects').addEventListener('click', () => {
    console.log('Button clicked');
    window.electronAPI.openProjectsWindow();
  });

  window.electronAPI.receiveProjectId((event, id) => {
    currentProjectId = id;
    console.log('Project ist geladen: ', currentProjectId);
    loadProjectData();
  
    window.electronAPI.loadProjects().then(projects => {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (currentProject) {
        document.getElementById('current-project-name').textContent = `${currentProject.name}`;
      }
    });
  });
  

  // Buttons oben
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


function saveCurrentProject() {
    if (!currentProjectId) {
      alert('Kein Projekt geöffnet.');
      return;
    }
  
    for (const key in bookmarks) {
      const { url, title, time } = bookmarks[key];
      window.electronAPI.saveBookmark(key, currentProjectId, url, title, time);
    }
  
    const noteArea = document.querySelector('#script textarea');
    if (noteArea) {
      window.electronAPI.saveNotes(noteArea.value, currentProjectId);
    }
  
    alert('Projekt gespeichert.');
  };
  
  

  //await initializeProject(); // Projekte initialisieren

  // Eingabe-Handling
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      
      const value = input.value.trim();
      if (value.toLowerCase() === 'clear') {
        bookmarks = {};
        document.getElementById('links').innerHTML = '';
        window.electronAPI.clearBookmarks(currentProjectId);
        input.value = '';
        return;
      }
      const videoId = extractYouTubeId(value);
      if (!videoId) return alert('Ungültige YouTube-URL.');

      const div = document.createElement('div');
      div.id = 'ytplayer';
      div.tabIndex = -1;
      playerContainer.innerHTML = '';
      playerContainer.appendChild(div);

      ytPlayer = new YT.Player('ytplayer', {
        height: '540',
        width: '960',
        videoId: videoId,
        events: {
          onReady: () => {
            ytPlayerReady = true;
            console.log('ytPlayer bereit');
            document.body.focus();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setTimeout(() => document.body.focus(), 100);
            }
          }
        }
      });
    }
  });
  
  document.addEventListener('click', (e) => {
  const playerEl = document.getElementById('ytplayer');
  if (playerEl && playerEl.contains(e.target)) {
    setTimeout(() => document.body.focus(), 50);
  }
});

  // Tastenkürzel
    
    document.addEventListener('keydown', (event) => {
      const active = document.activeElement;
      const tag = active.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable) return;
      if (active !== document.body) document.body.focus();
  
      const code = event.code;
      if (code === 'Space') {
        document.body.focus();
        event.preventDefault();
        const state = ytPlayer?.getPlayerState?.();
        if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
        return;
      }
  
      if (!labelMap.hasOwnProperty(code)) return;
  
      if (event.shiftKey) {
        if (ytPlayerReady && ytPlayer?.getCurrentTime && currentProjectId) {
          const time = ytPlayer.getCurrentTime();
          const videoId = ytPlayer.getVideoData().video_id;
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          const title = ytPlayer.getVideoData().title || 'Unbekanntes Video';
  
          const hotkey = event.code;
          bookmarks[currentProjectId] = bookmarks[currentProjectId] || {};
          bookmarks[currentProjectId][hotkey] = { time, url, title };
          updateBookmarkUI(hotkey, { time, url, title });
          window.electronAPI.saveBookmark(hotkey, currentProjectId, url, title, time);
          document.body.focus();

        }
      } else {
        const bookmark = bookmarks[currentProjectId][code];
        if (!currentProjectId || !bookmarks[currentProjectId] || !bookmarks[currentProjectId][code]) return;
  
        const targetId = extractYouTubeId(bookmark.url);
  
        if (!ytPlayer) {
          const div = document.createElement('div');
          div.id = 'ytplayer';
          div.tabIndex = -1;
          document.getElementById('player').innerHTML = '';
          document.getElementById('player').appendChild(div);
  
          ytPlayer = new YT.Player('ytplayer', {
            height: '540',
            width: '960',
            videoId: targetId,
            playerVars: { start: Math.floor(bookmark.time) },
            events: {
              onReady: () => {
                ytPlayerReady = true;
                ytPlayer.seekTo(bookmark.time, true);
                document.body.focus();
              }
            }
          });
        } else {
          ytPlayer.pauseVideo();
          const currentId = extractYouTubeId(ytPlayer.getVideoUrl());
          if (targetId !== currentId) {
            ytPlayer.cueVideoById(targetId, bookmark.time);
          } else {
            ytPlayer.seekTo(bookmark.time, true);
          }
        }
      }
    });
  
});

// Projekt-Daten laden (Notizen + Bookmarks)

function loadProjectData() {
  const linksContainer = document.getElementById('links');
  const scriptContainer = document.getElementById('script');

  window.electronAPI.loadNotes(currentProjectId).then(content => {
    let noteArea = scriptContainer.querySelector('textarea');
    if (!noteArea) {
      noteArea = document.createElement('textarea');
      noteArea.placeholder = 'Notizen hier schreiben...';
      noteArea.style.width = '100%';
      noteArea.style.height = '180px';
      noteArea.style.boxSizing = 'border-box';
      noteArea.style.backgroundColor = '#2e2e2e';
      noteArea.style.color = 'white';
      noteArea.style.border = 'none';
      noteArea.style.resize = 'none';
      noteArea.style.fontSize = '14px';
      noteArea.style.padding = '8px';
      scriptContainer.appendChild(noteArea);
    }
    noteArea.value = content || '';
    noteArea.addEventListener('input', () => {
      window.electronAPI.saveNotes(noteArea.value, currentProjectId);
    });
  });

   if (!bookmarks[currentProjectId]) {
    bookmarks[currentProjectId] = {};
  }

  window.electronAPI.loadBookmarks(currentProjectId).then(entries => {
    bookmarks[currentProjectId] = {};
    linksContainer.innerHTML = '';
  
    // Alle Bookmarks anzeigen
    entries.forEach(entry => {
      bookmarks[currentProjectId][entry.hotkey] = { time: entry.time, url: entry.url, title: entry.title };
      updateBookmarkUI(entry.hotkey, { time: entry.time, url: entry.url, title: entry.title });
    });
  
    if (entries.length > 0) {
      const firstBookmark = entries[0];
  
      const div = document.createElement('div');
      div.id = 'ytplayer';
      div.tabIndex = -1;
      document.getElementById('player').innerHTML = '';
      document.getElementById('player').appendChild(div);
  
      ytPlayer = new YT.Player('ytplayer', {
        height: '540',
        width: '960',
        videoId: extractYouTubeId(firstBookmark.url),
        playerVars: { start: Math.floor(firstBookmark.time) },
        events: {
          onReady: () => {
            ytPlayerReady = true;
            document.body.focus();
          }
        }
      });
    }
  });
  
  
}
window.electronAPI.receiveProjectId((event, id) => {
  currentProjectId = id;
  loadProjectData();
});


function updateBookmarkUI(hotkey, data) {
  const linksContainer = document.getElementById('links');
  const formatted = formatTime(data.time);
  const existing = document.getElementById(`bookmark-${hotkey}`);
  if (existing) existing.remove();

  const p = document.createElement('p');
  p.id = `bookmark-${hotkey}`;
  p.style.display = 'flex';
  p.style.alignItems = 'center';
  p.style.margin = '4px 0';

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '❌';
  deleteBtn.style.marginRight = '8px';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.background = 'transparent';
  deleteBtn.style.color = 'red';
  deleteBtn.style.border = 'none';
  deleteBtn.style.fontSize = '14px';

  deleteBtn.addEventListener('click', () => {
    delete bookmarks[currentProjectId][hotkey];
    p.remove();
    window.electronAPI.deleteBookmark(hotkey);
    document.body.focus();
  });

  const text = document.createElement('span');
  const displayHotkey = hotkey.replace("Digit", "");
  text.textContent = `[${displayHotkey}] ${formatted} — ${data.title || 'Unbekannt'}`;

  text.addEventListener('click', () => {
    const currentId = extractYouTubeId(ytPlayer.getVideoUrl());
    const targetId = extractYouTubeId(data.url);
    if (targetId !== currentId) {
      ytPlayer.loadVideoById(targetId, data.time);
    } else {
      ytPlayer.seekTo(data.time, true);
    }
  });

  p.appendChild(deleteBtn);
  p.appendChild(text);
  linksContainer.appendChild(p);
}

// Hilfsfunktionen
function extractYouTubeId(url) {
  const regExp = /(?:v=|\/|vi=|be\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}
