import { onBoardUser } from '@/modules/auth/actions'
import React from 'react'

const Layout = async ({children}) => {
  await onBoardUser();
  return (
    <div className='flex flex-col min-h-screen relative overflow-x-hidden' >
        {/* Navbar */}
        {children}
        </div>
  )
}

export default Layout