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
    const setupSocket = () => {
      // Connect socket
      connectSocket();

      // Socket event handlers
      socket.on('connect', () => {
        console.log('Connected to socket server');
        setConnectionError(null);
        
        // Join as student after successful connection
        socket.emit('student-joined', {
          studentName: sessionStorage.getItem('studentName'),
          quizId,
          timeLimit: quiz?.timeLimit * 60
        });
      });

      socket.on('connect_error', (error) => {
        console.log('Socket connection error:', error);
        setConnectionError('Connection lost. Attempting to reconnect...');
      });

      socket.on('join-acknowledged', (data) => {
        console.log('Join acknowledged:', data);
      });

      // Update server about student activity status
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

      // Handle visibility change
      const handleVisibilityChange = () => {
        const isVisible = document.visibilityState === 'visible';
        setIsPageActive(isVisible);
        
        if (!isVisible) {
          socket.emit('student-attempted-leave', {
            studentName: sessionStorage.getItem('studentName'),
            quizId,
            reason: 'tab_switch',
            timestamp: Date.now()
          });
        }
        
        emitActivityStatus();
      };

      // Handle window focus/blur
      const handleWindowFocus = () => {
        setIsBrowserActive(true);
        emitActivityStatus();
      };

      const handleWindowBlur = () => {
        setIsBrowserActive(false);
        socket.emit('student-attempted-leave', {
          studentName: sessionStorage.getItem('studentName'),
          quizId,
          reason: 'window_blur',
          timestamp: Date.now()
        });
        emitActivityStatus();
      };

      // Set up event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('blur', handleWindowBlur);

      // Initial status check
      setIsPageActive(document.visibilityState === 'visible');
      setIsBrowserActive(document.hasFocus());
      emitActivityStatus();

      // Start progress updates after connection
      progressInterval.current = setInterval(() => {
        if (socket.connected && quiz) {
          const progress = (Object.keys(answers).length / quiz.questions.length) * 100;
          socket.emit('student-progress-update', {
            progress,
            timeRemaining: timeLeft,
            isPageActive,
            isBrowserActive
          });
        }
      }, 2000);

      // Return cleanup function with references to the handlers
      return {
        handleVisibilityChange,
        handleWindowFocus,
        handleWindowBlur
      };
    };

    // Store the handlers returned from setupSocket
    const handlers = setupSocket();

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

    // Cleanup using the stored handlers
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handlers.handleVisibilityChange);
      window.removeEventListener('focus', handlers.handleWindowFocus);
      window.removeEventListener('blur', handlers.handleWindowBlur);
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      disconnectSocket();
    };
  }, [quizId, answers, timeLeft, quiz, isPageActive, isBrowserActive]);

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

  const handleAnswerChange = useCallback(async (answer) => {
    try {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion]: answer
      }));
      
      const questionId = quiz.questions[currentQuestion].id;
      const response = await api.post(`/quiz/${quizId}/answer`, {
        questionId,
        answer,
        studentName: sessionStorage.getItem('studentName')
      });

      if (response.data.progress && socket.connected) {
        socket.emit('student-progress-update', {
          progress: response.data.progress,
          timeRemaining: timeLeft
        });
      }

    } catch (error) {
      console.error('Error saving answer:', error);
      setConnectionError('Failed to save answer. Please try again.');
    }
  }, [currentQuestion, quizId, quiz, timeLeft]);

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