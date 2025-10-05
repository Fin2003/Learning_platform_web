import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  Search, 
  Hash, 
  FileText, 
  BookOpen, 
  Lightbulb, 
  Heart, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export function RightSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const [searchQuery, setSearchQuery] = useState("")

  const activityTypes = [
    { icon: FileText, label: "文章", count: 12, color: "bg-blue-500" },
    { icon: BookOpen, label: "笔记", count: 8, color: "bg-green-500" },
    { icon: Lightbulb, label: "想法", count: 5, color: "bg-yellow-500" },
    { icon: Heart, label: "收藏", count: 3, color: "bg-red-500" },
    { icon: HelpCircle, label: "问答", count: 7, color: "bg-purple-500" }
  ]

  const trendingTopics = [
    "React Hooks",
    "TypeScript",
    "Tailwind CSS",
    "Vue 3",
    "Node.js",
    "Python",
    "机器学习",
    "前端优化"
  ]


  const handleToggle = () => {
    onToggle()
  }

  return (
    <div className={`bg-background border-l border-border transition-all duration-300 min-h-screen ${
      isCollapsed ? 'w-16' : 'w-56'
    } flex-shrink-0`}>
      <div className="px-0 py-4 min-h-screen flex flex-col">
        {/* 切换按钮 */}
        <div className="px-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="w-full justify-center p-2 hover:bg-muted bg-transparent"
          >
            {isCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 搜索框 */}
        <div className="px-2 mb-6">
          {isCollapsed ? (
            <div className="flex justify-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">搜索</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
        </div>

        {/* 动态类型 */}
        <div className="px-2 mb-6">
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-foreground mb-3">动态类型</h3>
          )}
          <div className="space-y-2">
            {activityTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                {isCollapsed ? (
                  <div className="flex flex-col items-center space-y-1 w-full">
                    <div className={`p-2 rounded-full ${type.color}`}>
                      <type.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs text-foreground">{type.count}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded-full ${type.color}`}>
                        <type.icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-foreground">{type.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {type.count}
                    </Badge>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

         {/* 热门话题 */}
         {!isCollapsed && (
           <div className="px-2 mb-6">
             <h3 className="text-sm font-medium text-foreground mb-3">热门话题</h3>
             <div className="space-y-2">
               {trendingTopics.map((topic, index) => (
                 <div key={index} className="flex items-center">
                   <Hash className="h-4 w-4 text-muted-foreground mr-2" />
                   <span className="text-sm text-foreground">{topic}</span>
                 </div>
               ))}
             </div>
           </div>
         )}
      </div>
    </div>
  )
}
