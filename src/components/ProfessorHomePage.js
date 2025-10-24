import React, { useState, useEffect } from 'react';
import { saveFile as idbSaveFile, getFile as idbGetFile, deleteFile as idbDeleteFile } from '../utils/idbFileStorage';
import { useNavigate } from 'react-router-dom';
import PresentationViewer from './PresentationViewer';

const ProfessorHomePage = () => {
  const [lectures, setLectures] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [hoveredLecture, setHoveredLecture] = useState(null);
  const [lectureToDelete, setLectureToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLectures();
  }, []);

  // Load professor's saved lectures from localStorage and reconstruct File objects
  const fetchMyLectures = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setLectures([]);
      return;
    }

    const user = JSON.parse(userData);
    const savedLectures = localStorage.getItem(`lectures_${user._id || user.username}`);
    
    if (savedLectures) {
      try {
        const lecturesData = JSON.parse(savedLectures);
        // Prefer files from IndexedDB; migrate legacy base64 to IDB if found
        const lecturesWithFiles = await Promise.all(
          (lecturesData || []).map(async (lecture) => {
            let file = await idbGetFile(`lecture_file_${lecture.id}`);
            if (!file && lecture.fileData) {
              try {
                const byteString = atob(lecture.fileData);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: lecture.fileType || 'application/pdf' });
                file = new File([blob], lecture.originalName, { type: lecture.fileType || 'application/pdf' });
                await idbSaveFile(`lecture_file_${lecture.id}`, file);
              } catch {}
            }
            return { ...lecture, file };
          })
        );
        setLectures(lecturesWithFiles);
        // Save back sanitized metadata (no base64) to reduce localStorage usage
        const user = JSON.parse(userData);
        const sanitized = lecturesWithFiles.map((l) => ({
          id: l.id,
          originalName: l.originalName,
          uploadDate: l.uploadDate,
          size: l.size,
          fileType: l.fileType,
          accessCode: l.accessCode
        }));
        localStorage.setItem(`lectures_${user._id || user.username}`, JSON.stringify(sanitized));
      } catch (error) {
        console.error('Error loading lectures:', error);
        setLectures([]);
      }
    } else {
      setLectures([]);
    }
  };

  // Generate random 6-character code for students to access the lecture
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Convert file to base64 for localStorage storage
  const uploadFileToServer = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        const accessCode = generateAccessCode();
        resolve({
          file: {
            id: Date.now() + Math.random(),
            originalName: file.name,
            uploadDate: new Date().toISOString(),
            size: file.size,
            fileData: base64Data,
            fileType: file.type,
            accessCode: accessCode
          }
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (files) => {
    if (files && files.length > 0) {
      setUploading(true);
      setError('');

      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
      
      if (pdfFiles.length === 0) {
        setError('Please upload only PDF files');
        setUploading(false);
        return;
      }

      if (pdfFiles.length < files.length) {
        setError(`${files.length - pdfFiles.length} non-PDF file(s) skipped. Only PDFs are accepted.`);
      }

      try {
        const uploadPromises = pdfFiles.map(file => uploadFileToServer(file));
        const results = await Promise.all(uploadPromises);
        
        const newLectures = results.map((result, index) => ({
          id: result.file.id,
          originalName: result.file.originalName,
          file: pdfFiles[index],
          uploadDate: result.file.uploadDate,
          size: result.file.size,
          fileData: result.file.fileData,
          fileType: result.file.fileType,
          accessCode: result.file.accessCode
        }));

        const updatedLectures = [...lectures, ...newLectures];
        setLectures(updatedLectures);
        
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const lecturesToSave = updatedLectures.map(lecture => ({
            id: lecture.id,
            originalName: lecture.originalName,
            uploadDate: lecture.uploadDate,
            size: lecture.size,
            fileType: lecture.fileType,
            accessCode: lecture.accessCode
          }));
          // Save only metadata to localStorage; store file blob in IndexedDB to avoid quota issues
          localStorage.setItem(`lectures_${user._id || user.username}`, JSON.stringify(lecturesToSave));
          // Write files to IDB using a per-lecture key
          await Promise.all(updatedLectures.map(lec => lec.file ? idbSaveFile(`lecture_file_${lec.id}`, lec.file) : Promise.resolve(true)));
        }
        
        setShowUploadModal(false);
      } catch (error) {
        setError(error.message || 'Failed to upload files');
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };
  
  const handleLectureClick = (lecture) => {
    setSelectedLecture(lecture);
  };
  
  const handleCloseViewer = () => setSelectedLecture(null);

  const handleDeleteClick = (e, lecture) => {
    e.stopPropagation();
    setLectureToDelete(lecture);
  };

  const confirmDelete = () => {
    if (lectureToDelete) {
      const updatedLectures = lectures.filter(l => l.id !== lectureToDelete.id);
      setLectures(updatedLectures);
      
      // Update localStorage to persist deletion
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const lecturesToSave = updatedLectures.map(lecture => ({
          id: lecture.id,
          originalName: lecture.originalName,
          uploadDate: lecture.uploadDate,
          size: lecture.size,
          fileType: lecture.fileType,
          accessCode: lecture.accessCode
        }));
        localStorage.setItem(`lectures_${user._id || user.username}`, JSON.stringify(lecturesToSave));
        // Remove blob from IDB for the deleted lecture
        idbDeleteFile(`lecture_file_${lectureToDelete.id}`).catch(() => {});
      }
      
      setLectureToDelete(null);
    }
  };

  const cancelDelete = () => setLectureToDelete(null);

  // Prevent back button from navigating to login page
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      if (selectedLecture) {
        setSelectedLecture(null);
      }
      window.history.pushState(null, '', window.location.pathname);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedLecture]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Blue Header */}
      <header style={{
        backgroundColor: '#0066CC',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button 
          style={{
            backgroundColor: '#ADD8E6',
            border: '2px solid #87CEEB',
            color: 'black',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onClick={() => setShowUploadModal(true)}
        >
          Upload
        </button>
        
        <div 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <span style={{ 
              color: 'black', 
              fontSize: '18px', 
              fontWeight: 'bold',
              position: 'absolute',
              top: '45%',
              left: '48%',
              transform: 'translate(-50%, -50%)',
              lineHeight: '1',
              margin: 0,
              padding: 0
            }}>X</span>
          </div>
          <span style={{ color: 'black', fontSize: '14px', fontWeight: 'bold' }}>logout</span>
        </div>
      </header>

      {/* White Main Content Area */}
      <main style={{ 
        flex: 1, 
        backgroundColor: 'white',
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {lectures.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666',
            fontSize: '18px',
            padding: '60px 40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: '#0066CC' }}>PDF</div>
            <p style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#333' }}>No lectures uploaded yet</p>
            <p style={{ margin: 0 }}>Click "Upload" to add your first lecture</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '30px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '1200px'
          }}>
            {lectures.map((lecture, index) => (
              <div 
                key={lecture.id} 
                style={{ textAlign: 'center', position: 'relative' }}
                onMouseEnter={() => setHoveredLecture(lecture.id)}
                onMouseLeave={() => setHoveredLecture(null)}
              >
                <div 
                  style={{
                    width: '220px',
                    height: '160px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #dee2e6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    fontSize: '48px',
                    color: '#0066CC',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: hoveredLecture === lecture.id ? '0 4px 12px rgba(0, 102, 204, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => handleLectureClick(lecture)}
                >
                  PDF
                  
                  {/* Delete Button - Shows on Hover */}
                  {hoveredLecture === lecture.id && (
                    <div
                      onClick={(e) => handleDeleteClick(e, lecture)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#ff0000',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        position: 'absolute',
                        top: '47%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}>DEL</span>
                    </div>
                  )}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '5px'
                }}>
                  {lecture.originalName || `Lecture ${index + 1}`}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#0066CC',
                  fontWeight: 'bold',
                  backgroundColor: '#E6F2FF',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  Code: {lecture.accessCode || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Blue Footer */}
      <footer style={{
        backgroundColor: '#0066CC',
        height: '60px',
        width: '100%'
      }}>
      </footer>

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
            borderRadius: '12px',
            border: '2px solid #0066CC',
            maxWidth: '520px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 102, 204, 0.15)'
          }}>
            <h2 style={{ 
              marginBottom: '25px', 
              fontSize: '26px',
              color: '#0066CC',
              fontWeight: 'bold'
            }}>
              Upload Lecture PDF
            </h2>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '3px dashed #0066CC' : '3px dashed #ccc',
                borderRadius: '8px',
                padding: '40px 20px',
                marginBottom: '20px',
                backgroundColor: dragActive ? '#e6f2ff' : '#f9f9f9',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '15px',
                color: dragActive ? '#0066CC' : '#666'
              }}>
                PDF
              </div>
              <p style={{ 
                fontSize: '18px', 
                marginBottom: '10px',
                color: '#333',
                fontWeight: '500'
              }}>
                {dragActive ? 'Drop your PDF files here' : 'Drag and drop PDF files here'}
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                or click to select files
              </p>
            </div>

            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,application/pdf"
              multiple
              style={{ display: 'none' }}
            />

            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Only PDF files are supported
            </p>
                    
                    {uploading && (
                      <div style={{ 
                        marginBottom: '20px', 
                        padding: '10px', 
                        backgroundColor: '#e8f4fd', 
                        borderRadius: '4px',
                        color: '#0066CC'
                      }}>
                        Uploading files... Please wait.
                      </div>
                    )}
                    
                    {error && (
                      <div style={{ 
                        marginBottom: '20px', 
                        padding: '10px', 
                        backgroundColor: '#ffe6e6', 
                        borderRadius: '4px',
                        color: '#cc0000'
                      }}>
                        Error: {error}
                      </div>
                    )}
                    
                    <button
                      className="button"
                      onClick={() => setShowUploadModal(false)}
                      style={{ padding: '10px 20px' }}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lectureToDelete && (
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
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            border: '2px solid black',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '15px', fontSize: '22px', color: '#333' }}>Delete File?</h2>
            <p style={{ marginBottom: '25px', fontSize: '16px', color: '#666' }}>
              Are you sure you want to delete<br />
              <strong>{lectureToDelete.originalName}</strong>?<br />
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: '#ccc',
                  border: 'none',
                  color: 'black',
                  padding: '10px 25px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  backgroundColor: '#ff0000',
                  border: 'none',
                  color: 'white',
                  padding: '10px 25px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Viewer */}
      {selectedLecture && (
        <PresentationViewer
          lecture={selectedLecture}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
};

export default ProfessorHomePage;
