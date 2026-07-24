import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"ÖnceBak — Gitmeden önce bak",description:"Kapadokya'daki restoranları, kafeleri ve aktiviteleri güncel menüleri ve fiyatlarıyla keşfet.",metadataBase:new URL("https://xn--ncebak-vxa.com")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
