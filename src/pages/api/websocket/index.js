import { Server } from 'socket.io';

// In-memory storage for WebSocket connections
let io;

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    io = res.socket.server.io;
    res.end();
    return;
  }
  
  console.log('Setting up socket.io server');
  io = new Server(res.socket.server);
  res.socket.server.io = io;
  
  // Store active calendars in memory
  const activeCalendars = new Map();
  
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // Join a specific calendar room
    socket.on('joinCalendar', (calendarId) => {
      socket.join(`calendar-${calendarId}`);
      console.log(`Socket ${socket.id} joined calendar-${calendarId}`);
      
      // Track active users in this calendar
      if (!activeCalendars.has(calendarId)) {
        activeCalendars.set(calendarId, new Set());
      }
      const isFirstJoin = !activeCalendars.get(calendarId).has(socket.id);
      activeCalendars.get(calendarId).add(socket.id);
      
      // Notify others that someone joined, but only if it's a new user (not a reconnection)
      if (isFirstJoin) {
        socket.to(`calendar-${calendarId}`).emit('userJoined', {
          count: activeCalendars.get(calendarId).size,
          isNewUser: true // Flag to indicate this is a new user joining
        });
      } else {
        // For reconnections, just update the count without triggering a refresh
        socket.to(`calendar-${calendarId}`).emit('userJoined', {
          count: activeCalendars.get(calendarId).size,
          isNewUser: false // Not a new user, just a reconnection
        });
      }
    });
    
    // Leave a calendar room
    socket.on('leaveCalendar', (calendarId) => {
      socket.leave(`calendar-${calendarId}`);
      console.log(`Socket ${socket.id} left calendar-${calendarId}`);
      
      // Remove user from active calendar
      if (activeCalendars.has(calendarId)) {
        activeCalendars.get(calendarId).delete(socket.id);
        
        // Notify others that someone left
        socket.to(`calendar-${calendarId}`).emit('userLeft', {
          count: activeCalendars.get(calendarId).size
        });
      }
    });
    
    // Handle calendar updates
    socket.on('calendarUpdated', (data) => {
      const { calendarId } = data;
      console.log(`Calendar ${calendarId} updated, notifying all clients`);
      
      // Broadcast to all clients in the room except sender
      socket.to(`calendar-${calendarId}`).emit('calendarUpdated', data);
    });
    
    // Handle available slots updates
    socket.on('slotsUpdated', (data) => {
      const { calendarId, isNewUser } = data;
      console.log(`Slots for calendar ${calendarId} updated, notifying all clients. New user: ${isNewUser}`);
      
      // Only broadcast refresh if this is from a new user joining
      if (isNewUser) {
        // Broadcast to all clients in the room except sender
        socket.to(`calendar-${calendarId}`).emit('refreshSlots');
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      
      // Remove from all active calendars
      activeCalendars.forEach((sockets, calendarId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          
          // Notify others about the disconnection
          socket.to(`calendar-${calendarId}`).emit('userLeft', {
            count: sockets.size
          });
        }
      });
    });
  });
  
  res.end();
};

// Helper function for other API routes to access the socket.io instance
export const getIO = () => io;

export default SocketHandler;
