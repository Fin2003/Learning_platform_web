import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { CategorySidebar } from './components/CategorySidebar'
import { QuickPost } from './components/QuickPost'
import { ActivityFeed } from './components/ActivityFeed'
import { RightSidebar } from './components/RightSidebar'

function App() {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen w-screen bg-background flex px-2 " style={{width: '100vw', margin: 0}}>
      {/* 左侧分类栏 */}
      <CategorySidebar 
        isCollapsed={leftSidebarCollapsed} 
        onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
      />
      
      {/* 中间主要内容区域 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          {/* 快速发布区域 */}
          <QuickPost />
          
          {/* 动态流区域 */}
          <ActivityFeed />
        </div>
      </div>
      
      {/* 右侧边栏 */}
      <RightSidebar 
        isCollapsed={rightSidebarCollapsed} 
        onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
