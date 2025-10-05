import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedNight = localStorage.getItem("nightmode")
      if (storedNight === null) {
        // Fallback to system preference; default to light if unavailable
        const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        return prefersDark ? "dark" : "light"
      }
      return storedNight === 'true' ? "dark" : "light"
    } catch {
      return "light"
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    // Persist both theme (for compatibility) and nightmode
    try {
      localStorage.setItem("theme", theme)
      localStorage.setItem("nightmode", String(theme === 'dark'))
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light"
      try {
        // After manual click, nightmode becomes the source of truth
        localStorage.setItem('nightmode', String(next === 'dark'))
      } catch {}
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}