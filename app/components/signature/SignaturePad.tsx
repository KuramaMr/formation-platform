'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface SignaturePadProps {
  formationId: string;
  formationTitre: string;
  onSignatureComplete?: () => void;
}

export default function SignaturePad({ formationId, formationTitre, onSignatureComplete }: SignaturePadProps) {
  const { user, userData } = useAuth();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsSaved(false);
  };

  const save = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty() || !user) {
      alert('Veuillez signer avant de sauvegarder');
      return;
    }

    setIsLoading(true);
    try {
      // Obtenir l'image de la signature en base64
      const signatureDataURL = sigCanvas.current.toDataURL('image/png');
      
      // Enregistrer dans Firestore
      console.log("Données de signature à enregistrer:", {
        userId: user.uid,
        userName: userData?.displayName || user.email,
        formationId,
        formationTitre,
        signatureData: signatureDataURL.substring(0, 100), // Tronqué pour la lisibilité
        createdAt: serverTimestamp()
      });

      console.log("Enregistrement de signature pour formation:", formationId);

      await addDoc(collection(db, 'signatures'), {
        userId: user.uid,
        userName: userData?.displayName || user.email,
        formationId,
        formationTitre,
        signatureData: signatureDataURL,
        createdAt: serverTimestamp()
      });

      setIsSaved(true);
      if (onSignatureComplete) {
        onSignatureComplete();
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      alert('Une erreur est survenue lors de l\'enregistrement de la signature');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 text-sm text-gray-600">
        Veuillez signer ci-dessous pour confirmer votre présence à la formation
      </div>
      
      <div className="border border-gray-300 rounded-md bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-48 cursor-crosshair',
          }}
          backgroundColor="white"
          onBegin={() => setIsSigning(true)}
        />
      </div>
      
      <div className="flex mt-3 space-x-2">
        <button
          onClick={clear}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          disabled={isLoading}
        >
          Effacer
        </button>
        
        <button
          onClick={save}
          className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          disabled={isLoading || isSaved}
        >
          {isLoading ? 'Enregistrement...' : isSaved ? 'Signature enregistrée' : 'Enregistrer la signature'}
        </button>
      </div>
      
      {isSaved && (
        <div className="mt-2 text-sm text-green-600">
          Votre signature a été enregistrée avec succès.
        </div>
      )}
    </div>
  );
} 