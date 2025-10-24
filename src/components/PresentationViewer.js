import React, { useState, useEffect } from 'react';
import PollModal from './PollModal';
import PollResultsModal from './PollResultsModal';
import { listPolls } from '../utils/pollsApi';
import { isPageUnanswered, markPageUnanswered, clearPageIfAllAnswered } from '../utils/unansweredIndicator';
import { getVotes } from '../utils/reactions';

const PresentationViewer = ({ lecture, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading content...');
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [studentData, setStudentData] = useState({});
  const [hoveredQuestion, setHoveredQuestion] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showResults, setShowResults] = useState(null);
  const [pollTimer, setPollTimer] = useState(null);
  const [lastResultsPollId, setLastResultsPollId] = useState(null);
  const [dismissedResultsId, setDismissedResultsId] = useState(null);
  const [resultsDisabled, setResultsDisabled] = useState(false);
  const [unansweredPages, setUnansweredPages] = useState(new Set());

  const handleCloseResults = () => {
    if (showResults?.id) {
      try { localStorage.setItem(`poll_results_shown_${showResults.id}`, '1'); } catch {}
      setDismissedResultsId(showResults.id);
    }
    try { localStorage.setItem('poll_results_disabled', '1'); } catch {}
    setResultsDisabled(true);
    setShowResults(null);
  };

  useEffect(() => {
    try {
      const v = localStorage.getItem('poll_results_disabled');
      if (v === '1') setResultsDisabled(true);
    } catch {}
  }, []);
  const openLatestResults = async () => {
    try {
      const list = await listPolls({ lectureCode: lecture.accessCode });
      if (list && list.length > 0) {
        setShowResults(list[0]);
      }
    } catch {}
  };

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

  useEffect(() => {
    let timer;
    const check = async () => {
      try {
        const list = await listPolls({ lectureCode: lecture.accessCode });
        const active = (list || []).find(p => p.isActive);
        if (active && active.endsAt) {
          const endMs = new Date(active.endsAt).getTime();
          const now = Date.now();
          if (endMs > now) {
            const secs = Math.ceil((endMs - now) / 1000);
            setPollTimer(secs);
          } else {
            // Poll ended - clear timer permanently
            if (pollTimer !== null) {
              setPollTimer(null);
            }
            if (!resultsDisabled) {
              // Only open once per poll id
              const shownKey = `poll_results_shown_${active.id}`;
              const alreadyShown = (() => { try { return localStorage.getItem(shownKey) === '1'; } catch { return false; } })();
              if (!alreadyShown && lastResultsPollId !== active.id && dismissedResultsId !== active.id) {
                setShowResults(active);
                setLastResultsPollId(active.id);
                try { localStorage.setItem(shownKey, '1'); } catch {}
              }
            }
          }
        } else {
          if (pollTimer !== null) {
            setPollTimer(null);
          }
        }
      } catch {}
      timer = setTimeout(check, 1000);
    };
    if (lecture.accessCode) check();
    return () => clearTimeout(timer);
  }, [lecture.accessCode, lastResultsPollId, dismissedResultsId, resultsDisabled, pollTimer]);

  const loadStudentData = () => {
    const savedData = localStorage.getItem(`lecture_${lecture.accessCode}_data`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setStudentData(parsedData);
        // Update unanswered pages set in state for immediate re-render
        const newSet = new Set();
        Object.keys(parsedData).forEach(pageIdx => {
          const pageIndex = parseInt(pageIdx);
          if (parsedData[pageIndex]?.questions?.some(q => !q.acknowledged)) {
            newSet.add(pageIndex);
            markPageUnanswered(lecture.accessCode, pageIndex);
          }
        });
        setUnansweredPages(newSet);
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
        // Check if all questions on this page are now answered and clear the indicator
        clearPageIfAllAnswered(lecture.accessCode, pageIndex, updatedData[pageIndex].questions);
        // Update state to remove from unanswered set if all answered
        const allAnswered = !updatedData[pageIndex].questions.some(q => !q.acknowledged);
        if (allAnswered) {
          setUnansweredPages(prev => {
            const next = new Set(prev);
            next.delete(pageIndex);
            return next;
          });
        }
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
    // Before navigating, immediately mark current page if it has unanswered questions
    const current = studentData[currentPage];
    if (current?.questions?.some(q => !q.acknowledged)) {
      markPageUnanswered(lecture.accessCode, currentPage);
      setUnansweredPages(prev => new Set(prev).add(currentPage));
    } else {
      clearPageIfAllAnswered(lecture.accessCode, currentPage, current?.questions || []);
      setUnansweredPages(prev => {
        const next = new Set(prev);
        next.delete(currentPage);
        return next;
      });
    }

    setCurrentPage(pageIndex);
    const pageElement = document.getElementById(`pdf-page-${pageIndex}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      // Immediately mark current page if it has unanswered questions
      const current = studentData[currentPage];
      if (current?.questions?.some(q => !q.acknowledged)) {
        markPageUnanswered(lecture.accessCode, currentPage);
        setUnansweredPages(prev => new Set(prev).add(currentPage));
      } else {
        clearPageIfAllAnswered(lecture.accessCode, currentPage, current?.questions || []);
        setUnansweredPages(prev => {
          const next = new Set(prev);
          next.delete(currentPage);
          return next;
        });
      }
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
      // Immediately mark current page if it has unanswered questions
      const current = studentData[currentPage];
      if (current?.questions?.some(q => !q.acknowledged)) {
        markPageUnanswered(lecture.accessCode, currentPage);
        setUnansweredPages(prev => new Set(prev).add(currentPage));
      } else {
        clearPageIfAllAnswered(lecture.accessCode, currentPage, current?.questions || []);
        setUnansweredPages(prev => {
          const next = new Set(prev);
          next.delete(currentPage);
          return next;
        });
      }
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
    <>
      <style>
        {`
          #pdf-scroll-container::-webkit-scrollbar {
            display: none;
          }
          #pdf-scroll-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          /* Hide pagination dots */
          ::-webkit-scrollbar-track,
          ::-webkit-scrollbar-thumb {
            display: none !important;
          }
          [class*="pagination"],
          [class*="dot"],
          [class*="indicator"] {
            display: none !important;
          }
        `}
      </style>
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
                {unansweredPages.has(index) && (
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                    border: '1px solid #c0392b'
                  }}>!</div>
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
              onClick={() => setShowPollModal(true)}
              style={{
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Create Poll
            </button>
            {pollTimer != null && (
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFD700', whiteSpace: 'nowrap' }}>
                Poll ends in {Math.floor((pollTimer || 0) / 60)}:{String((pollTimer || 0) % 60).padStart(2, '0')}
              </div>
            )}
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
            border: pages[currentPage]?.type === 'pdf' ? 'none' : '2px solid #bdc3c7',
            overflow: 'hidden',
            height: pages[currentPage]?.type === 'pdf' ? 'calc(100vh - 80px)' : 'auto',
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
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollSnapType: 'y mandatory',
                scrollBehavior: 'smooth',
                padding: pages[currentPage]?.type === 'pdf' ? '0' : '20px',
                backgroundColor: '#fafafa',
                borderRadius: '0px',
                border: 'none',
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
                      height: '100%',
                      minHeight: '100%',
                      maxHeight: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexShrink: 0,
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <iframe
                      src={`${fileUrl}#page=${page.pageNumber}&view=FitV&toolbar=0&navpanes=0&scrollbar=0`}
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '100%',
                        minHeight: '100%',
                        border: 'none',
                        borderRadius: '0px',
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

      {showPollModal && (
        <PollModal
          instructorId={(JSON.parse(localStorage.getItem('user')||'{}')._id) || 'instructor'}
          lectureCode={lecture.accessCode}
          onClose={() => setShowPollModal(false)}
        />
      )}
      {showResults && (
        <PollResultsModal poll={showResults} onClose={handleCloseResults} />
      )}

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
                  textAlign: 'right',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{question.timestamp}</span>
                  <span style={{ fontSize: 12, color: '#3498db', fontWeight: 'bold' }}>
                    👍 {getVotes(lecture.accessCode, 'question', question.id)}
                  </span>
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
                  textAlign: 'right',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{comment.timestamp}</span>
                  <span style={{ fontSize: 12, color: '#3498db', fontWeight: 'bold' }}>
                    👍 {getVotes(lecture.accessCode, 'comment', comment.id)}
                  </span>
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
    </>
  );
};

export default PresentationViewer;
