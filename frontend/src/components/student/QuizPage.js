import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, ProgressBar } from 'react-bootstrap';
import api from '../../services/api';
import { io } from 'socket.io-client';

function QuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const handleSubmitQuiz = useCallback(async () => {
    try {
      await api.post(`/quiz/${quizId}/submit`, {
        answers,
        studentName: sessionStorage.getItem('studentName')
      });
      navigate('/feedback');
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }, [quizId, answers, navigate]);

  useEffect(() => {
    // Prevent leaving the page
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Notify admin through socket that student tried to leave
        socket.emit('student-attempted-leave', {
          studentName: sessionStorage.getItem('studentName'),
          quizId
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Socket connection
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Join as student
    socket.emit('student-joined', {
      studentName: sessionStorage.getItem('studentName'),
      quizId,
      timeLimit: quiz?.timeLimit * 60
    });

    // Send progress updates more frequently
    const progressInterval = setInterval(() => {
      if (socket.connected && quiz) {
        const progress = (Object.keys(answers).length / quiz.questions.length) * 100;
        socket.emit('student-progress-update', {
          progress,
          timeRemaining: timeLeft
        });
      }
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(progressInterval);
      socket.disconnect();
    };
  }, [quizId, answers, timeLeft, quiz]);

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

  const handleAnswerChange = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));

    // Auto-save answer
    api.post(`/quiz/${quizId}/answer`, {
      questionId: quiz.questions[currentQuestion].id,
      answer,
      studentName: sessionStorage.getItem('studentName')
    });
  };

  if (!quiz) return <div>Loading...</div>;

  return (
    <Container className="py-4">
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
                checked={answers[currentQuestion] === option}
                onChange={() => handleAnswerChange(option)}
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