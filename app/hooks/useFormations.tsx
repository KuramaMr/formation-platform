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
      
      const formations: any[] = [];
      
      // D'abord, récupérer toutes les formations
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formations.push({
          id: doc.id,
          titre: data.titre,
          description: data.description,
          image: data.image,
          formateurId: data.formateurId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          studentCount: 0 // Initialiser à 0
        });
      });
      
      // Ensuite, pour chaque formation, compter les élèves
      for (const formation of formations) {
        // Compter les élèves dans la collection "students"
        const studentsRef = collection(db, 'students');
        const studentsQuery = query(
          studentsRef,
          where('formationId', '==', formation.id)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        // Compter les élèves dans la collection "inscriptions"
        const inscriptionsRef = collection(db, 'inscriptions');
        const inscriptionsQuery = query(
          inscriptionsRef,
          where('formationId', '==', formation.id)
        );
        const inscriptionsSnapshot = await getDocs(inscriptionsQuery);
        
        // Éviter les doublons en utilisant un Set d'IDs d'élèves
        const studentIds = new Set();
        
        // Ajouter les IDs des élèves de la collection "students"
        studentsSnapshot.forEach(doc => {
          studentIds.add(doc.data().userId);
        });
        
        // Ajouter les IDs des élèves de la collection "inscriptions"
        inscriptionsSnapshot.forEach(doc => {
          const userId = doc.data().eleveId || doc.data().userId;
          studentIds.add(userId);
        });
        
        // Mettre à jour le nombre d'élèves
        formation.studentCount = studentIds.size;
      }
      
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
      
      // Tableau pour stocker les IDs des formations et leurs dates d'inscription
      const formationInfo: { id: string, dateInscription?: any }[] = [];
      
      // 1. Vérifier dans la collection "inscriptions"
      const inscriptionsRef = collection(db, 'inscriptions');
      const inscriptionsQuery = query(inscriptionsRef, where('eleveId', '==', eleveId));
      const inscriptionsSnapshot = await getDocs(inscriptionsQuery);
      
      inscriptionsSnapshot.forEach((doc) => {
        const data = doc.data();
        formationInfo.push({
          id: data.formationId,
          dateInscription: data.createdAt || null
        });
      });
      
      // 2. Vérifier également dans la collection "students"
      const studentsRef = collection(db, 'students');
      const studentsQuery = query(studentsRef, where('userId', '==', eleveId));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      studentsSnapshot.forEach((doc) => {
        const data = doc.data();
        formationInfo.push({
          id: data.formationId,
          dateInscription: data.createdAt || null
        });
      });
      
      // Si aucune inscription, retourner un tableau vide
      if (formationInfo.length === 0) {
        return [];
      }
      
      // Éliminer les doublons potentiels en gardant la date d'inscription la plus ancienne
      const formationMap = new Map();
      formationInfo.forEach(info => {
        if (!formationMap.has(info.id) || 
            (info.dateInscription && (!formationMap.get(info.id).dateInscription || 
             new Date(info.dateInscription) < new Date(formationMap.get(info.id).dateInscription)))) {
          formationMap.set(info.id, info);
        }
      });
      
      // Récupérer les formations correspondantes
      const formations: Formation[] = [];
      
      // Firestore ne permet pas de faire un where('id', 'in', formationIds) directement
      // On doit donc faire une requête pour chaque formation
      for (const [formationId, info] of formationMap.entries()) {
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
            updatedAt: data.updatedAt,
            dateInscription: info.dateInscription // Ajouter la date d'inscription
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
      
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('formationId', '==', formationId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const inscrit = !querySnapshot.empty;
      
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
      const studentsRef = collection(db, 'students');
      const studentsQuery = query(
        studentsRef,
        where('formationId', '==', formationId)
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      
      // 2. Vérifier la collection "inscriptions"
      const inscriptionsRef = collection(db, 'inscriptions');
      const inscriptionsQuery = query(
        inscriptionsRef,
        where('formationId', '==', formationId)
      );
      
      const inscriptionsSnapshot = await getDocs(inscriptionsQuery);
      
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
      
      // 1bis. Supprimer également l'inscription dans la collection "inscriptions"
      const inscriptionsRef = collection(db, 'inscriptions');
      const inscriptionsQuery = query(
        inscriptionsRef,
        where('formationId', '==', formationId),
        where('eleveId', '==', userId)
      );
      
      const inscriptionsSnapshot = await getDocs(inscriptionsQuery);
      inscriptionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Vérifier également avec le champ userId au cas où
      const inscriptionsQuery2 = query(
        inscriptionsRef,
        where('formationId', '==', formationId),
        where('userId', '==', userId)
      );
      
      const inscriptionsSnapshot2 = await getDocs(inscriptionsQuery2);
      inscriptionsSnapshot2.forEach((doc) => {
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
          
          // Utiliser eleveId au lieu de userId pour la requête des résultats
          const resultatsQuery = query(
            resultatsRef,
            where('quizId', 'in', quizIds),
            where('eleveId', '==', userId)
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