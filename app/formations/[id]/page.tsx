'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import useFormations from '../../hooks/useFormations';
import useCours from '../../hooks/useCours';
import useSignatures from '../../hooks/useSignatures';
import { Formation, Cours } from '../../types';

export default function FormationDetails() {
  const { user, userData, loading: authLoading } = useAuth();
  const { 
    getFormationById, 
    inscrireEleve, 
    estInscrit,
    loading: formationLoading, 
    error: formationError 
  } = useFormations();
  const { 
    getCoursByFormation,
    loading: coursLoading, 
    error: coursError 
  } = useCours();
  const { hasSignedToday } = useSignatures();
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formation, setFormation] = useState<Formation | null>(null);
  const [cours, setCours] = useState<Cours[]>([]);
  const [inscrit, setInscrit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dejaSigneAujourdhui, setDejaSigneAujourdhui] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || authLoading) return;
        
        console.log("Récupération de la formation:", id);
        const formationResult = await getFormationById(id);
        console.log("Formation récupérée:", formationResult);
        
        if (!formationResult) {
          router.push('/formations');
          return;
        }
        
        setFormation(formationResult);
        
        // Récupérer les cours de la formation
        const coursResult = await getCoursByFormation(id);
        setCours(coursResult);
        
        // Vérifier si l'utilisateur est inscrit à la formation
        if (user && userData?.role === 'eleve') {
          const inscritResult = await estInscrit(id, user.uid);
          setInscrit(inscritResult);
          
          // Vérifier si l'élève a déjà signé aujourd'hui
          if (inscritResult) {
            const signatureResult = await hasSignedToday(id, user.uid);
            setDejaSigneAujourdhui(signatureResult);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      }
    };
    
    if (mounted && !authLoading) {
      fetchData();
    }
  }, [mounted, authLoading, user, userData, id, router]);
  
  const handleInscription = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    if (userData?.role !== 'eleve') {
      setError('Seuls les élèves peuvent s\'inscrire à une formation');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const success = await inscrireEleve(id, user.uid);
      
      if (success) {
        setInscrit(true);
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };
  
  if (!mounted || authLoading || formationLoading || !formation) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  const isFormateur = userData?.role === 'formateur';
  const isFormateurOfFormation = isFormateur && formation.formateurId === user?.uid;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bannière avec image de fond */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        {formation.image && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={formation.image}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                {formation.titre}
              </h1>
              <p className="mt-2 text-indigo-100 max-w-3xl">
                {formation.description?.substring(0, 150)}
                {formation.description && formation.description.length > 150 ? '...' : ''}
              </p>
            </div>
            
            {userData?.role === 'eleve' && (
              <div className="flex-shrink-0">
                {inscrit ? (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-white flex items-center mb-3">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Inscrit</span>
                    </div>
                    
                    {dejaSigneAujourdhui ? (
                      <button
                        disabled
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-white/20 text-white cursor-not-allowed"
                      >
                        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Présence signée
                      </button>
                    ) : (
                      <Link
                        href={`/formations/${formation.id}/signature`}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Signer ma présence
                      </Link>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleInscription}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors duration-200"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Chargement...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        S'inscrire à cette formation
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {isFormateurOfFormation && (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/formations/edit/${formation.id}`}
                  className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-md shadow-sm text-white bg-white/10 hover:bg-white/20 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Modifier
                </Link>
                
                <Link
                  href={`/formations/gestion/${formation.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                  </svg>
                  Gérer
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages d'erreur */}
        {(error || formationError || coursError) && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p>{error || formationError || coursError}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Description complète */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">À propos de cette formation</h2>
            <div className="prose max-w-none">
              <p>{formation.description}</p>
            </div>
          </div>
        </div>
        
        {/* Liste des cours */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Cours disponibles
            </h2>
            
            {isFormateurOfFormation && (
              <Link
                href={`/cours/create?formationId=${formation.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Ajouter un cours
              </Link>
            )}
          </div>
          
          {coursLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : cours.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun cours disponible</h3>
              <p className="mt-2 text-gray-500">
                Cette formation ne contient pas encore de cours.
              </p>
              
              {isFormateurOfFormation && (
                <div className="mt-6">
                  <Link
                    href={`/cours/create?formationId=${formation.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Créer le premier cours
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cours.map((cours) => (
                <div key={cours.id} className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {cours.titre}
                    </h3>
                    
                    {cours.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {cours.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/cours/${cours.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Voir le cours
                      </Link>
                      
                      {isFormateurOfFormation && (
                        <>
                          <Link
                            href={`/cours/edit/${cours.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Modifier
                          </Link>
                          
                          <Link
                            href={`/quiz/create?coursId=${cours.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Ajouter un quiz
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
