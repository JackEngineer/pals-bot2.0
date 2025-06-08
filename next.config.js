/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 压缩和优化
  compress: true,
  poweredByHeader: false,
  
  // 支持 HTTPS 开发环境
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // 允许 Telegram 嵌入应用 - 移除 X-Frame-Options: DENY
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 预加载关键资源
          {
            key: 'Link',
            value: '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
          },
          // 缓存静态资源
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 