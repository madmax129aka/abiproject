const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const { checkSpam } = require('./spam');

const setupSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(`user-${socket.userId}`);

    socket.on('join-match', (matchId) => {
      socket.join(`match-${matchId}`);
    });

    socket.on('leave-match', (matchId) => {
      socket.leave(`match-${matchId}`);
    });

    socket.on('send-message', async (data) => {
      try {
        const { matchId, receiverId, content, type, resourceUrl } = data;
        const spamCheck = checkSpam(content);

        const message = await Message.create({
          matchId: parseInt(matchId),
          senderId: socket.userId,
          receiverId: parseInt(receiverId),
          content,
          type: type || 'text',
          resourceUrl,
          isSpam: spamCheck.isSpam
        });

        const sender = await User.findByPk(socket.userId, {
          attributes: ['id', 'fullName']
        });

        const populatedMessage = {
          ...message.toJSON(),
          _id: message.id,
          senderId: { _id: sender.id, fullName: sender.fullName },
          receiverId: { _id: receiverId }
        };

        io.to(`match-${matchId}`).emit('new-message', populatedMessage);
        io.to(`user-${receiverId}`).emit('message-notification', {
          matchId, senderId: socket.userId,
          preview: content.substring(0, 50)
        });

        if (spamCheck.isSpam) {
          socket.emit('spam-warning', {
            message: 'Your message was flagged as spam.',
            reason: spamCheck.reason
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });


    socket.on('typing', (data) => {
      socket.to(`match-${data.matchId}`).emit('user-typing', { userId: socket.userId, matchId: data.matchId });
    });

    socket.on('stop-typing', (data) => {
      socket.to(`match-${data.matchId}`).emit('user-stop-typing', { userId: socket.userId, matchId: data.matchId });
    });

    socket.on('read-messages', async (data) => {
      try {
        await Message.update({ readAt: new Date() }, { where: { matchId: parseInt(data.matchId), receiverId: socket.userId, readAt: null } });
        io.to(`match-${data.matchId}`).emit('messages-read', { userId: socket.userId, matchId: data.matchId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = { setupSocket };
