import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '火山虚拟人素材管理',
    template: '%s | 火山虚拟人',
  },
  description: '上传和管理虚拟人素材，支持图片、视频和音频的智能管理平台',
  keywords: [
    '火山引擎',
    '虚拟人',
    '素材管理',
    'AI素材',
    '数字人',
  ],
  authors: [{ name: 'Coze Code Team' }],
  generator: 'Coze Code',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" className="dark">
      <body className={`antialiased min-h-screen bg-background`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
