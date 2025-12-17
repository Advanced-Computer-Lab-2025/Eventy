import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full flex items-center justify-center pt-20 px-4">
        <Card className="w-full max-w-lg mx-4 overflow-visible">
          <CardContent className="pt-12 pb-8 overflow-visible">
            {/* Animated Boy with Balloon */}
            <div className="flex justify-center mb-6 overflow-visible">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-float"
                style={{ overflow: "visible" }}
              >
                {/* Balloon String */}
                <path
                  d="M 100 60 Q 98 75, 96 90 L 94 105"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  fill="none"
                  className="animate-sway"
                />

                {/* Purple Balloon */}
                <g className="animate-balloon-float">
                  <ellipse
                    cx="100"
                    cy="35"
                    rx="20"
                    ry="25"
                    fill="hsl(var(--primary))"
                    opacity="0.9"
                  />
                  <path
                    d="M 100 60 L 95 70 L 100 68 L 105 70 Z"
                    fill="hsl(var(--primary))"
                  />
                  {/* Balloon shine */}
                  <ellipse
                    cx="95"
                    cy="30"
                    rx="6"
                    ry="8"
                    fill="white"
                    opacity="0.4"
                  />
                </g>

                {/* Boy's Head */}
                <circle
                  cx="90"
                  cy="110"
                  r="15"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.8"
                />

                {/* Boy's Body */}
                <rect
                  x="80"
                  y="125"
                  width="20"
                  height="30"
                  rx="3"
                  fill="hsl(var(--primary))"
                  opacity="0.7"
                />

                {/* Boy's Legs */}
                <rect
                  x="82"
                  y="155"
                  width="7"
                  height="25"
                  rx="2"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.7"
                />
                <rect
                  x="91"
                  y="155"
                  width="7"
                  height="25"
                  rx="2"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.7"
                />

                {/* Boy's Arms */}
                {/* Left arm holding balloon */}
                <g className="animate-hold-balloon">
                  <rect
                    x="88"
                    y="105"
                    width="5"
                    height="22"
                    rx="2"
                    fill="hsl(var(--muted-foreground))"
                    opacity="0.7"
                    transform="rotate(-45 90.5 116)"
                  />
                  {/* Hand holding string */}
                  <circle
                    cx="94"
                    cy="105"
                    r="3"
                    fill="hsl(var(--muted-foreground))"
                    opacity="0.8"
                  />
                </g>
                {/* Right arm waving */}
                <rect
                  x="100"
                  y="130"
                  width="5"
                  height="20"
                  rx="2"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.7"
                  transform="rotate(20 102.5 140)"
                  className="animate-wave"
                />
              </svg>
            </div>

            {/* 404 Text */}
            <div className="text-center mb-6">
              <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
              <h2 className="text-2xl font-semibold mb-3">
                Oops! You seem lost
              </h2>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
                Let's get you back on track!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => setLocation("/")} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
