import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SimpleMDE from "react-simplemde-editor";
import ReactMarkdown from 'react-markdown';
import './SubjectNotesPage.css';
import 'easymde/dist/easymde.min.css';

const editorOptions = {
  spellChecker: false,
  placeholder: "Write your note here using Markdown...",
  status: false,
  autosave: { enabled: false, delay: 1000 },
};

function SubjectNotesPage() {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const subjectName = location.state?.subjectName || 'Subject';
  
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const [attachment, setAttachment] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', content: '', tags: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [showShareModal, setShowShareModal] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const token = localStorage.getItem('authToken');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); 

  
  const API_URL = import.meta.env.VITE_API_URL;

  const handleAuthError = useCallback((response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      navigate('/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
     
      let url = `${API_URL}/api/subjects/${subjectId}/notes`;
      
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (handleAuthError(response)) return;

      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        setFilteredNotes(data);
      }
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  }, [subjectId, token, handleAuthError, API_URL]);

  const fetchGroups = async () => {
    try {
        
        const response = await fetch(`${API_URL}/api/groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (handleAuthError(response)) return;

        if(response.ok) {
            const data = await response.json();
            setMyGroups(data);
        }
    } catch(err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [fetchData]); 

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);

    if (!searchQuery.trim()) {
        setFilteredNotes(notes);
        return;
    }

    const query = searchQuery.toLowerCase();
    const results = notes.filter(note => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const tagsMatch = note.tags && note.tags.toLowerCase().includes(query);
        return titleMatch || tagsMatch;
    });

    setFilteredNotes(results);
  };

  const handleShareNote = async () => {
      if(!selectedGroupId) return;
      try {
         
          const response = await fetch(`${API_URL}/api/notes/${selectedNote.id}/share`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ groupId: selectedGroupId })
          });

          if (handleAuthError(response)) return;

          if(response.ok) {
              setShareMessage("Note shared successfully!");
              setTimeout(() => {
                  setShowShareModal(false);
                  setShareMessage('');
              }, 1500);
          }
      } catch(err) { console.error(err); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
  
  
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title) return;

    const formData = new FormData();
    formData.append('title', newNote.title);
    formData.append('content', newNote.content);
    formData.append('tags', newNote.tags);
    if (attachment) {
        formData.append('attachment', attachment);
    }

    try {
      
      const response = await fetch(`${API_URL}/api/subjects/${subjectId}/notes`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      if (handleAuthError(response)) return;

      if (response.ok) { 
          setNewNote({ title: '', content: '', tags: '' }); 
          setAttachment(null);
          document.getElementById('fileInput').value = "";
          fetchData(); 
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteNote = async (noteId, e) => {
    if (e) e.stopPropagation();
    if(!confirm('Delete this note?')) return;
    try {
    
      const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (handleAuthError(response)) return;

      if (response.ok) {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);
        setFilteredNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) { setSelectedNote(null); setIsEditing(false); }
      }
    } catch (error) { console.error(error); }
  };

  const startEditing = () => {
      setEditFormData({ title: selectedNote.title, content: selectedNote.content, tags: selectedNote.tags || '' });
      setIsEditing(true);
  };
  
  const handleUpdateNote = async () => {
      if (!editFormData.title) return;
      try {
        
          const response = await fetch(`${API_URL}/api/notes/${selectedNote.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(editFormData)
          });
          
          if (handleAuthError(response)) return;

          if (response.ok) {
              const updated = await response.json();
              setNotes(notes.map(n => n.id === selectedNote.id ? updated : n));
              setFilteredNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
              
              setSelectedNote(updated);
              setIsEditing(false);
          }
      } catch (error) { console.error(error); }
  };

  const openShare = () => {
      fetchGroups();
      setShowShareModal(true);
  };

  return (
    <div className="notes-container">
      <div className="notes-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>&larr; Back to Subjects</button>
        <h1>Notes for: {subjectName}</h1>
      </div>

      <div className="search-container">
        <input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button className="btn-search" onClick={handleSearch}>Search</button>
      </div>

      <form className="add-note-form" onSubmit={handleAddNote}>
        <input className="note-input" type="text" placeholder="Title" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} />
        <div className="markdown-editor-wrapper">
            <SimpleMDE value={newNote.content} onChange={(val) => setNewNote(prev => ({ ...prev, content: val }))} options={editorOptions} />
        </div>
        
        <div style={{display: 'flex', gap: '10px', width: '100%'}}>
            <input className="tags-input" style={{flex: 1}} type="text" placeholder="Tags" value={newNote.tags} onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })} />
            <input 
                id="fileInput"
                type="file" 
                onChange={(e) => setAttachment(e.target.files[0])}
                style={{padding: '10px', background: 'white', borderRadius: '4px'}}
            />
        </div>

        <button type="submit" className="btn-save">Save Note</button>
      </form>

      {isLoading ? <div className="loading-spinner-container"><div className="loading-spinner"></div></div> : (
        <>
            <div className="notes-grid">
            {currentNotes.map((note) => (
                <div key={note.id} className="note-card" onClick={() => {setSelectedNote(note); setIsEditing(false);}} style={{ cursor: 'pointer' }}>
                <div className="note-card-header">
                    <h3>{note.title}</h3>
                    <button className="delete-note-btn" onClick={(e) => handleDeleteNote(note.id, e)}>×</button>
                </div>
                <div className="note-content-preview markdown-body"><ReactMarkdown>{note.content}</ReactMarkdown></div>
                {note.attachmentUrl && <span style={{fontSize: '0.8rem', color: '#e91e63'}}>📎 Has attachment</span>}
                <div className="click-hint">Click to expand</div>
                </div>
            ))}
            </div>

            {filteredNotes.length > 0 && (
                <div className="pagination-controls" style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center'}}>
                    <button onClick={prevPage} disabled={currentPage === 1} className="btn-search" style={{opacity: currentPage === 1 ? 0.5 : 1}}>
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={nextPage} disabled={currentPage === totalPages} className="btn-search" style={{opacity: currentPage === totalPages ? 0.5 : 1}}>
                        Next
                    </button>
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange} style={{padding: '5px', borderRadius: '4px'}}>
                        <option value={8}>8 / page</option>
                        <option value={16}>16 / page</option>
                        <option value={32}>32 / page</option>
                    </select>
                </div>
            )}
            
            {filteredNotes.length === 0 && notes.length > 0 && (
                 <p style={{textAlign: 'center', marginTop: '20px'}}>No notes match your search.</p>
            )}
        </>
      )}

      {selectedNote && (
        <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!isEditing ? (
                <>
                    <div className="modal-header">
                        <h2>{selectedNote.title}</h2>
                        <div style={{display: 'flex', gap: '10px'}}>
                             <button className="btn-search" style={{padding:'5px 15px'}} onClick={openShare}>Share</button>
                             <button className="btn-search" style={{padding:'5px 15px'}} onClick={startEditing}>Edit</button>
                             <button className="close-modal-btn" onClick={() => setSelectedNote(null)}>×</button>
                        </div>
                    </div>
                    
                    {showShareModal ? (
                        <div style={{padding: '20px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '20px'}}>
                            <h3>Share with Group</h3>
                            <select 
                                value={selectedGroupId} 
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                style={{width: '100%', padding: '10px', marginBottom: '10px'}}
                            >
                                <option value="">Select a Group...</option>
                                {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button className="btn-save" onClick={handleShareNote}>Confirm Share</button>
                            <button style={{marginTop:'10px', background:'none', border:'none', color:'#999', cursor:'pointer'}} onClick={() => setShowShareModal(false)}>Cancel</button>
                            {shareMessage && <p style={{color: 'green'}}>{shareMessage}</p>}
                        </div>
                    ) : (
                        <div className="modal-body markdown-body">
                            <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                            {selectedNote.attachmentUrl && (
                                <div style={{marginTop: '20px', padding: '10px', borderTop: '1px solid #eee'}}>
                                    <a 
                                            href={selectedNote.attachmentUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn-search"
                                            style={{textDecoration: 'none', display: 'inline-block'}}
                                    >
                                        📎 Download / View Attachment
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="modal-header"><h2>Edit Note</h2><button className="close-modal-btn" onClick={() => setIsEditing(false)}>×</button></div>
                    <div className="modal-body">
                        <input className="note-input" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
                        <SimpleMDE value={editFormData.content} onChange={(val) => setEditFormData(prev => ({ ...prev, content: val }))} options={editorOptions} />
                        <input className="tags-input" value={editFormData.tags} onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })} />
                        <button className="btn-save" onClick={handleUpdateNote}>Save</button>
                    </div>
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectNotesPage;