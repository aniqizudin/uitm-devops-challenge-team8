// src/app/auth/login/page.tsx (FINAL VERSION)

import ContentWrapper from '@/components/ContentWrapper'
import ModalLogIn from '@/components/ModalLogIn'
// 🚨 Remove the AuthGuard import (or comment it out)
// import AuthGuard from '@/components/AuthGuard' 

export default function AuthPage() {
  return (
    // 🚨 FINAL FIX: REMOVE THE AuthGuard WRAPPER
    // <AuthGuard requireAuth={false} redirectTo="/"> 
      <div>
        <ContentWrapper>
          <ModalLogIn isModal={false} isLoginPage={true} /> 
        </ContentWrapper>
      </div>
    // </AuthGuard> // 🚨 REMOVE CLOSING TAG
  )
}