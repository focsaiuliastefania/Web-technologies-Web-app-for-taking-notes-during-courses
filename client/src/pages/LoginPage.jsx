import React from "react";

function LoginPage() {
  const API_URL = import.meta.env.VITE_API_URL;

  const GOOGLE_AUTH_URL = `${API_URL}/api/auth/google`;

  return (
    <div>
      <h2>Login Page</h2>
      <p>Please log in using your institutional account.</p>
      
      <a href={GOOGLE_AUTH_URL}>
        Log in with @stud.ase.ro
      </a>
    </div>
  );
}

export default LoginPage;