import React, { useEffect, useState, useRef } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';
import io from 'socket.io-client';

function StudentMonitoring({ activeStudents }) {
  const { t } = useTranslation();
  const [connectedStudents, setConnectedStudents] = useState(activeStudents || []);
  const [studentCounters, setStudentCounters] = useState(new Map());
  const socketRef = useRef(null);
  const lastUpdateRef = useRef(new Map());
  const timerIntervalRef = useRef(null);
  const throttleTimeout = useRef(null);
  const pendingUpdates = useRef(new Map());

  // Add timer effect to countdown timeRemaining
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setConnectedStudents(prevStudents => 
        prevStudents.map(student => ({
          ...student,
          timeRemaining: student.timeRemaining > 0 ? student.timeRemaining - 1 : 0
        }))
      );
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Handle individual student updates
    socket.on('student-status-update', (updatedStudent) => {
      setConnectedStudents(prevStudents => {
        const studentIndex = prevStudents.findIndex(s => s.id === updatedStudent.id);
        if (studentIndex === -1) {
          return [...prevStudents, updatedStudent];
        }
        const newStudents = [...prevStudents];
        newStudents[studentIndex] = {
          ...newStudents[studentIndex],
          ...updatedStudent
        };
        return newStudents;
      });
    });

    // Handle full updates
    socket.on('activeStudents', (students) => {
      setConnectedStudents(students);
    });

    // Request initial state
    socket.emit('getInitialState');

    // Poll for updates more frequently
    const updateInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('getActiveStudents');
      }
    }, 2000); // Every 2 seconds

    return () => {
      clearInterval(updateInterval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      polling: { interval: 2000 },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('getActiveStudents');
      socket.emit('getStudentCounters');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    let lastUpdate = Date.now();
    socket.on('activeStudents', (students) => {
      const now = Date.now();
      if (now - lastUpdate >= 2000) {
        console.log('Received students update:', students);
        setConnectedStudents(prevStudents => {
          const existingStudentsMap = new Map(
            prevStudents.map(student => [student.id, { ...student }])
          );

          const mergedStudents = students.map(newStudent => {
            const existingStudent = existingStudentsMap.get(newStudent.id);
            const now = Date.now();
            
            if (!existingStudent) {
              lastUpdateRef.current.set(newStudent.id, now);
              return {
                ...newStudent,
                timeRemaining: newStudent.timeRemaining || 30 * 60,
                status: socket.connected ? 'connected' : 'disconnected'
              };
            }

            let status = socket.connected ? newStudent.status : 'disconnected';
            const lastUpdate = lastUpdateRef.current.get(newStudent.id) || 0;
            if (now - lastUpdate >= 5000) {
              lastUpdateRef.current.set(newStudent.id, now);
            }

            let timeRemaining = existingStudent.timeRemaining;
            if (existingStudent.currentQuiz !== newStudent.currentQuiz) {
              timeRemaining = newStudent.timeRemaining || 30 * 60;
            }

            return {
              ...newStudent,
              timeRemaining,
              status
            };
          });

          mergedStudents.sort((a, b) => a.name.localeCompare(b.name));
          return mergedStudents;
        });
        lastUpdate = now;
      }
    });

    socket.on('studentCounters', (counters) => {
      const counterMap = new Map(
        counters.map(counter => [counter.studentName, counter])
      );
      setStudentCounters(counterMap);
    });

    const pollInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('getActiveStudents');
      }
    }, 10000);

    const counterInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('getStudentCounters');
      }
    }, 10000);

    return () => {
      lastUpdateRef.current.clear();
      clearInterval(pollInterval);
      clearInterval(counterInterval);
      socket.disconnect();
    };
  }, []);

  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add CSS to reduce visual flickering
  const tableStyle = {
    transition: 'all 0.5s ease',
  };

  const rowStyle = {
    transition: 'all 0.5s ease',
  };

  const calculateProgress = (student) => {
    if (!student.submissions || !student.submissions.length) return {
      totalAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalQuestions: 0
    };
    
    const currentSubmission = student.submissions.find(
      sub => sub.quizId === student.currentQuiz
    );
    
    if (!currentSubmission) return {
      totalAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalQuestions: 0
    };

    const totalAnswered = currentSubmission.answers.length;
    const correctAnswers = currentSubmission.answers.filter(a => a.isCorrect).length;
    const wrongAnswers = totalAnswered - correctAnswers;

    return {
      totalAnswered,
      correctAnswers,
      wrongAnswers,
      totalQuestions: currentSubmission.totalQuestions
    };
  };

  const getActivityStatus = (student) => {
    if (!student.activity) return 'disconnected';
    const { isPageActive, isBrowserActive } = student.activity;
    if (!isPageActive) return 'tab_switched';
    if (!isBrowserActive) return 'window_inactive';
    return 'fully_active';
  };

  return (
    <Card>
      <Card.Body>
        <h3>{t('student.monitoring.title')}</h3>
        <Table responsive style={tableStyle}>
          <thead>
            <tr>
              <th>{t('student.monitoring.name')}</th>
              <th>{t('student.monitoring.status')}</th>
              <th>{t('student.monitoring.activity')}</th>
              <th>{t('student.monitoring.currentQuiz')}</th>
              <th>{t('student.monitoring.timeRemaining')}</th>
              <th>{t('student.monitoring.progress')}</th>
            </tr>
          </thead>
          <tbody>
            {connectedStudents.map((student, index) => {
              const counterData = studentCounters.get(student.name);
              const progressStats = calculateProgress(student);
              const activityStatus = getActivityStatus(student);
              
              return (
                <tr 
                  key={student.id || index}
                  style={rowStyle}
                >
                  <td>{student.name}</td>
                  <td>
                    <Badge 
                      bg={student.status === 'connected' ? 'success' : 'danger'}
                    >
                      {t(`student.monitoring.${student.status}`)}
                    </Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={
                        activityStatus === 'fully_active' ? 'success' : 
                        activityStatus === 'tab_switched' ? 'warning' : 'danger'
                      }
                    >
                      {t(`student.monitoring.${activityStatus}`)}
                    </Badge>
                  </td>
                  <td>{student.currentQuiz || 'N/A'}</td>
                  <td>{formatTime(student.timeRemaining)}</td>
                  <td>
                    {counterData ? (
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg="primary">
                          {t('student.monitoring.correctAnswers')}: {counterData.correctAnswers || 0} / {counterData.totalQuestions || 10}
                        </Badge>
                        <Badge bg="info">
                          {t('student.monitoring.totalAnswers')}: {counterData.totalAnswers || 0} / {counterData.totalQuestions || 10} {' '}
                          {!isNaN(counterData.totalAnswers) ? 
                            `(${Math.round(((counterData.totalAnswers || 0) / (counterData.totalQuestions || 10)) * 100)}%)` : 
                            '(0%)'
                          }
                        </Badge>
                      </div>
                    ) : (
                      <Badge bg="secondary">0 / 10 (0%)</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default StudentMonitoring;