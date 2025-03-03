'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useFormations from '../../hooks/useFormations';
import CoursForm from '../../components/cours/CoursForm';

// Composant qui utilise useSearchParams
function CreateCoursContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationById } = useFormations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formationId = searchParams.get('formationId');
  
  const [mounted, setMounted] = useState(false);
  const [formationExists, setFormationExists] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const checkFormation = async () => {
      if (!mounted || authLoading || !formationId) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      if (userData?.role !== 'formateur') {
        router.push('/formations');
        return;
      }
      
      const formation = await getFormationById(formationId);
      
      if (!formation) {
        router.push('/formations');
        return;
      }
      
      if (formation.formateurId !== user.uid) {
        router.push('/formations');
        return;
      }
      
      setFormationExists(true);
    };
    
    checkFormation();
  }, [mounted, authLoading, user, userData, formationId, router]);
  
  if (!mounted || authLoading || !formationId || !formationExists) {
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
            Créer un nouveau cours
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <CoursForm formationId={formationId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Composant principal qui enveloppe le contenu dans Suspense
export default function CreateCours() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <CreateCoursContent />
    </Suspense>
  );
}
