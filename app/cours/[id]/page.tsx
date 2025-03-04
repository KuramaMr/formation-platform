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
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                {cours.titre}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Formation : <Link href={`/formations/${formation.id}`} className="text-indigo-600 hover:text-indigo-500">{formation.titre}</Link>
              </p>
            </div>
            
            {isFormateur && (
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Link
                  href={`/cours/edit/${cours.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Modifier
                </Link>
                
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                >
                  {loading ? 'Chargement...' : 'Supprimer'}
                </button>
                
                <Link
                  href={`/quiz/create?coursId=${cours.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
          
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: cours.contenu }} />
              </div>
              
              {cours.presentationUrl && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
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
                      className="min-h-[500px] relative z-10"
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
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
                Quiz
              </h2>
              
              {quizLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : quiz.length === 0 ? (
                <div className="mt-4 bg-white shadow rounded-lg p-6">
                  <p className="text-gray-500">
                    Aucun quiz disponible pour ce cours.
                  </p>
                  
                  {isFormateur && (
                    <div className="mt-4">
                      <Link
                        href={`/quiz/create?coursId=${cours.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Créer un quiz
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {quiz.map((q) => (
                    <div key={q.id} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {q.titre}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {q.description}
                      </p>
                      
                      <div className="mt-4 flex space-x-3">
                        <Link
                          href={`/quiz/${q.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {isFormateur ? 'Voir le quiz' : 'Passer le quiz'}
                        </Link>
                        
                        {isFormateur && (
                          <Link
                            href={`/quiz/edit/${q.id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
