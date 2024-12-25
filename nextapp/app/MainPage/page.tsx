import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      {/* Header Section */}
      <header className="header">
        <span className="logo">💖 소스윗</span>
        <button className="logout">로그아웃</button>
      </header>

      {/* Main Content Section */}
      <main className="main-content">
        <div className="option ai">
          <div className="icon">🤖</div>
          <span className="label">AI</span>
        </div>

        <div className="option human">
          <div className="icon">🧑</div>
          <span className="label">사람</span>
        </div>
      </main>
    </div>
  );
}

export default App;