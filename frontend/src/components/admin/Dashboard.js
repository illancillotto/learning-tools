import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Nav, Badge, Modal } from 'react-bootstrap';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import QuizManagement from './QuizManagement';
import StudentMonitoring from './StudentMonitoring';
import socket from '../../services/socket';
import api from '../../services/api';
import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import QuizSubmissions from './QuizSubmissions';

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
  const [submissions, setSubmissions] = useState({});
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedQuizSubmissions, setSelectedQuizSubmissions] = useState(null);
  const [showQuestionDetailsModal, setShowQuestionDetailsModal] = useState(false);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const modalStyles = {
    '.submissions-modal .modal-content': {
      borderRadius: '12px',
      overflow: 'hidden'
    },
    '.submissions-modal .table': {
      marginBottom: 0
    },
    '.submissions-modal .table th': {
      fontWeight: 600,
      borderTop: 'none'
    },
    '.submissions-modal .score-badge': {
      fontWeight: 500,
      padding: '6px 10px',
      borderRadius: '6px'
    },
    '.submissions-modal .score-percentage': {
      opacity: 0.8,
      fontSize: '0.9em'
    },
    '.submissions-modal .btn-link': {
      color: '#666'
    },
    '.submissions-modal .btn-link:hover': {
      color: '#333'
    },
    '.submissions-modal .table-hover tbody tr:hover': {
      backgroundColor: 'rgba(0,0,0,0.02)'
    }
  };

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

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = Object.entries(modalStyles)
      .map(([selector, rules]) => 
        `${selector} { ${Object.entries(rules)
          .map(([property, value]) => 
            `${property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${value}`
          ).join('; ')} 
      }`
      ).join('\n');
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
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
      // After getting quizzes, fetch submissions for each
      response.data.forEach(quiz => fetchSubmissionsForQuiz(quiz._id));
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

  const fetchSubmissionsForQuiz = async (quizId) => {
    try {
      const response = await api.get(`/quiz/${quizId}/submissions`);
      setSubmissions(prev => ({
        ...prev,
        [quizId]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching submissions for quiz ${quizId}:`, error);
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
      console.error('Error activating quiz:', error);
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

  const handleViewSubmissions = (quizId) => {
    navigate(`/admin/quiz/${quizId}/submissions`);
  };

  const handleShowSubmissions = (quizId) => {
    console.log('Raw submissions:', submissions[quizId]); // Debug log
    setSelectedQuizSubmissions(submissions[quizId]?.map(submission => {
      const correctAnswers = submission.answers?.filter(a => a.isCorrect)?.length || 0;
      const totalAnswers = submission.answers?.length || 0;
      return {
        ...submission,
        correctAnswers,
        totalAnswers,
        score: totalAnswers > 0 ? (correctAnswers / totalAnswers) : 0
      };
    }));
    setShowSubmissionsModal(true);
  };

  const handleViewQuestionDetails = async (submission) => {
    try {
      console.log('Submission data:', submission);

      // Get the quiz details from the parent component
      const quiz = quizzes.find(q => {
        const submissionAnswers = submission.answers || [];
        return submissionAnswers.some(answer => 
          q.questions.some(question => question._id === answer.questionId)
        );
      });

      if (!quiz) {
        console.error('Quiz not found for submission:', submission);
        alert(t('quiz.submissions.errorFetchingDetails'));
        return;
      }

      setSelectedSubmissionDetails({
        ...submission,
        quizTitle: quiz.title,
        questions: quiz.questions,
        studentName: submission.studentName,
        answers: submission.answers || []
      });
      setShowQuestionDetailsModal(true);

    } catch (error) {
      console.error('Error processing submission details:', error);
      alert(t('quiz.submissions.errorFetchingDetails'));
    }
  };

  const getScoreBadgeColor = (correct, total) => {
    if (!total) return 'secondary';
    const percentage = (correct / total) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
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
              <Nav.Link 
                as={Link} 
                to="/admin/submissions"
                className="text-primary"
                onClick={() => setShowMobileMenu(false)}
              >
                {t('dashboard.navigation.submissions')}
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

      {/* Mobile Menu */}
      <div className="d-md-none">
        <Nav className="flex-column">
          <Nav.Link 
            as={Link} 
            to="/admin/gestione-quiz"
            className="text-primary"
          >
            {t('dashboard.navigation.quizManagement')}
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/admin/monitoraggio-studenti"
            className="text-primary"
          >
            {t('dashboard.navigation.studentMonitoring')}
          </Nav.Link>
        </Nav>
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
                to="/admin/gestione-quiz"
                className={activeTab === 'gestione-quiz' ? 'active' : ''}
                onClick={() => setActiveTab('gestione-quiz')}
              >
                {t('dashboard.navigation.quizManagement')}
              </Nav.Link>
              <Nav.Link 
                as={Link}
                to="/admin/monitoraggio-studenti"
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

          {/* Elenco Quiz Section */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Quiz attivi</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Gestione Quiz</th>
                    <th>Limite di Tempo</th>
                    <th>Domande</th>
                    <th>Domande per Studente</th>
                    <th>Stato</th>
                    <th>Consegne</th>
                    <th className="text-end">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map(quiz => (
                    <tr key={quiz._id}>
                      <td>{quiz.title}</td>
                      <td>{quiz.timeLimit} minuti</td>
                      <td>{quiz.questions.length} domande</td>
                      <td>{quiz.questionCount} domande</td>
                      <td>
                        <Badge bg={quiz.status === 'active' ? 'success' : 'secondary'}>
                          {quiz.status === 'active' ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="link"
                          className="text-decoration-none d-inline-flex align-items-center gap-2"
                          onClick={() => handleShowSubmissions(quiz._id)}
                        >
                          <div className="d-flex align-items-center">
                            <i className="bi bi-file-text me-2"></i>
                            <span className="badge rounded-pill bg-info text-white">
                              {(submissions[quiz._id]?.length || 0)}
                            </span>
                          </div>
                          {t('quiz.management.submissionCount')}
                        </Button>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <Button
                            variant={quiz.status === 'active' ? 'warning' : 'success'}
                            size="sm"
                            onClick={() => handleQuizActivation(quiz._id, quiz.status !== 'active')}
                          >
                            {quiz.status === 'active' ? 'Disattiva Quiz' : 'Attiva Quiz'}
                          </Button>
                          <Button 
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(quiz)}
                          >
                            Modifica
                          </Button>
                          <Button 
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(quiz._id)}
                          >
                            Elimina
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
            <Route path="/gestione-quiz" element={<QuizManagement 
              quizzes={quizzes} 
              onQuizUpdate={fetchQuizzes} 
              showModal={showQuizModal} 
              setShowModal={setShowQuizModal} 
            />} />
            <Route 
              path="/monitoraggio-studenti" 
              element={
                <StudentMonitoring 
                  activeStudents={activeStudents} 
                  quizzes={quizzes}  // Pass quizzes prop
                />
              } 
            />
            <Route path="/submissions" element={<QuizSubmissions />} />
            <Route path="quiz/:id/submissions" element={<QuizSubmissions />} />
          </Routes>
        </Col>
      </Row>

      {/* Add Modal component */}
      <Modal 
        show={showSubmissionsModal} 
        onHide={() => setShowSubmissionsModal(false)}
        size="lg"
        className="submissions-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">
            <i className="bi bi-file-text me-2"></i>
            {t('quiz.submissions.title')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedQuizSubmissions && selectedQuizSubmissions.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>{t('quiz.submissions.studentName')}</th>
                  <th>{t('quiz.submissions.startTime')}</th>
                  <th>{t('quiz.submissions.score')}</th>
                  <th>{t('quiz.submissions.timeSpent')}</th>
                  <th className="text-end">{t('quiz.submissions.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuizSubmissions.map((submission, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-circle text-primary me-2"></i>
                        <span className="student-name">{submission.studentName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="time-info">
                        {submission.startTime ? 
                          new Date(submission.startTime).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <Badge 
                        bg={getScoreBadgeColor(submission.correctAnswers, submission.totalAnswers)}
                        className="score-badge"
                      >
                        {`${submission.correctAnswers}/${submission.totalAnswers}`}
                        <span className="score-percentage">
                          ({Math.round((submission.correctAnswers / submission.totalAnswers) * 100)}%)
                        </span>
                      </Badge>
                    </td>
                    <td>
                      <span className="time-info">
                        {submission.startTime && submission.endTime ? (
                          <>
                            <i className="bi bi-clock me-1"></i>
                            {Math.round((new Date(submission.endTime) - new Date(submission.startTime)) / 60000)} min
                          </>
                        ) : 'N/A'}
                      </span>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleViewQuestionDetails(submission)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        {t('quiz.submissions.viewDetails')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>{t('quiz.submissions.noSubmissions')}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Add new modal for question details */}
      <Modal
        show={showQuestionDetailsModal}
        onHide={() => setShowQuestionDetailsModal(false)}
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSubmissionDetails?.quizTitle || 'Quiz'} - {selectedSubmissionDetails?.studentName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSubmissionDetails?.answers.map((answer, index) => {
            const question = selectedSubmissionDetails.questions?.find(q => q._id === answer.questionId);
            return (
              <Card key={index} className="mb-3">
                <Card.Header>
                  <strong>{t('quiz.submissions.questionDetails.questionNumber', { number: index + 1 })}</strong>
                </Card.Header>
                <Card.Body>
                  <p>{question?.text}</p>
                  <div className="mt-2">
                    <strong>{t('quiz.submissions.questionDetails.studentAnswer')}:</strong>
                    <p className={`mt-1 p-2 rounded ${answer.isCorrect ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                      {answer.answer}
                    </p>
                  </div>
                  {!answer.isCorrect && question?.correctAnswer && (
                    <div className="mt-2">
                      <strong>{t('quiz.submissions.questionDetails.correctAnswer')}:</strong>
                      <p className="mt-1 p-2 rounded bg-success-light text-success">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuestionDetailsModal(false)}>
            {t('common.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Dashboard;