import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true, // URL 끝에 / 추가
  output: 'standalone', // AWS Lambda 환경에서 standalone 빌드 사용
};

export default nextConfig;
