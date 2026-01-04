import React from 'react';
import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;