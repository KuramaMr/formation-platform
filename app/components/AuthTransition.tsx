'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthTransition({ 
  children, 
  currentPage, 
  onTransitionComplete 
}: { 
  children: React.ReactNode, 
  currentPage: 'signin' | 'signup' | 'reset',
  onTransitionComplete?: () => void
}) {
  const [animation, setAnimation] = useState('');
  const [nextPage, setNextPage] = useState<'signin' | 'signup' | 'reset' | null>(null);
  const router = useRouter();

  // Fonction pour naviguer avec animation
  const navigateTo = (page: 'signin' | 'signup' | 'reset') => {
    // Si on est déjà sur cette page, ne rien faire
    if (page === currentPage) return;
    
    // Déterminer la direction de l'animation
    const isForward = 
      (currentPage === 'signin' && page === 'signup') || 
      (currentPage === 'signup' && page === 'reset') ||
      (currentPage === 'signin' && page === 'reset');
    
    // Appliquer l'animation de sortie
    setAnimation(isForward ? 'form-exit' : 'form-leave');
    setNextPage(page);
    
    // Attendre la fin de l'animation avant de naviguer
    setTimeout(() => {
      if (page === 'signin') router.push('/auth/signin');
      else if (page === 'signup') router.push('/auth/signup');
      else if (page === 'reset') router.push('/auth/reset-password');
    }, 400);
  };

  // Appliquer l'animation d'entrée au chargement
  useEffect(() => {
    setAnimation('form-enter');
    
    // Notifier que la transition est terminée
    if (onTransitionComplete) {
      setTimeout(onTransitionComplete, 400);
    }
  }, [currentPage, onTransitionComplete]);

  return (
    <div className={`auth-transition ${animation}`}>
      {children}
      
      {/* Navigation contextuelle */}
      <div className="auth-navigation mt-6 text-center">
        {currentPage === 'signin' && (
          <p className="text-white/90">
            Pas encore de compte ?{' '}
            <button 
              onClick={() => navigateTo('signup')}
              className="font-medium text-pink-300 hover:text-pink-200 transition-colors text-glow-pink"
            >
              Créer un compte
            </button>
          </p>
        )}
        
        {currentPage === 'signup' && (
          <p className="text-white/90">
            Déjà un compte ?{' '}
            <button 
              onClick={() => navigateTo('signin')}
              className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors text-glow-cyan"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
} 