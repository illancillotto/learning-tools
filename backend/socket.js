const { Server } = require('socket.io');

let io;
let activeStudents = new Map(); // Track active students
let studentSockets = new Map(); // Track socket to student mapping

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000, // Increase ping timeout
      pingInterval: 25000 // Increase ping interval
    });

    io.on('connection', (socket) => {
      //console.log('New connection:', socket.id);

      socket.on('student-joined', (data) => {
        //console.log('Student joined:', data);
        const studentId = data.studentName; // Use student name as unique identifier
        
        // Store student data
        activeStudents.set(studentId, {
          id: studentId,
          name: data.studentName,
          status: 'connected',
          currentQuiz: data.quizId,
          timeRemaining: data.timeLimit,
          progress: 0,
          lastUpdate: Date.now()
        });

        // Map socket to student
        studentSockets.set(socket.id, studentId);
        
        // Broadcast updated list
        io.emit('activeStudents', Array.from(activeStudents.values()));
      });

      socket.on('student-progress-update', (data) => {
        const studentId = studentSockets.get(socket.id);
        if (studentId && activeStudents.has(studentId)) {
          const student = activeStudents.get(studentId);
          student.progress = data.progress;
          student.timeRemaining = data.timeRemaining;
          student.lastUpdate = Date.now();
          activeStudents.set(studentId, student);
          io.emit('activeStudents', Array.from(activeStudents.values()));
        }
      });

      socket.on('getActiveStudents', () => {
        // Clean up stale students (no updates for more than 10 seconds)
        const now = Date.now();
        for (const [studentId, student] of activeStudents.entries()) {
          if (now - student.lastUpdate > 10000) {
            activeStudents.delete(studentId);
          }
        }
        socket.emit('activeStudents', Array.from(activeStudents.values()));
      });

      socket.on('disconnect', () => {
        //console.log('Disconnected:', socket.id);
        const studentId = studentSockets.get(socket.id);
        if (studentId) {
          // Don't immediately remove the student, just update their status
          const student = activeStudents.get(studentId);
          if (student) {
            student.status = 'disconnected';
            student.lastUpdate = Date.now();
            activeStudents.set(studentId, student);
            io.emit('activeStudents', Array.from(activeStudents.values()));
          }
          studentSockets.delete(socket.id);
        }
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