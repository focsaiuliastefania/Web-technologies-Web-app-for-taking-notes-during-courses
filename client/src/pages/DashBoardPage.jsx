import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function DashboardPage() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', professor: '' });
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/subjects', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSubjects();
  }, [token]);

  const reloadSubjects = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error(error);
    }
  };

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

      if (response.ok) {
        setNewSubject({ name: '', professor: '' });
        reloadSubjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await fetch(`http://localhost:8080/api/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      reloadSubjects();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCardClick = (subject) => {
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
            style={{ cursor: 'pointer' }}
          >
            <button 
                className="delete-btn" 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(subject.id);
                }}
            >
                ×
            </button>
            <h3>{subject.name}</h3>
            {subject.professor && <p className="professor-name">👨‍🏫 {subject.professor}</p>}
          </div>
        ))}

        {subjects.length === 0 && (
          <p style={{ color: '#888' }}>You haven't added any subjects yet.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;