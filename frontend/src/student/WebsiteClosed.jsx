import React from 'react';
// Assuming general theme styles are imported here, similar to other components
import './styles/WebsiteClosed.module.css'; 

const WebsiteClosed = () => {
  return (
    <div className="website-closed-container">
      <div className="message-box">
        <h2>🛑 Maintenance Mode 🛑</h2>
        <p>The website is currently closed for maintenance.</p>
        <p>We apologize for any inconvenience. We will be back shortly!</p>
      </div>
    </div>
  );
};

export default WebsiteClosed;