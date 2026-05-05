import type { Metadata } from "next";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LateTracker™ — How Late Will She Be?",
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
        {/* Fixed top navbar */}
        <Navbar />

        {/* Page content — padded top so content clears the fixed navbar */}
        <main style={{
          flex: 1,
          paddingTop: 60, /* matches navbar height */
        }}>
          {children}
        </main>

        {/* Footer always at bottom */}
      </body>
      <Footer />
    </html>
  );
}