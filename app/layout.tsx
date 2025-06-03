import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
const inter = Inter({ subsets: ["latin"] });
import { AuthProvider } from "@/components/auth-provider";
import { PaymentSchedulerInit } from "@/components/payment-scheduler-init";

export const metadata: Metadata = {
  title: "HIT accomodation portal",
  description: "Accomodation portal for students applying to HIT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">      <body>
        <AuthProvider>
          <PaymentSchedulerInit />
          <ToastContainer />
          <main className="w-full h-screen">
            
              {children}
          
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}