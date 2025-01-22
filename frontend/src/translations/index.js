const translations = {
    en: {
      dashboard: {
        title: 'Admin Dashboard',
        quickActions: 'Quick Actions',
        createNewQuiz: 'Create New Quiz',
        exportResults: 'Export Results',
        navigation: {
          quizManagement: 'Quiz Management',
          studentMonitoring: 'Student Monitoring',
          submissions: 'Submissions'
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
          errorLoadingQuestions: 'Error loading questions',
          activate: 'Activate Quiz',
          deactivate: 'Deactivate Quiz',
          activationSuccess: 'Quiz activated successfully',
          deactivationSuccess: 'Quiz deactivated successfully',
          activationError: 'Error activating quiz',
          onlyOneActiveQuiz: 'Only one quiz can be active at a time',
          status: 'Stato',
          activate: 'Attiva Quiz',
          deactivate: 'Disattiva Quiz',
          activationSuccess: 'Quiz attivato con successo',
          deactivationSuccess: 'Quiz disattivato con successo',
          deleteConfirmation: 'Sei sicuro di voler eliminare questo quiz?',
          deleteSuccess: 'Quiz eliminato con successo',
          deleteError: 'Errore durante l\'eliminazione del quiz',
          totalQuestions: 'Total Questions',
          questionsPerStudent: 'Questions per Student',
          submissions: 'Submissions',
          submissionCount: 'Consegne'
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
          save: 'Save Quiz',
          studentQuestionCount: "Number of Questions per Student",
          questionCountHelp: "Each student will receive this many random questions from the total pool of {total} questions"
        },
        submissions: {
          title: 'Quiz Submissions',
          studentName: 'Student Name',
          status: 'Status',
          startTime: 'Start Time',
          endTime: 'End Time',
          answeredQuestions: 'Answered Questions',
          score: 'Score',
          noSubmissions: 'No submissions yet'
        }
      },
      student: {
        monitoring: {
          title: 'Student Monitoring',
          name: 'Student Name',
          status: 'Status',
          currentQuiz: 'Current Quiz',
          timeRemaining: 'Time Remaining',
          progress: 'Progresso',
          totalAnswers: 'Total Answers',
          correctAnswers: 'Correct Answers',
          wrongAnswers: 'Wrong Answers',
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
          nameRequired: 'Please enter your name',
          noActiveQuiz: 'No active quiz available or error joining quiz'
        },
        feedback: {
          title: 'Quiz Submitted Successfully!',
          message: 'Thank you for completing the quiz. Your answers have been saved.',
          returnHome: 'Return to Home'
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
      },
      common: {
        close: 'Close'
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
          studentMonitoring: 'Monitoraggio Studenti',
          submissions: 'Consegne'
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
          errorLoadingQuestions: 'Errore nel caricamento delle domande',
          status: 'Stato',
          activate: 'Attiva Quiz',
          deactivate: 'Disattiva Quiz',
          activationSuccess: 'Quiz attivato con successo',
          deactivationSuccess: 'Quiz disattivato con successo',
          activationError: 'Errore durante l\'attivazione del quiz',
          onlyOneActiveQuiz: 'Può essere attivo solo un quiz alla volta',
          deleteConfirmation: 'Sei sicuro di voler eliminare questo quiz?',
          deleteSuccess: 'Quiz eliminato con successo',
          deleteError: 'Errore durante l\'eliminazione del quiz',
          totalQuestions: 'Domande Totali',
          questionsPerStudent: 'Domande per Studente',
          submissions: 'Consegne',
          submissionCount: 'Consegne'
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
          save: 'Salva Quiz',
          studentQuestionCount: "Numero di Domande per Studente",
          questionCountHelp: "Ogni studente riceverà questo numero di domande casuali dal pool totale di {total} domande"
        },
        submissions: {
          title: 'Consegne Quiz',
          studentName: 'Nome Studente',
          status: 'Stato',
          startTime: 'Ora Inizio',
          endTime: 'Ora Fine',
          answeredQuestions: 'Domande Risposte',
          score: 'Punteggio',
          noSubmissions: 'Nessuna consegna'
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
          totalAnswers: 'Risposte Totali',
          correctAnswers: 'Risposte Corrette',
          wrongAnswers: 'Risposte Errate',
          connected: 'Connesso',
          disconnected: 'Disconnesso'
        },
        quiz: {
          previous: 'Precedente',
          next: 'Successivo',
          submit: 'Invia Quiz'
        },
        landing: {
          title: 'Benvenuto',
          enterName: 'Inserisci il tuo nome e cognome nel formato nome.cognome',
          startButton: 'Inizia Quiz',
          nameRequired: 'Inserisci nome.cognome',
          noActiveQuiz: 'Nessun quiz attivo disponibile o errore durante l\'accesso al quiz'
        },
        feedback: {
          title: 'Quiz Completato Con Successo!',
          message: 'Grazie per aver completato il quiz. Le tue risposte sono state salvate.',
          returnHome: 'Torna alla Home'
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
      },
      common: {
        close: 'Chiudi'
      }
    }
  };
  
  export default translations;