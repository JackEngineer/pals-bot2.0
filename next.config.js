/** @type {import('next').NextConfig} */
const nextConfig = {
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
        ],
      },
    ]
  },
}

module.exports = nextConfig 