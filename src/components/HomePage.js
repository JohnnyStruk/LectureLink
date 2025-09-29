import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      alert(`Joining session with code: ${code}`);
    }
  };

  const handleInstructorLogin = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container">
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button 
          className="button"
          onClick={handleInstructorLogin}
          style={{ padding: '15px 25px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>Instructor</div>
            <div>Login</div>
          </div>
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <form onSubmit={handleCodeSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter session code"
            className="input"
            style={{ marginBottom: '20px' }}
          />
          <br />
          <button 
            type="submit" 
            className="button"
            style={{ padding: '10px 30px' }}
          >
            Join Session
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
