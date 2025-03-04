'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import useFormations from '../hooks/useFormations';
import FormationCard from '../components/formations/FormationCard';
import { Formation } from '../types';

// Composant qui utilise useSearchParams
function FormationsContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const { 
    getFormations, 
    getFormationsFormateur, 
    getFormationsEleve,
    deleteFormation,
    loading: formationsLoading, 
    error 
  } = useFormations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inscrit = searchParams.get('inscrit') === 'true';
  
  const [formations, setFormations] = useState<Formation[]>([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchFormations = async () => {
      if (!mounted || authLoading) return;
      
      let result: Formation[] = [];
      
      if (inscrit && user && userData?.role === 'eleve') {
        // Récupérer les formations auxquelles l'élève est inscrit
        result = await getFormationsEleve(user.uid);
      } else if (user && userData?.role === 'formateur') {
        // Récupérer les formations du formateur
        result = await getFormationsFormateur(user.uid);
      } else {
        // Récupérer toutes les formations
        result = await getFormations();
      }
      
      setFormations(result);
    };
    
    fetchFormations();
  }, [mounted, authLoading, user, userData, inscrit]);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      const success = await deleteFormation(id);
      if (success) {
        setFormations(formations.filter(f => f.id !== id));
      }
    }
  };
  
  if (!mounted || authLoading || formationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="main-content">
      {/* Bannière avec dégradé */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold">
              {inscrit 
                ? 'Mes formations' 
                : userData?.role === 'formateur' 
                  ? 'Mes formations' 
                  : 'Formations disponibles'}
            </h1>
            
            {userData?.role === 'formateur' && (
              <Link
                href="/formations/create"
                className="btn-secondary flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Créer une formation
              </Link>
            )}
          </div>
          
          {userData?.role === 'eleve' && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/formations"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  !inscrit 
                    ? 'bg-white text-indigo-600' 
                    : 'bg-indigo-500 text-white border border-indigo-300'
                }`}
              >
                Toutes les formations
              </Link>
              <Link
                href="/formations?inscrit=true"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  inscrit 
                    ? 'bg-white text-indigo-600' 
                    : 'bg-indigo-500 text-white border border-indigo-300'
                }`}
              >
                Mes inscriptions
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {formations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {inscrit 
                ? 'Vous n\'êtes inscrit à aucune formation.' 
                : userData?.role === 'formateur' 
                  ? 'Vous n\'avez pas encore créé de formation.' 
                  : 'Aucune formation disponible pour le moment.'}
            </h2>
            
            {userData?.role === 'formateur' && (
              <div className="mt-6">
                <Link
                  href="/formations/create"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Créer ma première formation
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {formations.map((formation) => (
              <FormationCard
                key={formation.id}
                formation={formation}
                isFormateur={userData?.role === 'formateur' && formation.formateurId === user?.uid}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Composant principal qui enveloppe le contenu dans Suspense
export default function Formations() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <FormationsContent />
    </Suspense>
  );
}
