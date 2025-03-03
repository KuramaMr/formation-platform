'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useQuiz from '../../../hooks/useQuiz';
import useCours from '../../../hooks/useCours';
import useFormations from '../../../hooks/useFormations';
import QuizForm from '../../../components/quiz/QuizForm';
import { Quiz } from '../../../types';

export default function EditQuiz() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getQuizById, loading: quizLoading, error } = useQuiz();
  const { getCoursById } = useCours();
  const { getFormationById } = useFormations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!mounted || authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      if (userData?.role !== 'formateur') {
        router.push('/formations');
        return;
      }
      
      const quizResult = await getQuizById(id);
      
      if (!quizResult) {
        router.push('/formations');
        return;
      }
      
      const cours = await getCoursById(quizResult.coursId);
      
      if (!cours) {
        router.push('/formations');
        return;
      }
      
      const formation = await getFormationById(cours.formationId);
      
      if (!formation || formation.formateurId !== user.uid) {
        router.push('/formations');
        return;
      }
      
      setQuiz(quizResult);
    };
    
    fetchQuiz();
  }, [mounted, authLoading, user, userData, id, router]);
  
  if (!mounted || authLoading || quizLoading || !quiz) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur :</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Modifier le quiz
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <QuizForm quiz={quiz} isEditing={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
