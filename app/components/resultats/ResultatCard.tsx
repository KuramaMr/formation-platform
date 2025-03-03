import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResultatQuiz } from '../../types';
import useQuiz from '../../hooks/useQuiz';
import { useAuth } from '../../contexts/AuthContext';

interface ResultatCardProps {
  resultat: ResultatQuiz;
  showEleve?: boolean;
}

export default function ResultatCard({ resultat, showEleve = false }: ResultatCardProps) {
  const { getQuizById } = useQuiz();
  const { getUserData } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [eleveData, setEleveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const quizData = await getQuizById(resultat.quizId);
      setQuiz(quizData);
      
      if (showEleve) {
        const userData = await getUserData(resultat.eleveId);
        setEleveData(userData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [resultat]);
  
  if (loading) {
    return (
      <div className="p-4 border border-gray-300 rounded-md animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="p-4 border border-gray-300 rounded-md hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {quiz?.titre || 'Quiz non trouvé'}
          </h3>
          {showEleve && eleveData && (
            <p className="text-sm text-gray-600">
              Élève : {eleveData.displayName || eleveData.email}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Complété le {formattedDate}
          </p>
        </div>
        <div className={`text-xl font-bold ${getScoreColor(resultat.score)}`}>
          {resultat.score.toFixed(1)}%
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <Link 
          href={`/quiz/${resultat.quizId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Voir le quiz
        </Link>
        
        <Link 
          href={`/resultats/${resultat.id}`}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Détails
        </Link>
      </div>
    </div>
  );
}
