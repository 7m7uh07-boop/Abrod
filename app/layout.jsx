import './globals.css';

export const metadata = {
  title: 'AI Sandbox & Load Tester',
  description: 'AI Browser Sandbox with Agent Stress Tester',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
