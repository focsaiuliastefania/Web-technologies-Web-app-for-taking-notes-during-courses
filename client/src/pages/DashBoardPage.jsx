//DashBoardPage.jsx
import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function DashboardPage() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', professor: '' });
  const token = localStorage.getItem('authToken');

  // --- AICI ERA PROBLEMA: Am mutat funcția ÎNĂUNTRU pentru a scăpa de erori ---
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

  // Funcție separată pentru reîncărcare (folosită la Add/Delete)
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
        reloadSubjects(); // Reîmprospătăm lista
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Ești sigur că vrei să ștergi această materie?')) return;

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Materiile Tale</h1>
      </div>

      <form className="add-subject-form" onSubmit={handleAddSubject}>
        <div className="form-group">
          <label>Nume Materie</label>
          <input 
            type="text" 
            placeholder="Ex: Macroeconomie"
            value={newSubject.name}
            onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Profesor (Opțional)</label>
          <input 
            type="text" 
            placeholder="Ex: Popescu Ion"
            value={newSubject.professor}
            onChange={(e) => setNewSubject({...newSubject, professor: e.target.value})}
          />
        </div>
        <button type="submit" className="btn-add">+ Adaugă</button>
      </form>

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-card">
            <button className="delete-btn" onClick={() => handleDelete(subject.id)}>×</button>
            <h3>{subject.name}</h3>
            {subject.professor && <p className="professor-name">👨‍🏫 {subject.professor}</p>}
          </div>
        ))}

        {subjects.length === 0 && (
          <p style={{ color: '#888' }}>Nu ai adăugat nicio materie încă.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;