import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';

function FeedbackPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container className="py-4">
      <Card>
        <Card.Body className="text-center">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
          <h2 className="mt-3">Quiz Submitted Successfully!</h2>
          <p className="text-muted">Thank you for completing the quiz. Your answers have been saved.</p>
          <Button 
            variant="primary" 
            onClick={() => {
              sessionStorage.removeItem('studentName');
              navigate('/');
            }}
          >
            Return to Home
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FeedbackPage;