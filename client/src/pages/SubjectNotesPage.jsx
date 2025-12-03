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
  // Am scos 'file' si 'setFile' pentru ca nu le folosim momentan
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('authToken');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);

  // Folosim useCallback pentru ca functia sa nu se recreeze la fiecare render
  const fetchData = useCallback(async (query = '') => {
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
  }, [subjectId, token]);

  // ✅ REPARATIE: Scoatem fetchData din dependinte pentru a evita bucla
  // Adaugam comentariul eslint-disable pentru a ignora avertismentul strict
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]); 

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = notes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(notes.length / itemsPerPage);

  const nextPage = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleItemsPerPageChange = (e) => {
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1); 
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(searchQuery);
    setCurrentPage(1);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title) return;

    try {
      const payload = {
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags
      };

      const response = await fetch(`http://localhost:8080/api/subjects/${subjectId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setNewNote({ title: '', content: '', tags: '' });
        // Am scos setFile(null)
        fetchData(searchQuery); 
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
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);
        
        const newTotalPages = Math.ceil(updatedNotes.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
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

        {/* Am scos input-ul de tip fisier momentan */}

        <button type="submit" className="btn-save">Save Note</button>
      </form>

      <div className="notes-grid">
        {currentNotes.map((note) => (
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
            
            {/* Sectiunea de atasamente ramane doar pentru afisare daca exista deja in baza de date */}
            {note.attachmentUrl && (
                <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #eee'}}>
                    <a 
                        href={`http://localhost:8080${note.attachmentUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-link"
                    >
                        📎 View Attachment
                    </a>
                </div>
            )}
          </div>
        ))}
        {notes.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No notes found.</p>}
      </div>

      {notes.length > 0 && (
        <div className="pagination-container">
            <div className="items-per-page-selector">
                <label htmlFor="itemsPerPageNotes">Notes per page:</label>
                <select id="itemsPerPageNotes" value={itemsPerPage} onChange={handleItemsPerPageChange}>
                    <option value={1}>1</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                    <option value={notes.length > 0 ? notes.length : 16}>All ({notes.length})</option> 
                </select>
            </div>

            <div className="pagination-controls">
                <button className="pagination-btn" onClick={prevPage} disabled={currentPage === 1}>
                    &larr; Prev
                </button>
                <span className="page-info">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button className="pagination-btn" onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0}>
                    Next &rarr;
                </button>
            </div>
        </div>
      )}
    </div>
  );
}

export default SubjectNotesPage;