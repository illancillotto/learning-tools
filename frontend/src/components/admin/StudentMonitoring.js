import React, { useEffect, useState, useRef } from 'react';
import { Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';
import io from 'socket.io-client';

function StudentMonitoring({ activeStudents, quizzes }) {
  const { t } = useTranslation();
  const [connectedStudents, setConnectedStudents] = useState(activeStudents || []);
  const [studentCounters, setStudentCounters] = useState(new Map());
  const socketRef = useRef(null);
  const lastUpdateRef = useRef(new Map());
  const timerIntervalRef = useRef(null);
  const throttleTimeout = useRef(null);
  const pendingUpdates = useRef(new Map());
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);

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

  const getQuizName = (quizId) => {
    const quiz = quizzes?.find(q => q._id === quizId);
    return quiz ? quiz.title : 'N/A';
  };

  const handleViewAnswers = async (student) => {
    try {
      setIsLoadingSubmission(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/submissions/student/${student.name}?quizId=${student.currentQuiz}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submission details');
      }

      const data = await response.json();
      setSubmissionDetails(data);
      setShowAnswersModal(true);
    } catch (error) {
      console.error('Error fetching submission details:', error);
      alert(t('student.monitoring.errors.fetchSubmissionFailed'));
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  const handleViewSubmissionDetails = async (student) => {
    try {
      setIsLoadingSubmission(true);
      setSelectedStudent(student);
      
      // Match the exact route from studentRoutes.js
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const url = `${baseUrl}/api/student/${student.name}/submission?quizId=${student.currentQuiz}`;
      
      console.log('Fetching from URL:', url); // Debug log
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Submission details:', data); // Debug log
      
      setSubmissionDetails(data);
      setShowAnswersModal(true);
    } catch (error) {
      console.error('Error fetching submission details:', error);
      alert(t('student.monitoring.errors.fetchSubmissionFailed'));
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  return (
    <>
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
                <th>{t('student.monitoring.actions')}</th>
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
                    <td>{getQuizName(student.currentQuiz)}</td>
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
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="link"
                          className="text-decoration-none"
                          onClick={() => handleViewSubmissionDetails(student)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          {t('student.monitoring.viewAnswers')}
                        </Button>
                        <Button
                          variant="link"
                          className="text-decoration-none"
                          onClick={() => handleViewSubmissionDetails(student)}
                        >
                          <i className="bi bi-list-ul me-1"></i>
                          {t('student.monitoring.viewDetails')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Answers Modal */}
      <Modal
        show={showAnswersModal}
        onHide={() => {
          setShowAnswersModal(false);
          setSubmissionDetails(null);
        }}
        size="lg"
        className="answers-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-circle me-2"></i>
            {submissionDetails?.studentName} - {getQuizName(submissionDetails?.quizId)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {isLoadingSubmission ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            </div>
          ) : submissionDetails?.answers?.length > 0 ? (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4">{t('student.monitoring.answers.question')}</th>
                  <th className="px-4">{t('student.monitoring.answers.answer')}</th>
                  <th className="px-4">{t('student.monitoring.answers.status')}</th>
                  <th className="px-4">{t('student.monitoring.answers.time')}</th>
                </tr>
              </thead>
              <tbody>
                {submissionDetails.answers.map((answer, index) => (
                  <tr key={index}>
                    <td className="px-4">
                      {t('student.monitoring.answers.questionNumber', { number: index + 1 })}
                    </td>
                    <td className="px-4">{answer.answer}</td>
                    <td className="px-4">
                      <Badge bg={answer.isCorrect ? 'success' : 'danger'}>
                        {answer.isCorrect ? 
                          t('student.monitoring.answers.correct') : 
                          t('student.monitoring.answers.incorrect')
                        }
                      </Badge>
                    </td>
                    <td className="px-4">
                      {new Date(answer.submittedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light">
                <tr>
                  <td colSpan="4" className="px-4 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{t('student.monitoring.answers.totalAnswers')}:</strong> {submissionDetails.answers.length}/{submissionDetails.totalQuestions}
                      </div>
                      <div>
                        <strong>{t('student.monitoring.answers.correctAnswers')}:</strong> {submissionDetails.correctAnswers}/{submissionDetails.totalQuestions}
                        <span className="ms-2 text-muted">
                          ({Math.round((submissionDetails.correctAnswers / submissionDetails.totalQuestions) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </Table>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-secondary fs-1"></i>
              <p className="mt-3 text-secondary">
                {t('student.monitoring.answers.noAnswers')}
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default StudentMonitoring;