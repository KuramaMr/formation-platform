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
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            {inscrit 
              ? 'Mes formations' 
              : userData?.role === 'formateur' 
                ? 'Mes formations' 
                : 'Formations disponibles'}
          </h1>
          
          {userData?.role === 'formateur' && (
            <Link
              href="/formations/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Créer une formation
            </Link>
          )}
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {formations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">
                {inscrit 
                  ? 'Vous n\'êtes inscrit à aucune formation.' 
                  : userData?.role === 'formateur' 
                    ? 'Vous n\'avez pas encore créé de formation.' 
                    : 'Aucune formation disponible pour le moment.'}
              </p>
              
              {userData?.role === 'formateur' && (
                <div className="mt-6">
                  <Link
                    href="/formations/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Créer ma première formation
                  </Link>
                </div>
              )}
              
              {userData?.role === 'eleve' && !inscrit && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    Revenez plus tard pour découvrir de nouvelles formations.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
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
