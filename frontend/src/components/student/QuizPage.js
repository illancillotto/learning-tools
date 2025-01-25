import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, ProgressBar, Alert } from 'react-bootstrap';
import api from '../../services/api';
import socket, { connectSocket, disconnectSocket } from '../../services/socket';
import io from 'socket.io-client';

function QuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const { quizId } = useParams();
  const navigate = useNavigate();
  const progressInterval = useRef(null);
  const [isPageActive, setIsPageActive] = useState(true);
  const [isBrowserActive, setIsBrowserActive] = useState(true);
  const lastProgress = useRef(0);
  const lastTimeLeft = useRef(null);
  const updateQueue = useRef({
    progress: null,
    activity: null,
    timeRemaining: null
  });
  const updateInterval = useRef(null);
  
  const handleSubmitQuiz = useCallback(async () => {
    try {
      await api.post(`/quiz/${quizId}/submit`, {
        studentName: sessionStorage.getItem('studentName')
      });
      
      disconnectSocket();
      navigate('/feedback');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setConnectionError('Failed to submit quiz. Please try again.');
    }
  }, [quizId, navigate]);

  // Socket connection and event handlers
  useEffect(() => {
    let isSubscribed = true;

    const setupSocket = () => {
      if (!socket.connected) {
        connectSocket();
      }

      socket.removeAllListeners('connect');
      socket.removeAllListeners('connect_error');
      socket.removeAllListeners('join-acknowledged');

      socket.on('connect', () => {
        if (!isSubscribed) return;
        console.log('Connected to socket server');
        setConnectionError(null);
        
        // Join as student with activity status
        socket.emit('student-joined', {
          studentName: sessionStorage.getItem('studentName'),
          quizId,
          timeLimit: quiz?.timeLimit * 60,
          activity: {
            isPageActive: document.visibilityState === 'visible',
            isBrowserActive: document.hasFocus()
          }
        });
      });

      socket.on('connect_error', (error) => {
        if (!isSubscribed) return;
        console.log('Socket connection error:', error);
        setConnectionError('Connection lost. Attempting to reconnect...');
      });

      socket.on('join-acknowledged', (data) => {
        if (!isSubscribed) return;
        console.log('Join acknowledged:', {
          ...data,
          activity: {
            isPageActive: document.visibilityState === 'visible',
            isBrowserActive: document.hasFocus()
          },
          timestamp: new Date().toISOString()
        });
      });

      // Handle visibility change
      const handleVisibilityChange = () => {
        const isVisible = document.visibilityState === 'visible';
        setIsPageActive(isVisible);
        queueActivityUpdate();
        
        console.log('Visibility changed:', {
          isPageActive: isVisible,
          isBrowserActive: document.hasFocus(),
          timestamp: new Date().toISOString()
        });
      };

      // Handle window focus/blur
      const handleWindowFocus = () => {
        setIsBrowserActive(true);
        queueActivityUpdate();
        
        console.log('Window focused:', {
          isPageActive: document.visibilityState === 'visible',
          isBrowserActive: true,
          timestamp: new Date().toISOString()
        });
      };

      const handleWindowBlur = () => {
        setIsBrowserActive(false);
        queueActivityUpdate();
        
        console.log('Window blurred:', {
          isPageActive: document.visibilityState === 'visible',
          isBrowserActive: false,
          timestamp: new Date().toISOString()
        });
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('blur', handleWindowBlur);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
      };
    };

    const cleanup = setupSocket();

    // Prevent leaving the page
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      
      if (socket.connected) {
        socket.emit('student-attempted-leave', {
          studentName: sessionStorage.getItem('studentName'),
          quizId,
          reason: 'page_close',
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Start progress updates after connection
    progressInterval.current = setInterval(() => {
      if (socket.connected && quiz) {
        const progress = (Object.keys(answers).length / quiz.questions.length) * 100;
        // Only emit if there's been a change in progress or time
        if (progress !== lastProgress.current || timeLeft !== lastTimeLeft.current) {
          socket.emit('student-progress-update', {
            progress,
            timeRemaining: timeLeft,
            isPageActive,
            isBrowserActive
          });
          lastProgress.current = progress;
          lastTimeLeft.current = timeLeft;
        }
      }
    }, 10000);

    return () => {
      isSubscribed = false;
      socket.removeAllListeners('connect');
      socket.removeAllListeners('connect_error');
      socket.removeAllListeners('join-acknowledged');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (cleanup) cleanup();
      disconnectSocket();
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [quizId, answers, timeLeft, quiz, isPageActive, isBrowserActive]);

  // Optimize activity status updates
  useEffect(() => {
    let activityTimeout;
    
    const emitActivityStatus = () => {
      if (socket.connected) {
        socket.emit('student-activity-status', {
          studentName: sessionStorage.getItem('studentName'),
          quizId,
          isPageActive,
          isBrowserActive,
          timestamp: Date.now()
        });
      }
    };

    // Debounce activity status updates
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(emitActivityStatus, 10000);

    return () => clearTimeout(activityTimeout);
  }, [isPageActive, isBrowserActive, quizId]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const studentName = sessionStorage.getItem('studentName');
        if (!studentName) {
          console.error('No student name found');
          navigate('/');
          return;
        }

        const response = await api.get(`/quiz/exec/${quizId}/student`, {
          params: { studentName }
        });
        
        if (!response.data || !response.data.questions || response.data.questions.length === 0) {
          console.error('Invalid quiz data received');
          navigate('/');
          return;
        }

        setQuiz(response.data);
        setTimeLeft(response.data.timeLimit * 60);
        
        const initialAnswers = {};
        response.data.questions.forEach((_, index) => {
          initialAnswers[index] = '';
        });
        setAnswers(initialAnswers);
        
      } catch (error) {
        console.error('Error fetching quiz:', error);
        navigate('/');
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitQuiz]);

  // Consolidated socket update effect
  useEffect(() => {
    const sendBatchedUpdates = () => {
      if (!socket.connected || !quiz) return;

      const updates = updateQueue.current;
      
      // Only send if we have updates queued
      if (updates.progress !== null || updates.activity !== null || updates.timeRemaining !== null) {
        socket.emit('student-updates', {
          studentName: sessionStorage.getItem('studentName'),
          quizId,
          ...updates,
          timestamp: Date.now()
        });
        
        // Clear the queue
        updateQueue.current = {
          progress: null,
          activity: null,
          timeRemaining: null
        };
      }
    };

    // Set up periodic update sender
    updateInterval.current = setInterval(sendBatchedUpdates, 15000);

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [quizId, quiz]);

  // Queue progress update instead of sending immediately
  const queueProgressUpdate = useCallback(() => {
    if (!quiz) return;
    
    const progress = (Object.keys(answers).length / quiz.questions.length) * 100;
    if (progress !== lastProgress.current) {
      updateQueue.current.progress = progress;
      lastProgress.current = progress;
    }
  }, [quiz, answers]);

  // Queue activity update instead of sending immediately
  const queueActivityUpdate = useCallback(() => {
    updateQueue.current.activity = {
      isPageActive,
      isBrowserActive
    };
  }, [isPageActive, isBrowserActive]);

  // Update the visibility handlers to use queue
  const handleVisibilityChange = useCallback(() => {
    const isVisible = document.visibilityState === 'visible';
    setIsPageActive(isVisible);
    queueActivityUpdate();
  }, [queueActivityUpdate]);

  const handleWindowFocus = useCallback(() => {
    setIsBrowserActive(true);
    queueActivityUpdate();
  }, [queueActivityUpdate]);

  const handleWindowBlur = useCallback(() => {
    setIsBrowserActive(false);
    queueActivityUpdate();
  }, [queueActivityUpdate]);

  // Update answer change handler
  const handleAnswerChange = useCallback(async (answer) => {
    try {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion]: answer
      }));
      
      const questionId = quiz.questions[currentQuestion].id;
      await api.post(`/quiz/${quizId}/answer`, {
        questionId,
        answer,
        studentName: sessionStorage.getItem('studentName')
      });

      queueProgressUpdate();
    } catch (error) {
      console.error('Error saving answer:', error);
      setConnectionError('Failed to save answer. Please try again.');
    }
  }, [currentQuestion, quizId, quiz, queueProgressUpdate]);

  if (!quiz) return <div>Loading...</div>;

  return (
    <Container className="py-4">
      {(!isPageActive || !isBrowserActive) && (
        <Alert variant="warning" className="mb-3">
          Warning: Please keep this quiz window active and in focus!
        </Alert>
      )}
      {connectionError && (
        <Alert variant="danger" className="mb-3">
          {connectionError}
        </Alert>
      )}
      <Card>
        <Card.Body>
          <ProgressBar 
            now={(timeLeft / (quiz.timeLimit * 60)) * 100} 
            label={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
          />
          <h3 className="mt-3">{quiz.questions[currentQuestion].text}</h3>
          
          {quiz.questions[currentQuestion].type === 'multiple-choice' ? (
            quiz.questions[currentQuestion].options.map((option, index) => (
              <Form.Check
                key={index}
                type="radio"
                label={option}
                name="answer"
                value={option}
                checked={answers[currentQuestion] === option}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="mb-2"
              />
            ))
          ) : (
            <Form.Control
              as="textarea"
              rows={3}
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          )}

          <div className="d-flex justify-content-between mt-4">
            <Button 
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button variant="success" onClick={handleSubmitQuiz}>
                Submit Quiz
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={currentQuestion === quiz.questions.length - 1}
              >
                Next
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default QuizPage;