import React from 'react';

const TopBar = () => {
  const handleAITalk = () => {
    alert('Initiating AI conversation...');
  };

  return (
    <div className="top-bar">
      {/* ...existing code... */}
      <div className="top-bar-actions">
        {/* ...existing code... */}
        <button className="ai-button" onClick={handleAITalk}>
          Talk with AI
        </button>
      </div>
    </div>
  );
};

export default TopBar;