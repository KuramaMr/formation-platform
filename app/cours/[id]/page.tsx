'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import useCours from '../../hooks/useCours';
import useFormations from '../../hooks/useFormations';
import useQuiz from '../../hooks/useQuiz';
import { Cours, Formation, Quiz } from '../../types';

export default function CoursDetails() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getCoursById, deleteCours, loading: coursLoading, error: coursError } = useCours();
  const { getFormationById, estInscrit, loading: formationLoading, error: formationError } = useFormations();
  const { getQuizByCours, loading: quizLoading, error: quizError } = useQuiz();
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [cours, setCours] = useState<Cours | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [inscrit, setInscrit] = useState(false);
  const [isFormateur, setIsFormateur] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!mounted || authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      // Récupérer le cours
      const coursResult = await getCoursById(id);
      
      if (!coursResult) {
        router.push('/formations');
        return;
      }
      
      setCours(coursResult);
      
      // Récupérer la formation
      const formationResult = await getFormationById(coursResult.formationId);
      
      if (!formationResult) {
        router.push('/formations');
        return;
      }
      
      setFormation(formationResult);
      
      // Vérifier si l'utilisateur est le formateur
      const isUserFormateur = userData?.role === 'formateur' && formationResult.formateurId === user.uid;
      setIsFormateur(isUserFormateur);
      
      // Si l'utilisateur est un élève, vérifier s'il est inscrit à la formation
      if (userData?.role === 'eleve') {
        const inscritResult = await estInscrit(formationResult.id, user.uid);
        setInscrit(inscritResult);
        
        // Si l'élève n'est pas inscrit, rediriger vers la page de la formation
        if (!inscritResult) {
          router.push(`/formations/${formationResult.id}`);
          return;
        }
      }
      
      // Récupérer les quiz associés au cours
      const quizResult = await getQuizByCours(id);
      setQuiz(quizResult);
    };
    
    fetchData();
  }, [mounted, authLoading, user, userData, id, router]);
  
  const handleDelete = async () => {
    if (!isFormateur || !cours) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        setLoading(true);
        setError(null);
        
        const success = await deleteCours(cours.id);
        
        if (success && formation) {
          router.push(`/formations/${formation.id}`);
        }
      } catch (error: any) {
        setError(error.message || 'Une erreur est survenue lors de la suppression du cours');
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (!mounted || authLoading || coursLoading || formationLoading || !cours || !formation) {
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-gray-900">
                {cours.titre}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Formation : <Link href={`/formations/${formation.id}`} className="text-indigo-600 hover:text-indigo-500">{formation.titre}</Link>
              </p>
            </div>
            
            {isFormateur && (
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 sm:space-x-3">
                <Link
                  href={`/cours/edit/${cours.id}`}
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-sm font-medium rounded-md shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-gray-50 text-gray-700 bg-white transition-all duration-75"
                >
                  Modifier
                </Link>
                
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-red-700 text-sm font-medium rounded-md shadow-[0_3px_0_0_#b91c1c,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#b91c1c,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-red-700 text-white bg-red-600 disabled:bg-red-300 transition-all duration-75"
                >
                  {loading ? 'Chargement...' : 'Supprimer'}
                </button>
                
                <Link
                  href={`/quiz/create?coursId=${cours.id}`}
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-green-700 text-sm font-medium rounded-md shadow-[0_3px_0_0_#15803d,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#15803d,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-green-700 text-white bg-green-600 transition-all duration-75"
                >
                  Ajouter un quiz
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {(error || coursError || formationError) && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error || coursError || formationError}
            </div>
          )}
          
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <div className="prose prose-sm sm:prose max-w-none overflow-x-auto mx-auto light-theme">
                <div dangerouslySetInnerHTML={{ __html: cours.contenu }} />
              </div>
              
              {cours.presentationUrl && (
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4">
                    Présentation PowerPoint
                  </h3>
                  <div className="aspect-[16/9] w-full relative">
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                    
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(cours.presentationUrl)}&embedded=true`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      className="min-h-[300px] sm:min-h-[500px] relative z-10"
                      loading="lazy"
                      onLoad={(e) => {
                        if (e.target.parentElement) {
                          const loadingDiv = e.target.parentElement.querySelector('div');
                          if (loadingDiv) loadingDiv.style.display = 'none';
                        }
                      }}
                    ></iframe>
                  </div>
                  <div className="mt-2">
                    <a 
                      href={cours.presentationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Télécharger la présentation
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 sm:mt-8">
              <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-gray-900">
                Quiz
              </h2>
              
              {quizLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : quiz.length === 0 ? (
                <div className="mt-4 bg-white shadow rounded-lg p-4 sm:p-6">
                  <p className="text-gray-500">
                    Aucun quiz disponible pour ce cours.
                  </p>
                  
                  {isFormateur && (
                    <div className="mt-4">
                      <Link
                        href={`/quiz/create?coursId=${cours.id}`}
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-indigo-700 text-sm font-medium rounded-md shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#4338ca,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-700 text-white bg-indigo-600 transition-all duration-75"
                      >
                        Créer un quiz
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3 sm:space-y-4">
                  {quiz.map((q) => (
                    <div key={q.id} className="bg-white shadow rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                        {q.titre}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {q.description}
                      </p>
                      
                      <div className="mt-4 flex flex-wrap gap-2 sm:space-x-3">
                        <Link
                          href={`/quiz/${q.id}`}
                          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-indigo-700 bg-indigo-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
                        >
                          {isFormateur ? 'Voir le quiz' : 'Passer le quiz'}
                        </Link>
                        
                        {isFormateur && (
                          <Link
                            href={`/quiz/edit/${q.id}`}
                            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-gray-700 bg-white text-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
                          >
                            Modifier
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
