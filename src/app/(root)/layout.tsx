import { onBoardUser } from '@/modules/auth/actions'
import Navbar from '@/modules/home/components/navbar';
import React from 'react'

const Layout = async ({children}) => {
  await onBoardUser();
  return (
    <div className='flex flex-col min-h-screen relative overflow-x-hidden' >
        <Navbar></Navbar>
        {children}
        </div>
  )
}

export default Layout