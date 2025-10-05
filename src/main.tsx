import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { ThemeProvider } from './components/ThemeProvider'
import { TopNavigation } from './components/TopNavigation'
import { CategorySidebar } from './components/CategorySidebar'
import { QuickPost } from './components/QuickPost'
import { ActivityFeed } from './components/ActivityFeed'
import { RightSidebar } from './components/RightSidebar'
import { FloatingThemeToggle } from './components/FloatingThemeToggle'

function App() {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen w-screen bg-background" style={{width: '100vw', margin: 0}}>
      {/* 顶部导航栏 */}
      <div className="top-navigation">
        <TopNavigation />
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex px-2">
        {/* 左侧分类栏 */}
        <div className="sidebar">
          <CategorySidebar 
            isCollapsed={leftSidebarCollapsed} 
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
        </div>
        
        {/* 中间主要内容区域 */}
        <div className="main-content flex-1 flex flex-col">
          <div className="flex-1 p-6">
            {/* 快速发布区域 */}
            <QuickPost />
            
            {/* 动态流区域 */}
            <ActivityFeed />
          </div>
        </div>
        
        {/* 右侧边栏 */}
        <div className="sidebar">
          <RightSidebar 
            isCollapsed={rightSidebarCollapsed} 
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>
      </div>
      
      {/* 浮动主题切换按钮 */}
      <FloatingThemeToggle />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
