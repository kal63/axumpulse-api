'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { ConsultBooking, User } = require('./models');

// Store active rooms: roomId -> { bookingId, participants: Set<socketId> }
const activeRooms = new Map();

// Store socket to user mapping: socketId -> { userId, bookingId, roomId }
const socketUsers = new Map();

/**
 * Authenticate socket connection using JWT token
 */
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
}

/**
 * Setup Socket.io event handlers
 */
function setupSocketHandlers(io) {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.userId}`);

    // Handle joining a call room
    socket.on('join-room', async (data) => {
      try {
        const { bookingId, roomId } = data;
        const userId = socket.userId;

        if (!bookingId || !roomId) {
          socket.emit('error', { message: 'Missing bookingId or roomId' });
          return;
        }

        // Verify user has access to this booking
        const booking = await ConsultBooking.findOne({
          where: { id: bookingId, callRoomId: roomId },
          include: [
            { model: User, as: 'user', attributes: ['id', 'name'] },
            { model: require('./models').ConsultSlot, as: 'slot', attributes: ['id', 'providerId'] }
          ]
        });

        if (!booking) {
          socket.emit('error', { message: 'Booking not found or invalid room' });
          return;
        }

        // Check if user is either the patient or the medical professional
        const isPatient = booking.userId === userId;
        const isMedicalPro = booking.slot?.providerId === userId;

        if (!isPatient && !isMedicalPro) {
          socket.emit('error', { message: 'Unauthorized access to this booking' });
          return;
        }

        // Join the room
        socket.join(roomId);
        
        // Store socket info
        socketUsers.set(socket.id, { userId, bookingId, roomId });

        // Initialize or update room
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            bookingId,
            participants: new Set()
          });
        }
        activeRooms.get(roomId).participants.add(socket.id);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          userId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });

        // Send room info to the joining user
        const room = activeRooms.get(roomId);
        const otherParticipants = Array.from(room.participants)
          .filter(sid => sid !== socket.id)
          .map(sid => socketUsers.get(sid))
          .filter(Boolean);

        socket.emit('room-joined', {
          roomId,
          bookingId,
          participants: otherParticipants,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${userId} joined room ${roomId} for booking ${bookingId}`);
      } catch (error) {
        console.error('Error in join-room:', error);
        socket.emit('error', { message: 'Failed to join room', error: error.message });
      }
    });

    // Handle WebRTC offer
    socket.on('offer', (data) => {
      const { roomId, offer } = data;
      if (!roomId || !offer) {
        socket.emit('error', { message: 'Missing roomId or offer' });
        return;
      }

      // Forward offer to other participants in the room
      socket.to(roomId).emit('offer', {
        offer,
        from: socket.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle WebRTC answer
    socket.on('answer', (data) => {
      const { roomId, answer } = data;
      if (!roomId || !answer) {
        socket.emit('error', { message: 'Missing roomId or answer' });
        return;
      }

      // Forward answer to other participants in the room
      socket.to(roomId).emit('answer', {
        answer,
        from: socket.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
      const { roomId, candidate } = data;
      if (!roomId || !candidate) {
        socket.emit('error', { message: 'Missing roomId or candidate' });
        return;
      }

      // Forward ICE candidate to other participants in the room
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        from: socket.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
      try {
        const { roomId, message } = data;
        if (!roomId || !message || !message.trim()) {
          socket.emit('error', { message: 'Missing roomId or message' });
          return;
        }

        const userInfo = socketUsers.get(socket.id);
        if (!userInfo) {
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        // Broadcast message to all participants in the room (including sender)
        const messageData = {
          id: uuidv4(),
          message: message.trim(),
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        };

        io.to(roomId).emit('chat-message', messageData);
      } catch (error) {
        console.error('Error in chat-message:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // Handle call end
    socket.on('end-call', async (data) => {
      try {
        const { roomId } = data;
        const userInfo = socketUsers.get(socket.id);

        if (roomId && userInfo) {
          // Notify others in the room
          socket.to(roomId).emit('call-ended', {
            userId: socket.userId,
            timestamp: new Date().toISOString()
          });

          // Leave the room
          socket.leave(roomId);

          // Clean up room if empty
          if (activeRooms.has(roomId)) {
            const room = activeRooms.get(roomId);
            room.participants.delete(socket.id);
            
            if (room.participants.size === 0) {
              activeRooms.delete(roomId);
            }
          }

          // Update booking call status
          if (userInfo.bookingId) {
            await ConsultBooking.update(
              {
                callStatus: 'ended',
                callEndedAt: new Date()
              },
              { where: { id: userInfo.bookingId } }
            );
          }
        }

        socketUsers.delete(socket.id);
        console.log(`User ${socket.userId} ended call and left room`);
      } catch (error) {
        console.error('Error in end-call:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        const userInfo = socketUsers.get(socket.id);
        
        if (userInfo) {
          const { roomId, bookingId } = userInfo;

          // Notify others in the room
          if (roomId) {
            socket.to(roomId).emit('user-left', {
              userId: socket.userId,
              timestamp: new Date().toISOString()
            });

            // Clean up room
            if (activeRooms.has(roomId)) {
              const room = activeRooms.get(roomId);
              room.participants.delete(socket.id);
              
              if (room.participants.size === 0) {
                activeRooms.delete(roomId);
              }
            }
          }

          // Update booking if call was in progress
          if (bookingId) {
            const booking = await ConsultBooking.findByPk(bookingId);
            if (booking && booking.callStatus === 'in_progress') {
              await ConsultBooking.update(
                {
                  callStatus: 'ended',
                  callEndedAt: new Date()
                },
                { where: { id: bookingId } }
              );
            }
          }
        }

        socketUsers.delete(socket.id);
        console.log(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });
  });

  return io;
}

module.exports = { setupSocketHandlers, activeRooms, socketUsers };

