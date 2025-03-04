'use client';

import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Quiz, Question, ResultatQuiz } from '../types';

export default function useQuiz() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les quiz d'un cours
  const getQuizByCours = async (coursId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      
      const quizRef = collection(db, 'quiz');
      const q = query(
        quizRef, 
        where('coursId', '==', coursId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      
      const quiz: Quiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quiz.push({
          id: doc.id,
          coursId: data.coursId,
          titre: data.titre,
          description: data.description,
          questions: data.questions,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      return quiz;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des quiz:", error);
      setError(error.message || 'Une erreur est survenue lors de la récupération des quiz');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un quiz par son ID
  const getQuizById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const quizDoc = await getDoc(doc(db, 'quiz', id));
      
      if (!quizDoc.exists()) {
        throw new Error('Quiz non trouvé');
      }
      
      const data = quizDoc.data();
      return {
        id: quizDoc.id,
        coursId: data.coursId,
        titre: data.titre,
        description: data.description,
        questions: data.questions,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Quiz;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération du quiz');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau quiz
  const createQuiz = async (quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour créer un quiz');
      }
      
      // Vérifier que le cours existe
      const coursDoc = await getDoc(doc(db, 'cours', quiz.coursId));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', coursDoc.data().formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à ajouter un quiz à ce cours');
      }
      
      const now = new Date().toISOString();
      
      const docRef = await addDoc(collection(db, 'quiz'), {
        ...quiz,
        createdAt: now,
        updatedAt: now
      });
      
      return {
        id: docRef.id,
        ...quiz,
        createdAt: now,
        updatedAt: now
      } as Quiz;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la création du quiz');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un quiz
  const updateQuiz = async (id: string, quiz: Partial<Omit<Quiz, 'id' | 'coursId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour modifier un quiz');
      }
      
      // Vérifier que le quiz existe
      const quizDoc = await getDoc(doc(db, 'quiz', id));
      
      if (!quizDoc.exists()) {
        throw new Error('Quiz non trouvé');
      }
      
      // Vérifier que le cours existe
      const coursDoc = await getDoc(doc(db, 'cours', quizDoc.data().coursId));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', coursDoc.data().formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à modifier ce quiz');
      }
      
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, 'quiz', id), {
        ...quiz,
        updatedAt: now
      });
      
      return {
        id,
        ...quizDoc.data(),
        ...quiz,
        updatedAt: now
      } as Quiz;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la mise à jour du quiz');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un quiz
  const deleteQuiz = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour supprimer un quiz');
      }
      
      // Vérifier que le quiz existe
      const quizDoc = await getDoc(doc(db, 'quiz', id));
      
      if (!quizDoc.exists()) {
        throw new Error('Quiz non trouvé');
      }
      
      // Vérifier que le cours existe
      const coursDoc = await getDoc(doc(db, 'cours', quizDoc.data().coursId));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', coursDoc.data().formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à supprimer ce quiz');
      }
      
      // Supprimer d'abord les résultats liés à ce quiz
      const resultsRef = collection(db, 'resultats');
      const q = query(resultsRef, where('quizId', '==', id));
      const resultsSnapshot = await getDocs(q);
      
      // Supprimer chaque résultat individuellement
      const deletePromises = [];
      resultsSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      // Attendre que tous les résultats soient supprimés
      await Promise.all(deletePromises);
      
      // Maintenant, supprimer le quiz
      await deleteDoc(doc(db, 'quiz', id));
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la suppression du quiz');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Soumettre un résultat de quiz
  const soumettreResultat = async (quizId: string, reponses: { [questionId: string]: number }) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'eleve') {
        throw new Error('Vous devez être connecté en tant qu\'élève pour soumettre un résultat de quiz');
      }
      
      // Récupérer le quiz pour calculer le score
      const quizDoc = await getDoc(doc(db, 'quiz', quizId));
      
      if (!quizDoc.exists()) {
        throw new Error('Quiz non trouvé');
      }
      
      const quiz = quizDoc.data() as Quiz;
      
      // Calculer le score
      let score = 0;
      const questions = quiz.questions;
      
      for (const question of questions) {
        
        // Convertir les deux valeurs en chaînes de caractères
        if (String(reponses[question.id]) === String(question.reponseCorrecte)) {
          score++;
        }
      }
      
      // Calculer le pourcentage
      const scorePercentage = (score / questions.length) * 100;
      
      const now = new Date().toISOString();
      
      // Enregistrer le résultat
      const docRef = await addDoc(collection(db, 'resultats'), {
        quizId,
        eleveId: user.uid,
        reponses,
        score: scorePercentage,
        completedAt: now
      });
      
      return {
        id: docRef.id,
        quizId,
        eleveId: user.uid,
        reponses,
        score: scorePercentage,
        completedAt: now
      } as ResultatQuiz;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la soumission du résultat');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les résultats d'un élève
  const getResultatsEleve = async (eleveId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const resultatsRef = collection(db, 'resultats');
      const q = query(
        resultatsRef, 
        where('eleveId', '==', eleveId),
        orderBy('completedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const resultats: ResultatQuiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resultats.push({
          id: doc.id,
          quizId: data.quizId,
          eleveId: data.eleveId,
          reponses: data.reponses,
          score: data.score,
          completedAt: data.completedAt
        });
      });
      
      return resultats;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des résultats');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les résultats d'un quiz
  const getResultatsQuiz = async (quizId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour voir les résultats d\'un quiz');
      }
      
      // Vérifier que le quiz existe
      const quizDoc = await getDoc(doc(db, 'quiz', quizId));
      
      if (!quizDoc.exists()) {
        throw new Error('Quiz non trouvé');
      }
      
      // Vérifier que le cours existe
      const coursDoc = await getDoc(doc(db, 'cours', quizDoc.data().coursId));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', coursDoc.data().formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à voir les résultats de ce quiz');
      }
      
      const resultatsRef = collection(db, 'resultats');
      const q = query(
        resultatsRef, 
        where('quizId', '==', quizId),
        orderBy('completedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const resultats: ResultatQuiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resultats.push({
          id: doc.id,
          quizId: data.quizId,
          eleveId: data.eleveId,
          reponses: data.reponses,
          score: data.score,
          completedAt: data.completedAt
        });
      });
      
      return resultats;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des résultats');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un résultat par ID
  const getResultatById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Vous devez être connecté pour voir un résultat');
      }
      
      const resultatDoc = await getDoc(doc(db, 'resultats', id));
      
      if (!resultatDoc.exists()) {
        throw new Error('Résultat non trouvé');
      }
      
      const data = resultatDoc.data();
      
      // Vérifier si l'utilisateur est autorisé à voir ce résultat
      if (userData?.role === 'eleve' && data.eleveId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à voir ce résultat');
      }
      
      return {
        id: resultatDoc.id,
        quizId: data.quizId,
        eleveId: data.eleveId,
        reponses: data.reponses,
        score: data.score,
        completedAt: data.completedAt
      } as ResultatQuiz;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération du résultat');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer les résultats d'un quiz
  const deleteQuizResults = async (quizId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour supprimer les résultats d\'un quiz');
      }
      
      // Rechercher les résultats pour ce quiz
      const resultsRef = collection(db, 'resultats');
      const q = query(resultsRef, where('quizId', '==', quizId));
      const resultsSnapshot = await getDocs(q);
      
      if (resultsSnapshot.empty) {
        return true;
      }
      
      // Supprimer chaque résultat individuellement
      const deletePromises = [];
      resultsSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      // Attendre que tous les résultats soient supprimés
      await Promise.all(deletePromises);
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la suppression des résultats');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer tous les quiz créés par un formateur
  const getQuizzesByFormateur = async (formateurId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Nous devons d'abord récupérer les formations du formateur
      const formationsRef = collection(db, 'formations');
      const formationsQuery = query(
        formationsRef,
        where('formateurId', '==', formateurId)
      );
      const formationsSnapshot = await getDocs(formationsQuery);
      
      // Si aucune formation, retourner un tableau vide
      if (formationsSnapshot.empty) {
        return [];
      }
      
      // Récupérer les IDs des formations
      const formationIds = formationsSnapshot.docs.map(doc => doc.id);
      
      // Récupérer tous les cours de ces formations
      const coursRef = collection(db, 'cours');
      const coursPromises = formationIds.map(async (formationId) => {
        const coursQuery = query(
          coursRef,
          where('formationId', '==', formationId)
        );
        return getDocs(coursQuery);
      });
      
      const coursSnapshots = await Promise.all(coursPromises);
      
      // Récupérer les IDs des cours
      const coursIds = coursSnapshots
        .flatMap(snapshot => snapshot.docs)
        .map(doc => doc.id);
      
      // Si aucun cours, retourner un tableau vide
      if (coursIds.length === 0) {
        return [];
      }
      
      // Récupérer tous les quiz de ces cours
      const quizzes = [];
      
      // Firestore ne permet pas de faire un where('coursId', 'in', coursIds) si coursIds contient plus de 10 éléments
      // On doit donc faire des requêtes par lots de 10
      for (let i = 0; i < coursIds.length; i += 10) {
        const batch = coursIds.slice(i, i + 10);
        
        const quizRef = collection(db, 'quiz');
        const quizQuery = query(
          quizRef,
          where('coursId', 'in', batch)
        );
        
        const quizSnapshot = await getDocs(quizQuery);
        
        quizSnapshot.forEach((doc) => {
          const data = doc.data();
          quizzes.push({
            id: doc.id,
            coursId: data.coursId,
            titre: data.titre,
            description: data.description,
            questions: data.questions,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });
      }
      
      return quizzes;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des quiz');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si un élève a déjà complété un quiz
  const aDejaCompleteQuiz = async (quizId: string, eleveId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const resultatsRef = collection(db, 'resultats');
      const q = query(
        resultatsRef, 
        where('quizId', '==', quizId),
        where('eleveId', '==', eleveId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error: any) {
      console.error("Erreur lors de la vérification des résultats:", error);
      setError(error.message || 'Une erreur est survenue lors de la vérification des résultats');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getQuizByCours,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    soumettreResultat,
    getResultatsEleve,
    getResultatsQuiz,
    getResultatById,
    deleteQuizResults,
    getQuizzesByFormateur,
    aDejaCompleteQuiz
  };
}
