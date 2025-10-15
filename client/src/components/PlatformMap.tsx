import React from "react";

interface PlatformMapProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
}

const PlatformMap: React.FC<PlatformMapProps> = ({
  selectedLocation,
  onLocationSelect,
}) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto bg-[#FFF8E1] border-4 border-[#F2C57C] rounded-2xl shadow-md overflow-hidden h-[400px]">
      <svg
        viewBox="0 0 600 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="600" height="400" fill="#FFF8E1" />

        {/* --- HORIZONTAL PATHS (under/above booths) --- */}

        {/* Below Pronto (top-left) */}
        <image href="/images/path.png" x="-110" y="95" width="120" height="20" />

        {/* Below Lroma (top-right) */}
        <image href="/images/path.png" x="580" y="95" width="120" height="20" />

        {/* Above Friends (bottom-left) */}
        <image href="/images/path.png" x="-110" y="295" width="120" height="20" />

        {/* Above Mcarona (bottom-right) */}
        <image href="/images/path.png" x="580" y="305" width="120" height="20" />

        {/* --- VERTICAL SIDE PATHS beside booths --- */}

        {/* Left vertical path  Pronto */}
        <image href="/images/pathV.png" x="5" y="-25" width="20" height="150" />
        {/* Left vertical path  friends */}
        <image href="/images/pathV.png" x="5" y="285" width="20" height="150" />

        {/* Right vertical path connecting Lroma ↕ Mcarona */}
        <image href="/images/pathV.png" x="567" y="-25" width="20" height="150" />
        {/* Right vertical path  Mcarona */}
        <image href="/images/pathV.png" x="567" y="290" width="20" height="150" />

         {/* --- NEW VERTICAL CENTER PATHS --- */}

        {/* Top vertical path (center top) */}
        <image href="/images/pathV.png" x="290" y="-20" width="20" height="120" />

        {/* Bottom vertical path (center bottom) */}
        <image href="/images/pathV.png" x="290" y="300" width="20" height="120" />
      </svg>

      {/* --- Four Corner Booths --- */}

      {/* Pronto - Top Left */}
      <div className="absolute top-4 left-4">
        <img
          src="/images/pronto.jpg"
          alt="Pronto"
          width={70}
          height={70}
          className="rounded-md shadow-md"
        />
      </div>

      {/* Lroma - Top Right */}
      <div className="absolute top-4 right-4">
        <img
          src="/images/lroma.jpg"
          alt="Lroma"
          width={70}
          height={70}
          className="rounded-md shadow-md"
        />
      </div>

      {/* Friends - Bottom Left */}
      <div className="absolute bottom-4 left-4">
        <img
          src="/images/friends.png"
          alt="Friends"
          width={70}
          height={70}
          className="rounded-md shadow-md"
        />
      </div>

      {/* Mcarona - Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <img
          src="/images/mcarona.jpg"
          alt="Mcarona"
          width={70}
          height={70}
          className="rounded-md shadow-md"
        />
      </div>
    </div>
  );
};

export default PlatformMap;
