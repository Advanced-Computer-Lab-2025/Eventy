import { useTheme } from "./ThemeProvider";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = false, className = "" }: LogoProps) {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: "h-20 w-20",
    md: "h-24 w-24", 
    lg: "h-32 w-32",
    xl: "h-32 w-32",
    xxl: "h-40 w-40"
  };
  
  // Different size adjustments for light vs dark logos
  const themeSizeAdjustment = theme === "dark" ? "scale-107" : ""; // Slightly larger for dark mode
  
  const logoPath = theme === "dark" ? "/images/logo-dark.png" : "/images/logo-light.png";
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoPath}
        alt="Eventy Logo"
        className={`${sizeClasses[size]} object-contain ${themeSizeAdjustment}`}
      />
    </div>
  );
}
