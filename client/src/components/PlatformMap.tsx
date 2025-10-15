import React from "react";
import { motion } from "framer-motion";

interface PlatformMapProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
}

const PlatformMap: React.FC<PlatformMapProps> = ({ selectedLocation, onLocationSelect }) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto bg-[#FFF8E1] border-4 border-[#F2C57C] rounded-2xl shadow-md overflow-hidden">
      {/* Background hills & curved road */}
      <svg viewBox="0 0 600 400" className="w-full h-[400px]">
        {/* grass area */}
        <path
          d="M0,250 Q150,200 300,250 T600,250 L600,400 L0,400 Z"
          fill="#DFF0D8"
        />
        {/* main road */}
        <path
          d="M40,310 Q200,250 350,290 T560,320"
          stroke="#A66E4A"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        {/* smaller path */}
        <path
          d="M150,100 Q300,180 420,140"
          stroke="#C9975E"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Cafeteria - Top Left */}
      <div className="absolute top-2 left-2 flex flex-col items-center">
        <img src="/images/pronto.jpg" alt="Pronto" width={60} height={60} />
        <button
          onClick={() => onLocationSelect("pronto")}
          className={`mt-1 text-xs font-semibold px-2 py-1 rounded-md transition-all duration-200 ${
            selectedLocation === "pronto"
              ? "bg-orange-600 text-white scale-105 shadow-lg"
              : "bg-white/80 text-orange-700 hover:bg-orange-200"
          }`}
        >
          Pronto
        </button>
      </div>

      {/* Library - Top Right */}
      <div className="absolute top-2 right-2 flex flex-col items-center">
        <img src="/images/lroma.jpg" alt="Lroma" width={60} height={60} />
        <button
          onClick={() => onLocationSelect("lroma")}
          className={`mt-1 text-xs font-semibold px-2 py-1 rounded-md transition-all duration-200 ${
            selectedLocation === "lroma"
              ? "bg-orange-600 text-white scale-105 shadow-lg"
              : "bg-white/80 text-orange-700 hover:bg-orange-200"
          }`}
        >
          Lroma
        </button>
      </div>

      {/* Food Court - Bottom Left */}
      <div className="absolute bottom-2 left-2 flex flex-col items-center">
        <img src="/images/friends.png" alt="Friends" width={60} height={60} />
        <button
          onClick={() => onLocationSelect("friends")}
          className={`mt-1 text-xs font-semibold px-2 py-1 rounded-md transition-all duration-200 ${
            selectedLocation === "friends"
              ? "bg-orange-600 text-white scale-105 shadow-lg"
              : "bg-white/80 text-orange-700 hover:bg-orange-200"
          }`}
        >
          Friends
        </button>
      </div>

      {/* Student Center - Bottom Right */}
      <div className="absolute bottom-2 right-2 flex flex-col items-center">
        <img src="/images/mcarona.jpg" alt="Mcarona" width={60} height={60} />
        <button
          onClick={() => onLocationSelect("mcarona")}
          className={`mt-1 text-xs font-semibold px-2 py-1 rounded-md transition-all duration-200 ${
            selectedLocation === "mcarona"
              ? "bg-orange-600 text-white scale-105 shadow-lg"
              : "bg-white/80 text-orange-700 hover:bg-orange-200"
          }`}
        >
          Mcarona
        </button>
      </div>

      {/* Selected Label */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#FFB74D] text-white font-semibold px-4 py-2 rounded-xl shadow-lg"
        >
          Selected:{" "}
          {selectedLocation
            .replace("-", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </motion.div>
      )}
    </div>
  );
};

export default PlatformMap;
