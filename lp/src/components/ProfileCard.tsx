import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

export function ProfileCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src="https://github.com/shadcn.png" alt="Profile" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">张三</CardTitle>
        <p className="text-sm text-muted-foreground">前端开发工程师</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Vue</Badge>
          <Badge variant="secondary">Node.js</Badge>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            热爱技术，专注于前端开发，喜欢分享和学习新技术
          </p>
        </div>
        
        <div className="flex justify-center space-x-2">
          <Button variant="outline" size="sm">关注</Button>
          <Button size="sm">私信</Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
          <div>
            <div className="text-lg font-semibold">128</div>
            <div className="text-xs text-muted-foreground">动态</div>
          </div>
          <div>
            <div className="text-lg font-semibold">1.2K</div>
            <div className="text-xs text-muted-foreground">关注者</div>
          </div>
          <div>
            <div className="text-lg font-semibold">856</div>
            <div className="text-xs text-muted-foreground">关注中</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
