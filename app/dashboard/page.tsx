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
  const { getFormations, loading: formationsLoading } = useFormations();
  const { getCoursByFormation, loading: coursLoading } = useCours();
  const { getQuizByCours, getResultatsEleve, loading: quizLoading } = useQuiz();
  const router = useRouter();
  
  const [formations, setFormations] = useState<any[]>([]);
  const [cours, setCours] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [resultats, setResultats] = useState<any[]>([]);
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
      
      try {
        // Récupérer les formations
        const formationsData = await getFormations();
        setFormations(formationsData);
        
        // Si l'utilisateur est un élève, récupérer ses résultats
        if (userData?.role === 'eleve') {
          const resultatsData = await getResultatsEleve(user.uid);
          setResultats(resultatsData);
        }
        
        // Si des formations existent, récupérer les cours de la première formation
        if (formationsData.length > 0) {
          const coursData = await getCoursByFormation(formationsData[0].id);
          setCours(coursData);
          
          // Si des cours existent, récupérer les quiz du premier cours
          if (coursData.length > 0) {
            const quizzesData = await getQuizByCours(coursData[0].id);
            setQuizzes(quizzesData);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      }
    };
    
    fetchData();
  }, [mounted, authLoading, user, userData, router]);
  
  if (!mounted || authLoading || formationsLoading || coursLoading || quizLoading) {
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
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Tableau de bord
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Statistiques */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Formations
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {formations.length}
                    </dd>
                  </dl>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/formations" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Voir toutes les formations
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Cours
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {cours.length}
                    </dd>
                  </dl>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/formations" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Voir tous les cours
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Quiz
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {quizzes.length}
                    </dd>
                  </dl>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/formations" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Voir tous les quiz
                    </Link>
                  </div>
                </div>
              </div>
              
              {userData?.role === 'eleve' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Résultats
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {resultats.length}
                      </dd>
                    </dl>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link href="/resultats/eleve" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Voir tous mes résultats
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Activité récente */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Activité récente</h2>
              <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
                {userData?.role === 'eleve' && resultats.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {resultats.slice(0, 5).map((resultat) => (
                      <li key={resultat.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Quiz complété</p>
                            <p className="text-sm text-gray-500">
                              Score: {resultat.score.toFixed(2)}%
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(resultat.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray-500">Aucune activité récente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 