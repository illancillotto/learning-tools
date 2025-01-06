import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';

function StudentMonitoring({ activeStudents }) {
  const { t } = useTranslation();

  return (
    <Card>
      <Card.Body>
        <h3>{t('student.monitoring.title')}</h3>
        <Table responsive>
          <thead>
            <tr>
              <th>{t('student.monitoring.name')}</th>
              <th>{t('student.monitoring.status')}</th>
              <th>{t('student.monitoring.currentQuiz')}</th>
              <th>{t('student.monitoring.timeRemaining')}</th>
              <th>{t('student.monitoring.progress')}</th>
            </tr>
          </thead>
          <tbody>
            {activeStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.name}</td>
                <td>
                  <Badge bg={student.status === 'connected' ? 'success' : 'danger'}>
                    {t(`student.monitoring.${student.status}`)}
                  </Badge>
                </td>
                <td>{student.currentQuiz || 'N/A'}</td>
                <td>{student.timeRemaining || 'N/A'}</td>
                <td>
                  {student.progress ? (
                    <div className="progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${student.progress}%` }}
                        aria-valuenow={student.progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {student.progress}%
                      </div>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default StudentMonitoring;