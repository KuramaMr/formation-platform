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
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            {formation.titre}
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {(error || formationError || coursError) && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error || formationError || coursError}
            </div>
          )}
          
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {formation.image && (
                <div className="relative h-64 w-full">
                  <Image
                    src={formation.image}
                    alt={formation.titre}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="px-4 py-5 sm:p-6">
                <div className="prose max-w-none">
                  <p>{formation.description}</p>
                </div>
                
                {userData?.role === 'eleve' && (
                  <div className="mt-6">
                    {inscrit ? (
                      <div className="flex space-x-3">
                        <div className="text-green-600 flex items-center">
                          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Vous êtes inscrit à cette formation
                        </div>
                        
                        {dejaSigneAujourdhui ? (
                          <button
                            disabled
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                          >
                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Présence signée aujourd&apos;hui
                          </button>
                        ) : (
                          <Link
                            href={`/formations/${formation.id}/signature`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                          >
                            Signer ma présence
                          </Link>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleInscription}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                      >
                        {loading ? 'Chargement...' : 'S\'inscrire à cette formation'}
                      </button>
                    )}
                  </div>
                )}
                
                {userData?.role === 'formateur' && formation.formateurId === user?.uid && (
                  <div className="mt-6 flex space-x-3">
                    <Link
                      href={`/formations/edit/${formation.id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Modifier la formation
                    </Link>
                    
                    <Link
                      href={`/cours/create?formationId=${formation.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Ajouter un cours
                    </Link>
                    
                    <Link
                      href={`/formations/gestion/${formation.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Gérer
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
                Cours
              </h2>
              
              {coursLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : cours.length === 0 ? (
                <div className="mt-4 bg-white shadow rounded-lg p-6">
                  <p className="text-gray-500">
                    Aucun cours disponible pour cette formation.
                  </p>
                  
                  {userData?.role === 'formateur' && formation.formateurId === user?.uid && (
                    <div className="mt-4">
                      <Link
                        href={`/cours/create?formationId=${formation.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Créer le premier cours
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {cours.map((cours) => (
                    <div key={cours.id} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {cours.titre}
                      </h3>
                      
                      <div className="mt-4 flex space-x-3">
                        <Link
                          href={`/cours/${cours.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Voir le cours
                        </Link>
                        
                        {userData?.role === 'formateur' && formation.formateurId === user?.uid && (
                          <>
                            <Link
                              href={`/cours/edit/${cours.id}`}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Modifier
                            </Link>
                            
                            <Link
                              href={`/quiz/create?coursId=${cours.id}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Ajouter un quiz
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
