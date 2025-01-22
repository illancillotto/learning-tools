const { Server } = require('socket.io');
const StudentSubmission = require('./models/Student');

let io;
let activeStudents = new Map(); // Track active students
let studentSockets = new Map(); // Track socket to student mapping

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' 
          ? '*'  // Allow all origins in development
          : process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      path: '/socket.io/',
      connectTimeout: 20000,
      maxHttpBufferSize: 1e8, // 100 MB
      allowUpgrades: true,
      serveClient: false
    });

    // Debug connection issues
    io.engine.on('connection_error', (err) => {
      console.error('Connection error:', {
        type: err.type,
        message: err.message,
        context: err.context
      });
    });

    io.on('connection', (socket) => {
      console.log('New connection:', socket.id, 'Transport:', socket.conn.transport.name);

      // Handle transport change
      socket.conn.on('upgrade', (transport) => {
        console.log('Transport upgraded to:', transport.name);
      });

      socket.on('student-joined', (data) => {
        try {
          console.log('Student joined:', data);
          const studentId = data.studentName;
          
          activeStudents.set(studentId, {
            id: studentId,
            name: data.studentName,
            status: 'connected',
            currentQuiz: data.quizId,
            timeRemaining: data.timeLimit,
            progress: 0,
            lastUpdate: Date.now(),
            socketId: socket.id
          });

          studentSockets.set(socket.id, studentId);
          
          // Acknowledge the join
          socket.emit('join-acknowledged', { success: true });
          
          // Broadcast updated list
          io.emit('activeStudents', Array.from(activeStudents.values()));
        } catch (error) {
          console.error('Error in student-joined:', error);
          socket.emit('error', { message: 'Failed to join' });
        }
      });

      socket.on('student-progress-update', (data) => {
        try {
          const studentId = studentSockets.get(socket.id);
          if (studentId && activeStudents.has(studentId)) {
            const student = activeStudents.get(studentId);
            student.progress = data.progress;
            student.timeRemaining = data.timeRemaining;
            student.lastUpdate = Date.now();
            activeStudents.set(studentId, student);
            io.emit('activeStudents', Array.from(activeStudents.values()));
          }
        } catch (error) {
          console.error('Error in progress-update:', error);
        }
      });

      socket.on('getActiveStudents', () => {
        try {
          const now = Date.now();
          // Clean up stale students (no updates for more than 30 seconds)
          for (const [studentId, student] of activeStudents.entries()) {
            if (now - student.lastUpdate > 30000) {
              activeStudents.delete(studentId);
              console.log('Removed stale student:', studentId);
            }
          }
          socket.emit('activeStudents', Array.from(activeStudents.values()));
        } catch (error) {
          console.error('Error in getActiveStudents:', error);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
        try {
          const studentId = studentSockets.get(socket.id);
          if (studentId) {
            const student = activeStudents.get(studentId);
            if (student) {
              student.status = 'disconnected';
              student.lastUpdate = Date.now();
              activeStudents.set(studentId, student);
              io.emit('activeStudents', Array.from(activeStudents.values()));
            }
            studentSockets.delete(socket.id);
          }
        } catch (error) {
          console.error('Error in disconnect handler:', error);
        }
      });

      socket.on('getStudentCounters', async () => {
        try {
          // Get all in-progress submissions
          const submissions = await StudentSubmission.find({ 
            status: 'in-progress' 
          }).select('studentName answers totalQuestions');

          // Format the data for frontend
          const studentCounters = submissions.map(sub => ({
            studentName: sub.studentName,
            totalAnswers: sub.answers.length,
            correctAnswers: sub.answers.filter(a => a.isCorrect).length,
            totalQuestions: sub.totalQuestions || 10  // Fallback to 10 if not set
          }));

          socket.emit('studentCounters', studentCounters);
        } catch (error) {
          console.error('Error fetching student counters:', error);
        }
      });
    });

    // Periodic cleanup of disconnected sockets
    setInterval(() => {
      const now = Date.now();
      for (const [studentId, student] of activeStudents.entries()) {
        if (student.status === 'disconnected' && now - student.lastUpdate > 60000) {
          activeStudents.delete(studentId);
          console.log('Cleaned up disconnected student:', studentId);
        }
      }
    }, 30000);

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};