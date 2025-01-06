import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function FeedbackPage() {
  const navigate = useNavigate();

  return (
    <Container className="py-4">
      <Card>
        <Card.Body className="text-center">
          <h2>Quiz Submitted Successfully!</h2>
          <p>Thank you for completing the quiz.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FeedbackPage;