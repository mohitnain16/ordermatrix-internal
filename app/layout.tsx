import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import './wynlo.css';
import './globals.css';

const urbanist = Urbanist({ subsets: ['latin'], variable: '--font', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://admin.ordermatrix.in'),
  title: 'Ordermatrix Admin',
  description: 'Internal operations command center',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#EC6240' },
    ],
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
    function apply(m){document.documentElement.setAttribute('data-theme',m);}
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
      className={`${urbanist.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
