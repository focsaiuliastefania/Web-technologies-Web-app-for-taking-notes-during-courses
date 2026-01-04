import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; 
import './GroupsPage.css';
import './SubjectNotesPage.css'; 

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupNotes, setGroupNotes] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  const handleAuthError = useCallback((response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      navigate('/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error(error);
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name) return;

    try {
      const response = await fetch('http://localhost:8080/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGroup)
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        setNewGroup({ name: '', description: '' });
        fetchGroups();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setMessage('');
    setSelectedNote(null);
    try {
      const response = await fetch(`http://localhost:8080/api/groups/${group.id}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (handleAuthError(response)) return;

      if (response.ok) {
        const data = await response.json();
        setGroupNotes(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    try {
      const response = await fetch(`http://localhost:8080/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newMemberEmail })
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        setMessage('Member invited successfully!');
        setNewMemberEmail('');
      } else {
        setMessage('Failed to invite member (User not found?)');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error inviting member');
    }
  };

  const handleRemoveNoteFromGroup = async (noteId, e) => {
      e.stopPropagation();
      if(!confirm('Remove this note from the group?')) return;

      try {
          const response = await fetch(`http://localhost:8080/api/groups/${selectedGroup.id}/notes/${noteId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (handleAuthError(response)) return;

          if (response.ok) {
              setGroupNotes(groupNotes.filter(n => n.id !== noteId));
              if (selectedNote?.id === noteId) setSelectedNote(null);
          }
      } catch (error) {
          console.error(error);
      }
  };

  return (
    <div className="groups-container">
      <div className="groups-sidebar">
        <h2>My Study Groups</h2>
        <div className="groups-list">
          {groups.map(group => (
            <div 
              key={group.id} 
              className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
              onClick={() => handleGroupClick(group)}
            >
              {group.name}
            </div>
          ))}
        </div>

        <form className="create-group-form" onSubmit={handleCreateGroup}>
          <h3>Create New Group</h3>
          <input
            type="text"
            placeholder="Group Name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="Description"
            value={newGroup.description}
            onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
          />
          <button type="submit">Create Group</button>
        </form>
      </div>

      <div className="group-content">
        {selectedGroup ? (
          <>
            <div className="group-header">
              <h1>{selectedGroup.name}</h1>
              <p>{selectedGroup.description}</p>
            </div>

            <div className="invite-section">
              <h3>Invite Colleagues</h3>
              <form onSubmit={handleInviteMember} style={{display: 'flex', gap: '10px'}}>
                <input 
                  type="email" 
                  placeholder="Colleague's Email (@stud.ase.ro)"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  style={{flex: 1}}
                />
                <button type="submit">Invite</button>
              </form>
              {message && <p className="status-message">{message}</p>}
            </div>

            <div className="group-notes-section">
              <h3>Shared Notes in this Group</h3>
              <div className="notes-grid">
                {groupNotes.map(note => (
                  <div 
                    key={note.id} 
                    className="note-card small-card"
                    onClick={() => setSelectedNote(note)}
                    style={{cursor: 'pointer', position: 'relative'}}
                  >
                    <div className="note-card-header">
                        <h4>{note.title}</h4>
                        <button 
                            className="delete-note-btn"
                            onClick={(e) => handleRemoveNoteFromGroup(note.id, e)}
                            title="Remove from group"
                        >
                            ×
                        </button>
                    </div>
                    <div className="note-content-preview">
                         {note.content.substring(0, 100)}...
                    </div>
                    {note.attachmentUrl && <span style={{fontSize: '0.8rem', color: '#e91e63', marginTop:'5px', display:'block'}}>📎 Has attachment</span>}
                  </div>
                ))}
                {groupNotes.length === 0 && <p>No notes shared yet.</p>}
              </div>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <h2>Select a group to see details</h2>
          </div>
        )}
      </div>

      {selectedNote && (
        <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2>{selectedNote.title}</h2>
                <button className="close-modal-btn" onClick={() => setSelectedNote(null)}>×</button>
            </div>
            
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
          </div>
        </div>
      )}

    </div>
  );
}

export default GroupsPage;