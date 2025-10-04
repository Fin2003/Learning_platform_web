import { useState } from "react"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { 
  Eye, 
  Edit3, 
  FileText, 
  BookOpen, 
  Lightbulb
} from "lucide-react"

export function QuickPost() {
  const [content, setContent] = useState("")
  const [isPreview, setIsPreview] = useState(false)

  const handlePost = () => {
    if (content.trim()) {
      // 这里发布动态的逻辑
      console.log("发布动态:", content)
      setContent("")
      setIsPreview(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">快速发布</h3>
              <p className="text-sm text-muted-foreground">分享你的想法和经验</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  编辑
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  预览
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isPreview ? (
          <div className="space-y-4">
            <Textarea
              placeholder="今天有什么想分享的吗？写下你的想法、学习心得或者问题..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  <FileText className="mr-1 h-3 w-3" />
                  技术
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  <BookOpen className="mr-1 h-3 w-3" />
                  学习
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  <Lightbulb className="mr-1 h-3 w-3" />
                  想法
                </Badge>
              </div>
              <Button 
                onClick={handlePost}
                disabled={!content.trim()}
                size="sm"
              >
                发布
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 min-h-[100px]">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">张三</span>
                  <span className="text-sm text-muted-foreground ml-2">刚刚</span>
                </div>
              </div>
              <p className="text-sm">
                {content || "这是预览内容，你输入的内容会显示在这里..."}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreview(false)}
              >
                返回编辑
              </Button>
              <Button 
                onClick={handlePost}
                disabled={!content.trim()}
                size="sm"
              >
                确认发布
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
