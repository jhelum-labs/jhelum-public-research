import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Respect an explicit saved preference, else the OS preference.
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('jl-theme')
      if (saved) return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    // Absolute-dark rides on top of the dark theme (data-theme='dark'
    // plus .theme-absolute for the pure-black token overrides).
    if (theme === 'absolute-dark') {
      document.documentElement.dataset.theme = 'dark'
      document.documentElement.classList.add('theme-absolute')
    } else {
      document.documentElement.dataset.theme = theme
      document.documentElement.classList.remove('theme-absolute')
    }
    window.localStorage.setItem('jl-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}