'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useQuiz from '../../hooks/useQuiz';
import Link from 'next/link';
import { ResultatQuiz, Quiz } from '../../types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ResultatsElevePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getResultatsEleve, loading: quizLoading, error } = useQuiz();
  const router = useRouter();
  
  const [resultats, setResultats] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchResultats = async () => {
      if (!mounted || authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      // Vérifier que l'utilisateur est un élève
      if (userData?.role !== 'eleve') {
        router.push('/resultats');
        return;
      }
      
      try {
        setLoading(true);
        
        // Récupérer les résultats de l'élève
        const resultatsData = await getResultatsEleve(user.uid);
        
        // Récupérer les informations des quiz associés
        const resultsWithQuizPromises = resultatsData.map(async (resultat) => {
          try {
            const quizDoc = await getDoc(doc(db, 'quiz', resultat.quizId));
            if (quizDoc.exists()) {
              return {
                ...resultat,
                quiz: {
                  id: quizDoc.id,
                  ...quizDoc.data()
                }
              };
            } else {
              return {
                ...resultat,
                quiz: null
              };
            }
          } catch (error) {
            console.error("Erreur lors de la récupération du quiz:", error);
            return {
              ...resultat,
              quiz: null
            };
          }
        });
        
        const finalResults = await Promise.all(resultsWithQuizPromises);
        setResultats(finalResults);
      } catch (error) {
        console.error("Erreur lors de la récupération des résultats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResultats();
  }, [mounted, authLoading, user, userData, router]);
  
  const generateStudentPDF = async (eleveId: string, eleveNom: string) => {
    try {
      const eleveResultats = resultats.filter(r => r.eleveId === eleveId);
      
      if (eleveResultats.length === 0) {
        alert('Aucun résultat trouvé pour cet élève.');
        return;
      }
      
      // Importation dynamique de jspdf et jspdf-autotable
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Ajouter le titre et les informations
      doc.setFontSize(18);
      doc.text(`Résultats de l'élève: ${eleveNom}`, 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Email: ${eleveResultats[0].eleve?.email || 'Email inconnu'}`, 14, 30);
      doc.text(`Nombre de quiz complétés: ${eleveResultats.length}`, 14, 37);
      
      const averageScore = eleveResultats.reduce((sum, result) => sum + result.score, 0) / eleveResultats.length;
      doc.text(`Score moyen: ${averageScore.toFixed(2)}%`, 14, 44);
      
      // Créer le tableau des résultats
      const tableColumn = ["Quiz", "Score", "Date de complétion"];
      const tableRows = eleveResultats.map(result => [
        result.quiz?.titre || 'Quiz non trouvé',
        `${result.score.toFixed(2)}%`,
        new Date(result.completedAt).toLocaleString()
      ]);
      
      // Ajouter le tableau au document - utiliser autoTable comme fonction
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 51,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Enregistrer le PDF
      doc.save(`resultats_eleve_${eleveId}.pdf`);
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  };
  
  const generateQuizPDF = async (quizId: string, quizResults: any[]) => {
    try {
      const quiz = quizResults[0].quiz;
      if (!quiz) {
        alert('Impossible de générer le PDF : informations du quiz manquantes.');
        return;
      }
      
      // Importation dynamique de jspdf et jspdf-autotable
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Ajouter le titre et les informations
      doc.setFontSize(18);
      doc.text(`Résultats du quiz: ${quiz.titre}`, 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Description: ${quiz.description || 'Aucune description'}`, 14, 30);
      doc.text(`Nombre de questions: ${quiz.questions?.length || 0}`, 14, 37);
      doc.text(`Nombre de participants: ${quizResults.length}`, 14, 44);
      
      const averageScore = quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length;
      doc.text(`Score moyen: ${averageScore.toFixed(2)}%`, 14, 51);
      doc.text(`Généré le: ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`, 14, 58);
      
      // Créer le tableau des résultats
      const tableColumn = ["Élève", "Email", "Score", "Date de complétion"];
      const tableRows = quizResults.map(result => [
        result.eleve?.displayName || 'Élève inconnu',
        result.eleve?.email || 'Email inconnu',
        `${result.score.toFixed(2)}%`,
        new Date(result.completedAt).toLocaleString()
      ]);
      
      // Ajouter le tableau au document - utiliser autoTable comme fonction
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Enregistrer le PDF
      doc.save(`resultats_quiz_${quizId}.pdf`);
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  };
  
  const generateAllResultsPDF = async () => {
    try {
      // Importation dynamique de jspdf et jspdf-autotable
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Ajouter le titre et les informations
      doc.setFontSize(18);
      doc.text('Tous les résultats', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Nombre total de résultats: ${resultats.length}`, 14, 30);
      doc.text(`Généré le: ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`, 14, 37);
      
      // Résumé par quiz
      doc.setFontSize(14);
      doc.text('Résumé par quiz', 14, 47);
      
      const quizTableColumn = ["Quiz", "Participants", "Score moyen"];
      const quizTableRows = Object.entries(resultsByQuiz).map(([quizId, quizResults]: [string, any]) => {
        const typedResults = quizResults as any[];
        const averageScore = typedResults.reduce((sum, r) => sum + r.score, 0) / typedResults.length;
        return [
          typedResults[0].quiz?.titre || 'Quiz non trouvé',
          typedResults.length.toString(),
          `${averageScore.toFixed(2)}%`
        ];
      });
      
      // Ajouter le tableau au document - utiliser autoTable comme fonction
      autoTable(doc, {
        head: [quizTableColumn],
        body: quizTableRows,
        startY: 52,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Enregistrer le PDF
      doc.save('tous_les_resultats.pdf');
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  };
  
  if (!mounted || authLoading || loading) {
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
            Mes résultats de quiz
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {resultats.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500">Vous n&apos;avez pas encore de résultats.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {resultats.map((resultat) => (
                  <div key={resultat.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {resultat.quiz ? resultat.quiz.titre : 'Quiz non trouvé'}
                      </h2>
                      {resultat.quiz && (
                        <p className="mt-1 text-sm text-gray-500">
                          {resultat.quiz.description}
                        </p>
                      )}
                    </div>
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Score :</span>
                        <span className={`text-sm font-semibold ${
                          resultat.score >= 80 ? 'text-green-600' : 
                          resultat.score >= 60 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {resultat.score.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            resultat.score >= 80 ? 'bg-green-600' : 
                            resultat.score >= 60 ? 'bg-yellow-600' : 
                            'bg-red-600'
                          }`} 
                          style={{ width: `${resultat.score}%` }}
                        ></div>
                      </div>
                      <p className="mt-4 text-sm text-gray-500">
                        Complété le {new Date(resultat.completedAt).toLocaleDateString()} à {new Date(resultat.completedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="px-6 py-4 bg-gray-50">
                      {resultat.quiz ? (
                        <Link 
                          href={`/resultats/${resultat.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Voir les détails
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">Quiz non disponible</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 