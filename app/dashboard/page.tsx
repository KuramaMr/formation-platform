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
  const { getCoursByFormation, loading: coursLoading } = useCours();
  const { getQuizByCours, getResultatsEleve, getQuizzesByFormateur, loading: quizLoading } = useQuiz();
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
          setQuizzes(quizzesData);
          
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
        }
        
        setFormations(formationsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, userData, authLoading, router]);
  
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
                className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
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
      
      {userData?.role === 'formateur' && (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
                <Link href="/formations" className="font-medium text-indigo-600 hover:text-indigo-500">
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
                <Link href="/quiz" className="font-medium text-indigo-600 hover:text-indigo-500">
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
      )}
      
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
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
                >
                  Créer ma première formation
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {formations.map((formation) => (
              <li key={formation.id} className="hover:bg-gray-50">
                <Link href={`/formations/${formation.id}`} className="block">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-lg">
                            {formation.titre ? formation.titre.charAt(0) : '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {formation.titre || 'Sans titre'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {formation.description?.substring(0, 100) || 'Aucune description'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        {userData?.role === 'formateur' ? (
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {formation.studentCount || 0} élève(s)
                          </p>
                        ) : (
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Inscrit(e) le {formatDate(formation.dateInscription)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Créée le {formatDate(formation.createdAt)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <p>
                          {formation.duration || 'Durée non spécifiée'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {userData?.role === 'formateur' && quizzes.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Mes quiz récents
            </h2>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {quizzes.slice(0, 5).map((quiz) => (
              <li key={quiz.id} className="hover:bg-gray-50">
                <Link href={`/quiz/${quiz.id}`} className="block">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-medium text-lg">
                            Q
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {quiz.titre || 'Sans titre'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {quiz.questions?.length || 0} question(s)
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {'Sans formation'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          
          {quizzes.length > 5 && (
            <div className="bg-gray-50 px-4 py-3 text-center">
              <Link href="/quiz" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
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
        
        <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/formations" className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg flex items-center transition-colors duration-200">
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
              <Link href="/quiz" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex items-center transition-colors duration-200">
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
              
              <Link href="/signatures/gestion" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center transition-colors duration-200">
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
            <Link href="/resultats/eleve" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center transition-colors duration-200">
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