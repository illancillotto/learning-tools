const translations = {
    en: {
      dashboard: {
        title: 'Admin Dashboard',
        quickActions: 'Quick Actions',
        createNewQuiz: 'Create New Quiz',
        exportResults: 'Export Results',
        navigation: {
          quizManagement: 'Quiz Management',
          studentMonitoring: 'Student Monitoring'
        },
        stats: {
          activeStudents: 'Active Students',
          totalQuizzes: 'Total Quizzes',
          activeQuizzes: 'Active Quizzes',
          completedQuizzes: 'Completed Quizzes'
        },
        notifications: {
          studentLeaveTitle: 'Student Attempted to Leave',
          studentLeaveBody: '{studentName} attempted to leave the quiz'
        }
      },
      quiz: {
        management: {
          title: 'Quiz Management',
          timeLimit: 'Time Limit',
          questions: 'Questions',
          actions: 'Actions',
          edit: 'Edit',
          delete: 'Delete',
          minutes: 'minutes',
          questionCount: 'questions',
          selectQuestions: "Select Questions",
          importJson: "Import JSON",
          exportJson: "Export JSON",
          invalidJson: "Invalid JSON format",
          notEnoughQuestions: "Not enough questions in pool",
          loadQuestions: 'Load Questions',
          questionsLoaded: 'Questions loaded successfully',
          errorLoadingQuestions: 'Error loading questions'
        },
        creation: {
          title: 'Create New Quiz',
          editTitle: 'Edit Quiz',
          quizTitle: 'Quiz Title',
          timeLimit: 'Time Limit (minutes)',
          questions: 'Questions',
          questionType: 'Question Type',
          multipleChoice: 'Multiple Choice',
          openEnded: 'Open Ended',
          option: 'Option',
          correctAnswer: 'Correct Answer',
          selectAnswer: 'Select correct answer',
          addQuestion: 'Add Question',
          cancel: 'Cancel',
          save: 'Save Quiz'
        }
      },
      student: {
        monitoring: {
          title: 'Student Monitoring',
          name: 'Student Name',
          status: 'Status',
          currentQuiz: 'Current Quiz',
          timeRemaining: 'Time Remaining',
          progress: 'Progress',
          connected: 'Connected',
          disconnected: 'Disconnected'
        },
        quiz: {
          previous: 'Previous',
          next: 'Next',
          submit: 'Submit Quiz'
        },
        landing: {
          title: 'Welcome to the Quiz',
          enterName: 'Enter your name',
          startButton: 'Start Quiz',
          nameRequired: 'Please enter your name'
        }
      },
      auth: {
        login: {
          title: 'Admin Login',
          username: 'Username',
          password: 'Password',
          loginButton: 'Login',
          error: 'Invalid credentials'
        }
      }
    },
    it: {
      dashboard: {
        title: 'Dashboard Amministratore',
        quickActions: 'Azioni Rapide',
        createNewQuiz: 'Crea Nuovo Quiz',
        exportResults: 'Esporta Risultati',
        navigation: {
          quizManagement: 'Gestione Quiz',
          studentMonitoring: 'Monitoraggio Studenti'
        },
        stats: {
          activeStudents: 'Studenti Attivi',
          totalQuizzes: 'Quiz Totali',
          activeQuizzes: 'Quiz Attivi',
          completedQuizzes: 'Quiz Completati'
        },
        notifications: {
          studentLeaveTitle: 'Studente Tenta di Abbandonare',
          studentLeaveBody: '{studentName} sta cercando di abbandonare il quiz'
        }
      },
      quiz: {
        management: {
          title: 'Gestione Quiz',
          timeLimit: 'Limite di Tempo',
          questions: 'Domande',
          actions: 'Azioni',
          edit: 'Modifica',
          delete: 'Elimina',
          minutes: 'minuti',
          questionCount: 'domande',
          selectQuestions: "Seleziona Domande",
          importJson: "Importa JSON",
          exportJson: "Esporta JSON",
          invalidJson: "Formato JSON non valido",
          notEnoughQuestions: "Non ci sono abbastanza domande nel pool",
          loadQuestions: 'Carica Domande',
          questionsLoaded: 'Domande caricate con successo',
          errorLoadingQuestions: 'Errore nel caricamento delle domande'
        },
        creation: {
          title: 'Crea Nuovo Quiz',
          editTitle: 'Modifica Quiz',
          quizTitle: 'Titolo Quiz',
          timeLimit: 'Limite di Tempo (minuti)',
          questions: 'Domande',
          questionType: 'Tipo di Domanda',
          multipleChoice: 'Scelta Multipla',
          openEnded: 'Risposta Aperta',
          option: 'Opzione',
          correctAnswer: 'Risposta Corretta',
          selectAnswer: 'Seleziona risposta corretta',
          addQuestion: 'Aggiungi Domanda',
          cancel: 'Annulla',
          save: 'Salva Quiz'
        }
      },
      student: {
        monitoring: {
          title: 'Monitoraggio Studenti',
          name: 'Nome Studente',
          status: 'Stato',
          currentQuiz: 'Quiz Attuale',
          timeRemaining: 'Tempo Rimanente',
          progress: 'Progresso',
          connected: 'Connesso',
          disconnected: 'Disconnesso'
        },
        quiz: {
          previous: 'Precedente',
          next: 'Successivo',
          submit: 'Invia Quiz'
        },
        landing: {
          title: 'Benvenuto al Quiz',
          enterName: 'Inserisci il tuo nome',
          startButton: 'Inizia Quiz',
          nameRequired: 'Inserisci il tuo nome per favore'
        }
      },
      auth: {
        login: {
          title: 'Admin Login',
          username: 'Username',
          password: 'Password',
          loginButton: 'Login',
          error: 'Invalid credentials'
        }
      }
    }
  };
  
  export default translations;