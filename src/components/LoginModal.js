import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Temporary dev bypass (remove in production)
    if (username === 'dev' && password === 'dev') {
      setTimeout(() => {
        onLogin({ _id: 'dev-user', username: 'dev', message: 'Development login' });
        onClose();
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Account creation failed');
      }
    } catch (err) {
      setError(`Network error: ${err.message}. Please check if the backend is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#0066CC',
        padding: '40px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: 'white', 
          marginBottom: '30px',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif'
        }}>
          Instructor Login
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '15px',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box'
            }}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '20px',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box'
            }}
          />

          {error && (
            <div style={{
              color: '#ffcccb',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: '#ADD8E6',
                border: '2px solid #87CEEB',
                color: 'black',
                padding: '15px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>

            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: '#ADD8E6',
                border: '2px solid #87CEEB',
                color: 'black',
                padding: '15px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
