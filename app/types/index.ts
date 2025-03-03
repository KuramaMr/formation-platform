// app/types/index.ts

// Type pour les utilisateurs
export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: 'formateur' | 'eleve';
    createdAt: string;
  }
  
  // Type pour les formations
  export interface Formation {
    id: string;
    titre: string;
    description: string;
    image?: string;
    formateurId: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Type pour les cours
  export interface Cours {
    id: string;
    formationId: string;
    titre: string;
    contenu: string;
    ordre: number;
    createdAt: string;
    updatedAt: string;
  }
  
  // Type pour les questions de quiz
  export interface Question {
    id: string;
    texte: string;
    options: string[];
    reponseCorrecte: number; // Index de l'option correcte
  }
  
  // Type pour les quiz
  export interface Quiz {
    id: string;
    coursId: string;
    titre: string;
    description: string;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
  }
  
  // Type pour les résultats de quiz
  export interface ResultatQuiz {
    id: string;
    quizId: string;
    eleveId: string;
    reponses: { [questionId: string]: number }; // questionId -> index de la réponse choisie
    score: number;
    completedAt: string;
  }
  
  // Type pour les signatures
  export interface Signature {
    id: string;
    userId: string;
    userName: string;
    formationId: string;
    formationTitre: string;
    signatureData: string;
    createdAt: string;
  }