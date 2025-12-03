// client/src/components/Navbar.jsx
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

      
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </nav>
  );
}

export default Navbar;