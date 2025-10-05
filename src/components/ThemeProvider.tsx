import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  toggleTheme: (event: React.MouseEvent) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme
    return savedTheme || "light"
  })

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionStyle, setTransitionStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = (event: React.MouseEvent) => {
    // 找到中间内容区域
    const mainContent = document.querySelector('.main-content')
    if (!mainContent) return
    
    const mainRect = mainContent.getBoundingClientRect()
    const x = event.clientX - mainRect.left
    const y = event.clientY - mainRect.top
    
    // 设置过渡动画的起始位置
    setTransitionStyle({
      '--click-x': `${x}px`,
      '--click-y': `${y}px`,
    } as React.CSSProperties)
    
    setIsTransitioning(true)
    
    // 延迟切换主题，让圆形动画有时间播放
    setTimeout(() => {
      setTheme(prev => prev === "light" ? "dark" : "light")
      setIsTransitioning(false)
    }, 300)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div 
        className={`theme-transition-container ${isTransitioning ? 'transitioning' : ''}`}
        style={transitionStyle}
      >
        {children}
      </div>
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