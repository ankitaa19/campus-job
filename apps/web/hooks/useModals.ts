import { useState, useCallback } from 'react';

export type UserType = 'student' | 'college' | 'company';

export function useModals() {
  const [loginModal, setLoginModal] = useState<{
    isOpen: boolean;
    defaultTab: UserType;
  }>({
    isOpen: false,
    defaultTab: 'student'
  });

  const [registerModal, setRegisterModal] = useState<{
    isOpen: boolean;
    defaultTab: UserType;
  }>({
    isOpen: false,
    defaultTab: 'student'
  });

  const openLoginModal = useCallback((tab: UserType = 'student') => {
    setLoginModal({ isOpen: true, defaultTab: tab });
    setRegisterModal({ isOpen: false, defaultTab: 'student' });
  }, []);

  const openRegisterModal = useCallback((tab: UserType = 'student') => {
    setRegisterModal({ isOpen: true, defaultTab: tab });
    setLoginModal({ isOpen: false, defaultTab: 'student' });
  }, []);

  const closeLoginModal = useCallback(() => {
    setLoginModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const closeRegisterModal = useCallback(() => {
    setRegisterModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setLoginModal(prev => ({ ...prev, isOpen: false }));
    setRegisterModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    loginModal,
    registerModal,
    openLoginModal,
    openRegisterModal,
    closeLoginModal,
    closeRegisterModal,
    closeAllModals,
  };
}
