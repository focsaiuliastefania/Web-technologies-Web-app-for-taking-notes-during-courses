import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Navbar.css'; 

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        📚 Notes app for ASE students
      </Link>

      <div className="navbar-links" style={{display: 'flex', gap: '20px'}}>
        <Link to="/dashboard" style={{color: 'white', textDecoration: 'none', fontWeight: 'bold'}}>Subjects</Link>
        <Link to="/groups" style={{color: 'white', textDecoration: 'none', fontWeight: 'bold'}}>Groups</Link>
      </div>
      
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </nav>
  );
}

export default Navbar;