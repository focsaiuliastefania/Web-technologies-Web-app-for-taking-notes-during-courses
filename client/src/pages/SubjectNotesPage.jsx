import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SimpleMDE from "react-simplemde-editor";
import ReactMarkdown from 'react-markdown';
import './SubjectNotesPage.css';

const editorOptions = {
  spellChecker: false,
  placeholder: "Write your note here using Markdown...",
  status: false,
  autosave: {
      enabled: false,
      delay: 1000,
  },
};

function SubjectNotesPage() {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const subjectName = location.state?.subjectName || 'Subject';
  
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('authToken');

  // --- 1. ÎNCĂRCARE INIȚIALĂ (Fără erori de useEffect) ---
  useEffect(() => {
    const loadInitialNotes = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/subjects/${subjectId}/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadInitialNotes();
  }, [subjectId, token]); // Depinde doar de ID și token (valori stabile)

  // --- 2. FUNCȚIE PENTRU REÎNCĂRCARE MANUALĂ (Căutare/Add/Delete) ---
  const reloadNotes = async (query = '') => {
    try {
      let url = `http://localhost:8080/api/subjects/${subjectId}/notes`;
      if (query) {
        url += `?search=${query}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    reloadNotes(searchQuery);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title) return;

    try {
      const formData = new FormData();
      formData.append('title', newNote.title);
      formData.append('content', newNote.content);
      formData.append('tags', newNote.tags);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`http://localhost:8080/api/subjects/${subjectId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setNewNote({ title: '', content: '', tags: '' });
        setFile(null);
        reloadNotes(searchQuery); 
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if(!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onContentChange = useCallback((value) => {
    setNewNote(prev => ({ ...prev, content: value }));
  }, []);

  return (
    <div className="notes-container">
      <div className="notes-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          &larr; Back to Subjects
        </button>
        <h1>Notes for: {subjectName}</h1>
      </div>

      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search notes by title, content or tags..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn-search" onClick={handleSearch}>Search</button>
      </div>

      <form className="add-note-form" onSubmit={handleAddNote}>
        <input
          className="note-input"
          type="text"
          placeholder="Note Title (e.g., Lecture 1)"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
        />
        
        <div className="markdown-editor-wrapper">
            <SimpleMDE 
                value={newNote.content} 
                onChange={onContentChange}
                options={editorOptions}
            />
        </div>

        <input
          className="tags-input"
          type="text"
          placeholder="Tags (comma separated): exam, important, chapter 1"
          value={newNote.tags}
          onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
        />

        <div className="file-input-wrapper">
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Attachment (Optional):</label>
            <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                style={{marginBottom: '10px'}}
            />
        </div>

        <button type="submit" className="btn-save">Save Note</button>
      </form>

      <div className="notes-grid">
        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <div className="note-card-header">
                <h3>{note.title}</h3>
                <button 
                    className="delete-note-btn" 
                    onClick={() => handleDeleteNote(note.id)}
                >
                    ×
                </button>
            </div>
            
            <div className="note-content-preview markdown-body">
                <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>

            {note.tags && (
              <div className="note-tags">
                {note.tags.split(',').map((tag, index) => (
                  <span key={index} className="tag-badge">#{tag.trim()}</span>
                ))}
              </div>
            )}

            {note.attachmentUrl && (
                <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #eee'}}>
                    <a 
                        href={`http://localhost:8080${note.attachmentUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{color: '#3498db', textDecoration: 'none', fontWeight: 'bold'}}
                    >
                        📎 View Attachment
                    </a>
                </div>
            )}
          </div>
        ))}
        {notes.length === 0 && <p style={{ color: '#888' }}>No notes found.</p>}
      </div>
    </div>
  );
}

export default SubjectNotesPage;