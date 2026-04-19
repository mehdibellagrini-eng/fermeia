/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/tiktokMzUvvCFTrtgK1duCaIUHrIDrTKbcieLX.txt',
        destination: '/publique/tiktokMzUvvCFTrtgK1duCaIUHrIDrTKbcieLX.txt',
      },
      {
        source: '/tiktokfPaPfxD02QOVrmbaX1CnL0f8ytv3DOGv.txt',
        destination: '/publique/tiktokfPaPfxD02QOVrmbaX1CnL0f8ytv3DOGv.txt',
      },
    ];
  },
};
module.exports = nextConfig;
