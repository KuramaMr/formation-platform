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

export default function QuizPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getQuizById, soumettreResultat, deleteQuiz, deleteQuizResults, aDejaCompleteQuiz, getResultatsEleve, loading: quizLoading, error } = useQuiz();
  const { getCoursById } = useCours();
  const { getFormationById, estInscrit } = useFormations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [cours, setCours] = useState<any>(null);
  const [formation, setFormation] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [reponses, setReponses] = useState<{ [questionId: string]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultat, setResultat] = useState<ResultatQuiz | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [dejaComplete, setDejaComplete] = useState(false);
  const [ancienResultat, setAncienResultat] = useState<any>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!mounted || authLoading) return;
      
      setCheckingAuth(true);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      const quizResult = await getQuizById(id);
      
      if (!quizResult) {
        router.push('/formations');
        return;
      }
      
      setQuiz(quizResult);
      
      const coursResult = await getCoursById(quizResult.coursId);
      
      if (!coursResult) {
        router.push('/formations');
        return;
      }
      
      setCours(coursResult);
      
      const formationResult = await getFormationById(coursResult.formationId);
      
      if (!formationResult) {
        router.push('/formations');
        return;
      }
      
      setFormation(formationResult);
      
      // Vérifier si l'utilisateur est autorisé à voir ce quiz
      if (userData?.role === 'formateur') {
        if (formationResult.formateurId === user.uid) {
          setAuthorized(true);
        }
      } else if (userData?.role === 'eleve') {
        const inscrit = await estInscrit(formationResult.id, user.uid);
        if (inscrit) {
          setAuthorized(true);
          
          // Vérifier si l'élève a déjà complété ce quiz
          const aDejaFait = await aDejaCompleteQuiz(id, user.uid);
          setDejaComplete(aDejaFait);
          
          if (aDejaFait) {
            // Récupérer les résultats de l'élève pour ce quiz
            const resultats = await getResultatsEleve(user.uid);
            const resultatQuiz = resultats.find(r => r.quizId === id);
            if (resultatQuiz) {
              setAncienResultat(resultatQuiz);
            }
          }
        }
      }
      
      setCheckingAuth(false);
    };
    
    fetchQuiz();
  }, [mounted, authLoading, user, userData, id, router]);
  
  const handleAnswer = (questionId: string, reponse: number) => {
    setReponses(prev => ({
      ...prev,
      [questionId]: reponse
    }));
  };
  
  const handleSubmit = async () => {
    if (!quiz || !user) return;
    
    // Vérifier que toutes les questions ont une réponse
    const allQuestionsAnswered = quiz.questions.every(q => reponses[q.id] !== undefined);
    
    if (!allQuestionsAnswered) {
      alert('Veuillez répondre à toutes les questions avant de soumettre.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await soumettreResultat(quiz.id, reponses);
      
      if (result) {
        setResultat(result);
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du quiz:", error);
      alert("Une erreur est survenue lors de la soumission du quiz. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteQuiz = async () => {
    if (!quiz || !user) {
      alert('Vous devez être connecté pour effectuer cette action.');
      return;
    }
    
    // Demander confirmation avant de supprimer
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      // Afficher un message de chargement
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
      loadingMessage.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-lg">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p class="mt-2 text-center">Suppression en cours...</p>
        </div>
      `;
      document.body.appendChild(loadingMessage);
      
      const success = await deleteQuiz(quiz.id);
      
      // Supprimer le message de chargement
      document.body.removeChild(loadingMessage);
      
      if (success) {
        // Rediriger vers la page du cours après la suppression
        router.push(`/cours/${quiz.coursId}`);
      } else {
        alert('Une erreur est survenue lors de la suppression du quiz. Veuillez réessayer plus tard.');
      }
    } catch (err: any) {
      console.error("Erreur détaillée:", err);
      alert(`Erreur lors de la suppression : ${err.message || 'Une erreur inconnue est survenue'}`);
    }
  };
  
  const handleDeleteResults = async () => {
    if (!quiz || !user) return;
    
    // Demander confirmation avant de supprimer les résultats
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les résultats de ce quiz ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      const success = await deleteQuizResults(quiz.id);
      
      if (success) {
        alert('Tous les résultats de ce quiz ont été supprimés avec succès.');
      } else {
        alert('Une erreur est survenue lors de la suppression des résultats.');
      }
    } catch (err) {
      console.error("Erreur détaillée:", err);
      alert(`Erreur lors de la suppression des résultats : ${err instanceof Error ? err.message : 'Une erreur inconnue est survenue'}`);
    }
  };
  
  if (!mounted || authLoading || quizLoading || !quiz || checkingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!authorized && !submitting) {
    return (
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Accès non autorisé
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Vous n'êtes pas autorisé à accéder à ce quiz. Veuillez vous inscrire à la formation correspondante.
                </p>
              </div>
              <div className="mt-5">
                <Link href="/formations" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Retour aux formations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (userData?.role === 'eleve' && dejaComplete && ancienResultat) {
    return (
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{quiz.titre}</h1>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  ancienResultat.score >= 70 ? 'bg-green-100 text-green-800' : 
                  ancienResultat.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {ancienResultat.score.toFixed(0)}%
                </span>
              </div>
              
              <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Quiz déjà complété</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Vous avez déjà complété ce quiz. Vous ne pouvez pas le refaire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Votre résultat</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Vous avez obtenu un score de <span className="font-semibold">{ancienResultat.score.toFixed(0)}%</span>.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Link href={`/cours/${cours.id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Retour au cours
                </Link>
                <Link href="/resultats/eleve" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Voir tous mes résultats
                </Link>
              </div>
            </div>
          </div>
        </div>
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              {quiz.titre}
            </h1>
            {userData?.role === 'formateur' && (
              <div className="flex space-x-2">
                <Link 
                  href={`/quiz/edit/${quiz.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Modifier
                </Link>
                <button 
                  onClick={handleDeleteQuiz}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
                <button 
                  onClick={handleDeleteResults}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Supprimer résultats
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-lg text-gray-700">{quiz.description}</p>
          <div className="mt-2">
            <Link 
              href={`/cours/${cours?.id}`}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Retour au cours: {cours?.titre}
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {submitted ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Résultats</h2>
                <div className="p-4 mb-6 bg-gray-100 rounded-lg">
                  <p className="text-lg">
                    Votre score : 
                    <span className={`font-bold ${
                      resultat?.score && resultat.score >= 80 ? 'text-green-600' : 
                      resultat?.score && resultat.score >= 60 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {resultat?.score.toFixed(2)}%
                    </span>
                  </p>
                </div>
                
                <div className="space-y-6">
                  {quiz.questions.map((question, index) => (
                    <QuizQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      onAnswer={() => {}}
                      selectedAnswer={reponses[question.id]}
                      showCorrect={true}
                      disabled={true}
                    />
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Link 
                    href={`/cours/${cours?.id}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Retour au cours
                  </Link>
                  
                  <Link 
                    href={`/formations/${formation?.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Retour à la formation
                  </Link>
                </div>
              </div>
            ) : submitting ? (
              <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-gray-700">Traitement de vos réponses en cours...</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-6">
                  {quiz.questions.map((question, index) => (
                    <QuizQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      onAnswer={handleAnswer}
                      selectedAnswer={reponses[question.id]}
                    />
                  ))}
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={handleSubmit}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Soumettre les réponses
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
