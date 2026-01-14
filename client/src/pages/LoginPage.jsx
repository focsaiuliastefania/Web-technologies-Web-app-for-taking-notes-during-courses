import React from "react";
function LoginPage(){
const GOOGLE_AUTH_URL = 'https://web-technologies-web-app-for-taking.onrender.com/api/auth/google';

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