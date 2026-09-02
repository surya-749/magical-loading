import React, { useState, useEffect } from 'react';

const messages = [
  "Calibrating Web-Shooters...",
  "Syncing Multiverses...",
  "Evading the Prowler...",
  "Detecting Anomalies...",
  "Bypassing Kingpin's Firewall...",
  "Locating Miles Morales...",
  "Opening portals...",
  "Almost there, Spidey..."
];

const GlitchMessage = ({ progress }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Change message based on progress
    const newIndex = Math.floor((progress / 100) * messages.length);
    if (newIndex < messages.length && newIndex !== messageIndex) {
      setMessageIndex(newIndex);
    }
  }, [progress, messageIndex]);

  const currentMessage = messages[messageIndex];

  return (
    <div className="glitch-wrapper" data-text={currentMessage}>
      {currentMessage}
    </div>
  );
};

export default GlitchMessage;
