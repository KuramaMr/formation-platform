'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useFormations from '../../../hooks/useFormations';
import useSignatures from '../../../hooks/useSignatures';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { writeBatch } from 'firebase/firestore';

export default function GestionSignaturesFormationPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationById, getStudentsByFormation } = useFormations();
  const { 
    getSignaturesByDay,
    getSignaturesByDayInPeriod,
    generatePeriodSignaturesPDF,
    addManualSignature,
    deleteSignature,
    deleteMultipleSignatures,
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
  
  // États pour suivre les signatures sélectionnées
  const [selectedSignatures, setSelectedSignatures] = useState<{[key: string]: boolean}>({});
  const [selectionMode, setSelectionMode] = useState(false);
  
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
  
  const handleDeleteSignature = async (signatureId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette signature ?')) {
      return;
    }
    
    try {
      setLoading(true);
      const success = await deleteSignature(signatureId);
      
      if (success) {
        // Rafraîchir les données après la suppression
        if (filterByPeriod && startDate && endDate) {
          await applyPeriodFilter();
        } else {
          const signatures = await getSignaturesByDay(id);
          setSignaturesByDay(signatures);
        }
        alert('Signature supprimée avec succès');
      } else {
        alert('Erreur lors de la suppression de la signature');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour basculer le mode de sélection
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedSignatures({});
  };
  
  // Fonction pour gérer la sélection d'une signature
  const toggleSignatureSelection = (signatureId: string) => {
    setSelectedSignatures(prev => ({
      ...prev,
      [signatureId]: !prev[signatureId]
    }));
  };
  
  // Fonction pour sélectionner/désélectionner toutes les signatures d'un jour
  const toggleAllSignaturesForDay = (date: string, select: boolean) => {
    const newSelectedSignatures = { ...selectedSignatures };
    
    signaturesByDay[date].forEach((signature: any) => {
      newSelectedSignatures[signature.id] = select;
    });
    
    setSelectedSignatures(newSelectedSignatures);
  };
  
  // Fonction pour supprimer les signatures sélectionnées
  const handleDeleteSelectedSignatures = async () => {
    const selectedIds = Object.entries(selectedSignatures)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    if (selectedIds.length === 0) {
      alert('Aucune signature sélectionnée');
      return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} signature(s) ?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const success = await deleteMultipleSignatures(selectedIds);
      
      if (success) {
        // Rafraîchir les données après la suppression
        if (filterByPeriod && startDate && endDate) {
          await applyPeriodFilter();
        } else {
          const signatures = await getSignaturesByDay(id);
          setSignaturesByDay(signatures);
        }
        setSelectedSignatures({});
        alert('Signatures supprimées avec succès');
      } else {
        alert('Erreur lors de la suppression des signatures');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
      alert('Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
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
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Signatures pour {formation?.titre || 'la formation'}
          </h1>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowSignaturePad(true)}
              className="inline-flex items-center px-3 py-2 rounded-md border border-gray-700 bg-white text-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
            >
              Ajouter une signature
            </button>
            
            <button
              onClick={handleGenerateCalendarPDF}
              disabled={signaturesLoading || Object.keys(signaturesByDay).length === 0}
              className="inline-flex items-center px-3 py-2 rounded-md border border-green-700 bg-green-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] disabled:bg-green-300 flex-1 sm:flex-none justify-center"
            >
              {signaturesLoading ? 'Génération...' : 'PDF'}
            </button>
            
            <Link
              href="/signatures/gestion"
              className="inline-flex items-center px-3 py-2 rounded-md border border-gray-700 bg-white text-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
            >
              Retour
            </Link>
          </div>
        </div>
        
        {/* Filtre par période */}
        <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg p-4 sm:p-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  className="inline-flex items-center px-3 py-2 rounded-md border border-indigo-700 bg-indigo-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] w-full sm:w-auto justify-center"
                >
                  Appliquer le filtre
                </button>
              </div>
            </div>
          )}
        </div>
        
        {showSignaturePad && (
          <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg p-4 sm:p-6">
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
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearSignature}
                className="inline-flex items-center px-3 py-2 rounded-md border border-gray-700 bg-white text-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
              >
                Effacer
              </button>
              
              <button
                onClick={handleAddSignature}
                className="inline-flex items-center px-3 py-2 rounded-md border border-indigo-700 bg-indigo-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
              >
                Enregistrer
              </button>
              
              <button
                onClick={() => setShowSignaturePad(false)}
                className="inline-flex items-center px-3 py-2 rounded-md border border-gray-700 bg-white text-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 sm:p-6">
            <p className="text-gray-500">
              Aucune signature n&apos;a été enregistrée pour cette {filterByPeriod ? 'période' : 'formation'}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ajouter un bouton pour activer/désactiver le mode de sélection */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
              <h2 className="text-xl font-semibold">Signatures par jour</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={toggleSelectionMode}
                  className={`px-3 py-1 text-xs sm:text-sm rounded-md flex-1 sm:flex-none justify-center border shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] ${
                    selectionMode 
                      ? 'bg-red-100 text-red-700 border-red-700' 
                      : 'bg-gray-100 text-gray-700 border-gray-700'
                  }`}
                >
                  {selectionMode ? 'Annuler' : 'Sélectionner'}
                </button>
                
                {selectionMode && (
                  <button
                    onClick={handleDeleteSelectedSignatures}
                    className="px-3 py-1 text-xs sm:text-sm rounded-md border border-red-700 bg-red-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
                    disabled={Object.values(selectedSignatures).filter(Boolean).length === 0}
                  >
                    Supprimer sélection
                  </button>
                )}
              </div>
            </div>
            
            {/* Pour chaque jour */}
            {sortedDates.map((date) => (
              <div key={date} className="mb-6 bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      {new Date(date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {signaturesByDay[date].length} signature(s)
                    </p>
                  </div>
                  
                  {/* Ajouter des contrôles de sélection pour le jour entier */}
                  {selectionMode && signaturesByDay[date].length > 0 && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => toggleAllSignaturesForDay(date, true)}
                        className="px-2 py-1 text-xs rounded-md border border-blue-700 bg-blue-100 text-blue-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        onClick={() => toggleAllSignaturesForDay(date, false)}
                        className="px-2 py-1 text-xs rounded-md border border-gray-700 bg-gray-100 text-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] flex-1 sm:flex-none justify-center"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                    {signaturesByDay[date].map((signature: any) => (
                      <div 
                        key={signature.id} 
                        className={`border rounded-lg p-4 ${
                          selectionMode && selectedSignatures[signature.id] 
                            ? 'ring-2 ring-blue-500 border-blue-500' 
                            : ''
                        }`}
                        onClick={() => selectionMode && toggleSignatureSelection(signature.id)}
                      >
                        {/* Ajouter une case à cocher pour la sélection */}
                        {selectionMode && (
                          <div className="flex justify-end mb-2">
                            <input
                              type="checkbox"
                              checked={!!selectedSignatures[signature.id]}
                              onChange={() => toggleSignatureSelection(signature.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        
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
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            {new Date(signature.createdAt.toDate()).toLocaleTimeString('fr-FR')}
                          </p>
                          
                          {/* Afficher le bouton de suppression uniquement en mode normal */}
                          {!selectionMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSignature(signature.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded-md border border-red-700 bg-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
                              title="Supprimer cette signature"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Élève
                    </th>
                    {sortedDates.map((date) => {
                      // Formater la date en format français
                      const [year, month, day] = date.split('-');
                      const formattedDate = `${day}/${month}`;
                      
                      return (
                        <th key={date} scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {formattedDate}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.displayName || student.email}
                      </td>
                      
                      {sortedDates.map((date) => {
                        // Vérification plus flexible
                        const hasSigned = signaturesByDay[date].some((sig: any) => 
                          sig.userId === student.id || 
                          sig.userName === (student.displayName || student.email)
                        );
                        
                        return (
                          <td key={`${student.id}-${date}`} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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