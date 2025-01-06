const { Server } = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('student-joined', (data) => {
        socket.join(data.quizId);
        io.emit('student-status-update', {
          studentName: data.studentName,
          status: 'connected'
        });
      });

      socket.on('student-attempted-leave', (data) => {
        io.to(data.quizId).emit('student-attempted-leave', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};