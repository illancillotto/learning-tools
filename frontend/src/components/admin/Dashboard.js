import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Nav } from 'react-bootstrap';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import QuizManagement from './QuizManagement';
import StudentMonitoring from './StudentMonitoring';
import socket from '../../services/socket';
import api from '../../services/api';

function Dashboard() {
  const [activeStudents, setActiveStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    
    socket.on('student-status-update', (data) => {
      setActiveStudents(prev => {
        const index = prev.findIndex(s => s.name === data.studentName);
        if (index === -1 && data.status === 'connected') {
          return [...prev, { 
            name: data.studentName, 
            status: data.status,
            currentQuiz: data.currentQuiz,
            timeRemaining: data.timeRemaining
          }];
        } else if (index !== -1) {
          const newStudents = [...prev];
          if (data.status === 'disconnected') {
            newStudents.splice(index, 1);
          } else {
            newStudents[index] = { ...newStudents[index], ...data };
          }
          return newStudents;
        }
        return prev;
      });
    });

    socket.on('student-attempted-leave', (data) => {
      // Show a more prominent notification
      const notification = new Notification('Student Attempted to Leave', {
        body: `${data.studentName} attempted to leave the quiz`,
        icon: '/favicon.ico'
      });
    });

    fetchQuizzes();
    return () => socket.disconnect();
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

  const handleCreateNewQuiz = () => {
    setActiveTab('quizzes');
    setShowQuizModal(true);
  };

  return (
    <Container fluid className="p-0">
      {/* Mobile Header */}
      <div className="d-md-none bg-white p-3 sticky-top border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Admin Dashboard</h4>
          <Button 
            variant="primary"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="rounded-circle p-2"
            style={{ width: '40px', height: '40px' }}
          >
            <i className="bi bi-list"></i>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`d-md-none position-fixed start-0 top-0 w-100 h-100 ${showMobileMenu ? 'd-block' : 'd-none'}`} 
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1040 
        }}
        onClick={() => setShowMobileMenu(false)}
      >
        {/* Mobile Menu Content */}
        <div 
          className="bg-white h-100 p-4" 
          style={{ 
            maxWidth: '280px',
            transform: showMobileMenu ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="d-flex flex-column h-100">
            <Nav className="flex-column mb-4">
              <Nav.Link 
                as={Link} 
                to="/admin"
                className="text-primary"
                onClick={() => setShowMobileMenu(false)}
              >
                Quiz Management
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/admin/monitoring"
                className="text-primary"
                onClick={() => setShowMobileMenu(false)}
              >
                Student Monitoring
              </Nav.Link>
            </Nav>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={() => {
                  navigate('/admin/quiz/new');
                  setShowMobileMenu(false);
                }}
              >
                Create New Quiz
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  exportResults();
                  setShowMobileMenu(false);
                }}
              >
                Export Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Row className="g-0">
        {/* Sidebar - Desktop */}
        <Col md={2} className="d-none d-md-block border-end vh-100 position-fixed">
          <div className="d-flex flex-column h-100 p-3">
            <h4 className="mb-4">Admin Dashboard</h4>
            
            <Nav className="flex-column mb-auto">
              <Nav.Link 
                as={Link} 
                to="/admin"
                className={activeTab === 'quizzes' ? 'active' : ''}
                onClick={() => setActiveTab('quizzes')}
              >
                Quiz Management
              </Nav.Link>
              <Nav.Link 
                as={Link}
                to="/admin/monitoring"
                className={activeTab === 'monitoring' ? 'active' : ''}
                onClick={() => setActiveTab('monitoring')}
              >
                Student Monitoring
              </Nav.Link>
            </Nav>

            <div className="mt-auto">
              <Card className="bg-light">
                <Card.Body>
                  <h6>Quick Actions</h6>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleCreateNewQuiz}
                    >
                      Create New Quiz
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={exportResults}
                    >
                      Export Results
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Col>

        {/* Main Content */}
        <Col md={10} className="ms-auto p-3">
          {/* Stats Cards */}
          <Row className="g-3 mb-4">
            {[
              { title: 'Active Students', value: activeStudents.length },
              { title: 'Total Quizzes', value: quizzes.length },
              { title: 'Active Quizzes', value: quizzes.filter(q => q.status === 'active').length },
              { title: 'Completed Quizzes', value: quizzes.filter(q => q.status === 'completed').length }
            ].map((stat, index) => (
              <Col xs={6} md={3} key={index}>
                <Card className="text-center h-100">
                  <Card.Body>
                    <h6>{stat.title}</h6>
                    <h3>{stat.value}</h3>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Routes Content */}
          <Routes>
            <Route path="/" element={<QuizManagement quizzes={quizzes} onQuizUpdate={fetchQuizzes} showModal={showQuizModal} setShowModal={setShowQuizModal} />} />
            <Route path="/monitoring" element={<StudentMonitoring activeStudents={activeStudents} />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;