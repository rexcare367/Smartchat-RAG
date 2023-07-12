import { FC, ReactNode } from 'react'
import Sidebar from '@/src/components/Sidebar'

const Header = () => {
  return (
    <header className="text-2xl py-3 font-bold text-center">
      <h1>Chat with AI</h1>
    </header>
  )}

const Footer = () => {
  return <footer className='py-3 text-center opacity-40'>This chatbot responses are generated by OpenAI's GPT. As GPT may occasionally produce inaccurate or misleading data, always verify AI messages when they contain critical information. </footer>
}

const Layout: FC<{ children: ReactNode }>  = ({ children }) => (
  <div className='flex h-screen'>
    <Sidebar />
    <main className ="w-full">
      <Header />
      {children}
      <Footer />  
    </main> 
  </div>
)

export default Layout


