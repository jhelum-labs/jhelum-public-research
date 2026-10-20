import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import LiquidChrome from './components/LiquidChrome.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ResearchHome from './pages/ResearchHome.jsx'
import W11Research from './pages/W11Research.jsx'
import ResearchArticle from './pages/ResearchArticle.jsx'
import Playground from './pages/Playground.jsx'

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

function AppContent() {
  const { theme } = useTheme()
  const { pathname } = useLocation()

  return (
    <>
      {pathname !== '/' && (
        <LiquidChrome
          className="site__liquid-chrome"
          baseColor={theme === 'dark' ? [0.04, 0.08, 0.2] : [0.5, 0.68, 1]}
          speed={0.26}
          amplitude={0.42}
          interactive={false}
        />
      )}
      <ScrollToTop />
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<ResearchHome />} />
            <Route path="/w-1.1" element={<W11Research />} />
            <Route path="/research/:slug" element={<ResearchArticle />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="*" element={<ResearchHome />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
