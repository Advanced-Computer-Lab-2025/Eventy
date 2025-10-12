import { useTheme } from "./ThemeProvider";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = false, className = "" }: LogoProps) {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  };
  
  const logoPath = theme === "dark" ? "/images/logo-dark.png" : "/images/logo-light.png";
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoPath}
        alt="Eventy Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
}
