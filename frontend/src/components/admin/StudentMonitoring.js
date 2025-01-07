import React, { useEffect, useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';
import io from 'socket.io-client';

function StudentMonitoring({ activeStudents }) {
  const { t } = useTranslation();
  const [connectedStudents, setConnectedStudents] = useState(activeStudents);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['polling'],
      polling: {
        interval: 2000  // Poll every 2 seconds
      }
    });
    
    // Initial request for active students
    socket.emit('getActiveStudents');

    // Listen for student updates
    socket.on('activeStudents', (updatedStudents) => {
      setConnectedStudents(updatedStudents);
    });

    // Set up continuous polling
    socket.on('connect', () => {
      socket.emit('getActiveStudents');
    });

    socket.on('disconnect', () => {
      // Attempt to reconnect
      socket.connect();
    });

    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

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
            {connectedStudents.map((student, index) => (
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