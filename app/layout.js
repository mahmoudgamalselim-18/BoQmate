export const metadata = {
  title: "BoQmate — منصة تسعير ذكية",
  description: "منصة تسعير مقايسات الإنشاء للسوق المصري والخليجي",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
