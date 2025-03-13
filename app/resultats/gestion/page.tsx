'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useQuiz from '../../hooks/useQuiz';
import Link from 'next/link';
import { collection, doc, getDoc, getDocs, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function GestionResultatsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { deleteQuizResults, loading: quizLoading, error } = useQuiz();
  const router = useRouter();
  
  const [resultats, setResultats] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Références pour les PDF
  const quizPdfRef = useRef(null);
  const studentPdfRef = useRef(null);
  const allResultsPdfRef = useRef(null);
  
  // États pour stocker les données du PDF actuel
  const [currentQuizData, setCurrentQuizData] = useState(null);
  const [currentStudentData, setCurrentStudentData] = useState(null);
  const [showQuizPdf, setShowQuizPdf] = useState(false);
  const [showStudentPdf, setShowStudentPdf] = useState(false);
  const [showAllResultsPdf, setShowAllResultsPdf] = useState(false);
  
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
      
      // Vérifier que l'utilisateur est un formateur
      if (userData?.role !== 'formateur') {
        router.push('/formations');
        return;
      }
      
      try {
        setLoading(true);
        
        // 1. D'abord, récupérer les formations du formateur
        const formationsRef = collection(db, 'formations');
        const formationsQuery = query(
          formationsRef,
          where('formateurId', '==', user.uid)
        );
        const formationsSnapshot = await getDocs(formationsQuery);
        
        // Si aucune formation, retourner un tableau vide
        if (formationsSnapshot.empty) {
          setResultats([]);
          return;
        }
        
        // 2. Récupérer les IDs des formations
        const formationIds = formationsSnapshot.docs.map(doc => doc.id);
        
        // 3. Récupérer tous les cours de ces formations
        const coursRef = collection(db, 'cours');
        const coursPromises = formationIds.map(async (formationId) => {
          const coursQuery = query(
            coursRef,
            where('formationId', '==', formationId)
          );
          return getDocs(coursQuery);
        });
        
        const coursSnapshots = await Promise.all(coursPromises);
        
        // 4. Récupérer les IDs des cours
        const coursIds = coursSnapshots
          .flatMap(snapshot => snapshot.docs)
          .map(doc => doc.id);
        
        // Si aucun cours, retourner un tableau vide
        if (coursIds.length === 0) {
          setResultats([]);
          return;
        }
        
        // 5. Récupérer tous les quiz de ces cours
        const quizIds = [];
        
        // Firestore ne permet pas de faire un where('coursId', 'in', coursIds) si coursIds contient plus de 10 éléments
        // On doit donc faire des requêtes par lots de 10
        for (let i = 0; i < coursIds.length; i += 10) {
          const batch = coursIds.slice(i, i + 10);
          
          const quizRef = collection(db, 'quiz');
          const quizQuery = query(
            quizRef,
            where('coursId', 'in', batch)
          );
          
          const quizSnapshot = await getDocs(quizQuery);
          
          quizSnapshot.forEach((doc) => {
            quizIds.push(doc.id);
          });
        }
        
        // Si aucun quiz, retourner un tableau vide
        if (quizIds.length === 0) {
          setResultats([]);
          return;
        }
        
        // 6. Récupérer tous les résultats de ces quiz
        const resultsData = [];
        
        // Firestore ne permet pas de faire un where('quizId', 'in', quizIds) si quizIds contient plus de 10 éléments
        // On doit donc faire des requêtes par lots de 10
        for (let i = 0; i < quizIds.length; i += 10) {
          const batch = quizIds.slice(i, i + 10);
          
          const resultsRef = collection(db, 'resultats');
          const resultsQuery = query(
            resultsRef,
            where('quizId', 'in', batch)
          );
          
          const resultsSnapshot = await getDocs(resultsQuery);
          
          resultsSnapshot.forEach((doc) => {
            resultsData.push({
              id: doc.id,
              ...doc.data()
            });
          });
        }
        
        // Récupérer les informations des quiz associés
        const quizPromises = resultsData.map(async (resultat) => {
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
            return {
              ...resultat,
              quiz: null
            };
          }
        });
        
        const resultsWithQuiz = await Promise.all(quizPromises);
        
        // Récupérer les informations des élèves
        const elevePromises = resultsWithQuiz.map(async (resultat) => {
          try {
            const eleveDoc = await getDoc(doc(db, 'users', resultat.eleveId));
            if (eleveDoc.exists()) {
              return {
                ...resultat,
                eleve: {
                  id: eleveDoc.id,
                  ...eleveDoc.data()
                }
              };
            } else {
              return {
                ...resultat,
                eleve: null
              };
            }
          } catch (error) {
            return {
              ...resultat,
              eleve: null
            };
          }
        });
        
        const finalResults = await Promise.all(elevePromises);
        
        setResultats(finalResults);
      } catch (error) {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    };
    
    fetchResultats();
  }, [mounted, authLoading, user, userData, router]);
  
  const handleDeleteResult = async (resultId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'resultats', resultId));
      
      // Mettre à jour la liste des résultats
      setResultats(prev => prev.filter(r => r.id !== resultId));
    } catch (error) {
      console.error("Erreur lors de la suppression du résultat:", error);
      alert('Une erreur est survenue lors de la suppression du résultat.');
    }
  };
  
  const handleDeleteQuizResults = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les résultats de ce quiz ?')) {
      return;
    }
    
    try {
      const success = await deleteQuizResults(quizId);
      
      if (success) {
        // Mettre à jour la liste des résultats
        setResultats(prev => prev.filter(r => r.quizId !== quizId));
        alert('Tous les résultats de ce quiz ont été supprimés avec succès.');
      } else {
        alert('Une erreur est survenue lors de la suppression des résultats.');
      }
    } catch (error) {
      console.error("Erreur lors de la suppression des résultats:", error);
      alert('Une erreur est survenue lors de la suppression des résultats.');
    }
  };
  
  const generateQuizPDF = async (quizId: string, quizResults: any[]) => {
    try {
      const quiz = quizResults[0].quiz;
      if (!quiz) {
        alert('Impossible de générer le PDF : informations du quiz manquantes.');
        return;
      }
      
      // Importation dynamique de jspdf
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      // Importer jspdf-autotable
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.autoTable;
      
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
  
  const generateStudentPDF = async (eleveId: string, eleveNom: string) => {
    try {
      const eleveResultats = resultats.filter(r => r.eleveId === eleveId);
      
      if (eleveResultats.length === 0) {
        alert('Aucun résultat trouvé pour cet élève.');
        return;
      }
      
      // Importation dynamique de jspdf
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      // Importer jspdf-autotable
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.autoTable;
      
      // Créer un nouveau document PDF
      const pdfDoc = new jsPDF();
      
      // Ajouter le titre et les informations
      pdfDoc.setFontSize(18);
      pdfDoc.text(`Résultats de l'élève: ${eleveNom}`, 14, 20);
      
      pdfDoc.setFontSize(12);
      pdfDoc.text(`Email: ${eleveResultats[0].eleve?.email || 'Email inconnu'}`, 14, 30);
      pdfDoc.text(`Nombre de quiz complétés: ${eleveResultats.length}`, 14, 37);
      
      const averageScore = eleveResultats.reduce((sum, result) => sum + result.score, 0) / eleveResultats.length;
      pdfDoc.text(`Score moyen: ${averageScore.toFixed(2)}%`, 14, 44);
      
      // Créer le tableau des résultats
      const tableColumn = ["Quiz", "Score", "Date de complétion"];
      const tableRows = eleveResultats.map(result => [
        result.quiz?.titre || 'Quiz non trouvé',
        `${result.score.toFixed(2)}%`,
        new Date(result.completedAt).toLocaleString()
      ]);
      
      // Ajouter le tableau au document - utiliser autoTable comme fonction
      autoTable(pdfDoc, {
        head: [tableColumn],
        body: tableRows,
        startY: 51,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Ajouter les détails des questions et réponses pour chaque quiz
      let yPosition = pdfDoc.lastAutoTable.finalY + 15;
      
      // Pour chaque résultat de quiz
      for (const resultat of eleveResultats) {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 250) {
          pdfDoc.addPage();
          yPosition = 20;
        }
        
        // Titre du quiz
        pdfDoc.setFontSize(14);
        pdfDoc.setFont(undefined, 'bold');
        pdfDoc.text(`Quiz: ${resultat.quiz?.titre || 'Quiz non trouvé'}`, 14, yPosition);
        yPosition += 10;
        
        try {
          // Récupérer les détails du quiz directement
          const quizDoc = await getDoc(doc(db, 'quiz', resultat.quizId));
          
          if (!quizDoc.exists()) {
            pdfDoc.setFontSize(11);
            pdfDoc.setFont(undefined, 'normal');
            pdfDoc.text('Détails du quiz non disponibles.', 14, yPosition);
            yPosition += 10;
            continue;
          }
          
          const quizData = quizDoc.data();
          
          // Vérifier si les questions sont dans le document du quiz
          if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
            pdfDoc.setFontSize(11);
            pdfDoc.setFont(undefined, 'normal');
            pdfDoc.text('Aucune question trouvée pour ce quiz.', 14, yPosition);
            yPosition += 10;
            continue;
          }
          
          // Récupérer les réponses de l'élève depuis le résultat
          const reponsesEleve = resultat.reponses || {};
          
          // Afficher chaque question
          for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];
            
            // Vérifier si on a besoin d'une nouvelle page
            if (yPosition > 270) {
              pdfDoc.addPage();
              yPosition = 20;
            }
            
            // Question
            pdfDoc.setFontSize(11);
            pdfDoc.setFont(undefined, 'bold');
            pdfDoc.text(`Question ${i+1}: ${question.texte || 'Question non disponible'}`, 14, yPosition);
            yPosition += 7;
            
            // Options (choix possibles)
            if (question.options && Array.isArray(question.options)) {
              pdfDoc.setFont(undefined, 'normal');
              pdfDoc.text('Options:', 20, yPosition);
              yPosition += 5;
              
              for (let j = 0; j < question.options.length; j++) {
                const option = question.options[j];
                // Vérifier si l'option est un objet ou une chaîne
                const optionText = typeof option === 'object' ? option.text || `Option ${j}` : option;
                pdfDoc.text(`${j}: ${optionText}`, 25, yPosition);
                yPosition += 5;
              }
              yPosition += 2;
            }
            
            // Réponse de l'élève
            pdfDoc.setFont(undefined, 'normal');
            
            // Essayer de trouver la réponse de l'élève
            let reponseEleve = "Réponse non disponible";
            let estCorrect = false;
            
            // Vérifier si nous avons la réponse de l'élève pour cette question
            if (question.id && reponsesEleve[question.id] !== undefined) {
              const reponseValue = reponsesEleve[question.id];
              
              // Convertir la réponse en texte
              if (Array.isArray(reponseValue)) {
                reponseEleve = reponseValue.join(', ');
              } else {
                reponseEleve = reponseValue.toString();
              }
              
              // Vérifier si la réponse est correcte
              if (question.reponseCorrecte !== undefined) {
                if (Array.isArray(question.reponseCorrecte)) {
                  // Pour les questions à choix multiples
                  const reponseEleveArray = Array.isArray(reponseValue) ? reponseValue : [reponseValue];
                  estCorrect = JSON.stringify(reponseEleveArray.sort()) === JSON.stringify(question.reponseCorrecte.sort());
                } else {
                  // Pour les questions à choix unique
                  estCorrect = reponseValue.toString() === question.reponseCorrecte.toString();
                }
              }
            }
            
            // Afficher la réponse de l'élève avec la couleur appropriée
            pdfDoc.setTextColor(estCorrect ? 0 : 255, estCorrect ? 128 : 0, 0);
            pdfDoc.text(`Réponse de l'élève: ${reponseEleve}`, 20, yPosition);
            yPosition += 7;
            
            // Réinitialiser la couleur pour le texte normal
            pdfDoc.setTextColor(0, 0, 0);
            
            // Réponse correcte
            if (question.reponseCorrecte !== undefined) {
              let reponseCorrecteTexte = '';
              
              if (Array.isArray(question.reponseCorrecte)) {
                reponseCorrecteTexte = question.reponseCorrecte.join(', ');
              } else {
                reponseCorrecteTexte = question.reponseCorrecte.toString();
              }
              
              // Afficher la réponse correcte en vert
              pdfDoc.setTextColor(0, 128, 0);
              pdfDoc.text(`Réponse correcte: ${reponseCorrecteTexte}`, 20, yPosition);
              pdfDoc.setTextColor(0, 0, 0); // Réinitialiser la couleur
              yPosition += 7;
            }
            
            // Statut (correct/incorrect) avec couleur et style plus visible
            pdfDoc.setFillColor(estCorrect ? 220 : 255, estCorrect ? 255 : 220, estCorrect ? 220 : 220);
            pdfDoc.rect(20, yPosition - 5, 50, 7, 'F');
            pdfDoc.setTextColor(estCorrect ? 0 : 255, estCorrect ? 128 : 0, 0);
            pdfDoc.setFont(undefined, 'bold');
            pdfDoc.text(`Statut: ${estCorrect ? 'Correct' : 'Incorrect'}`, 22, yPosition);
            pdfDoc.setFont(undefined, 'normal');
            pdfDoc.setTextColor(0, 0, 0); // Réinitialiser la couleur
            yPosition += 10;
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des détails:", error);
          pdfDoc.setFontSize(11);
          pdfDoc.setFont(undefined, 'normal');
          pdfDoc.text('Erreur lors de la récupération des détails pour ce quiz.', 14, yPosition);
          yPosition += 10;
        }
        
        yPosition += 10; // Espace entre les quiz
      }
      
      // Enregistrer le PDF
      pdfDoc.save(`resultats_eleve_${eleveId}.pdf`);
      
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
  
  // Regrouper les résultats par quiz
  const resultsByQuiz = resultats.reduce((acc, resultat) => {
    const quizId = resultat.quizId;
    if (!acc[quizId]) {
      acc[quizId] = [];
    }
    acc[quizId].push(resultat);
    return acc;
  }, {});
  
  // Regrouper les résultats par élève
  const resultsByStudent = resultats.reduce((acc, resultat) => {
    if (resultat.eleve) {
      const eleveId = resultat.eleveId;
      if (!acc[eleveId]) {
        acc[eleveId] = {
          eleve: resultat.eleve,
          resultats: []
        };
      }
      acc[eleveId].resultats.push(resultat);
    }
    return acc;
  }, {});
  
  return (
    <>
      <div className="py-6 sm:py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Gestion des résultats de quiz
              </h1>
              <button 
                onClick={async () => {
                  try {
                    // Importation dynamique de jspdf
                    const jsPDFModule = await import('jspdf');
                    const jsPDF = jsPDFModule.default;
                    
                    // Importer jspdf-autotable
                    const autoTableModule = await import('jspdf-autotable');
                    const autoTable = autoTableModule.autoTable;
                    
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
                }}
                className="inline-flex items-center px-3 py-2 border border-green-700 text-sm font-medium rounded-md text-white bg-green-600 shadow-[0_3px_0_0_#15803d,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#15803d,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-green-700 transition-all duration-75"
              >
                Générer PDF de tous les résultats
              </button>
            </div>
          </div>
        </header>
        
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:py-8 sm:px-0">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Résultats par élève</h2>
              {Object.keys(resultsByStudent).length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <p className="text-gray-500">Aucun résultat trouvé.</p>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Élève
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Email
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quiz
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(resultsByStudent).map(([eleveId, data]: [string, any]) => {
                          const averageScore = data.resultats.reduce((sum: number, r: any) => sum + r.score, 0) / data.resultats.length;
                          return (
                            <tr key={eleveId}>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {data.eleve.displayName || 'Élève inconnu'}
                                </div>
                                <div className="text-xs text-gray-500 sm:hidden">
                                  {data.eleve.email || 'Email inconnu'}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <div className="text-sm text-gray-500">
                                  {data.eleve.email || 'Email inconnu'}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {data.resultats.length}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${
                                  averageScore >= 80 ? 'text-green-600' : 
                                  averageScore >= 60 ? 'text-yellow-600' : 
                                  'text-red-600'
                                }`}>
                                  {averageScore.toFixed(2)}%
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                  onClick={() => generateStudentPDF(eleveId, data.eleve.displayName || 'Élève inconnu')}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  PDF
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-6 sm:py-8 sm:px-0">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Résultats par quiz</h2>
              {Object.keys(resultsByQuiz).length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <p className="text-gray-500">Aucun résultat trouvé.</p>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {Object.entries(resultsByQuiz).map(([quizId, quizResults]) => {
                    const typedResults = quizResults as any[];
                    return (
                      <div key={quizId} className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                          <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                              {typedResults[0].quiz ? typedResults[0].quiz.titre : 'Quiz non trouvé'}
                            </h2>
                            <p className="text-sm text-gray-500">
                              {typedResults.length} résultat(s)
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {typedResults[0].quiz && (
                              <>
                                <Link 
                                  href={`/quiz/${quizId}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-indigo-700 text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#4338ca,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-700 transition-all duration-75 flex-1 sm:flex-none justify-center"
                                >
                                  Voir le quiz
                                </Link>
                                <button 
                                  onClick={() => generateQuizPDF(quizId, typedResults)}
                                  className="inline-flex items-center px-3 py-1.5 border border-green-700 text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 shadow-[0_3px_0_0_#15803d,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#15803d,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-green-700 transition-all duration-75 flex-1 sm:flex-none justify-center"
                                >
                                  PDF
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteQuizResults(quizId)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-700 text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 shadow-[0_3px_0_0_#b91c1c,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#b91c1c,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-red-700 transition-all duration-75 flex-1 sm:flex-none justify-center"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Élève
                                </th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Score
                                </th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                  Date
                                </th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {typedResults.map((resultat) => (
                                <tr key={resultat.id}>
                                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {resultat.eleve ? resultat.eleve.displayName : 'Élève inconnu'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {resultat.eleve ? resultat.eleve.email : 'Email inconnu'}
                                        </div>
                                        <div className="text-xs text-gray-500 sm:hidden">
                                          {new Date(resultat.completedAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                    <div className={`text-sm font-semibold ${
                                      resultat.score >= 80 ? 'text-green-600' : 
                                      resultat.score >= 60 ? 'text-yellow-600' : 
                                      'text-red-600'
                                    }`}>
                                      {resultat.score.toFixed(2)}%
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                    {new Date(resultat.completedAt).toLocaleString()}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                      onClick={() => handleDeleteResult(resultat.id)}
                                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded border border-transparent hover:border-red-200 shadow-[0_2px_0_0_transparent] hover:shadow-[0_2px_0_0_#fecaca,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] active:bg-red-50 transition-all duration-75"
                                    >
                                      Supprimer
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {showQuizPdf && currentQuizData && (
        <div className="hidden">
          <div ref={quizPdfRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Résultats du quiz: {currentQuizData.quiz.titre}</h1>
            <p>Description: {currentQuizData.quiz.description || 'Aucune description'}</p>
            <p>Nombre de questions: {currentQuizData.quiz.questions?.length || 0}</p>
            <p>Nombre de participants: {currentQuizData.results.length}</p>
            <p>Score moyen: {(currentQuizData.results.reduce((sum, result) => sum + result.score, 0) / currentQuizData.results.length).toFixed(2)}%</p>
            <p>Généré le: {new Date().toLocaleDateString()} à {new Date().toLocaleTimeString()}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Élève</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Email</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Score</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Date de complétion</th>
                </tr>
              </thead>
              <tbody>
                {currentQuizData.results.map((result, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.eleve?.displayName || 'Élève inconnu'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.eleve?.email || 'Email inconnu'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.score.toFixed(2)}%</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(result.completedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showStudentPdf && currentStudentData && (
        <div className="hidden">
          <div ref={studentPdfRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Résultats de l&apos;élève: {currentStudentData.eleve?.displayName || 'Élève inconnu'}</h1>
            <p>Email: {currentStudentData.eleve?.email || 'Email inconnu'}</p>
            <p>Nombre de quiz complétés: {currentStudentData.resultats.length}</p>
            <p>Score moyen: {(currentStudentData.resultats.reduce((sum, result) => sum + result.score, 0) / currentStudentData.resultats.length).toFixed(2)}%</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Quiz</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Score</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Date de complétion</th>
                </tr>
              </thead>
              <tbody>
                {currentStudentData.resultats.map((result, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.quiz?.titre || 'Quiz non trouvé'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.score.toFixed(2)}%</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(result.completedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showAllResultsPdf && (
        <div className="hidden">
          <div ref={allResultsPdfRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Tous les résultats</h1>
            <p>Nombre total de résultats: {resultats.length}</p>
            <p>Généré le: {new Date().toLocaleDateString()} à {new Date().toLocaleTimeString()}</p>
            
            <h2 style={{ marginTop: '20px' }}>Résumé par quiz</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Quiz</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Participants</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Score moyen</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(resultsByQuiz).map(([quizId, quizResults]: [string, any]) => {
                  const typedResults = quizResults as any[];
                  const averageScore = typedResults.reduce((sum, r) => sum + r.score, 0) / typedResults.length;
                  return (
                    <tr key={quizId}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{typedResults[0].quiz?.titre || 'Quiz non trouvé'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{typedResults.length}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{averageScore.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
} 