'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useFormations from '../../../hooks/useFormations';
import useSignatures from '../../../hooks/useSignatures';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';

export default function GestionSignaturesFormationPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationById, getStudentsByFormation } = useFormations();
  const { 
    getSignaturesByDay,
    getSignaturesByDayInPeriod,
    generatePeriodSignaturesPDF,
    addManualSignature,
    loading: signaturesLoading 
  } = useSignatures();
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formation, setFormation] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [signaturesByDay, setSignaturesByDay] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  // États pour le filtre par période
  const [filterByPeriod, setFilterByPeriod] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    if (userData?.role !== 'formateur') {
      router.push('/formations');
      return;
    }
    
    const fetchData = async () => {
      try {
        const formationData = await getFormationById(id);
        
        if (!formationData) {
          router.push('/signatures/gestion');
          return;
        }
        
        if (formationData.formateurId !== user.uid) {
          router.push('/signatures/gestion');
          return;
        }
        
        setFormation(formationData);
        
        const studentsData = await getStudentsByFormation(id);
        setStudents(studentsData);
        
        // Initialiser les dates par défaut (dernier mois)
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        
        // Charger toutes les signatures par défaut
        const signaturesData = await getSignaturesByDay(id);
        setSignaturesByDay(signaturesData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, userData, authLoading, router]);
  
  // Fonction pour appliquer le filtre par période
  const applyPeriodFilter = async () => {
    if (!startDate || !endDate) {
      alert('Veuillez sélectionner une date de début et de fin');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      alert('La date de début doit être antérieure à la date de fin');
      return;
    }
    
    setLoading(true);
    
    try {
      if (filterByPeriod) {
        // Filtrer par période
        const signaturesData = await getSignaturesByDayInPeriod(id, startDate, endDate);
        setSignaturesByDay(signaturesData);
      } else {
        // Afficher toutes les signatures
        const signaturesData = await getSignaturesByDay(id);
        setSignaturesByDay(signaturesData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des signatures:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Appliquer le filtre lorsque filterByPeriod change
  useEffect(() => {
    if (!loading && formation) {
      applyPeriodFilter();
    }
  }, [filterByPeriod]);
  
  const handleGenerateCalendarPDF = async () => {
    if (!formation) return;
    
    if (filterByPeriod) {
      await generatePeriodSignaturesPDF(formation.id, formation.titre, students, startDate, endDate);
    } else {
      // Si pas de filtre, utilisez la date actuelle moins 3 mois comme date de début
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const startDateStr = threeMonthsAgo.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      await generatePeriodSignaturesPDF(formation.id, formation.titre, students, startDateStr, endDateStr);
    }
  };
  
  const handleAddSignature = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty() || !selectedStudent) {
      alert('Veuillez sélectionner un étudiant et dessiner une signature');
      return;
    }
    
    const signatureDataURL = sigCanvas.current.toDataURL('image/png');
    
    const success = await addManualSignature(
      formation.id,
      formation.titre,
      selectedStudent.id,
      selectedStudent.displayName || selectedStudent.email,
      signatureDataURL
    );
    
    if (success) {
      alert('Signature ajoutée avec succès');
      sigCanvas.current.clear();
      setShowSignaturePad(false);
      setSelectedStudent(null);
      
      // Rafraîchir les données
      applyPeriodFilter();
    }
  };
  
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Trier les dates (du plus récent au plus ancien)
  const sortedDates = Object.keys(signaturesByDay).sort().reverse();
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Signatures - {formation?.titre}
          </h1>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSignaturePad(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Ajouter une signature
            </button>
            
            <button
              onClick={handleGenerateCalendarPDF}
              disabled={signaturesLoading || Object.keys(signaturesByDay).length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
            >
              {signaturesLoading ? 'Génération...' : 'Télécharger le tableau de signatures'}
            </button>
            
            <Link
              href="/signatures/gestion"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Retour
            </Link>
          </div>
        </div>
        
        {/* Filtre par période */}
        <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="filterByPeriod"
              checked={filterByPeriod}
              onChange={(e) => setFilterByPeriod(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="filterByPeriod" className="ml-2 block text-sm text-gray-900">
              Filtrer par période
            </label>
          </div>
          
          {filterByPeriod && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Date de début
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={applyPeriodFilter}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Appliquer le filtre
                </button>
              </div>
            </div>
          )}
        </div>
        
        {showSignaturePad && (
          <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ajouter une signature</h2>
            
            <div className="mb-4">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Sélectionner un étudiant
              </label>
              <select
                id="student"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedStudent(student || null);
                }}
              >
                <option value="">Sélectionner un étudiant</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.displayName || student.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="border border-gray-300 rounded-md bg-white mb-4">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: 'w-full h-48 cursor-crosshair',
                }}
                backgroundColor="white"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={clearSignature}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Effacer
              </button>
              
              <button
                onClick={handleAddSignature}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Enregistrer la signature
              </button>
              
              <button
                onClick={() => setShowSignaturePad(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        
        {/* Affichage des résultats filtrés */}
        {filterByPeriod && (
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Affichage des signatures du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {sortedDates.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <p className="text-gray-500">
              Aucune signature n&apos;a été enregistrée pour cette {filterByPeriod ? 'période' : 'formation'}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              // Formater la date en format français
              const [year, month, day] = date.split('-');
              const formattedDate = `${day}/${month}/${year}`;
              
              return (
                <div key={date} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">
                      Signatures du {formattedDate}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {signaturesByDay[date].length} signature(s)
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                      {signaturesByDay[date].map((signature: any) => (
                        <div key={signature.id} className="border rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {signature.userName}
                          </p>
                          <div className="border rounded-lg overflow-hidden bg-gray-50">
                            <img 
                              src={signature.signatureData} 
                              alt={`Signature de ${signature.userName}`}
                              className="w-full h-20 object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(signature.createdAt.toDate()).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Tableau récapitulatif des présences
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Vue d&apos;ensemble des signatures par étudiant et par jour
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom de l&apos;élève
                    </th>
                    {sortedDates.map((date) => {
                      // Formater la date en format français
                      const [year, month, day] = date.split('-');
                      const formattedDate = `${day}/${month}`;
                      
                      return (
                        <th key={date} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {formattedDate}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.displayName || student.email}
                      </td>
                      
                      {sortedDates.map((date) => {
                        // Vérifier si l'étudiant a signé ce jour-là
                        const hasSigned = signaturesByDay[date].some((sig: any) => sig.userId === student.id);
                        
                        return (
                          <td key={`${student.id}-${date}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {hasSigned ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                ✓
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                ✗
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 