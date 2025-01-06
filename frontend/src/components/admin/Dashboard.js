import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { useNavigate, Routes, Route } from 'react-router-dom';
import QuizManagement from './QuizManagement';
import StudentMonitoring from './StudentMonitoring';
import socket from '../../services/socket';
import api from '../../services/api';

function Dashboard() {
  const [activeStudents, setActiveStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    
    socket.on('student-status-update', (data) => {
      setActiveStudents(prev => {
        const index = prev.findIndex(s => s.name === data.studentName);
        if (index === -1 && data.status === 'connected') {
          return [...prev, { name: data.studentName, status: data.status }];
        } else if (index !== -1) {
          const newStudents = [...prev];
          if (data.status === 'disconnected') {
            newStudents.splice(index, 1);
          } else {
            newStudents[index].status = data.status;
          }
          return newStudents;
        }
        return prev;
      });
    });

    socket.on('student-attempted-leave', (data) => {
      // Handle student attempt to leave notification
      console.warn(`Student ${data.studentName} attempted to leave the quiz`);
    });

    fetchQuizzes();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quiz');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const exportResults = async () => {
    try {
      const response = await api.get('/quiz/results/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'quiz_results.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  return (
    <Container fluid className="py-3">
      <Row>
        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <div className="d-grid gap-2">
                <Button onClick={() => navigate('/admin/quiz/new')}>Create New Quiz</Button>
                <Button onClick={exportResults}>Export Results</Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mt-3">
            <Card.Body>
              <Card.Title>Active Students</Card.Title>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map((student, index) => (
                    <tr key={index}>
                      <td>{student.name}</td>
                      <td>{student.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9}>
          <Routes>
            <Route path="/" element={<QuizManagement quizzes={quizzes} onQuizUpdate={fetchQuizzes} />} />
            <Route path="/monitoring" element={<StudentMonitoring activeStudents={activeStudents} />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;