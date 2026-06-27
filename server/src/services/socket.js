const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const { checkSpam } = require('./spam');

const setupSocket = (io) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user's personal room for notifications
    socket.join(`user-${socket.userId}`);

    // Join a match chat room
    socket.on('join-match', (matchId) => {
      socket.join(`match-${matchId}`);
      console.log(`User ${socket.userId} joined match room: ${matchId}`);
    });

    // Leave a match chat room
    socket.on('leave-match', (matchId) => {
      socket.leave(`match-${matchId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { matchId, receiverId, content, type, resourceUrl } = data;
        
        // Check for spam
        const spamCheck = checkSpam(content);
        
        const message = await Message.create({
          matchId,
          senderId: socket.userId,
          receiverId,
          content,
          type: type || 'text',
          resourceUrl,
          isSpam: spamCheck.isSpam
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'fullName')
          .populate('receiverId', 'fullName');

        // Emit to the match room
        io.to(`match-${matchId}`).emit('new-message', populatedMessage);

        // Notify receiver if they're not in the room
        io.to(`user-${receiverId}`).emit('message-notification', {
          matchId,
          senderId: socket.userId,
          preview: content.substring(0, 50)
        });

        if (spamCheck.isSpam) {
          socket.emit('spam-warning', { 
            message: 'Your message was flagged as potential spam.',
            reason: spamCheck.reason 
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { matchId } = data;
      socket.to(`match-${matchId}`).emit('user-typing', {
        userId: socket.userId,
        matchId
      });
    });

    // Stop typing indicator
    socket.on('stop-typing', (data) => {
      const { matchId } = data;
      socket.to(`match-${matchId}`).emit('user-stop-typing', {
        userId: socket.userId,
        matchId
      });
    });

    // Mark messages as read
    socket.on('read-messages', async (data) => {
      try {
        const { matchId } = data;
        
        await Message.updateMany(
          { matchId, receiverId: socket.userId, readAt: null },
          { readAt: new Date() }
        );

        io.to(`match-${matchId}`).emit('messages-read', {
          userId: socket.userId,
          matchId
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = { setupSocket };
