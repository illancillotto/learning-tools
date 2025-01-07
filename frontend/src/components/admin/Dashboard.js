import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Nav } from 'react-bootstrap';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import QuizManagement from './QuizManagement';
import StudentMonitoring from './StudentMonitoring';
import socket from '../../services/socket';
import api from '../../services/api';
import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

function Dashboard() {
  const [activeStudents, setActiveStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    timeLimit: 30,
    questionCount: 10,
    questions: []
  });
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      const notification = new Notification(t('dashboard.notifications.studentLeaveTitle'), {
        body: t('dashboard.notifications.studentLeaveBody').replace('{studentName}', data.studentName),
        icon: '/favicon.ico'
      });
    });

    fetchQuizzes();
    return () => socket.disconnect();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token when fetching:', token); // Debug token

      if (!token) {
        console.error('No auth token found');
        navigate('/login');
        return;
      }

      // Add explicit headers to debug auth issues
      const response = await api.get('/quiz', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Quiz response:', response.data); // Debug response
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
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

  const handleQuizActivation = async (quizId, active) => {
    try {
      await api.put(`/quiz/${quizId}/activate`, { active });
      await fetchQuizzes(); // Refresh quiz list
      
      // Show success notification or feedback
      const message = active ? 
        t('quiz.management.activationSuccess') : 
        t('quiz.management.deactivationSuccess');
      
      // You might want to add a toast/notification system here
    } catch (error) {
      console.error('Error activating quiz:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Handle error - show error message
    }
  };

  const handleEdit = (quiz) => {
    setCurrentQuiz(quiz);
    setFormData({
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questionCount: quiz.questionCount,
      questions: quiz.questions
    });
    setShowQuizModal(true);
  };

  const handleDelete = async (quizId) => {
    if (window.confirm(t('quiz.management.deleteConfirmation'))) {
      try {
        await api.delete(`/quiz/${quizId}`);
        await fetchQuizzes(); // Refresh quiz list
        // Show success notification
      } catch (error) {
        console.error('Error deleting quiz:', error);
        // Handle error - show error message
      }
    }
  };

  return (
    <Container fluid className="p-0">
      {/* Mobile Header */}
      <div className="d-md-none bg-white p-3 sticky-top border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{t('dashboard.title')}</h4>
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
                {t('dashboard.navigation.quizManagement')}
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/admin/monitoring"
                className="text-primary"
                onClick={() => setShowMobileMenu(false)}
              >
                {t('dashboard.navigation.studentMonitoring')}
              </Nav.Link>
            </Nav>

            <LanguageSwitcher className="mb-4" />

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={() => {
                  navigate('/admin/quiz/new');
                  setShowMobileMenu(false);
                }}
              >
                {t('dashboard.createNewQuiz')}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  exportResults();
                  setShowMobileMenu(false);
                }}
              >
                {t('dashboard.exportResults')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Row className="g-0">
        {/* Sidebar - Desktop */}
        <Col md={2} className="d-none d-md-block border-end vh-100 position-fixed">
          <div className="d-flex flex-column h-100 p-3">
            <h4 className="mb-0">{t('dashboard.title')}</h4>
            <LanguageSwitcher className="mt-2 mb-4" />
            
            <Nav className="flex-column mb-auto">
              <Nav.Link 
                as={Link} 
                to="/admin"
                className={activeTab === 'quizzes' ? 'active' : ''}
                onClick={() => setActiveTab('quizzes')}
              >
                {t('dashboard.navigation.quizManagement')}
              </Nav.Link>
              <Nav.Link 
                as={Link}
                to="/admin/monitoring"
                className={activeTab === 'monitoring' ? 'active' : ''}
                onClick={() => setActiveTab('monitoring')}
              >
                {t('dashboard.navigation.studentMonitoring')}
              </Nav.Link>
            </Nav>

            <div className="mt-auto">
              <Card className="bg-light">
                <Card.Body>
                  <h6>{t('dashboard.quickActions')}</h6>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleCreateNewQuiz}
                    >
                      {t('dashboard.createNewQuiz')}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={exportResults}
                    >
                      {t('dashboard.exportResults')}
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
              { title: t('dashboard.stats.activeStudents'), value: activeStudents.length },
              { title: t('dashboard.stats.totalQuizzes'), value: quizzes.length },
              { title: t('dashboard.stats.activeQuizzes'), value: quizzes.filter(q => q.status === 'active').length },
              { title: t('dashboard.stats.completedQuizzes'), value: quizzes.filter(q => q.status === 'completed').length }
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

          {/* Quiz List with Activation Buttons */}
          <Card className="mb-4">
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>{t('quiz.management.title')}</th>
                    <th>{t('quiz.management.timeLimit')}</th>
                    <th>{t('quiz.management.questions')}</th>
                    <th>{t('quiz.management.questionsPerStudent')}</th>
                    <th>{t('quiz.management.status')}</th>
                    <th className="text-end">{t('quiz.management.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map(quiz => (
                    <tr key={quiz._id}>
                      <td>{quiz.title}</td>
                      <td>{quiz.timeLimit} {t('quiz.management.minutes')}</td>
                      <td>{quiz.questions.length} {t('quiz.management.questionCount')}</td>
                      <td>{quiz.questionCount} {t('quiz.management.questionCount')}</td>
                      <td>{quiz.status}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          {quiz.status !== 'completed' && (
                            <Button
                              variant={quiz.status === 'active' ? 'warning' : 'success'}
                              size="sm"
                              onClick={() => handleQuizActivation(quiz._id, quiz.status !== 'active')}
                            >
                              {quiz.status === 'active' ? 
                                t('quiz.management.deactivate') : 
                                t('quiz.management.activate')
                              }
                            </Button>
                          )}
                          <Button 
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(quiz)}
                          >
                            {t('quiz.management.edit')}
                          </Button>
                          <Button 
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(quiz._id)}
                          >
                            {t('quiz.management.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

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