import './globals.css';

export const metadata = {
  title: 'AI Sandbox & Load Tester',
  description: 'AI Browser Sandbox with Agent Stress Tester',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
