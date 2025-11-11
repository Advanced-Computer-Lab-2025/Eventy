import { ReactNode } from "react";
import Header from "./Header";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({
  children,
  className = "",
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <Header />
      <main className="pb-20 md:pb-8">{children}</main>
    </div>
  );
}
