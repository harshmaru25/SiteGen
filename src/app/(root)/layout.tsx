import { onBoardUser } from '@/modules/auth/actions'
import Navbar from '@/modules/home/components/navbar'
import { auth } from '@clerk/nextjs/server'
import React from 'react'

type LayoutProps = {
  children: React.ReactNode
}

const Layout = async ({ children }: LayoutProps) => {
  const { userId } = await auth()
  if (userId) {
    await onBoardUser()
  }

  return (
    <div className='flex flex-col min-h-screen relative overflow-x-hidden'>
      <Navbar />
      {children}
    </div>
  )
}

export default Layout