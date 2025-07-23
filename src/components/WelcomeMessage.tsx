import React, { useState, useEffect } from 'react';

const WelcomeMessage = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="welcome-message">
      Welcome back!
    </div>
  );
};

export default WelcomeMessage;
