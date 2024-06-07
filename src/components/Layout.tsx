import { useState, useEffect, FC, ReactNode } from 'react'
import Sidebar from '@/src/components/Sidebar'
import Header from '@/src/components/Header'

const Footer = () => {
  return <footer className='py-3 text-center opacity-40'>This chatbot responses are generated by OpenAI&apos;s GPT. As GPT may occasionally produce inaccurate or misleading data, always verify AI messages when they contain critical information. </footer>
}

const Layout: FC<{ children: ReactNode}>  = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
 
  useEffect(() => {
const checkIsMobile = () => {
  console.log("width", window.innerWidth)
      setIsMobile(window.innerWidth <= 480)
    }

    // Run on initial mount
    checkIsMobile()

    window.addEventListener('resize', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])
console.log("isMobile", isMobile)

  return (
    <div className='flex flex-col w-screen h-screen' >
      <Header 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex flex-row">
        { 
        isMobile && isSidebarOpen  && <Sidebar isSidebarOpen={isSidebarOpen}/>}
        {isMobile && !isSidebarOpen && 
         <main className ="w-full lg:w-70vw ">
            {children}
            <Footer />  
          </main>}
          { !isMobile && isSidebarOpen && 
          <>
            <Sidebar isSidebarOpen={isSidebarOpen}/>
            <main className ="w-full lg:w-70vw mx-auto">
              {children}
              <Footer />  
            </main>
          </>}
          {!isMobile && !isSidebarOpen &&  
          <main className ="w-full lg:w-70vw mx-auto">
            {children}
            <Footer />  
          </main>}     
         </div>
    </div>
  )
}

export default Layout


