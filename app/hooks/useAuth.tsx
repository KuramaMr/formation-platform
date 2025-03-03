'use client';

import { useAuth as useFirebaseAuth } from '../contexts/AuthContext';

export default function useAuth() {
  return useFirebaseAuth();
}
