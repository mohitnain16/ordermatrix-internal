import type { Metadata } from 'next';
import { Inter, Source_Serif_4, Geist_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '600'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://admin.ordermatrix.in'),
  title: 'Ordermatrix Admin',
  description: 'Internal operations command center',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    title: 'Ordermatrix Admin',
    description: 'Internal operations command center',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

// Blocking inline script — runs before paint to prevent flash of wrong theme.
const themeScript = `(function(){
  try{
    var KEY='om-theme';
    function apply(m){document.documentElement.setAttribute('data-mode',m);}
    var stored=localStorage.getItem(KEY);
    apply(stored||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){
      if(!localStorage.getItem(KEY))apply(e.matches?'dark':'light');
    });
  }catch(e){}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
