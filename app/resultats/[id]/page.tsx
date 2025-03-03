'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useQuiz from '../../hooks/useQuiz';
import useCours from '../../hooks/useCours';
import useFormations from '../../hooks/useFormations';
import QuizQuestion from '../../components/quiz/QuizQuestion';
import { Quiz, ResultatQuiz } from '../../types';
import Link from 'next/link';

export default function ResultatDetailPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getQuizById, getResultatById, loading: quizLoading, error } = useQuiz();
  const { getCoursById } = useCours();
  const { getFormationById } = useFormations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [resultat, setResultat] = useState<ResultatQuiz | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [cours, setCours] = useState<any>(null);
  const [formation, setFormation] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchResultat = async () => {
      if (!mounted || authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      setIsChecking(true);
      
      try {
        // Récupérer le résultat depuis Firestore
        const resultatData = await getResultatById(id);
        
        if (!resultatData) {
          router.push('/resultats');
          return;
        }
        
        setResultat(resultatData);
        
        // Récupérer le quiz associé au résultat
        const quizData = await getQuizById(resultatData.quizId);
        
        if (!quizData) {
          throw new Error('Quiz non trouvé');
        }
        
        setQuiz(quizData);
        
        // Vérifier si l'utilisateur est autorisé à voir ce résultat
        let isAuthorized = false;
        
        if (userData?.role === 'eleve' && resultatData.eleveId === user.uid) {
          isAuthorized = true;
        } else if (userData?.role === 'formateur') {
          // Vérifier si le formateur est responsable de la formation
          const coursData = await getCoursById(quizData.coursId);
          
          if (coursData) {
            setCours(coursData);
            
            const formationData = await getFormationById(coursData.formationId);
            
            if (formationData && formationData.formateurId === user.uid) {
              setFormation(formationData);
              isAuthorized = true;
            }
          }
        }
        
        setAuthorized(isAuthorized);
        
        if (!isAuthorized) {
          router.push('/resultats');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    fetchResultat();
  }, [mounted, authLoading, user, userData, id, router]);
  
  if (!mounted || authLoading || quizLoading || isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!authorized || !resultat || !quiz) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Accès refusé ou données manquantes :</strong>
            <span className="block sm:inline"> Impossible d'afficher ce résultat.</span>
          </div>
          <div className="mt-4">
            <Link href="/resultats" className="text-indigo-600 hover:text-indigo-800">
              Retour aux résultats
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const date = new Date(resultat.completedAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Résultat du quiz : {quiz.titre}
          </h1>
          <p className="mt-2 text-lg text-gray-700">
            Complété le {formattedDate}
          </p>
          <div className="mt-2">
            <Link 
              href={userData?.role === 'eleve' ? '/resultats' : `/formations/${formation?.id}`}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {userData?.role === 'eleve' ? 'Retour à mes résultats' : 'Retour à la formation'}
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="p-4 mb-6 bg-gray-100 rounded-lg">
                <p className="text-lg">Score : <span className="font-bold">{resultat.score.toFixed(2)}%</span></p>
              </div>
              
              <div className="space-y-6">
                {quiz.questions.map((question, index) => (
                  <QuizQuestion
                    key={question.id}
                    question={question}
                    index={index}
                    onAnswer={() => {}}
                    selectedAnswer={resultat.reponses[question.id]}
                    showCorrect={true}
                    disabled={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
