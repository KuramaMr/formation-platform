// app/hooks/useFormations.tsx
'use client';

import { useState, useEffect } from 'react';
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
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Formation } from '../types';

export default function useFormations() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer toutes les formations
  const getFormations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const formationsRef = collection(db, 'formations');
      const q = query(formationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const formations: Formation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formations.push({
          id: doc.id,
          titre: data.titre,
          description: data.description,
          image: data.image,
          formateurId: data.formateurId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      return formations;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des formations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les formations d'un formateur
  const getFormationsFormateur = async (formateurId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const formationsRef = collection(db, 'formations');
      const q = query(
        formationsRef, 
        where('formateurId', '==', formateurId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const formations: Formation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formations.push({
          id: doc.id,
          titre: data.titre,
          description: data.description,
          image: data.image,
          formateurId: data.formateurId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      return formations;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des formations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les formations auxquelles un élève est inscrit
  const getFormationsEleve = async (eleveId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer d'abord les inscriptions de l'élève
      const inscriptionsRef = collection(db, 'inscriptions');
      const q = query(inscriptionsRef, where('eleveId', '==', eleveId));
      const querySnapshot = await getDocs(q);
      
      const formationIds: string[] = [];
      querySnapshot.forEach((doc) => {
        formationIds.push(doc.data().formationId);
      });
      
      // Si aucune inscription, retourner un tableau vide
      if (formationIds.length === 0) {
        return [];
      }
      
      // Récupérer les formations correspondantes
      const formations: Formation[] = [];
      
      // Firestore ne permet pas de faire un where('id', 'in', formationIds) directement
      // On doit donc faire une requête pour chaque formation
      for (const formationId of formationIds) {
        const formationDoc = await getDoc(doc(db, 'formations', formationId));
        if (formationDoc.exists()) {
          const data = formationDoc.data();
          formations.push({
            id: formationDoc.id,
            titre: data.titre,
            description: data.description,
            image: data.image,
            formateurId: data.formateurId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        }
      }
      
      return formations;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des formations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer une formation par son ID
  const getFormationById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const formationDoc = await getDoc(doc(db, 'formations', id));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      const data = formationDoc.data();
      return {
        id: formationDoc.id,
        titre: data.titre,
        description: data.description,
        image: data.image,
        formateurId: data.formateurId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Formation;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération de la formation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle formation
  const createFormation = async (formation: Omit<Formation, 'id' | 'formateurId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour créer une formation');
      }
      
      const now = new Date().toISOString();
      
      const docRef = await addDoc(collection(db, 'formations'), {
        ...formation,
        formateurId: user.uid,
        createdAt: now,
        updatedAt: now
      });
      
      return {
        id: docRef.id,
        ...formation,
        formateurId: user.uid,
        createdAt: now,
        updatedAt: now
      } as Formation;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la création de la formation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour une formation
  const updateFormation = async (id: string, formation: Partial<Omit<Formation, 'id' | 'formateurId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour modifier une formation');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', id));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à modifier cette formation');
      }
      
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, 'formations', id), {
        ...formation,
        updatedAt: now
      });
      
      return {
        id,
        ...formationDoc.data(),
        ...formation,
        updatedAt: now
      } as Formation;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la mise à jour de la formation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une formation
  const deleteFormation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour supprimer une formation');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', id));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à supprimer cette formation');
      }
      
      await deleteDoc(doc(db, 'formations', id));
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la suppression de la formation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Inscrire un élève à une formation
  const inscrireEleve = async (formationId: string, eleveId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si l'élève est déjà inscrit
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef, 
        where('formationId', '==', formationId),
        where('userId', '==', eleveId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Vous êtes déjà inscrit à cette formation');
      }
      
      const now = new Date().toISOString();
      
      await addDoc(collection(db, 'students'), {
        formationId,
        userId: eleveId,
        createdAt: now
      });
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'inscription à la formation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si un élève est inscrit à une formation
  const estInscrit = async (formationId: string, userId: string) => {
    try {
      console.log("Vérification de l'inscription pour:", formationId, userId);
      
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('formationId', '==', formationId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const inscrit = !querySnapshot.empty;
      
      console.log("Résultat de la vérification:", inscrit);
      return inscrit;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'inscription:", error);
      return false;
    }
  };

  // Récupérer les élèves d'une formation
  const getStudentsByFormation = async (formationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Tableau pour stocker les données des élèves
      const students = [];
      
      // 1. Vérifier la collection "students"
      console.log("Vérification de la collection 'students'");
      const studentsRef = collection(db, 'students');
      const studentsQuery = query(
        studentsRef,
        where('formationId', '==', formationId)
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      console.log("Nombre d'élèves trouvés dans 'students':", studentsSnapshot.size);
      
      // 2. Vérifier la collection "inscriptions"
      console.log("Vérification de la collection 'inscriptions'");
      const inscriptionsRef = collection(db, 'inscriptions');
      const inscriptionsQuery = query(
        inscriptionsRef,
        where('formationId', '==', formationId)
      );
      
      const inscriptionsSnapshot = await getDocs(inscriptionsQuery);
      console.log("Nombre d'élèves trouvés dans 'inscriptions':", inscriptionsSnapshot.size);
      
      // Traiter les résultats de "students"
      for (const docSnapshot of studentsSnapshot.docs) {
        const studentData = docSnapshot.data();
        const userId = studentData.userId;
        
        // Récupérer les données de l'utilisateur
        const userDocRef = doc(db, 'users', userId);
        const userDocSnapshot = await getDoc(userDocRef);
        
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          
          students.push({
            id: docSnapshot.id,
            userId: userId,
            formationId: formationId,
            displayName: userData.displayName,
            email: userData.email,
            createdAt: studentData.createdAt,
            source: 'students'
          });
        }
      }
      
      // Traiter les résultats de "inscriptions"
      for (const docSnapshot of inscriptionsSnapshot.docs) {
        const inscriptionData = docSnapshot.data();
        const userId = inscriptionData.eleveId || inscriptionData.userId;
        
        // Vérifier si cet utilisateur n'est pas déjà dans la liste (pour éviter les doublons)
        if (students.some(s => s.userId === userId)) {
          continue;
        }
        
        // Récupérer les données de l'utilisateur
        const userDocRef = doc(db, 'users', userId);
        const userDocSnapshot = await getDoc(userDocRef);
        
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          
          students.push({
            id: docSnapshot.id,
            userId: userId,
            formationId: formationId,
            displayName: userData.displayName,
            email: userData.email,
            createdAt: inscriptionData.createdAt,
            source: 'inscriptions'
          });
        }
      }
      
      console.log("Total d'élèves trouvés:", students.length);
      return students;
    } catch (error: any) {
      console.error("Erreur dans getStudentsByFormation:", error);
      setError(error.message || 'Une erreur est survenue lors de la récupération des élèves');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour désinscrire un élève d'une formation et supprimer toutes ses données associées
  const desinscrireEleve = async (formationId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Référence à la base de données Firestore
      const batch = writeBatch(db);
      
      // 1. Supprimer l'inscription de l'élève (dans la collection "students")
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('formationId', '==', formationId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // 2. Supprimer les signatures de l'élève pour cette formation
      const signaturesRef = collection(db, 'signatures');
      const signaturesQuery = query(
        signaturesRef,
        where('formationId', '==', formationId),
        where('userId', '==', userId)
      );
      
      const signaturesSnapshot = await getDocs(signaturesQuery);
      signaturesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // 3. Supprimer les résultats de quiz de l'élève pour cette formation
      // D'abord, récupérer tous les cours de la formation
      const coursRef = collection(db, 'cours');
      const coursQuery = query(coursRef, where('formationId', '==', formationId));
      const coursSnapshot = await getDocs(coursQuery);
      
      // Récupérer tous les quiz liés à ces cours
      const coursIds = coursSnapshot.docs.map(doc => doc.id);
      
      if (coursIds.length > 0) {
        const quizRef = collection(db, 'quiz');
        const quizQuery = query(quizRef, where('coursId', 'in', coursIds));
        const quizSnapshot = await getDocs(quizQuery);
        
        // Récupérer tous les résultats liés à ces quiz
        const quizIds = quizSnapshot.docs.map(doc => doc.id);
        
        if (quizIds.length > 0) {
          const resultatsRef = collection(db, 'resultats');
          const resultatsQuery = query(
            resultatsRef,
            where('quizId', 'in', quizIds),
            where('userId', '==', userId)
          );
          
          const resultatsSnapshot = await getDocs(resultatsQuery);
          resultatsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }
      }
      
      // Exécuter toutes les suppressions en une seule transaction
      await batch.commit();
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la désinscription de l'élève:", error);
      setError(error.message || "Une erreur est survenue lors de la désinscription de l'élève");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getFormations,
    getFormationsFormateur,
    getFormationsEleve,
    getFormationById,
    createFormation,
    updateFormation,
    deleteFormation,
    inscrireEleve,
    estInscrit,
    getStudentsByFormation,
    desinscrireEleve
  };
}