import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  User, 
  Hash, 
  FileText,
  BookOpen,
  Lightbulb,
  Heart,
  HelpCircle
} from "lucide-react"

const trendingTopics = [
  { name: "React 18", count: 156 },
  { name: "TypeScript", count: 98 },
  { name: "Vue 3", count: 87 },
  { name: "Next.js", count: 76 },
  { name: "Tailwind CSS", count: 65 }
]

const activeUsers = [
  { name: "张三", avatar: "https://github.com/shadcn.png", followers: "1200" },
  { name: "李四", avatar: "https://github.com/shadcn.png", followers: "980" },
  { name: "王五", avatar: "https://github.com/shadcn.png", followers: "756" },
  { name: "赵六", avatar: "https://github.com/shadcn.png", followers: "634" }
]

export function RightPanel() {
  return (
    <div className="w-full space-y-6">
      {/* 搜索栏 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">搜索</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="搜索动态、用户、话题..." />
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <User className="mr-1 h-3 w-3" />
              用户
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Hash className="mr-1 h-3 w-3" />
              话题
            </Button>
            <Button variant="default" size="sm" className="flex-1">
              <FileText className="mr-1 h-3 w-3" />
              动态
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 动态类型筛选 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">动态类型</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
              <span className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>技术分享</span>
              </span>
              <Badge variant="secondary">45</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
              <span className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>学习感悟</span>
              </span>
              <Badge variant="secondary">32</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
              <span className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>创意想法</span>
              </span>
              <Badge variant="secondary">28</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
              <span className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>生活日常</span>
              </span>
              <Badge variant="secondary">19</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
              <span className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>求助问答</span>
              </span>
              <Badge variant="secondary">15</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 热门话题 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">热门话题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingTopics.map((topic) => (
            <div key={topic.name} className="flex items-center justify-between">
              <span className="font-medium cursor-pointer hover:text-primary">
                #{topic.name}
              </span>
              <Badge variant="outline">{topic.count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 活跃用户 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">活跃用户</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeUsers.map((user, index) => (
              <div key={user.name} className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.followers} 关注者</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
