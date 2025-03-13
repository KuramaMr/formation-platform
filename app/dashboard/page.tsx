'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import useFormations from '../hooks/useFormations';
import useCours from '../hooks/useCours';
import useQuiz from '../hooks/useQuiz';

export default function DashboardPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormations, getFormationsFormateur, getFormationsEleve } = useFormations();
  const { getCoursByFormation, loading: coursLoading, getCoursById } = useCours();
  const { getQuizByCours, getResultatsEleve, getQuizzesByFormateur, getQuizById, loading: quizLoading } = useQuiz();
  const router = useRouter();
  
  const [formations, setFormations] = useState<any[]>([]);
  const [cours, setCours] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [resultats, setResultats] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    const fetchData = async () => {
      try {
        let formationsData = [];
        
        if (userData?.role === 'formateur') {
          formationsData = await getFormationsFormateur(user.uid);
          
          const quizzesData = await getQuizzesByFormateur(user.uid);
          
          // Enrichir les quiz avec les informations de cours et formation
          const enrichedQuizzes = [];
          for (const quiz of quizzesData) {
            const cours = await getCoursById(quiz.coursId);
            if (cours) {
              const formation = formationsData.find(f => f.id === cours.formationId);
              enrichedQuizzes.push({
                ...quiz,
                coursTitle: cours.titre,
                formationTitle: formation ? formation.titre : 'Sans formation',
                formationId: cours.formationId
              });
            } else {
              enrichedQuizzes.push({
                ...quiz,
                coursTitle: 'Cours inconnu',
                formationTitle: 'Sans formation',
                formationId: null
              });
            }
          }
          
          setQuizzes(enrichedQuizzes);
          
          const totalStudents = formationsData.reduce((acc, formation) => {
            return acc + (formation.studentCount || 0);
          }, 0);
          
          setStats({
            totalFormations: formationsData.length,
            totalQuizzes: quizzesData.length,
            totalStudents,
            recentActivity: []
          });
        } else if (userData?.role === 'eleve') {
          formationsData = await getFormationsEleve(user.uid);
          
          const resultatsData = await getResultatsEleve(user.uid);
          setResultats(resultatsData);
          
          if (resultatsData.length > 0) {
            const quizIds = [...new Set(resultatsData.map(r => r.quizId))];
            const quizPromises = quizIds.map(id => getQuizById(id));
            const quizData = await Promise.all(quizPromises);
            setQuizzes(quizData.filter(q => q !== null));
          }
        }
        
        setFormations(formationsData || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, userData, authLoading, router, getFormationsFormateur, getFormationsEleve, getQuizzesByFormateur, getResultatsEleve, getQuizById, getCoursById]);
  
  const formatDate = (date: any) => {
    if (!date) return 'Date inconnue';
    
    try {
      let dateObj;
      
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Format de date invalide';
      }
      
      if (isNaN(dateObj.getTime())) {
        return 'Date invalide';
      }
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Erreur de date';
    }
  };
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord
            </h1>
            <p className="mt-1 text-lg text-gray-500">
              Bienvenue, {userData?.displayName || user?.email}
            </p>
          </div>
          
          {userData?.role === 'formateur' && (
            <div className="mt-4 md:mt-0">
              <Link
                href="/formations/create"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white border border-indigo-700 shadow-[0_5px_0_0_#4338ca,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-700 transition-all duration-75"
              >
                <svg className="-ml-0.5 mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Créer une formation
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xxs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Formations
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.totalFormations}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/formations" className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-50 transition-all duration-75">
              Voir toutes les formations
            </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Quiz
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.totalQuizzes}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/quiz" className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-50 transition-all duration-75">
                Gérer les quiz
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Élèves inscrits
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.totalStudents}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-indigo-600">
                Total des élèves inscrits
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Activité récente
        </h2>
        
        <div className="bg-white shadow rounded-lg p-6">
          {userData?.role === 'formateur' && (
            <div>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <ul className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <li key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md">
                      {/* Contenu de l'activité */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">
                  Aucune activité récente.
                </p>
              )}
            </div>
          )}
          
          {userData?.role === 'eleve' && (
            <div>
              {resultats && resultats.length > 0 ? (
                <ul className="space-y-4">
                  {resultats.slice(0, 5).map((resultat) => {
                    const quiz = quizzes.find(q => q?.id === resultat.quizId);
                    return (
                      <li key={resultat.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-medium text-lg">Q</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {quiz ? quiz.titre : 'Quiz inconnu'}
                            </p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              resultat.score >= 70 ? 'bg-green-100 text-green-800' : 
                              resultat.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {resultat.score.toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Complété le {formatDate(resultat.completedAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-gray-500">
                  Aucune activité récente. Complétez des quiz pour voir vos résultats ici.
                </p>
              )}
              
              {resultats.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/resultats/eleve" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-50 transition-all duration-75">
                    Voir tous mes résultats
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {userData?.role === 'formateur' ? 'Mes formations' : 'Formations auxquelles je suis inscrit(e)'}
          </h2>
        </div>
        
        {formations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {userData?.role === 'formateur' 
              ? "Vous n'avez pas encore créé de formation." 
              : "Vous n'êtes inscrit(e) à aucune formation."}
            
            {userData?.role === 'formateur' && (
              <div className="mt-4">
                <Link
                  href="/formations/create"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white border border-indigo-700 shadow-[0_5px_0_0_#4338ca,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-700 transition-all duration-75"
                >
                  Créer ma première formation
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Mes formations récentes</h2>
            
            <div className="space-y-4">
              {formations.map((formation) => (
                <div key={formation.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm sm:text-base font-medium">{formation.titre.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/formations/${formation.id}`}
                        className="text-sm sm:text-base font-medium text-indigo-600 hover:text-indigo-800 line-clamp-1 inline-flex items-center px-2 py-1 rounded-md border border-transparent hover:border-gray-200 shadow-[0_2px_0_0_transparent] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] active:bg-indigo-50 transition-all duration-75"
                      >
                        {formation.titre}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">
                        {formation.description || "Aucune description"}
                      </p>
                      
                      <div className="mt-2 flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Créée le {formatDate(formation.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Durée non spécifiée</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {formation.studentCount !== undefined && (
                    <div className="mt-2 flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {formation.studentCount} élève(s)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {userData?.role === 'formateur' && quizzes.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Mes quiz récents
            </h2>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Mes quiz récents</h2>
            
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm sm:text-base font-medium">Q</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/quiz/${quiz.id}`}
                        className="text-sm sm:text-base font-medium text-indigo-600 hover:text-indigo-800 line-clamp-1 inline-flex items-center px-2 py-1 rounded-md border border-transparent hover:border-gray-200 shadow-[0_2px_0_0_transparent] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] active:bg-indigo-50 transition-all duration-75"
                      >
                        {quiz.titre}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {quiz.questions?.length || 0} question(s)
                      </p>
                      
                      {quiz.formationTitre && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {quiz.formationTitre}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {quizzes.length > 5 && (
            <div className="bg-gray-50 px-4 py-3 text-center">
              <Link href="/quiz" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-50 transition-all duration-75">
                Voir tous les quiz
              </Link>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Liens rapides
          </h2>
        </div>
        
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/formations" className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg flex items-center transition-colors duration-200 border border-indigo-100 shadow-[0_5px_0_0_#e0e7ff,0_5px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_0_0_#e0e7ff,0_3px_6px_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-100 transition-all duration-75">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-indigo-800">Formations</h3>
              <p className="text-sm text-indigo-600">Accéder à toutes les formations</p>
            </div>
          </Link>
          
          {userData?.role === 'formateur' && (
            <>
              <Link href="/quiz" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex items-center transition-colors duration-200 border border-green-100 shadow-[0_5px_0_0_#dcfce7,0_5px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_0_0_#dcfce7,0_3px_6px_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-green-100 transition-all duration-75">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-800">Quiz</h3>
                  <p className="text-sm text-green-600">Gérer vos quiz</p>
                </div>
              </Link>
              
              <Link href="/signatures/gestion" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center transition-colors duration-200 border border-purple-100 shadow-[0_5px_0_0_#f3e8ff,0_5px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_0_0_#f3e8ff,0_3px_6px_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-purple-100 transition-all duration-75">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-purple-800">Signatures</h3>
                  <p className="text-sm text-purple-600">Gérer les signatures</p>
                </div>
              </Link>
            </>
          )}
          
          {userData?.role === 'eleve' && (
            <Link href="/resultats/eleve" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center transition-colors duration-200 border border-blue-100 shadow-[0_5px_0_0_#dbeafe,0_5px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_0_0_#dbeafe,0_3px_6px_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-blue-100 transition-all duration-75">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-blue-800">Mes résultats</h3>
                <p className="text-sm text-blue-600">Voir mes résultats de quiz</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 