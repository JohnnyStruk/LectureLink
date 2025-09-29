import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ProfessorHomePage from './components/ProfessorHomePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<ProfessorHomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
