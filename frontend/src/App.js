import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/student/LandingPage';
import QuizPage from './components/student/QuizPage';
import FeedbackPage from './components/student/FeedbackPage';
import Login from './components/admin/Login';
import AdminDashboard from './components/admin/Dashboard';
import PrivateRoute from './components/common/PrivateRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Student Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            
            {/* Admin Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            <Route 
              path="/admin/*" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;