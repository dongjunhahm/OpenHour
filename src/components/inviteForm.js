import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const InviteForm = ({ calendarId, onInviteSuccess }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const token = useSelector((state) => state.token.value);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await axios.post('/api/calendar/invite-user', {
        calendarId,
        inviterToken: token,
        invitedEmail: recipientEmail
      });
      
      const inviteUrl = `${window.location.origin}/join-calendar/${calendarId}`;
      const emailStatus = response.data.emailStatus || 'unknown';
      const emailService = response.data.emailService || 'default';
      
      const messageText = emailStatus === 'sent'
        ? `Invitation sent to ${recipientEmail}! Share this link: ${inviteUrl}`
        : `User added but email delivery ${emailStatus}. Share this link: ${inviteUrl}`;
        
      setMessage({ 
        text: messageText, 
        type: 'success' 
      });
      setRecipientEmail('');
      
      if (onInviteSuccess) {
        const inviteData = {
          ...response.data,
          inviteUrl: `${window.location.origin}/join-calendar/${calendarId}`
        };
        onInviteSuccess(inviteData);
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Error sending invitation',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Invite Friends</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="recipientEmail"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="friend@example.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
      
      {message.text && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Or share invitation link</h3>
        <div className="flex">
          <input
            type="text"
            value={`${window.location.origin}/join-calendar/${calendarId}`}
            readOnly
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join-calendar/${calendarId}`);
              setMessage({ text: 'Link copied to clipboard!', type: 'success' });
            }}
            className="bg-gray-200 px-4 py-2 rounded-r-md hover:bg-gray-300"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteForm;
