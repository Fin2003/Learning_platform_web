import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggleButton } from "./ui/theme-toggle-button"
import { useTheme } from "./ThemeProvider"
import { useState, useRef, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

export function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 150) // 150ms延迟，避免抽搐
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed left-0 z-50" style={{ bottom: '10vh' }}>
      {/* 按钮右半部分 - 固定在左边缘，悬停时隐藏 */}
      <AnimatePresence>
        {!isHovered && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-10 bg-background border border-border rounded-r-md shadow-lg cursor-pointer"
            style={{ transform: 'translateY(-50%)' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center h-full">
              {theme === "light" ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 悬停区域 - 扩大触发范围 */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-16 cursor-pointer"
        style={{ transform: 'translateY(-50%)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* 主按钮容器 - 悬停时显示 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute left-6"
            style={{ 
              top: '50%',
              transform: 'translateY(-100%)'
            }}
            initial={{ x: -60, opacity: 0, y: -20 }}
            animate={{ x: 0, opacity: 1, y: -20 }}
            exit={{ x: -60, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThemeToggleButton
                theme={theme}
                onClick={toggleTheme}
                variant="circle-blur"
                start="bottom-left"
                className="shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
