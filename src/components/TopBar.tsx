import React from 'react';

const TopBar = () => {
  const handleAITalk = () => {
    alert('Initiating AI conversation...');
  };

  return (
    <div className="top-bar">
      {/* ...existing code... */}
      <button className="ai-button" onClick={handleAITalk}>
        Talk with AI
      </button>
    </div>
  );
};

export default TopBar;