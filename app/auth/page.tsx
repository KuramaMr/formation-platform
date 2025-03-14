'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode, getAuth } from 'firebase/auth';
import AuthTransition from '../components/AuthTransition';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Récupérer le code oob (out-of-band) de l'URL
    const code = searchParams.get('oobCode');
    if (code) {
      setOobCode(code);
      
      // Vérifier la validité du code et récupérer l'email associé
      const verifyCode = async () => {
        try {
          const auth = getAuth();
          const email = await verifyPasswordResetCode(auth, code);
          setEmail(email);
        } catch (error: any) {
          setError('Ce lien de réinitialisation est invalide ou a expiré.');
        }
      };
      
      verifyCode();
    } else {
      setError('Aucun code de réinitialisation trouvé dans l\'URL.');
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    if (!oobCode) {
      setError('Code de réinitialisation manquant.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      setSuccess(true);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-16 relative overflow-hidden">
      {/* Fond animé avec dégradés */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 animate-ultra-gradient"></div>
      
      {/* Bulles animées en arrière-plan */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-300/20 to-indigo-400/20 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-purple-300/20 to-pink-400/20 blur-3xl animate-float-slow-reverse"></div>
      <div className="absolute top-3/4 left-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-indigo-300/20 to-blue-400/20 blur-3xl animate-float-medium"></div>
      
      {/* Effet de verre animé */}
      <div className="absolute inset-0 backdrop-blur-[2px] animate-glass-blur"></div>
      
      <div className="w-full max-w-2xl relative z-10 px-6 py-8">
        <AuthTransition currentPage="reset">
          <div className="relative backdrop-blur-lg bg-white/30 border border-white/50 rounded-3xl shadow-2xl overflow-hidden animate-glass-shimmer depth-shadow-card">
            {/* Éléments décoratifs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/30 blur-2xl animate-pulse-slow"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-2xl animate-pulse-slow-reverse"></div>
            
            {/* Contenu du formulaire */}
            <div className="relative p-10 md:p-12">
              {/* En-tête */}
              <div className="text-center mb-10">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-neon animate-ultra-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-4xl font-extrabold text-white text-glow animate-text-pulse">
                  Nouveau mot de passe
                </h2>
                {email && (
                  <p className="mt-3 text-center text-lg text-white/90">
                    Pour le compte <span className="font-medium text-cyan-300 text-glow-cyan">{email}</span>
                  </p>
                )}
              </div>

              {/* Messages d'erreur */}
              {error && (
                <div className="mb-8 rounded-xl bg-red-500/30 backdrop-blur-md p-5 border border-red-400/30 animate-fade-in-bounce shadow-inner">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-white">Erreur</h3>
                      <div className="mt-2 text-sm text-white">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message de succès */}
              {success && (
                <div className="mb-8 rounded-xl bg-green-900/30 backdrop-blur-md p-5 border border-green-500/50 animate-fade-in-bounce neon-success-glow">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-green-300">Mot de passe réinitialisé</h3>
                      <div className="mt-2 text-sm text-green-200">
                        <p>Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Formulaire de réinitialisation */}
              {!success && (
                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="new-password" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                        placeholder="Entrez votre nouveau mot de passe"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                        placeholder="Confirmez votre nouveau mot de passe"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={loading || !oobCode}
                      className="mt-6 w-full rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-size-200 px-4 py-4 text-white text-lg font-medium shadow-neon-cyan transition-all hover:scale-[1.03] hover:shadow-neon-cyan-intense hover:bg-pos-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed animate-button-pulse"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Réinitialisation en cours...
                        </div>
                      ) : 'Réinitialiser le mot de passe'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </AuthTransition>
      </div>
    </div>
  );
}