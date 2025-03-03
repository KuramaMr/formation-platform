'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useCours from '../../../hooks/useCours';
import useFormations from '../../../hooks/useFormations';
import CoursForm from '../../../components/cours/CoursForm';
import { Cours } from '../../../types';

export default function EditCours() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getCoursById, loading: coursLoading, error } = useCours();
  const { getFormationById } = useFormations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [cours, setCours] = useState<Cours | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchCours = async () => {
      if (!mounted || authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      if (userData?.role !== 'formateur') {
        router.push('/formations');
        return;
      }
      
      const coursResult = await getCoursById(id);
      
      if (!coursResult) {
        router.push('/formations');
        return;
      }
      
      // Vérifier que la formation appartient au formateur
      const formation = await getFormationById(coursResult.formationId);
      
      if (!formation || formation.formateurId !== user.uid) {
        router.push('/formations');
        return;
      }
      
      setCours(coursResult);
    };
    
    fetchCours();
  }, [mounted, authLoading, user, userData, id, router]);
  
  if (!mounted || authLoading || coursLoading || !cours) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Modifier le cours
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <CoursForm cours={cours} isEditing={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
