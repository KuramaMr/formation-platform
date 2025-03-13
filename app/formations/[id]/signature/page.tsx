'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import SignaturePad from '../../../components/signature/SignaturePad';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import useSignatures from '../../../hooks/useSignatures';

export default function SignaturePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { hasSignedToday } = useSignatures();
  const params = useParams();
  const router = useRouter();
  const formationId = params.id as string;
  
  const [formation, setFormation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    const fetchData = async () => {
      try {
        const formationDoc = await getDoc(doc(db, 'formations', formationId));
        
        if (!formationDoc.exists()) {
          router.push('/formations');
          return;
        }
        
        setFormation({
          id: formationDoc.id,
          ...formationDoc.data()
        });
        
        if (user) {
          const hasSigned = await hasSignedToday(formationId, user.uid);
          setAlreadySigned(hasSigned);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formationId, user, authLoading, router, hasSignedToday]);
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  
  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-lg leading-6 font-medium text-gray-900">
              Signature de présence
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Formation : {formation?.titre}
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {signatureComplete ? (
              <div className="text-center">
                <div className="text-green-600 mb-4">
                  Votre signature a été enregistrée avec succès.
                </div>
                <Link
                  href={`/formations/${formationId}`}
                  className="inline-flex items-center px-4 py-2 rounded-md border border-indigo-700 bg-indigo-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
                >
                  Retour à la formation
                </Link>
              </div>
            ) : alreadySigned ? (
              <div className="text-center">
                <div className="text-amber-600 mb-4">
                  <svg className="h-12 w-12 mx-auto text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-lg font-medium">Vous avez déjà signé votre présence aujourd&apos;hui.</p>
                  <p className="text-sm mt-1">Une seule signature par jour est autorisée.</p>
                </div>
                <Link
                  href={`/formations/${formationId}`}
                  className="inline-flex items-center px-4 py-2 rounded-md border border-indigo-700 bg-indigo-600 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
                >
                  Retour à la formation
                </Link>
              </div>
            ) : (
              <SignaturePad
                formationId={formationId}
                formationTitre={formation?.titre}
                onSignatureComplete={() => setSignatureComplete(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 