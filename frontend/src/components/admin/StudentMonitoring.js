import React, { useEffect, useState, useRef } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';
import io from 'socket.io-client';

function StudentMonitoring({ activeStudents }) {
  const { t } = useTranslation();
  const [connectedStudents, setConnectedStudents] = useState(activeStudents || []);
  const lastUpdateRef = useRef(new Map());
  const timerIntervalRef = useRef(null);

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
      transports: ['polling'],
      polling: { interval: 1000 },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socket.on('activeStudents', (students) => {
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
              timeRemaining: newStudent.timeRemaining || 30 * 60 // Convert to seconds if not set
            };
          }

          // Handle status changes with debounce
          let status = newStudent.status;
          if (newStudent.status !== existingStudent.status) {
            const lastUpdate = lastUpdateRef.current.get(newStudent.id) || 0;
            if (now - lastUpdate < 5000) {
              status = existingStudent.status;
            } else {
              lastUpdateRef.current.set(newStudent.id, now);
            }
          }

          // Handle time changes
          let timeRemaining = existingStudent.timeRemaining;
          if (existingStudent.currentQuiz !== newStudent.currentQuiz) {
            // Only reset time if quiz changed
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
    });

    const pollInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('getActiveStudents');
      }
    }, 5000);

    return () => {
      lastUpdateRef.current.clear();
      clearInterval(pollInterval);
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
    if (!student.submissions || !student.submissions.length) return 0;
    
    const currentSubmission = student.submissions.find(
      sub => sub.quizId === student.currentQuiz
    );
    
    if (!currentSubmission) return 0;

    const answeredQuestions = currentSubmission.answers.length;
    const totalQuestions = currentSubmission.totalQuestions;
    const correctAnswers = currentSubmission.answers.filter(a => a.isCorrect).length;

    return {
      progress: Math.round((answeredQuestions / totalQuestions) * 100),
      correctAnswers,
      totalAnswered: answeredQuestions,
      totalQuestions
    };
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
              <th>{t('student.monitoring.currentQuiz')}</th>
              <th>{t('student.monitoring.timeRemaining')}</th>
              <th>{t('student.monitoring.progress')}</th>
            </tr>
          </thead>
          <tbody>
            {connectedStudents.map((student, index) => {
              const progressStats = calculateProgress(student);
              
              return (
                <tr 
                  key={student.id || index}
                  style={rowStyle}
                >
                  <td>{student.name}</td>
                  <td>
                    <Badge 
                      bg={student.status === 'connected' ? 'success' : 'danger'}
                      style={{ transition: 'all 0.5s ease' }}
                    >
                      {t(`student.monitoring.${student.status}`)}
                    </Badge>
                  </td>
                  <td>{student.currentQuiz || 'N/A'}</td>
                  <td>{formatTime(student.timeRemaining)}</td>
                  <td>
                    {progressStats.totalQuestions > 0 ? (
                      <div>
                        <div className="progress mb-2">
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ 
                              width: `${progressStats.progress}%`,
                              transition: 'all 0.5s ease',
                              backgroundColor: '#007bff'
                            }}
                            aria-valuenow={progressStats.progress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {progressStats.progress}%
                          </div>
                        </div>
                        <small className="text-muted">
                          {t('student.monitoring.answers', {
                            correct: progressStats.correctAnswers,
                            total: progressStats.totalAnswered,
                            questions: progressStats.totalQuestions
                          })}
                        </small>
                      </div>
                    ) : (
                      'N/A'
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