'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AuthTransitionProps {
  children: ReactNode;
  currentPage: 'signin' | 'signup' | 'reset';
  onTransitionComplete?: () => void
}

export default function AuthTransition({ children, currentPage, onTransitionComplete }: AuthTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
    setIsVisible(false);
    
    // Attendre la fin de l'animation avant de naviguer
    setTimeout(() => {
      if (page === 'signin') router.push('/auth/signin');
      else if (page === 'signup') router.push('/auth/signup');
      else if (page === 'reset') router.push('/auth/reset-password');
    }, 400);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
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
      </motion.div>
    </AnimatePresence>
  );
} 