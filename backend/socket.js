const { Server } = require('socket.io');
const StudentSubmission = require('./models/Student');
const os = require('os');

// Add monitoring variables
let pollCount = 0;
let lastPollTime = Date.now();
let connectionCount = 0;

// Get server IP address
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost'; // Fallback to localhost
}

// Add this before module.exports
const SERVER_IP = getServerIP();
console.log('Server running on IP:', SERVER_IP);

let io;
let activeStudents = new Map();
let studentSockets = new Map();
let pendingUpdates = new Map();
let updateInterval;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
      },
      pingTimeout: 30000,
      pingInterval: 10000,
      transports: ['websocket'],
      connectTimeout: 10000,
      maxHttpBufferSize: 1e6,
      serveClient: false
    });

    // Monitor connection events
    io.engine.on('connection', (socket) => {
      connectionCount++;
      console.log(`New transport connection (${connectionCount} total)`);
      
      socket.on('polling', () => {
        pollCount++;
        const now = Date.now();
        console.log(`Poll #${pollCount}, interval: ${now - lastPollTime}ms`);
        lastPollTime = now;
      });
    });

    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle student updates more frequently
      socket.on('student-updates', (data) => {
        try {
          const studentId = data.studentName;
          if (!studentId) return;

          const existingStudent = activeStudents.get(studentId);
          if (existingStudent) {
            const updatedStudent = {
              ...existingStudent,
              ...data,
              lastUpdate: Date.now(),
              activity: {
                isPageActive: data.isPageActive,
                isBrowserActive: data.isBrowserActive
              },
              status: 'connected'
            };
            activeStudents.set(studentId, updatedStudent);
            
            // Broadcast update immediately
            io.emit('student-status-update', updatedStudent);
          }
        } catch (error) {
          console.error('Error processing student updates:', error);
        }
      });

      socket.on('student-joined', (data) => {
        try {
          const studentId = data.studentName;
          const { isPageActive, isBrowserActive } = data.activity || { 
            isPageActive: true, 
            isBrowserActive: true 
          };
          
          console.log(`Student Join: ${studentId}`, {
            isPageActive,
            isBrowserActive,
            timestamp: new Date().toISOString()
          });

          // Check if student is already connected
          if (activeStudents.has(studentId)) {
            const existingStudent = activeStudents.get(studentId);
            if (existingStudent.socketId !== socket.id) {
              existingStudent.socketId = socket.id;
              existingStudent.activity = { isPageActive, isBrowserActive };
              existingStudent.lastUpdate = Date.now();
              activeStudents.set(studentId, existingStudent);
              
              socket.emit('join-acknowledged', { 
                success: true, 
                reconnected: true,
                activity: { isPageActive, isBrowserActive }
              });
              return;
            }
            return;
          }
          
          // New student connection
          activeStudents.set(studentId, {
            id: studentId,
            name: data.studentName,
            status: 'connected',
            currentQuiz: data.quizId,
            timeRemaining: data.timeLimit,
            lastUpdate: Date.now(),
            socketId: socket.id,
            activity: { isPageActive, isBrowserActive }
          });

          studentSockets.set(socket.id, studentId);
          socket.emit('join-acknowledged', { 
            success: true, 
            new: true,
            activity: { isPageActive, isBrowserActive }
          });
        } catch (error) {
          console.error('Error in student-joined:', error);
          socket.emit('join-acknowledged', { 
            success: false, 
            error: error.message 
          });
        }
      });

      // More frequent status checks
      const statusInterval = setInterval(() => {
        const now = Date.now();
        activeStudents.forEach((student, studentId) => {
          if (now - student.lastUpdate > 5000) { // 5 seconds threshold
            student.status = 'disconnected';
            io.emit('student-status-update', student);
          }
        });
      }, 2000); // Check every 2 seconds

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        clearInterval(statusInterval);
        const studentId = studentSockets.get(socket.id);
        if (studentId) {
          const student = activeStudents.get(studentId);
          if (student) {
            student.status = 'disconnected';
            activeStudents.set(studentId, student);
            io.emit('student-status-update', student);
          }
          studentSockets.delete(socket.id);
        }
      });

      // Simplified counter fetching
      socket.on('getStudentCounters', async () => {
        try {
          const submissions = await StudentSubmission.find({ 
            status: 'in-progress' 
          }).select('studentName answers totalQuestions');

          const studentCounters = submissions.map(sub => ({
            studentName: sub.studentName,
            totalAnswers: sub.answers.length,
            correctAnswers: sub.answers.filter(a => a.isCorrect).length,
            totalQuestions: sub.totalQuestions || 10
          }));

          socket.emit('studentCounters', studentCounters);
        } catch (error) {
          console.error('Error fetching student counters:', error);
        }
      });
    });

    // Broadcast all students status periodically
    setInterval(() => {
      io.emit('activeStudents', Array.from(activeStudents.values()));
    }, 3000); // Every 3 seconds

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  cleanup: () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    pendingUpdates.clear();
    activeStudents.clear();
    studentSockets.clear();
  },

  // Add monitoring methods
  getStats: () => ({
    connections: connectionCount,
    pollCount,
    lastPollTime,
    activeStudents: activeStudents.size,
    pendingUpdates: pendingUpdates.size
  })
};