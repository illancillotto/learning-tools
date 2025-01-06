import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import api from '../../services/api';
import { useTranslation } from '../../contexts/LanguageContext';

function QuizManagement({ quizzes, onQuizUpdate, showModal, setShowModal }) {
  const { t } = useTranslation();
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    timeLimit: 30,
    questions: []
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [jsonError, setJsonError] = useState('');
  const fileInputRef = useRef();

  // Reset form when modal is opened
  useEffect(() => {
    if (showModal && !currentQuiz) {
      setFormData({
        title: '',
        timeLimit: 30,
        questions: []
      });
    }
  }, [showModal, currentQuiz]);
 
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        text: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: ''
      }]
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentQuiz) {
        await api.put(`/quiz/${currentQuiz._id}`, formData);
      } else {
        await api.post('/quiz', formData);
      }
      onQuizUpdate();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  const handleEdit = (quiz) => {
    setCurrentQuiz(quiz);
    setFormData({
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions
    });
    setShowModal(true);
  };

  const handleDelete = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/quiz/${quizId}`);
        onQuizUpdate();
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  const handleJsonImport = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        if (!validateQuizJson(jsonData)) {
          setJsonError(t('quiz.management.invalidJson'));
          return;
        }
        
        if (jsonData.questionPool.length < questionCount) {
          setJsonError(t('quiz.management.notEnoughQuestions'));
          return;
        }
        
        // Randomly select questions from pool
        const selectedQuestions = shuffleArray(jsonData.questionPool)
          .slice(0, questionCount);
        
        setFormData({
          title: jsonData.title,
          timeLimit: jsonData.timeLimit,
          questions: selectedQuestions
        });
        
        setShowModal(true);
      } catch (error) {
        setJsonError(t('quiz.management.invalidJson'));
      }
    };
    
    reader.readAsText(file);
  };
  
  const handleJsonExport = (quiz) => {
    const jsonData = {
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questionPool: quiz.questions
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quiz.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>{t('quiz.management.title')}</h3>
            <Button onClick={() => {
              setCurrentQuiz(null);
              setFormData({ title: '', timeLimit: 30, questions: [] });
              setShowModal(true);
            }}>
              {t('dashboard.createNewQuiz')}
            </Button>
          </div>

          <Table responsive>
            <thead>
              <tr>
                <th>{t('quiz.management.title')}</th>
                <th>{t('quiz.management.timeLimit')}</th>
                <th>{t('quiz.management.questions')}</th>
                <th>{t('quiz.management.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map(quiz => (
                <tr key={quiz._id}>
                  <td>{quiz.title}</td>
                  <td>{quiz.timeLimit} {t('quiz.management.minutes')}</td>
                  <td>{quiz.questions.length} {t('quiz.management.questionCount')}</td>
                  <td>
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(quiz)}>
                      {t('quiz.management.edit')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(quiz._id)}>
                      {t('quiz.management.delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentQuiz ? t('quiz.creation.editTitle') : t('quiz.creation.title')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('quiz.creation.quizTitle')}</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('quiz.creation.timeLimit')}</Form.Label>
              <Form.Control
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                required
              />
            </Form.Group>

            <div className="d-flex gap-2 mb-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                {t('quiz.creation.cancel')}
              </Button>
              <div className="flex-grow-1"></div>
              <Button variant="primary" type="submit">
                {t('quiz.creation.save')}
              </Button>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">{t('quiz.creation.questions')}</h5>
              <div className="d-flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleJsonImport}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => fileInputRef.current.click()}
                >
                  {t('quiz.management.importJson')}
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleAddQuestion}
                >
                  {t('quiz.creation.addQuestion')}
                </Button>
              </div>
            </div>

            {formData.questions.map((question, index) => (
              <Card key={index} className="mb-3">
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Question {index + 1}</Form.Label>
                    <Form.Control
                      type="text"
                      value={question.text}
                      onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Question Type</Form.Label>
                    <Form.Select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="open-ended">Open Ended</option>
                    </Form.Select>
                  </Form.Group>

                  {question.type === 'multiple-choice' && (
                    <>
                      {question.options.map((option, optionIndex) => (
                        <Form.Group key={optionIndex} className="mb-2">
                          <Form.Label>Option {optionIndex + 1}</Form.Label>
                          <Form.Control
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[optionIndex] = e.target.value;
                              handleQuestionChange(index, 'options', newOptions);
                            }}
                            required
                          />
                        </Form.Group>
                      ))}
                      <Form.Group className="mb-3">
                        <Form.Label>Correct Answer</Form.Label>
                        <Form.Select
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                          required
                        >
                          <option value="">Select correct answer</option>
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </>
                  )}
                </Card.Body>
              </Card>
            ))}
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

// Utility function to shuffle array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Validate JSON structure
function validateQuizJson(json) {
  return (
    json.title &&
    typeof json.timeLimit === 'number' &&
    Array.isArray(json.questionPool) &&
    json.questionPool.every(q => 
      q.text && 
      q.type && 
      (q.type === 'multiple-choice' ? 
        Array.isArray(q.options) && q.correctAnswer : true)
    )
  );
}

export default QuizManagement;