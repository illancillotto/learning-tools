import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../../services/api';

function LandingPage() {
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      // Get the active quiz first
      const response = await api.get('/quiz/active');
      const activeQuiz = response.data;

      // Join the quiz
      await api.post('/student/join', {
        studentName: studentName.trim(),
        quizId: activeQuiz._id
      });

      // Store student name in sessionStorage
      sessionStorage.setItem('studentName', studentName.trim());
      
      // Navigate to the specific quiz
      navigate(`/quiz/${activeQuiz._id}`);
    } catch (error) {
      console.error('Error joining quiz:', error);
      setError('No active quiz available or error joining quiz');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Welcome to the Quiz</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Enter your name to begin</Form.Label>
              <Form.Control
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Your name"
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Start Quiz
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LandingPage;