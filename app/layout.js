export const metadata = {
  title: "BOQmate — AI-Powered Construction Pricing",
  description: "AI-Powered Construction Pricing",
  icons: {
    icon: "/favicon.ico",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
