import React from "react";
import Booths from "./Booths";

interface PlatformMapProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
}

const PlatformMap: React.FC<PlatformMapProps> = ({
  selectedLocation,
  onLocationSelect,
}) => {
  const handleBoothClick = (id: string) => {
    onLocationSelect(selectedLocation === id ? "" : id);
  };

  const handleBoothClickSpecial = (id: string) => {
    console.log(`Special booth ${id} clicked!`);
    onLocationSelect(selectedLocation === id ? "" : id);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto bg-[#FFF8E1] border-4 border-[#F2C57C] rounded-2xl shadow-md overflow-hidden h-[700px]">
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
          <filter id="boothShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000033" />
          </filter>
        </defs>

        {/* Background */}
        <rect width="600" height="500" fill="#FFF8E1" />

        {/* --- pronto PATHS --- */}
        <image href="/images/path.png" x="-130" y="80" width="100" height="20" />
        <image href="/images/pathV.png" x="-25" y="-35" width="20" height="150" />
        {/* --- friends PATHS --- */}
        <image href="/images/path.png" x="-130" y="410" width="100" height="20" />
        <image href="/images/pathV.png" x="-25" y="395" width="20" height="150" />
        {/* --- lroma PATHS --- */}
        <image href="/images/path.png" x="620" y="78" width="100" height="20" />
        <image href="/images/pathV.png" x="595" y="-40" width="20" height="150" />
        {/* --- mcarona PATHS --- */}
        <image href="/images/path.png" x="620" y="410" width="100" height="20" />
        <image href="/images/pathV.png" x="595" y="395" width="20" height="150" />

        {/* --- PATHS for the center of the platform --- */}
        <image href="/images/pathV.png" x="290" y="-20" width="20" height="120" />
        <image href="/images/pathV.png" x="290" y="400" width="20" height="120" />

        {/* --- TABLES & UMBRELLAS --- */}
        <image href="/images/tables.png" x="190" y="120" width="100" height="80" />
        <image href="/images/tables.png" x="60" y="160" width="100" height="80" />
        <image href="/images/tables.png" x="440" y="160" width="100" height="80" />
        <image href="/images/tables.png" x="130" y="220" width="100" height="80" />
        <image href="/images/tables.png" x="250" y="220" width="100" height="80" />
        <image href="/images/tables.png" x="380" y="220" width="100" height="80" />
        <image href="/images/tables.png" x="300" y="150" width="100" height="80" />
        <image href="/images/tables.png" x="70" y="90" width="100" height="80" />
        <image href="/images/tables.png" x="400" y="90" width="100" height="80" />
        <image href="/images/tables.png" x="470" y="280" width="100" height="80" />
        <image href="/images/tables.png" x="350" y="300" width="100" height="80" />
        <image href="/images/tables.png" x="220" y="300" width="100" height="80" />
        <image href="/images/tables.png" x="30" y="250" width="100" height="80" />
        <image href="/images/tables.png" x="110" y="310" width="100" height="80" />

        <image href="/images/ubeige.png" x="350" y="80" width="100" height="80" />
        <image href="/images/ublue.png" x="390" y="150" width="100" height="80" />
        <image href="/images/uorange.png" x="330" y="215" width="100" height="80" />
        <image href="/images/ubeige.png" x="200" y="210" width="100" height="80" />
        <image href="/images/uyellow.png" x="260" y="140" width="100" height="80" />
        <image href="/images/ublue.png" x="140" y="110" width="100" height="80" />
        <image href="/images/uorange.png" x="20" y="80" width="100" height="80" />
        <image href="/images/ubeige.png" x="10" y="150" width="100" height="80" />
        <image href="/images/uyellow.png" x="80" y="215" width="100" height="80" />
        <image href="/images/uorange.png" x="490" y="100" width="100" height="80" />
        <image href="/images/uyellow.png" x="520" y="270" width="100" height="80" />
        <image href="/images/ublue.png" x="300" y="290" width="100" height="80" />
        <image href="/images/ublue.png" x="-30" y="240" width="100" height="80" />
        <image href="/images/ubeige.png" x="60" y="305" width="100" height="80" />
        <image href="/images/uorange.png" x="160" y="290" width="100" height="80" />

        <image href="/images/tree1.png" x="-150" y="340" width="100" height="80" />

        {/* All Booths */}
        <Booths
          selectedLocation={selectedLocation}
          onBoothClick={handleBoothClick}
          onBoothClickSpecial={handleBoothClickSpecial}
        />
      </svg>

      {/* --- Four Corner Booths --- */}
      <div className="absolute top-4 left-4">
        <img src="/images/pronto.jpg" alt="Pronto" width={90} height={90} className="rounded-md shadow-md" />
      </div>
      <div className="absolute top-4 right-4">
        <img src="/images/lroma.jpg" alt="Lroma" width={95} height={95} className="rounded-md shadow-md" />
      </div>
      <div className="absolute bottom-4 left-4">
        <img src="/images/friends.png" alt="Friends" width={90} height={90} className="rounded-md shadow-md" />
      </div>
      <div className="absolute bottom-4 right-4">
        <img src="/images/mcarona.jpg" alt="Mcarona" width={100} height={100} className="rounded-md shadow-md" />
      </div>
    </div>
  );
};

export default PlatformMap;
