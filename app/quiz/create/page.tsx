'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useCours from '../../hooks/useCours';
import useFormations from '../../hooks/useFormations';
import QuizForm from '../../components/quiz/QuizForm';

// Composant qui utilise useSearchParams
function CreateQuizContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getCoursById } = useCours();
  const { getFormationById } = useFormations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const coursId = searchParams.get('coursId');
  
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!mounted || authLoading || !coursId) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      if (userData?.role !== 'formateur') {
        router.push('/formations');
        return;
      }
      
      const cours = await getCoursById(coursId);
      
      if (!cours) {
        router.push('/formations');
        return;
      }
      
      const formation = await getFormationById(cours.formationId);
      
      if (!formation || formation.formateurId !== user.uid) {
        router.push('/formations');
        return;
      }
      
      setAuthorized(true);
    };
    
    checkAuthorization();
  }, [mounted, authLoading, user, userData, coursId, router]);
  
  if (!mounted || authLoading || !coursId || !authorized) {
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
            Créer un nouveau quiz
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <QuizForm coursId={coursId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Composant principal qui enveloppe le contenu dans Suspense
export default function CreateQuiz() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <CreateQuizContent />
    </Suspense>
  );
}
