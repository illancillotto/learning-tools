import React, { useEffect, useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';
import io from 'socket.io-client';

function StudentMonitoring({ activeStudents }) {
  const { t } = useTranslation();
  const [connectedStudents, setConnectedStudents] = useState(activeStudents || []);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['polling'],
      polling: {
        interval: 1000
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Debug connection status
    socket.on('connect', () => {
      console.log('Monitoring connected to socket');
      socket.emit('getActiveStudents');
    });

    socket.on('disconnect', () => {
      console.log('Monitoring disconnected from socket');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Set up polling interval
    const pollInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('getActiveStudents');
      }
    }, 2000);

    // Listen for active students updates
    socket.on('activeStudents', (students) => {
      console.log('Received students update:', students);
      setConnectedStudents(prevStudents => {
        // Merge new students with existing ones
        const updatedStudents = [...students];
        // Sort by name to maintain consistent order
        updatedStudents.sort((a, b) => a.name.localeCompare(b.name));
        return updatedStudents;
      });
    });

    return () => {
      clearInterval(pollInterval);
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
              <tr key={student.id || index}>
                <td>{student.name}</td>
                <td>
                  <Badge bg={student.status === 'connected' ? 'success' : 'danger'}>
                    {t(`student.monitoring.${student.status}`)}
                  </Badge>
                </td>
                <td>{student.currentQuiz || 'N/A'}</td>
                <td>{student.timeRemaining ? `${Math.floor(student.timeRemaining / 60)}:${(student.timeRemaining % 60).toString().padStart(2, '0')}` : 'N/A'}</td>
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