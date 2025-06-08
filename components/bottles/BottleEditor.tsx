"use client";

import { useState } from "react";

interface BottleStyle {
  color: string;
  pattern: string;
  decoration: string;
}

interface BottleEditorProps {
  onSubmit?: (
    content: string,
    mediaType?: string,
    mediaUrl?: string,
    bottleStyle?: BottleStyle
  ) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const bottleColors = [
  { name: "ocean", label: "海洋蓝", gradient: "from-ocean-400 to-ocean-600" },
  {
    name: "deepblue",
    label: "深海蓝",
    gradient: "from-deepblue-400 to-deepblue-600",
  },
  { name: "aqua", label: "水晶蓝", gradient: "from-aqua-400 to-aqua-600" },
  { name: "teal", label: "翡翠绿", gradient: "from-teal-400 to-teal-600" },
  { name: "cyan", label: "天空蓝", gradient: "from-cyan-400 to-cyan-600" },
];

const bottlePatterns = [
  { name: "solid", label: "纯色", icon: "⚪" },
  { name: "gradient", label: "渐变", icon: "🌈" },
  { name: "striped", label: "条纹", icon: "📏" },
  { name: "dotted", label: "圆点", icon: "⚫" },
  { name: "waves", label: "波浪", icon: "🌊" },
];

const bottleDecorations = [
  { name: "none", label: "无装饰", icon: "⭕" },
  { name: "stars", label: "星星", icon: "⭐" },
  { name: "hearts", label: "爱心", icon: "💖" },
  { name: "waves", label: "海浪", icon: "🌊" },
  { name: "bubbles", label: "气泡", icon: "💧" },
];

export default function BottleEditor({
  onSubmit,
  onClose,
  isOpen,
}: BottleEditorProps) {
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "audio">(
    "text"
  );
  const [mediaUrl, setMediaUrl] = useState("");
  const [bottleStyle, setBottleStyle] = useState<BottleStyle>({
    color: "ocean",
    pattern: "solid",
    decoration: "none",
  });
  const [currentStep, setCurrentStep] = useState<
    "content" | "style" | "preview"
  >("content");

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit?.(content, mediaType, mediaUrl || undefined, bottleStyle);
      handleReset();
    }
  };

  const handleReset = () => {
    setContent("");
    setMediaType("text");
    setMediaUrl("");
    setBottleStyle({ color: "ocean", pattern: "solid", decoration: "none" });
    setCurrentStep("content");
    onClose?.();
  };

  const getBottlePreview = () => {
    const colorGradient =
      bottleColors.find((c) => c.name === bottleStyle.color)?.gradient ||
      "from-ocean-400 to-ocean-600";
    return `bg-gradient-to-br ${colorGradient}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-ocean-gradient text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <span className="text-xl">🍾</span> */}
            <h2 className="text-lg font-semibold">
              {currentStep === "content" && "写下漂流瓶内容"}
              {currentStep === "style" && "装扮瓶子"}
              {currentStep === "preview" && "预览瓶子"}
            </h2>
          </div>
          <button
            onClick={handleReset}
            className="text-white/80 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-center gap-2 mb-4">
            {["content", "style", "preview"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep === step
                      ? "bg-ocean-500 text-white"
                      : "bg-ocean-100 text-ocean-600"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      ["style", "preview"].includes(currentStep) && index === 0
                        ? "bg-ocean-500"
                        : "bg-ocean-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 overflow-y-auto max-h-96">
          {/* 第一步：内容编辑 */}
          {currentStep === "content" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ocean-700 mb-2">
                  写下你想说的话...
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="在这里写下你的漂流瓶内容，让它随着漂流瓶飘向远方..."
                  className="w-full h-32 p-3 border border-ocean-200 rounded-lg resize-none
                    focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200 transition-colors
                    placeholder-ocean-400"
                  maxLength={100}
                />
                <div className="text-right text-xs text-ocean-500 mt-1">
                  {content.length}/100
                </div>
              </div>

              {/* 媒体类型选择 */}
              {/* <div>
                <label className="block text-sm font-medium text-ocean-700 mb-2">
                  内容类型
                </label>
                <div className="flex gap-2">
                  {[
                    { type: "text", label: "文字", icon: "📝" },
                    { type: "image", label: "图片", icon: "📷" },
                    { type: "audio", label: "语音", icon: "🎵" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setMediaType(item.type as any)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        mediaType === item.type
                          ? "bg-ocean-500 text-white"
                          : "bg-ocean-100 text-ocean-700 hover:bg-ocean-200"
                      }`}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </div> */}
            </div>
          )}

          {/* 第二步：样式选择 */}
          {currentStep === "style" && (
            <div className="space-y-4">
              {/* 颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-ocean-700 mb-2">
                  瓶子颜色
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bottleColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setBottleStyle({ ...bottleStyle, color: color.name })
                      }
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        bottleStyle.color === color.name
                          ? "ring-2 ring-ocean-500 ring-offset-2"
                          : "hover:scale-105"
                      }`}
                    >
                      <div
                        className={`w-full h-8 rounded bg-gradient-to-br ${color.gradient} mb-1`}
                      ></div>
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 图案选择 */}
              <div>
                <label className="block text-sm font-medium text-ocean-700 mb-2">
                  瓶子图案
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bottlePatterns.map((pattern) => (
                    <button
                      key={pattern.name}
                      onClick={() =>
                        setBottleStyle({
                          ...bottleStyle,
                          pattern: pattern.name,
                        })
                      }
                      className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                        bottleStyle.pattern === pattern.name
                          ? "border-ocean-500 bg-ocean-50 text-ocean-700"
                          : "border-ocean-200 text-ocean-600 hover:border-ocean-300"
                      }`}
                    >
                      <div className="text-lg mb-1">{pattern.icon}</div>
                      {pattern.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 装饰选择 */}
              <div>
                <label className="block text-sm font-medium text-ocean-700 mb-2">
                  瓶子装饰
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bottleDecorations.map((decoration) => (
                    <button
                      key={decoration.name}
                      onClick={() =>
                        setBottleStyle({
                          ...bottleStyle,
                          decoration: decoration.name,
                        })
                      }
                      className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                        bottleStyle.decoration === decoration.name
                          ? "border-ocean-500 bg-ocean-50 text-ocean-700"
                          : "border-ocean-200 text-ocean-600 hover:border-ocean-300"
                      }`}
                    >
                      <div className="text-lg mb-1">{decoration.icon}</div>
                      {decoration.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 第三步：预览 */}
          {currentStep === "preview" && (
            <div className="space-y-4">
              <div className="text-center">
                {/* 瓶子预览 */}
                <div
                  className={`inline-block w-24 h-28 ${getBottlePreview()} 
                  shadow-lg relative animate-float mb-4 bottle-shape`}
                >
                  {/* 瓶子肩部 */}
                  <div className="bottle-shoulder"></div>

                  {/* 瓶颈 */}
                  <div className="bottle-neck"></div>

                  {/* 瓶口环 */}
                  <div className="bottle-rim"></div>

                  {/* 软木塞 */}
                  <div className="bottle-mouth"></div>

                  {/* 瓶中液体 */}
                  <div
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2
                    w-14 h-8 bg-gradient-to-t from-white/60 via-white/40 to-white/20 
                    liquid-wave rounded-b-full"
                  ></div>
                </div>

                <h3 className="text-lg font-semibold text-ocean-800 mb-2">
                  你的漂流瓶
                </h3>
              </div>

              {/* 内容预览 */}
              <div className="bg-ocean-50 rounded-xl p-4 border-l-4 border-ocean-400">
                <p className="text-ocean-800 leading-relaxed text-sm">
                  {content || "暂无内容"}
                </p>
              </div>

              {/* 样式信息 */}
              <div className="text-xs text-ocean-600 space-y-1">
                <div>
                  🎨 颜色：
                  {
                    bottleColors.find((c) => c.name === bottleStyle.color)
                      ?.label
                  }
                </div>
                <div>
                  ✨ 图案：
                  {
                    bottlePatterns.find((p) => p.name === bottleStyle.pattern)
                      ?.label
                  }
                </div>
                <div>
                  🎭 装饰：
                  {
                    bottleDecorations.find(
                      (d) => d.name === bottleStyle.decoration
                    )?.label
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-ocean-100">
          <div className="flex gap-3">
            {currentStep !== "content" && (
              <button
                onClick={() =>
                  setCurrentStep(currentStep === "style" ? "content" : "style")
                }
                className="px-4 py-2 bg-ocean-100 hover:bg-ocean-200 text-ocean-700 
                  rounded-lg text-sm font-medium transition-colors"
              >
                上一步
              </button>
            )}

            <button
              onClick={() => {
                if (currentStep === "content") {
                  if (content.trim()) setCurrentStep("style");
                } else if (currentStep === "style") {
                  setCurrentStep("preview");
                } else {
                  handleSubmit();
                }
              }}
              disabled={currentStep === "content" && !content.trim()}
              className="flex-1 bg-ocean-500 hover:bg-ocean-600 disabled:bg-ocean-300 
                text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors
                disabled:cursor-not-allowed"
            >
              {currentStep === "content" && "下一步"}
              {currentStep === "style" && "下一步"}
              {currentStep === "preview" && "🌊 投入大海"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
