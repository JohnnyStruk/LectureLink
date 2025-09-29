import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorHomePage = () => {
  const [lectures, setLectures] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = (files) => {
    if (files && files.length > 0) {
      const newLectures = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        title: file.name.replace(/\.[^/.]+$/, ""),
        file: file
      }));
      
      setLectures([...lectures, ...newLectures]);
      setShowUploadModal(false);
    }
  };

  const handleFileSelect = (event) => {
    handleFileUpload(event.target.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleLogout = () => navigate('/');
  const handleLectureClick = (lecture) => alert(`Opening ${lecture.title} for Q&A session`);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px', 
        borderBottom: '2px solid black' 
      }}>
        <div>
          <button 
            className="button" 
            style={{ padding: '10px 20px' }}
            onClick={() => setShowUploadModal(true)}
          >
            Upload
          </button>
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          <div className="logout-icon">×</div>
          <span>logout</span>
        </button>
      </div>

      <div style={{ flex: 1, padding: '20px' }}>
        {lectures.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '50px', 
            color: '#666',
            fontSize: '18px'
          }}>
            No lectures uploaded yet. Click "Upload" to add your first lecture.
          </div>
        ) : (
          <div className="lecture-grid">
            {lectures.map((lecture) => (
            <div key={lecture.id} className="lecture-item">
              <div 
                className="lecture-thumbnail"
                onClick={() => handleLectureClick(lecture)}
                style={{ cursor: 'pointer' }}
              >
              </div>
              <div className="lecture-title">{lecture.title}</div>
            </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
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
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            border: '2px solid black',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Upload Lecture File</h2>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '3px dashed #007bff' : '3px dashed #ccc',
                borderRadius: '8px',
                padding: '40px 20px',
                marginBottom: '20px',
                backgroundColor: dragActive ? '#f0f8ff' : '#f9f9f9',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                {dragActive ? 'Drop your files here' : 'Drag and drop files here'}
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                or select multiple files
              </p>
            </div>

            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
              multiple
              style={{ display: 'none' }}
            />

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Supported formats: PDF, PowerPoint, Word documents, Text files
            </p>
            <button
              className="button"
              onClick={() => setShowUploadModal(false)}
              style={{ padding: '10px 20px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorHomePage;
