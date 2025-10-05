import { useState, useEffect } from "react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Code,
  BookOpen,
  Rocket,
  Heart
} from "lucide-react"

interface Category {
  name: string
  count: number
  icon: string
}

interface SubCategory {
  name: string
  count: number
}

interface CategoryGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  categories: (Category | SubCategory)[]
}

const categoryData: CategoryGroup[] = [
  {
    name: "技术分享",
    icon: Code,
    categories: [
      { name: "前端开发", count: 23 },
      { name: "后端开发", count: 15 },
      { name: "数据库", count: 8 },
      { name: "DevOps", count: 12 }
    ]
  },
  {
    name: "学习笔记",
    icon: BookOpen,
    categories: [
      { name: "算法学习", count: 18 },
      { name: "框架学习", count: 25 },
      { name: "工具使用", count: 16 },
      { name: "最佳实践", count: 9 }
    ]
  },
  {
    name: "项目经验",
    icon: Rocket,
    categories: [
      { name: "个人项目", count: 7 },
      { name: "开源贡献", count: 3 },
      { name: "团队协作", count: 12 },
      { name: "问题解决", count: 21 }
    ]
  },
  {
    name: "生活分享",
    icon: Heart,
    categories: [
      { name: "日常感悟", count: 14 },
      { name: "读书心得", count: 6 },
      { name: "旅行记录", count: 4 },
      { name: "兴趣爱好", count: 11 }
    ]
  }
]

export function CategorySidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const handleToggle = () => {
    if (!isCollapsed) {
      // 如果当前是展开状态，点击收起
      setTextOpacity(0) // 开始淡出
      // 延迟0.2秒后真正收起
      setTimeout(() => {
        setShowText(false)
        onToggle()
      }, 200)
    } else {
      // 如果当前是收起状态，直接展开
      onToggle()
    }
  }
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["技术分享", "学习笔记"]))
  const [showText, setShowText] = useState(!isCollapsed)
  const [textOpacity, setTextOpacity] = useState(!isCollapsed ? 1 : 0)

  useEffect(() => {
    if (!isCollapsed) {
      // 展开时，延迟0.2秒显示文字
      const timer = setTimeout(() => {
        setShowText(true)
        // 使用setTimeout确保DOM更新后再设置透明度
        setTimeout(() => {
          setTextOpacity(1) // 开始淡入
        }, 10)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isCollapsed])





  const toggleGroup = (groupName: string) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupName)) {
      newOpenGroups.delete(groupName)
    } else {
      newOpenGroups.add(groupName)
    }
    setOpenGroups(newOpenGroups)
  }

  return (
    <div className={`bg-background border-r transition-all duration-300 min-h-screen ${isCollapsed ? 'w-20' : 'w-56'}`}>
      <div className="px-0 py-10 min-h-screen">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={`mb-4 ${isCollapsed ? 'w-full justify-center p-0 h-12' : 'w-full justify-start'} hover:bg-muted bg-transparent`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4 mr-2" />
          )}
          {showText && <span style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}}>收起</span>}
        </Button>

        {showText && (
          <div className="space-y-2" style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}}>
            {categoryData.map((group) => (
              <Collapsible key={group.name}>
                <CollapsibleTrigger
                  onClick={() => toggleGroup(group.name)}
                  className="w-full text-left hover:bg-muted bg-transparent"
                >
                  <div className="flex items-center space-x-2">
                    <group.icon className="h-4 w-4 text-foreground" />
                    <span className="font-medium text-foreground">{group.name}</span>
                  </div>
                  {openGroups.has(group.name) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent isOpen={openGroups.has(group.name)}>
                  <div className="ml-6 space-y-1 mt-2">
                    {group.categories.map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                      >
                        <span className="text-sm text-foreground">{category.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {isCollapsed && (
          <div className="space-y-2">
            {categoryData.map((group) => (
              <Button
                key={group.name}
                variant="ghost"
                size="sm"
                className="w-full justify-center p-0 h-12 hover:bg-muted bg-transparent"
                title={group.name}
              >
                <group.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
