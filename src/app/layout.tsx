import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LatePredictor — How Late Will She Be?",
  description: "Predict how late your friend will arrive using live map coordinates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        background: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}>
      {/* ThemeProvider must wrap everything so Navbar + Footer + pages share state */}
      <ThemeProvider>
        <Navbar />
        <main style={{
          flex: 1,
          paddingTop: 60, /* clears fixed navbar */
        }}>
          {children}
        </main>
        <Footer />
      </ThemeProvider>
    </body>
  </html>
  );
}