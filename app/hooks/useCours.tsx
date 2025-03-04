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
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Cours } from '../types';

export default function useCours() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les cours d'une formation
  const getCoursByFormation = async (formationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const coursRef = collection(db, 'cours');
      const q = query(
        coursRef, 
        where('formationId', '==', formationId),
        orderBy('ordre', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      const cours: Cours[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cours.push({
          id: doc.id,
          formationId: data.formationId,
          titre: data.titre,
          contenu: data.contenu,
          ordre: data.ordre,
          presentationUrl: data.presentationUrl || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      return cours;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération des cours');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un cours par son ID
  const getCoursById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const coursDoc = await getDoc(doc(db, 'cours', id));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      const data = coursDoc.data();
      return {
        id: coursDoc.id,
        formationId: data.formationId,
        titre: data.titre,
        contenu: data.contenu,
        ordre: data.ordre,
        presentationUrl: data.presentationUrl || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Cours;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la récupération du cours');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau cours
  const createCours = async (cours: Omit<Cours, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour créer un cours');
      }
      
      // Vérifier que la formation existe et appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', cours.formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à ajouter un cours à cette formation');
      }
      
      const now = new Date().toISOString();
      
      const docRef = await addDoc(collection(db, 'cours'), {
        ...cours,
        createdAt: now,
        updatedAt: now
      });
      
      return {
        id: docRef.id,
        ...cours,
        createdAt: now,
        updatedAt: now
      } as Cours;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la création du cours');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un cours
  const updateCours = async (id: string, cours: Partial<Omit<Cours, 'id' | 'formationId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour modifier un cours');
      }
      
      // Vérifier que le cours existe
      const coursDoc = await getDoc(doc(db, 'cours', id));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', coursDoc.data().formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
      }
      
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, 'cours', id), {
        ...cours,
        updatedAt: now
      });
      
      return {
        id,
        ...coursDoc.data(),
        ...cours,
        updatedAt: now
      } as Cours;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la mise à jour du cours');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un cours
  const deleteCours = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || userData?.role !== 'formateur') {
        throw new Error('Vous devez être connecté en tant que formateur pour supprimer un cours');
      }
      
      // Vérifier que le cours existe
      const coursDoc = await getDoc(doc(db, 'cours', id));
      
      if (!coursDoc.exists()) {
        throw new Error('Cours non trouvé');
      }
      
      // Vérifier que la formation appartient au formateur
      const formationDoc = await getDoc(doc(db, 'formations', coursDoc.data().formationId));
      
      if (!formationDoc.exists()) {
        throw new Error('Formation non trouvée');
      }
      
      if (formationDoc.data().formateurId !== user.uid) {
        throw new Error('Vous n\'êtes pas autorisé à supprimer ce cours');
      }
      
      await deleteDoc(doc(db, 'cours', id));
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la suppression du cours');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getCoursByFormation,
    getCoursById,
    createCours,
    updateCours,
    deleteCours
  };
}
