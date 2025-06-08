"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  Badge,
  Skeleton,
  SkeletonBottleCard,
  Icon,
} from "@/components/ui";
import { Heart, MessageCircle, Share, Plus, Settings } from "lucide-react";

export default function UIShowcasePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");

  return (
    <div className="min-h-screen bg-ocean-light p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-ocean-800 mb-4">
            🌊 UI 组件展示
          </h1>
          <p className="text-ocean-600 text-lg">
            基于 shadcn/ui 架构的海洋主题组件库
          </p>
        </div>

        {/* 按钮组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Button 组件</CardTitle>
            <CardDescription>
              各种样式和大小的按钮组件，支持海洋主题
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 不同变体 */}
            <div>
              <h4 className="text-sm font-medium text-ocean-700 mb-3">
                变体样式
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="ocean">海洋主题</Button>
                <Button variant="ocean-outline">海洋边框</Button>
                <Button variant="aqua">水蓝主题</Button>
                <Button variant="deepblue">深海主题</Button>
                <Button variant="success">成功状态</Button>
                <Button variant="warning">警告状态</Button>
                <Button variant="error">错误状态</Button>
              </div>
            </div>

            {/* 不同尺寸 */}
            <div>
              <h4 className="text-sm font-medium text-ocean-700 mb-3">
                尺寸大小
              </h4>
              <div className="flex items-center gap-3">
                <Button size="sm">小按钮</Button>
                <Button size="md">中按钮</Button>
                <Button size="lg">大按钮</Button>
                <Button size="xl">超大按钮</Button>
              </div>
            </div>

            {/* 带图标的按钮 */}
            <div>
              <h4 className="text-sm font-medium text-ocean-700 mb-3">
                图标按钮
              </h4>
              <div className="flex gap-3">
                <Button>
                  <Icon icon={Plus} size="sm" className="mr-2" />
                  创建内容
                </Button>
                <Button variant="aqua">
                  <Icon icon={Heart} size="sm" className="mr-2" />
                  收藏
                </Button>
                <Button variant="ocean-outline">
                  <Icon icon={Share} size="sm" className="mr-2" />
                  分享
                </Button>
              </div>
            </div>

            {/* 加载状态 */}
            <div>
              <h4 className="text-sm font-medium text-ocean-700 mb-3">
                加载状态
              </h4>
              <div className="flex gap-3">
                <Button loading>加载中...</Button>
                <Button variant="aqua" loading>
                  处理中...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 输入组件展示 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Input 组件</CardTitle>
              <CardDescription>各种输入框组件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input
                label="邮箱地址"
                type="email"
                placeholder="example@email.com"
                helperText="请输入有效的邮箱地址"
              />
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                error="密码长度至少8位"
              />
              <Input
                variant="success"
                label="验证码"
                placeholder="已验证"
                disabled
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Textarea 组件</CardTitle>
              <CardDescription>多行文本输入组件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="消息内容"
                placeholder="写下你想说的话..."
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                maxLength={500}
                showCount
              />
              <Textarea
                label="描述"
                placeholder="详细描述..."
                size="lg"
                helperText="最多1000字符"
              />
            </CardContent>
          </Card>
        </div>

        {/* 卡片组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Card 组件</CardTitle>
            <CardDescription>不同样式的卡片组件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Card variant="ocean" hoverable>
                <CardHeader>
                  <CardTitle>海洋卡片</CardTitle>
                  <CardDescription>带毛玻璃效果的海洋主题卡片</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>这是一个海洋主题的卡片内容，具有美丽的视觉效果。</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">查看详情</Button>
                </CardFooter>
              </Card>

              <Card variant="glass" hoverable>
                <CardHeader>
                  <CardTitle>玻璃卡片</CardTitle>
                  <CardDescription>毛玻璃效果卡片</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>透明毛玻璃效果，现代设计风格。</p>
                </CardContent>
                <CardFooter>
                  <Button variant="aqua" size="sm">
                    操作
                  </Button>
                </CardFooter>
              </Card>

              <Card variant="gradient" hoverable>
                <CardHeader>
                  <CardTitle>渐变卡片</CardTitle>
                  <CardDescription>渐变背景卡片</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>美丽的渐变背景效果。</p>
                </CardContent>
                <CardFooter>
                  <Button variant="deepblue" size="sm">
                    确认
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* 标签组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Badge 组件</CardTitle>
            <CardDescription>各种状态标签组件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-ocean-700 mb-3">
                主题标签
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="ocean">海洋</Badge>
                <Badge variant="aqua">水蓝</Badge>
                <Badge variant="deepblue">深海</Badge>
                <Badge variant="ocean-outline">海洋边框</Badge>
                <Badge variant="ocean-soft">海洋柔和</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-ocean-700 mb-3">
                状态标签
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">成功</Badge>
                <Badge variant="warning">警告</Badge>
                <Badge variant="error">错误</Badge>
                <Badge variant="success-outline">成功边框</Badge>
                <Badge variant="success-soft">成功柔和</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 对话框组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog 组件</CardTitle>
            <CardDescription>模态对话框组件</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Icon icon={Settings} size="sm" className="mr-2" />
                  打开对话框
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>海洋主题对话框</DialogTitle>
                  <DialogDescription>
                    这是一个美丽的海洋主题对话框，具有毛玻璃效果和阴影。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input label="设置项 1" placeholder="请输入值" />
                  <Textarea label="设置项 2" placeholder="请输入描述" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="ocean-outline">取消</Button>
                  <Button>确认</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 骨架屏组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton 组件</CardTitle>
            <CardDescription>加载状态骨架屏组件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-ocean-700 mb-3">
                  漂流瓶卡片骨架屏
                </h4>
                <SkeletonBottleCard />
              </div>
              <div>
                <h4 className="text-sm font-medium text-ocean-700 mb-3">
                  基础骨架屏
                </h4>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 漂流瓶主题示例 */}
        <Card variant="ocean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌊 漂流瓶主题示例
            </CardTitle>
            <CardDescription>展示在实际漂流瓶应用中的使用效果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-ocean-50 rounded-xl p-4 border-l-4 border-ocean-400">
                <p className="text-ocean-800 leading-relaxed">
                  "在这片数字海洋中，每一个漂流瓶都承载着一个故事，一份心情，或是一个秘密。
                  让我们用美丽的界面来展现这些珍贵的瞬间。"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-ocean-500">
                <span>💫 来自远方的漂流瓶</span>
                <span>2小时前</span>
              </div>

              <div className="flex gap-3">
                <Button variant="success" size="sm">
                  <Icon icon={MessageCircle} size="sm" className="mr-1" />
                  回复
                </Button>
                <Button variant="aqua" size="sm">
                  扔回大海
                </Button>
                <Button variant="ocean-outline" size="sm">
                  <Icon icon={Heart} size="sm" className="mr-1" />
                  收藏
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
