import { onBoardUser } from '@/modules/auth/actions'
import Navbar from '@/modules/home/components/navbar'
import React from 'react'

type LayoutProps = {
  children: React.ReactNode
}

const Layout = async ({ children }: LayoutProps) => {
  await onBoardUser()

  return (
    <div className='flex flex-col min-h-screen relative overflow-x-hidden'>
      <Navbar />
      {children}
    </div>
  )
}

export default Layout