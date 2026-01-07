import React from "react";
import Booths from "./Booths";
import { useToast } from "@/hooks/use-toast";

interface PlatformMapProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  attendees: Array<{ name: string; email: string }>;
  boothSize: "2x2" | "4x4";
  onBoothApplication: (boothId: string, boothNumber: number | string) => void;
}

const PlatformMap: React.FC<PlatformMapProps> = ({
  selectedLocation,
  onLocationSelect,
  onBoothApplication,
}) => {
  const { toast } = useToast();

  const handleBoothClick = (id: string, number: number | string) => {
    // Skip Special Needs Shop
    if (id === "booth-special-needs-shop") {
      return;
    }

    // Show selection toast
    toast({
      title: "Booth Selected",
      description: `Booth ${number} selected`,
    });

    // Update selected location for visual feedback
    onLocationSelect(selectedLocation === id ? "" : id);

    // Call the parent component's booth application handler
    onBoothApplication(id, number);
  };

  const handleBoothClickSpecial = (id: string, number: number | string) => {
    // Skip Special Needs Shop
    if (id === "booth-special-needs-shop") {
      return;
    }

    // Show selection toast
    toast({
      title: "Booth Selected",
      description: `Booth ${number} selected`,
    });

    // Update selected location for visual feedback
    onLocationSelect(selectedLocation === id ? "" : id);

    // Call the parent component's booth application handler
    onBoothApplication(id, number);
  };

  return (
    <>
      <div className="flex flex-col w-full max-w-6xl mx-auto">
        <div className="relative w-full bg-[#FFF8E1] border-4 border-[#F2C57C] rounded-2xl shadow-md overflow-hidden h-[700px]">
          <svg
            viewBox="0 0 600 500"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gradient fills for booth realism */}
              <linearGradient id="boothGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF9E6" />
                <stop offset="100%" stopColor="#F7C66F" />
              </linearGradient>
              <linearGradient id="boothSelected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
              <filter
                id="boothShadow"
                x="-20%"
                y="-20%"
                width="150%"
                height="150%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="2"
                  floodColor="#00000033"
                />
              </filter>
            </defs>

            {/* Background */}
            <rect width="600" height="500" fill="#FFF8E1" />

            {/* --- pronto PATHS --- */}
            <image
              href="/images/path.png"
              x="-130"
              y="80"
              width="100"
              height="20"
            />
            <image
              href="/images/pathV.png"
              x="-25"
              y="-35"
              width="20"
              height="150"
            />
            {/* --- friends PATHS --- */}
            <image
              href="/images/path.png"
              x="-130"
              y="410"
              width="100"
              height="20"
            />
            <image
              href="/images/pathV.png"
              x="-25"
              y="395"
              width="20"
              height="150"
            />
            {/* --- lroma PATHS --- */}
            <image
              href="/images/path.png"
              x="620"
              y="78"
              width="100"
              height="20"
            />
            <image
              href="/images/pathV.png"
              x="595"
              y="-40"
              width="20"
              height="150"
            />
            {/* --- mcarona PATHS --- */}
            <image
              href="/images/path.png"
              x="620"
              y="410"
              width="100"
              height="20"
            />
            <image
              href="/images/pathV.png"
              x="595"
              y="395"
              width="20"
              height="150"
            />

            {/* --- PATHS for the center of the platform --- */}
            <image
              href="/images/pathV.png"
              x="290"
              y="-20"
              width="20"
              height="120"
            />
            <image
              href="/images/pathV.png"
              x="290"
              y="400"
              width="20"
              height="120"
            />

            {/* --- LEFT TABLES --- */}
            <image
              href="/images/tables.png"
              x="10"
              y="230"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="30"
              y="150"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="60"
              y="90"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="70"
              y="320"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="150"
              y="210"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="180"
              y="120"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="180"
              y="300"
              width="100"
              height="80"
            />

            {/* --- RIGHT TABLES ---         <image href="/images/tables.png" x="260" y="220" width="100" height="80" />*/}
            <image
              href="/images/tables.png"
              x="480"
              y="165"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="410"
              y="220"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="340"
              y="130"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="430"
              y="90"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="470"
              y="280"
              width="100"
              height="80"
            />
            <image
              href="/images/tables.png"
              x="370"
              y="300"
              width="100"
              height="80"
            />

            {/* --- BEIGE umbrellas ---         <image href="/images/ubeige.png" x="200" y="210" width="100" height="80" />*/}
            <image
              href="/images/ubeige.png"
              x="380"
              y="80"
              width="100"
              height="80"
            />
            <image
              href="/images/ubeige.png"
              x="20"
              y="305"
              width="100"
              height="80"
            />

            <image
              href="/images/ubeige.png"
              x="-20"
              y="140"
              width="100"
              height="80"
            />

            {/* --- YELLOW umbrellas --- */}
            <image
              href="/images/uyellow.png"
              x="100"
              y="200"
              width="100"
              height="80"
            />
            <image
              href="/images/uyellow.png"
              x="290"
              y="120"
              width="100"
              height="80"
            />
            <image
              href="/images/uyellow.png"
              x="520"
              y="270"
              width="100"
              height="80"
            />

            {/* --- BLUE umbrellas --- */}
            <image
              href="/images/ublue.png"
              x="130"
              y="110"
              width="100"
              height="80"
            />
            <image
              href="/images/ublue.png"
              x="320"
              y="290"
              width="100"
              height="80"
            />
            <image
              href="/images/ublue.png"
              x="-50"
              y="220"
              width="100"
              height="80"
            />
            <image
              href="/images/ublue.png"
              x="430"
              y="155"
              width="100"
              height="80"
            />
            {/* --- ORANGE umbrellas --- */}

            <image
              href="/images/uorange.png"
              x="120"
              y="290"
              width="100"
              height="80"
            />
            <image
              href="/images/uorange.png"
              x="350"
              y="215"
              width="100"
              height="80"
            />
            <image
              href="/images/uorange.png"
              x="10"
              y="80"
              width="100"
              height="80"
            />
            <image
              href="/images/uorange.png"
              x="510"
              y="100"
              width="100"
              height="80"
            />

            <image
              href="/images/palm2.png"
              x="-140"
              y="340"
              width="100"
              height="80"
            />
            <image
              href="/images/palm2.png"
              x="-140"
              y="80"
              width="100"
              height="80"
            />
            <image
              href="/images/screen.png"
              x="-140"
              y="205"
              width="100"
              height="80"
            />
            <image
              href="/images/bush.png"
              x="-155"
              y="290"
              width="100"
              height="80"
            />
            <image
              href="/images/bush.png"
              x="-155"
              y="125"
              width="100"
              height="80"
            />

            <image
              href="/images/palmr.png"
              x="-35"
              y="-10"
              width="100"
              height="80"
            />
            <image
              href="/images/palmr.png"
              x="220"
              y="-10"
              width="100"
              height="80"
            />
            <image
              href="/images/palmr.png"
              x="280"
              y="-10"
              width="100"
              height="80"
            />
            <image
              href="/images/palmr.png"
              x="530"
              y="-10"
              width="100"
              height="80"
            />
            <image
              href="/images/palmr.png"
              x="95"
              y="-10"
              width="100"
              height="80"
            />
            <image
              href="/images/palmr.png"
              x="400"
              y="-10"
              width="100"
              height="80"
            />

            <image
              href="/images/palm.png"
              x="-35"
              y="430"
              width="100"
              height="80"
            />
            <image
              href="/images/palm.png"
              x="220"
              y="430"
              width="100"
              height="80"
            />
            <image
              href="/images/palm.png"
              x="280"
              y="430"
              width="100"
              height="80"
            />
            <image
              href="/images/palm.png"
              x="530"
              y="430"
              width="100"
              height="80"
            />
            <image
              href="/images/palm.png"
              x="95"
              y="430"
              width="100"
              height="80"
            />
            <image
              href="/images/palm.png"
              x="400"
              y="430"
              width="100"
              height="80"
            />

            <image
              href="/images/bushu.png"
              x="30"
              y="452"
              width="100"
              height="80"
            />
            <image
              href="/images/bushu.png"
              x="160"
              y="452"
              width="100"
              height="80"
            />
            <image
              href="/images/bushu.png"
              x="340"
              y="452"
              width="100"
              height="80"
            />
            <image
              href="/images/bushu.png"
              x="460"
              y="452"
              width="100"
              height="80"
            />

            <image
              href="/images/bushd.png"
              x="30"
              y="-32"
              width="100"
              height="80"
            />
            <image
              href="/images/bushd.png"
              x="160"
              y="-32"
              width="100"
              height="80"
            />
            <image
              href="/images/bushd.png"
              x="340"
              y="-32"
              width="100"
              height="80"
            />
            <image
              href="/images/bushd.png"
              x="460"
              y="-32"
              width="100"
              height="80"
            />

            <image
              href="/images/palmri.png"
              x="640"
              y="360"
              width="100"
              height="80"
            />
            <image
              href="/images/palmri.png"
              x="640"
              y="220"
              width="100"
              height="80"
            />
            <image
              href="/images/palmri.png"
              x="640"
              y="70"
              width="100"
              height="80"
            />
            <image
              href="/images/bushr.png"
              x="657"
              y="300"
              width="100"
              height="80"
            />
            <image
              href="/images/bushr.png"
              x="657"
              y="140"
              width="100"
              height="80"
            />

            {/* All Booths */}
            <Booths
              selectedLocation={selectedLocation}
              onBoothClick={handleBoothClick}
              onBoothClickSpecial={handleBoothClickSpecial}
            />
          </svg>

          {/* --- Four Corner Booths --- */}
          <div className="absolute top-4 left-4">
            <img
              src="/images/pronto.jpg"
              alt="Pronto"
              width={90}
              height={90}
              className="rounded-md shadow-md"
            />
          </div>
          <div className="absolute top-4 right-4">
            <img
              src="/images/lroma.jpg"
              alt="Lroma"
              width={95}
              height={95}
              className="rounded-md shadow-md"
            />
          </div>
          <div className="absolute bottom-4 left-4">
            <img
              src="/images/friends.png"
              alt="Friends"
              width={90}
              height={90}
              className="rounded-md shadow-md"
            />
          </div>
          <div className="absolute bottom-4 right-4">
            <img
              src="/images/mcarona.jpg"
              alt="Mcarona"
              width={100}
              height={100}
              className="rounded-md shadow-md"
            />
          </div>
        </div>
        {/* C building label */}
        <div className="flex items-center justify-center mt-4">
          <p className="text-sm font-medium text-gray-700">C building</p>
        </div>
      </div>
    </>
  );
};

export default PlatformMap;
