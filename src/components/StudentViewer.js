import React, { useState, useEffect } from 'react';

const StudentViewer = ({ lecture, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [question, setQuestion] = useState('');
  const [comment, setComment] = useState('');
  const [studentData, setStudentData] = useState({});
  const [postSuccess, setPostSuccess] = useState('');

  useEffect(() => {
    loadFileContent();
    loadStudentData();
    
    const interval = setInterval(() => {
      loadStudentData();
    }, 3000);
    
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      clearInterval(interval);
    };
  }, [lecture]);

  const loadStudentData = () => {
    const savedData = localStorage.getItem(`lecture_${lecture.accessCode}_data`);
    if (savedData) {
      setStudentData(JSON.parse(savedData));
    }
  };

  const loadFileContent = async () => {
    setLoading(true);
    
    try {
      if (lecture.file) {
        const fileType = lecture.originalName?.split('.').pop()?.toLowerCase();
        
        if (fileType === 'pdf') {
          await loadPDFContent();
        } else {
          generateMockPages();
        }
      } else {
        generateMockPages();
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      generateMockPages();
    }
  };

  const loadPDFContent = async () => {
    try {
      if (!lecture.file) {
        throw new Error('No file found in lecture object');
      }
      
      const url = URL.createObjectURL(lecture.file);
      setFileUrl(url);
      
      const text = await lecture.file.text();
      const countMatch = text.match(/\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/);
      let pageCount = 3;
      
      if (countMatch && countMatch[1]) {
        pageCount = parseInt(countMatch[1], 10);
      } else {
        const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
        if (pageMatches) {
          pageCount = pageMatches.length;
        }
      }
      
      setNumPages(pageCount);
      
      const extractedPages = [];
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        extractedPages.push({
          id: pageNum - 1,
          title: `Page ${pageNum}`,
          type: 'pdf',
          pageNumber: pageNum,
          totalPages: pageCount
        });
      }
      
      setPages(extractedPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      generateMockPages();
    }
  };

  const generateMockPages = () => {
    const mockPages = [];
    const pageCount = 5;
    
    for (let i = 0; i < pageCount; i++) {
      mockPages.push({
        id: i,
        title: `Slide ${i + 1}`,
        type: 'mock'
      });
    }
    
    setPages(mockPages);
    setLoading(false);
  };

  const handleScroll = () => {
    const container = document.getElementById('student-pdf-scroll-container');
    if (!container) return;

    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const centerPosition = containerTop + containerHeight / 2;

    for (let i = 0; i < pages.length; i++) {
      const pageElement = document.getElementById(`student-pdf-page-${i}`);
      if (pageElement) {
        const pageTop = pageElement.offsetTop;
        const pageBottom = pageTop + pageElement.clientHeight;
        
        if (centerPosition >= pageTop && centerPosition < pageBottom) {
          if (currentPage !== i) {
            setCurrentPage(i);
          }
          break;
        }
      }
    }
  };

  const handleThumbnailClick = (pageIndex) => {
    setCurrentPage(pageIndex);
    const pageElement = document.getElementById(`student-pdf-page-${pageIndex}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Post question to current page and save to localStorage
  const handlePostQuestion = () => {
    if (!question.trim()) return;

    const newQuestion = {
      id: Date.now(),
      text: question,
      timestamp: new Date().toLocaleTimeString(),
      page: currentPage,
      acknowledged: false // Will be marked true when professor acknowledges
    };

    const updatedData = { ...studentData };
    if (!updatedData[currentPage]) {
      updatedData[currentPage] = { questions: [], comments: [] };
    }
    updatedData[currentPage].questions.push(newQuestion);
    
    setStudentData(updatedData);
    localStorage.setItem(`lecture_${lecture.accessCode}_data`, JSON.stringify(updatedData));
    setQuestion('');
    setComment('');
    
    setPostSuccess('Question posted successfully!');
    setTimeout(() => setPostSuccess(''), 3000);
  };

  const handlePostComment = () => {
    if (!comment.trim()) return;

    const newComment = {
      id: Date.now(),
      text: comment,
      timestamp: new Date().toLocaleTimeString(),
      page: currentPage
    };

    const updatedData = { ...studentData };
    if (!updatedData[currentPage]) {
      updatedData[currentPage] = { questions: [], comments: [] };
    }
    updatedData[currentPage].comments.push(newComment);
    
    setStudentData(updatedData);
    localStorage.setItem(`lecture_${lecture.accessCode}_data`, JSON.stringify(updatedData));
    setQuestion('');
    setComment('');
    
    setPostSuccess('Comment posted successfully!');
    setTimeout(() => setPostSuccess(''), 3000);
  };

  useEffect(() => {
    const thumbnailElement = document.getElementById(`student-thumbnail-${currentPage}`);
    if (thumbnailElement) {
      thumbnailElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [currentPage]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{ 
            fontSize: '32px', 
            marginBottom: '20px',
            fontWeight: 'bold',
            color: '#0066CC'
          }}>
            PDF
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Loading content...</h2>
          <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
            {lecture.originalName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000
    }}>
      {/* Top Header with Access Code */}
      <div style={{
        backgroundColor: '#0066CC',
        color: 'white',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '3px solid #0052A3',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '3px',
          textTransform: 'uppercase'
        }}>
          Code: {lecture?.accessCode || 'NO CODE'}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Thumbnails */}
        <div style={{
          width: '200px',
          backgroundColor: '#0066CC',
          color: 'white',
          padding: '20px 0',
          overflowY: 'auto',
          borderRight: '2px solid #0052A3'
        }}>
        <div style={{
          padding: '0 20px 20px',
          borderBottom: '1px solid #0052A3',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            {lecture.originalName || 'Lecture'}
          </h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#ADD8E6' }}>
            {pages.length} slides
          </p>
        </div>
        
        <div style={{ padding: '0 10px' }}>
          {pages.map((page, index) => (
            <div
              key={page.id}
              id={`student-thumbnail-${index}`}
              onClick={() => handleThumbnailClick(index)}
              style={{
                backgroundColor: currentPage === index ? '#003d7a' : 'transparent',
                padding: '8px',
                margin: '5px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                border: currentPage === index ? '2px solid #001f3d' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                backgroundColor: '#f0f0f0',
                width: '110px',
                height: '140px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '5px',
                border: '1px solid #ddd',
                overflow: 'hidden',
                position: 'relative',
                margin: '0 auto'
              }}>
                {page.type === 'pdf' && fileUrl ? (
                  <iframe
                    src={`${fileUrl}#page=${page.pageNumber}&view=FitV&toolbar=0&navpanes=0&scrollbar=0`}
                    style={{
                      width: '220px',
                      height: '280px',
                      border: 'none',
                      transform: 'scale(0.5)',
                      transformOrigin: 'top center',
                      pointerEvents: 'none'
                    }}
                    title={`PDF Page ${page.pageNumber} Thumbnail`}
                  />
                ) : (
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#0066CC' }}>PDF</span>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                textAlign: 'center',
                fontWeight: currentPage === index ? 'bold' : 'normal'
              }}>
                Page {page.pageNumber || index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        border: '2px solid black'
      }}>
        {/* Header with Page Info */}
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '15px 20px',
          borderBottom: '2px solid black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {pages[currentPage]?.type === 'pdf' ? `Page ${currentPage + 1}` : `Slide ${currentPage + 1}`}
            <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '5px' }}>
              of {pages.length}
            </span>
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          id="student-pdf-scroll-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          onScroll={pages[0]?.type === 'pdf' ? handleScroll : undefined}
        >
          {pages[0]?.type === 'pdf' && fileUrl ? (
            pages.map((page, index) => (
              <div
                key={page.id}
                id={`student-pdf-page-${index}`}
                style={{
                  width: '100%',
                  minHeight: '100vh',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                  padding: '20px 0'
                }}
              >
                <iframe
                  src={`${fileUrl}#page=${page.pageNumber}&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                  style={{
                    width: '95%',
                    height: '95vh',
                    border: 'none',
                    borderRadius: '4px',
                    pointerEvents: 'none'
                  }}
                  title={`PDF Page ${page.pageNumber}`}
                  scrolling="no"
                />
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', fontSize: '18px', color: '#666', textAlign: 'center' }}>
              Lecture content appears here
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '15px',
          borderTop: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {postSuccess && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #c3e6cb',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {postSuccess}
            </div>
          )}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Type your question or comment here..."
              value={question || comment}
              onChange={(e) => {
                setQuestion(e.target.value);
                setComment(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePostQuestion();
                }
              }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          <button
            onClick={() => {
              if (question.trim() || comment.trim()) {
                handlePostQuestion();
              }
            }}
            style={{
              backgroundColor: '#ADD8E6',
              border: '2px solid #87CEEB',
              color: 'black',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap'
            }}
          >
            Post Question
          </button>
          <button
            onClick={() => {
              if (question.trim() || comment.trim()) {
                handlePostComment();
              }
            }}
            style={{
              backgroundColor: '#ADD8E6',
              border: '2px solid #87CEEB',
              color: 'black',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap'
            }}
          >
            Post Comment
          </button>
          </div>
        </div>
      </div>

        {/* Right Sidebar - Student Questions & Comments */}
      <div style={{
        width: '350px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '2px solid #ddd',
        overflow: 'hidden'
      }}>
        {/* Questions Section */}
        <div style={{
          backgroundColor: '#0066CC',
          color: 'white',
          padding: '15px 20px',
          fontSize: '18px',
          fontWeight: 'bold',
          borderBottom: '2px solid #0052A3'
        }}>
          Student Questions
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          borderBottom: '2px solid #ddd'
        }}>
          {studentData[currentPage]?.questions?.length > 0 ? (
            studentData[currentPage].questions.map((question) => (
              <div
                key={question.id}
                style={{
                  backgroundColor: question.acknowledged ? '#f0f8ff' : '#ffe0e0',
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: question.acknowledged ? '1px solid #d0e8ff' : '2px solid #ff6b6b'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '5px',
                  lineHeight: '1.4'
                }}>
                  {question.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  textAlign: 'right',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{question.timestamp}</span>
                  {question.acknowledged && (
                    <span style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      Answered
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No questions for this page
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div style={{
          backgroundColor: '#0066CC',
          color: 'white',
          padding: '15px 20px',
          fontSize: '18px',
          fontWeight: 'bold',
          borderBottom: '2px solid #0052A3'
        }}>
          Student Comments
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px'
        }}>
          {studentData[currentPage]?.comments?.length > 0 ? (
            studentData[currentPage].comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  backgroundColor: '#fff8e1',
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ffe0b2'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '5px',
                  lineHeight: '1.4'
                }}>
                  {comment.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  textAlign: 'right'
                }}>
                  {comment.timestamp}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No comments for this page
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default StudentViewer;

