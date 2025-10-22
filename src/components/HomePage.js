import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import StudentViewer from './StudentViewer';

const HomePage = () => {
  const [code, setCode] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [foundLecture, setFoundLecture] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      const lecture = findLectureByCode(code.trim().toUpperCase());
      if (lecture) {
        setFoundLecture(lecture);
        setError('');
      } else {
        setError('Invalid code. Please try again.');
        setFoundLecture(null);
      }
    }
  };

  // Search all professor's localStorage for a lecture matching the access code
  const findLectureByCode = (accessCode) => {
    const allUsers = Object.keys(localStorage).filter(key => key.startsWith('lectures_'));
    
    for (const userKey of allUsers) {
      const lecturesData = localStorage.getItem(userKey);
      if (lecturesData) {
        try {
          const lectures = JSON.parse(lecturesData);
          const foundLecture = lectures.find(lecture => lecture.accessCode === accessCode);
          
          if (foundLecture) {
            // Reconstruct File object from base64 data for viewing
            const byteString = atob(foundLecture.fileData);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: foundLecture.fileType || 'application/pdf' });
            const file = new File([blob], foundLecture.originalName, { type: foundLecture.fileType || 'application/pdf' });
            
            return { ...foundLecture, file };
          }
        } catch (error) {
          console.error('Error parsing lecture data:', error);
        }
      }
    }
    return null;
  };

  const handleInstructorLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/dashboard');
  };

  // If student entered valid code, show StudentViewer instead of homepage
  if (foundLecture) {
    return <StudentViewer lecture={foundLecture} onClose={() => setFoundLecture(null)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#0066CC',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        <h1 style={{ 
          fontSize: '60px', 
          fontWeight: 'bold', 
          margin: 0,
          fontFamily: 'Arial, sans-serif'
        }}>
          LectureLink
        </h1>
        <button 
          onClick={handleInstructorLogin}
          style={{ 
            backgroundColor: '#ADD8E6',
            border: '2px solid #87CEEB',
            color: 'black',
            padding: '15px 25px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            position: 'absolute',
            right: '20px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>Instructor</div>
            <div>Login</div>
          </div>
        </button>
      </header>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <form onSubmit={handleCodeSubmit} style={{ textAlign: 'center' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter Session Code"
            style={{
              width: '300px',
              padding: '15px',
              fontSize: '16px',
              border: '2px solid #D3D3D3',
              borderRadius: '4px',
              marginBottom: '10px',
              fontFamily: 'Arial, sans-serif',
              textTransform: 'uppercase'
            }}
            maxLength={6}
          />
          {error && (
            <div style={{
              color: '#ff0000',
              fontSize: '14px',
              marginBottom: '10px',
              fontFamily: 'Arial, sans-serif'
            }}>
              {error}
            </div>
          )}
          <br />
          <button 
            type="submit" 
            style={{
              backgroundColor: '#ADD8E6',
              border: '2px solid #87CEEB',
              color: 'black',
              padding: '15px 30px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            Join Session
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0066CC',
        height: '60px',
        width: '100%'
      }}>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
};

export default HomePage;
