import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form } from 'react-bootstrap';
import api from '../../services/api';

function QuizManagement({ quizzes, onQuizUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    timeLimit: 30,
    questions: []
  });

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

  return (
    <>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Quiz Management</h3>
            <Button onClick={() => {
              setCurrentQuiz(null);
              setFormData({ title: '', timeLimit: 30, questions: [] });
              setShowModal(true);
            }}>
              Create New Quiz
            </Button>
          </div>

          <Table responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Time Limit</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map(quiz => (
                <tr key={quiz._id}>
                  <td>{quiz.title}</td>
                  <td>{quiz.timeLimit} minutes</td>
                  <td>{quiz.questions.length} questions</td>
                  <td>
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(quiz)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(quiz._id)}>
                      Delete
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
          <Modal.Title>{currentQuiz ? 'Edit Quiz' : 'Create New Quiz'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Quiz Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time Limit (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                required
              />
            </Form.Group>

            <h5>Questions</h5>
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

            <Button variant="secondary" onClick={handleAddQuestion} className="mb-3">
              Add Question
            </Button>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Quiz
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default QuizManagement;