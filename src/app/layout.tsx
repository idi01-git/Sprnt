import type { Metadata } from "next";
import { Outfit, Poppins } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sprintern - Virtual Industrial Internship for Core Engineers",
  description: "Learn. Build. Certify. In Just 7 Days. Get industrial experience through intensive, project-based learning sprints for core engineering students.",
  keywords: ["virtual internship", "engineering", "core engineers", "certification", "industrial training"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
