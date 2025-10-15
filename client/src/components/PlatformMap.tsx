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
    <div className="relative w-full max-w-6xl mx-auto bg-[#FFF8E1] border-4 border-[#F2C57C] rounded-2xl shadow-md overflow-hidden h-[600px]">
      <svg
        viewBox="0 0 600 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="600" height="400" fill="#FFF8E1" />

        {/* --- HORIZONTAL PATHS (under/above booths) --- */}

        {/* Below Pronto (top-left) */}
        <image href="/images/path.png" x="-110" y="75" width="100" height="20" />

        {/* Below Lroma (top-right) */}
        <image href="/images/path.png" x="600" y="75" width="100" height="20" />

        {/* Above Friends (bottom-left) */}
        <image href="/images/path.png" x="-110" y="315" width="100" height="20" />

        {/* Above Mcarona (bottom-right) */}
        <image href="/images/path.png" x="600" y="315" width="100" height="20" />

        {/* --- VERTICAL SIDE PATHS beside booths --- */}

        {/* Left vertical path  Pronto */}
        <image href="/images/pathV.png" x="-5" y="-35" width="20" height="150" />
        {/* Left vertical path  friends */}
        <image href="/images/pathV.png" x="-5" y="295" width="20" height="150" />

        {/* Right vertical path connecting Lroma ↕ Mcarona */}
        <image href="/images/pathV.png" x="575" y="-35" width="20" height="150" />
        {/* Right vertical path  Mcarona */}
        <image href="/images/pathV.png" x="575" y="295" width="20" height="150" />

        {/* --- NEW VERTICAL CENTER PATHS --- */}

        {/* Top vertical path (center top) */}
        <image href="/images/pathV.png" x="290" y="-20" width="20" height="120" />

        {/* Bottom vertical path (center bottom) */}
        <image href="/images/pathV.png" x="290" y="300" width="20" height="120" />

         {/* --- TABLES SCATTERED IN THE MIDDLE --- */}
         <image href="/images/tables.png" x="190" y="120" width="100" height="80" />
         <image href="/images/tables.png" x="60" y="160" width="100" height="80" />
         <image href="/images/tables.png" x="440" y="160" width="100" height="80" />       
         <image href="/images/tables.png" x="130" y="220" width="100" height="80" />
         <image href="/images/tables.png" x="250" y="220" width="100" height="80" />
         <image href="/images/tables.png" x="380" y="220" width="100" height="80" />
         <image href="/images/tables.png" x="300" y="150" width="100" height="80" />
         <image href="/images/tables.png" x="70" y="90" width="100" height="80" />
         <image href="/images/tables.png" x="400" y="90" width="100" height="80" />

        {/* --- UMBRELLAS SCATTERED IN THE MIDDLE --- */}
         <image href="/images/ubeige.png" x="350" y="80" width="100" height="80" />
         <image href="/images/ublue.png" x="390" y="150" width="100" height="80" />
         <image href="/images/uorange.png" x="330" y="215" width="100" height="80" />
         <image href="/images/ubeige.png" x="200" y="210" width="100" height="80" />
         <image href="/images/uyellow.png" x="260" y="140" width="100" height="80" />
         <image href="/images/ublue.png" x="140" y="110" width="100" height="80" />
         <image href="/images/uorange.png" x="20" y="80" width="100" height="80" />
         <image href="/images/ubeige.png" x="10" y="150" width="100" height="80" />
         <image href="/images/uyellow.png" x="80" y="215" width="100" height="80" />
         


                       {/* More scattered tables 
         {/* Even more tables 
         <image href="/images/tables.png" x="460" y="200" width="100" height="80" />
         <image href="/images/tables.png" x="140" y="280" width="100" height="80" />
         <image href="/images/tables.png" x="360" y="280" width="100" height="80" />*/}
      </svg>

      {/* --- Four Corner Booths --- */}

      {/* Pronto - Top Left */}
      <div className="absolute top-4 left-4">
        <img
          src="/images/pronto.jpg"
          alt="Pronto"
          width={80}
          height={80}
          className="rounded-md shadow-md"
        />
      </div>

      {/* Lroma - Top Right */}
      <div className="absolute top-4 right-4">
        <img
          src="/images/lroma.jpg"
          alt="Lroma"
          width={90}
          height={90}
          className="rounded-md shadow-md"
        />
      </div>

      {/* Friends - Bottom Left */}
      <div className="absolute bottom-4 left-4">
        <img
          src="/images/friends.png"
          alt="Friends"
          width={80}
          height={80}
          className="rounded-md shadow-md"
        />
      </div>

      {/* Mcarona - Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <img
          src="/images/mcarona.jpg"
          alt="Mcarona"
          width={90}
          height={90}
          className="rounded-md shadow-md"
        />
      </div>
    </div>
  );
};

export default PlatformMap;
