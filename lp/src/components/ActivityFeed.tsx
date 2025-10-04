import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { 
  FileText, 
  Heart, 
  MessageSquare, 
  Users
} from "lucide-react"
import React from "react"

interface Activity {
  id: string
  type: 'post' | 'like' | 'comment' | 'follow'
  user: {
    name: string
    avatar: string
    username: string
  }
  content: string
  timestamp: string
  likes?: number
  comments?: number
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'post',
    user: {
      name: '张三',
      avatar: 'https://github.com/shadcn.png',
      username: 'zhangsan'
    },
    content: '今天学习了React 18的新特性，特别是并发渲染和Suspense的改进，感觉前端开发又有了新的可能性！',
    timestamp: '2小时前',
    likes: 24,
    comments: 8
  },
  {
    id: '2',
    type: 'like',
    user: {
      name: '李四',
      avatar: 'https://github.com/shadcn.png',
      username: 'lisi'
    },
    content: '点赞了你的动态：关于TypeScript高级类型的使用技巧',
    timestamp: '4小时前'
  },
  {
    id: '3',
    type: 'post',
    user: {
      name: '王五',
      avatar: 'https://github.com/shadcn.png',
      username: 'wangwu'
    },
    content: '分享一个Vue 3 + TypeScript + Vite的项目模板，包含了完整的开发环境配置和最佳实践。',
    timestamp: '6小时前',
    likes: 18,
    comments: 5
  },
  {
    id: '4',
    type: 'comment',
    user: {
      name: '赵六',
      avatar: 'https://github.com/shadcn.png',
      username: 'zhaoliu'
    },
    content: '评论了你的动态：这个解决方案很实用，感谢分享！',
    timestamp: '8小时前'
  }
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'post':
      return FileText
    case 'like':
      return Heart
    case 'comment':
      return MessageSquare
    case 'follow':
      return Users
    default:
      return FileText
  }
}

function getActivityBadgeVariant(type: string) {
  switch (type) {
    case 'post':
      return 'default'
    case 'like':
      return 'destructive'
    case 'comment':
      return 'secondary'
    case 'follow':
      return 'outline'
    default:
      return 'default'
  }
}

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">最新动态</h2>
        <Button variant="outline" size="sm">查看更多</Button>
      </div>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{activity.user.name}</span>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {React.createElement(getActivityIcon(activity.type), { className: "mr-1 h-3 w-3" })}
                      {activity.type === 'post' ? '发布' : 
                       activity.type === 'like' ? '点赞' :
                       activity.type === 'comment' ? '评论' : '关注'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed mb-3">{activity.content}</p>
              {(activity.likes !== undefined || activity.comments !== undefined) && (
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {activity.likes !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{activity.likes}</span>
                    </div>
                  )}
                  {activity.comments !== undefined && (
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{activity.comments}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
