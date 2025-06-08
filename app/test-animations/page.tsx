"use client";

import { useState } from "react";
import { BottleLoadingAnimation } from "@/components/bottles/BottleLoadingAnimation";

export default function TestAnimationsPage() {
  const [animationType, setAnimationType] = useState<"picking" | "waiting">(
    "picking"
  );

  return (
    <div className="min-h-screen bg-ocean-light p-4">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ocean-800 mb-2">
            🌊 漂流瓶动画展示
          </h1>
          <p className="text-ocean-600">测试和预览漂流瓶加载动画效果</p>
        </div>

        {/* 动画类型选择 */}
        <div className="bottle-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-ocean-800 mb-4">
            选择动画类型
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setAnimationType("waiting")}
              className={`p-4 rounded-xl border-2 transition-all ${
                animationType === "waiting"
                  ? "border-ocean-500 bg-ocean-50 text-ocean-700"
                  : "border-ocean-200 bg-white text-ocean-600 hover:border-ocean-300"
              }`}
            >
              <div className="text-2xl mb-2">🌊</div>
              <div className="font-medium">等待发现</div>
              <div className="text-sm opacity-75">漂浮的瓶子</div>
            </button>

            <button
              onClick={() => setAnimationType("picking")}
              className={`p-4 rounded-xl border-2 transition-all ${
                animationType === "picking"
                  ? "border-ocean-500 bg-ocean-50 text-ocean-700"
                  : "border-ocean-200 bg-white text-ocean-600 hover:border-ocean-300"
              }`}
            >
              <div className="text-2xl mb-2">🎣</div>
              <div className="font-medium">捞取瓶子</div>
              <div className="text-sm opacity-75">钓鱼场景</div>
            </button>
          </div>
        </div>

        {/* 动画预览区域 */}
        <div className="bottle-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-ocean-800 mb-4">
            动画预览
          </h2>

          {/* 动画展示容器 */}
          <div className="border-2 border-dashed border-ocean-300 rounded-xl p-4 bg-white/50">
            <BottleLoadingAnimation
              type={animationType}
              message={
                animationType === "picking"
                  ? "正在捞瓶子......"
                  : "海面上漂浮着许多故事..."
              }
            />
          </div>
        </div>

        {/* 动画信息 */}
        <div className="bottle-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-ocean-800 mb-4">
            当前动画信息
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-ocean-600">动画类型:</span>
              <span className="font-medium text-ocean-800">
                {animationType === "picking" ? "捞取瓶子" : "等待发现"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ocean-600">场景描述:</span>
              <span className="font-medium text-ocean-800">
                {animationType === "picking" ? "钓鱼场景" : "海面漂浮"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ocean-600">主要元素:</span>
              <span className="font-medium text-ocean-800">
                {animationType === "picking"
                  ? "钓竿, 鱼线, 瓶子, 气泡"
                  : "漂流瓶, 软木塞, 光点"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ocean-600">动画效果:</span>
              <span className="font-medium text-ocean-800">
                {animationType === "picking"
                  ? "波浪, 漂浮, 旋转, 脉冲"
                  : "漂浮, 闪烁, 弹跳"}
              </span>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bottle-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-ocean-800 mb-4">
            使用方法
          </h2>

          <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
            <div className="text-gray-600 mb-2">// 导入组件</div>
            <div className="text-blue-600 mb-3">
              import {`{BottleLoadingAnimation}`} from
              '@/components/bottles/BottleLoadingAnimation';
            </div>

            <div className="text-gray-600 mb-2">// 使用组件</div>
            <div className="text-purple-600">
              {`<BottleLoadingAnimation`}
              <br />
              <span className="ml-4 text-green-600">
                type="{animationType}"
              </span>
              <br />
              <span className="ml-4 text-green-600">
                message="
                {animationType === "picking"
                  ? "正在捞瓶子......"
                  : "海面上漂浮着许多故事..."}
                "
              </span>
              <br />
              {`/>`}
            </div>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <a
            href="/home"
            className="inline-flex items-center gap-2 bg-ocean-500 hover:bg-ocean-600 
              text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <span>🏠</span>
            返回主页
          </a>
        </div>
      </div>
    </div>
  );
}
