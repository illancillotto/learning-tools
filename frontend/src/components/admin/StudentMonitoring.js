import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';

function StudentMonitoring({ activeStudents }) {
  return (
    <Card>
      <Card.Body>
        <h3>Student Monitoring</h3>
        <Table responsive>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Status</th>
              <th>Current Quiz</th>
              <th>Time Remaining</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {activeStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.name}</td>
                <td>
                  <Badge bg={student.status === 'connected' ? 'success' : 'danger'}>
                    {student.status}
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