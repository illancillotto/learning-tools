import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../../services/api';
import { useTranslation } from '../../contexts/LanguageContext';

function LandingPage() {
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError(t('student.landing.nameRequired'));
      return;
    }
    
    try {
      console.log('Attempting to fetch active quiz...');
      const response = await api.get('/quiz/active');
      console.log('Active quiz response:', response.data);
      const activeQuiz = response.data;

      if (!activeQuiz) {
        console.error('No active quiz found');
        setError(t('student.landing.noActiveQuiz'));
        return;
      }

      console.log('Attempting to join quiz:', activeQuiz._id);
      await api.post('/student/join', {
        studentName: studentName.trim(),
        quizId: activeQuiz._id
      });

      sessionStorage.setItem('studentName', studentName.trim());
      navigate(`/quiz/${activeQuiz._id}`);
    } catch (error) {
      console.error('Detailed error:', error.response?.data || error.message);
      setError(t('student.landing.noActiveQuiz'));
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">{t('student.landing.title')}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('student.landing.enterName')}</Form.Label>
              <Form.Control
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={t('student.landing.enterName')}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              {t('student.landing.startButton')}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LandingPage;