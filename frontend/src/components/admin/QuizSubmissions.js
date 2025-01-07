import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from '../../contexts/LanguageContext';

function QuizSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchQuizAndSubmissions();
    } else {
      navigate('/admin/dashboard');
    }
  }, [id, navigate]);

  const fetchQuizAndSubmissions = async () => {
    try {
      // Fetch both quiz and submissions in parallel
      const [quizResponse, submissionsResponse] = await Promise.all([
        api.get(`/quiz/${id}`),
        api.get(`/quiz/${id}/submissions`)
      ]);

      setQuiz(quizResponse.data);
      setSubmissions(submissionsResponse.data);
    } catch (error) {
      console.error('Error fetching quiz and submissions:', error);
      navigate('/admin/dashboard');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'in-progress': 'warning',
      'completed': 'success',
      'timed-out': 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="quiz-submissions">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>{t('quiz.submissions.title')} - {quiz?.title}</h4>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
            {t('common.back')}
          </Button>
        </Card.Header>
        <Card.Body>
          {submissions.length === 0 ? (
            <div className="text-center py-4">
              <p>{t('quiz.submissions.noSubmissions')}</p>
            </div>
          ) : (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>{t('quiz.submissions.studentName')}</th>
                  <th>{t('quiz.submissions.status')}</th>
                  <th>{t('quiz.submissions.startTime')}</th>
                  <th>{t('quiz.submissions.endTime')}</th>
                  <th>{t('quiz.submissions.answeredQuestions')}</th>
                  <th>{t('quiz.submissions.score')}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id}>
                    <td>{submission.studentName}</td>
                    <td>{getStatusBadge(submission.status)}</td>
                    <td>{new Date(submission.startTime).toLocaleString()}</td>
                    <td>
                      {submission.endTime ? 
                        new Date(submission.endTime).toLocaleString() : 
                        '-'
                      }
                    </td>
                    <td>{submission.answers?.length || 0}</td>
                    <td>
                      {submission.status === 'completed' ? 
                        `${submission.score || 0}/${quiz?.questionCount}` : 
                        '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default QuizSubmissions;