import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function DashboardPage() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', professor: '' });
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', professor: '' });

  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  const handleAuthError = (response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      navigate('/login');
      return true;
    }
    return false;
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (handleAuthError(response)) return;
      
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name) return;

    try {
      const response = await fetch('http://localhost:8080/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSubject)
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        setNewSubject({ name: '', professor: '' });
        fetchSubjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (handleAuthError(response)) return;
      fetchSubjects();
    } catch (error) {
      console.error(error);
    }
  };

  const startEditing = (subject, e) => {
    e.stopPropagation();
    setEditingId(subject.id);
    setEditFormData({ name: subject.name, professor: subject.professor || '' });
  };

  const cancelEditing = (e) => {
    if(e) e.stopPropagation();
    setEditingId(null);
    setEditFormData({ name: '', professor: '' });
  };

  const handleUpdateSubject = async (e) => {
    e.stopPropagation();
    if (!editFormData.name) return;

    try {
      const response = await fetch(`http://localhost:8080/api/subjects/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        setEditingId(null);
        fetchSubjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCardClick = (subject) => {
    if (editingId === subject.id) return;
    navigate(`/subjects/${subject.id}/notes`, {
        state: { subjectName: subject.name }
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Subjects</h1>
      </div>

      <form className="add-subject-form" onSubmit={handleAddSubject}>
        <div className="form-group">
          <label>Subject Name</label>
          <input 
            type="text" 
            placeholder="Ex: Macroeconomics"
            value={newSubject.name}
            onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Professor (Optional)</label>
          <input 
            type="text" 
            placeholder="Ex: John Doe"
            value={newSubject.professor}
            onChange={(e) => setNewSubject({...newSubject, professor: e.target.value})}
          />
        </div>
        <button type="submit" className="btn-add">+ Add</button>
      </form>

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div 
            key={subject.id} 
            className="subject-card" 
            onClick={() => handleCardClick(subject)}
            style={{ 
                cursor: editingId === subject.id ? 'default' : 'pointer',
                position: 'relative' 
            }}
          >
            {editingId === subject.id ? (
              <div className="edit-subject-mode" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="Name"
                  className="edit-input"
                  style={{marginBottom: '10px', width: '100%', padding: '8px', boxSizing: 'border-box'}}
                />
                <input 
                  type="text"
                  value={editFormData.professor}
                  onChange={(e) => setEditFormData({...editFormData, professor: e.target.value})}
                  placeholder="Professor"
                  className="edit-input"
                  style={{marginBottom: '10px', width: '100%', padding: '8px', boxSizing: 'border-box'}}
                />
                <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                   <button 
                      onClick={handleUpdateSubject}
                      style={{backgroundColor: '#e91e63', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                   >
                     Save
                   </button>
                   <button 
                      onClick={cancelEditing}
                      style={{backgroundColor: '#ccc', color: 'black', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                   >
                     Cancel
                   </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    display: 'flex', 
                    gap: '8px',
                    zIndex: 10
                }}>
                   <button 
                      onClick={(e) => startEditing(subject, e)}
                      style={{
                          background: 'white', 
                          border: '1px solid #ddd',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem'
                      }}
                      title="Edit"
                   >
                     ✏️
                   </button>
                   <button 
                      className="delete-btn" 
                      onClick={(e) => handleDelete(subject.id, e)}
                      style={{ 
                          position: 'static', 
                          margin: 0,
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                      }}
                   >
                      ×
                   </button>
                </div>

                <h3 style={{marginTop: '25px'}}>{subject.name}</h3>
                {subject.professor && <p className="professor-name">👨‍🏫 {subject.professor}</p>}
              </>
            )}
          </div>
        ))}

        {subjects.length === 0 && (
          <p style={{ color: '#888', width: '100%', textAlign: 'center' }}>You haven't added any subjects yet.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;