import React, { useState, useEffect } from 'react';

const PresentationViewer = ({ lecture, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading content...');
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [studentData, setStudentData] = useState({});
  const [hoveredQuestion, setHoveredQuestion] = useState(null);

  // Poll for new student questions/comments every 2 seconds
  useEffect(() => {
    if (lecture.accessCode) {
      loadStudentData();
      
      const interval = setInterval(() => {
        loadStudentData();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [lecture.accessCode]);

  const loadStudentData = () => {
    const savedData = localStorage.getItem(`lecture_${lecture.accessCode}_data`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setStudentData(parsedData);
      } catch (error) {
        console.error('Error loading student data:', error);
      }
    }
  };

  // Mark question as acknowledged (changes from red to blue for students)
  const handleAcknowledgeQuestion = (questionId, pageIndex) => {
    const updatedData = { ...studentData };
    if (updatedData[pageIndex] && updatedData[pageIndex].questions) {
      const questionIndex = updatedData[pageIndex].questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        updatedData[pageIndex].questions[questionIndex].acknowledged = true;
        setStudentData(updatedData);
        localStorage.setItem(`lecture_${lecture.accessCode}_data`, JSON.stringify(updatedData));
      }
    }
  };

  useEffect(() => {
    loadFileContent();
    
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [lecture]);

  const loadFileContent = async () => {
    setLoading(true);
    
    try {
      if (lecture.file) {
        await loadPDFContent();
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
      setLoadingMessage('Loading PDF file...');
      
      if (!lecture.file) {
        throw new Error('No file found in lecture object');
      }
      
      const url = URL.createObjectURL(lecture.file);
      setFileUrl(url);
      
      setLoadingMessage('Detecting page count...');
      
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
      setLoadingMessage(`Loading ${pageCount} pages...`);
      
      const extractedPages = [];
      
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        extractedPages.push({
          id: pageNum - 1,
          title: `Page ${pageNum}`,
          thumbnail: '📄',
          backgroundColor: '#f0f0f0',
          type: 'pdf',
          pageNumber: pageNum,
          totalPages: pageCount
        });
      }
      
      setPages(extractedPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoadingMessage('Error loading PDF. Showing fallback content...');
      generateMockPages();
    }
  };

  const generateMockPages = () => {
    const mockPages = [];
    const pageCount = 5;
    
    for (let i = 0; i < pageCount; i++) {
      mockPages.push({
        id: i,
        title: `Page ${i + 1}`,
        type: 'pdf',
        pageNumber: i + 1,
        totalPages: pageCount
      });
    }
    
    setPages(mockPages);
    setLoading(false);
  };

  const handleScroll = () => {
    const container = document.getElementById('pdf-scroll-container');
    if (!container) return;

    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const centerPosition = containerTop + containerHeight / 2;

    for (let i = 0; i < pages.length; i++) {
      const pageElement = document.getElementById(`pdf-page-${i}`);
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
    const pageElement = document.getElementById(`pdf-page-${pageIndex}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      const pageElement = document.getElementById(`pdf-page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const pageElement = document.getElementById(`pdf-page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPage]);

  useEffect(() => {
    const thumbnailElement = document.getElementById(`thumbnail-${currentPage}`);
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
          <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
            {loadingMessage}
          </h2>
          <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
            {lecture.originalName}
          </p>
          <div style={{
            marginTop: '20px',
            width: '100%',
            height: '4px',
            backgroundColor: '#ecf0f1',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#3498db',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
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
      zIndex: 2000
    }}>
      {/* Left Sidebar - Thumbnails */}
      <div style={{
        width: '200px',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px 0',
        overflowY: 'auto',
        borderRight: '2px solid #34495e'
      }}>
        <div style={{
          padding: '0 20px 20px',
          borderBottom: '1px solid #34495e',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            {lecture.originalName || 'Presentation'}
          </h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#bdc3c7' }}>
            {pages.length} slides
          </p>
        </div>
        
        <div style={{ padding: '0 10px' }}>
          {pages.map((page, index) => (
            <div
              key={page.id}
              id={`thumbnail-${index}`}
              onClick={() => handleThumbnailClick(index)}
              style={{
                backgroundColor: currentPage === index ? '#3498db' : 'transparent',
                padding: '8px',
                margin: '5px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                border: currentPage === index ? '2px solid #2980b9' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                backgroundColor: page.backgroundColor,
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
                  <span style={{ fontSize: '28px', fontWeight: 'bold' }}>PDF</span>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                textAlign: 'center',
                fontWeight: currentPage === index ? 'bold' : 'normal'
              }}>
                {page.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#34495e',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>
              {pages[currentPage]?.title || 'Slide'}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#bdc3c7' }}>
              Slide {currentPage + 1} of {pages.length}
            </p>
          </div>
          
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            color: '#ADD8E6',
            backgroundColor: 'rgba(173, 216, 230, 0.15)',
            padding: '8px 16px',
            borderRadius: '4px',
            border: '2px solid #ADD8E6'
          }}>
            Code: {lecture.accessCode || 'N/A'}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              style={{
                backgroundColor: currentPage === 0 ? '#7f8c8d' : '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              ← Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentPage === pages.length - 1}
              style={{
                backgroundColor: currentPage === pages.length - 1 ? '#7f8c8d' : '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Next →
            </button>
            
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Slide Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: pages[currentPage]?.type === 'pdf' ? '20px' : '40px',
          paddingTop: pages[currentPage]?.type === 'pdf' ? '10px' : '40px',
          backgroundColor: pages[currentPage]?.backgroundColor || '#ecf0f1'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: pages[currentPage]?.type === 'pdf' ? '10px' : '60px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: pages[currentPage]?.type === 'pdf' ? '950px' : '1000px',
            width: '100%',
            textAlign: 'left',
            border: '2px solid #bdc3c7',
            overflow: 'hidden',
            height: pages[currentPage]?.type === 'pdf' ? 'calc(100vh - 100px)' : 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Content */}
            <div 
              id="pdf-scroll-container"
              style={{
                fontSize: pages[currentPage]?.type === 'pdf' ? '14px' : '16px',
                lineHeight: '1.8',
                color: '#2c3e50',
                whiteSpace: 'pre-wrap',
                fontFamily: pages[currentPage]?.type === 'text' ? 'monospace' : 'Arial, sans-serif',
                flex: '1',
                overflowY: 'auto',
                padding: pages[currentPage]?.type === 'pdf' ? '0' : '20px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 0
              }}
              onScroll={pages[0]?.type === 'pdf' ? handleScroll : undefined}
            >
              {pages[0]?.type === 'pdf' && fileUrl ? (
                pages.map((page, index) => (
                  <div
                    key={page.id}
                    id={`pdf-page-${index}`}
                    style={{
                      width: '100%',
                      height: 'calc(100vh - 160px)',
                      minHeight: 'calc(100vh - 160px)',
                      maxHeight: 'calc(100vh - 160px)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      flexShrink: 0
                    }}
                  >
                    <iframe
                      src={`${fileUrl}#page=${page.pageNumber}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '4px',
                        pointerEvents: 'none'
                      }}
                      title={`PDF Page ${page.pageNumber}`}
                      scrolling="no"
                    />
                  </div>
                ))
              ) : pages[currentPage]?.type !== 'pdf' ? (
                pages[currentPage]?.content || 'Content not available...'
              ) : null}
            </div>

          </div>
        </div>

        {/* Footer Navigation */}
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: currentPage === index ? '#3498db' : '#bdc3c7',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            />
          ))}
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
                onMouseEnter={() => setHoveredQuestion(question.id)}
                onMouseLeave={() => setHoveredQuestion(null)}
                style={{
                  backgroundColor: question.acknowledged ? '#f0f8ff' : '#ffe0e0',
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: question.acknowledged ? '1px solid #d0e8ff' : '2px solid #ff6b6b',
                  position: 'relative',
                  cursor: question.acknowledged ? 'default' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '5px',
                  lineHeight: '1.4',
                  paddingRight: hoveredQuestion === question.id && !question.acknowledged ? '35px' : '0'
                }}>
                  {question.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  textAlign: 'right'
                }}>
                  {question.timestamp}
                </div>
                
                {hoveredQuestion === question.id && !question.acknowledged && (
                  <div
                    onClick={() => handleAcknowledgeQuestion(question.id, currentPage)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '30px',
                      height: '30px',
                      backgroundColor: '#4CAF50',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s'
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
                      fontSize: '18px',
                      fontWeight: 'bold',
                      lineHeight: '1'
                    }}>OK</span>
                  </div>
                )}
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
  );
};

export default PresentationViewer;
