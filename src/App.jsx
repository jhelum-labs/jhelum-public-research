import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ResearchHome from './pages/ResearchHome.jsx'
import W11Research from './pages/W11Research.jsx'
import ResearchArticle from './pages/ResearchArticle.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<ResearchHome />} />
            <Route path="/w-1.1" element={<W11Research />} />
            <Route path="/research/:slug" element={<ResearchArticle />} />
            <Route path="*" element={<ResearchHome />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}