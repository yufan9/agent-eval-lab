import "./globals.css";

export const metadata = {
  title: "Customer Support Agent Evaluation Dashboard",
  description: "Portfolio-ready AI PM dashboard for evaluating customer support agents."
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
