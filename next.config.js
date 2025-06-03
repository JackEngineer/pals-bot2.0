/** @type {import('next').NextConfig} */
const nextConfig = {
  // 支持 HTTPS 开发环境
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 