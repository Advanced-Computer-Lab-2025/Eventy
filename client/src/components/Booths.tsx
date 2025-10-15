import React from "react";
import Booth from "./Booth";

interface BoothsProps {
  selectedLocation: string;
  onBoothClick: (id: string) => void;
  onBoothClickSpecial: (id: string) => void;
}

const Booths: React.FC<BoothsProps> = ({
  selectedLocation,
  onBoothClick,
  onBoothClickSpecial,
}) => {
  return (
    <>
      {/* --- INTERACTIVE BOOTHS 1–8 (EXISTING) --- */}
      {/* Left top */}
      <Booth
        id="booth-left-top"
        x={40}
        y={20}
        width={80}
        height={50}
        number={1}
        isSelected={selectedLocation === "booth-left-top"}
        onClick={onBoothClick}
      />

      {/* Left bottom */}
      <Booth
        id="booth-left-bottom"
        x={170}
        y={20}
        width={80}
        height={50}
        number={2}
        isSelected={selectedLocation === "booth-left-bottom"}
        onClick={onBoothClick}
      />

      {/* Right top */}
      <Booth
        id="booth-right-top"
        x={350}
        y={20}
        width={80}
        height={50}
        number={3}
        isSelected={selectedLocation === "booth-right-top"}
        onClick={onBoothClick}
      />

      {/* Right bottom */}
      <Booth
        id="booth-right-bottom"
        x={470}
        y={20}
        width={80}
        height={50}
        number={4}
        isSelected={selectedLocation === "booth-right-bottom"}
        onClick={onBoothClick}
      />

      {/* Bottom booths (5–8) */}
      <Booth
        id="booth-left-top-bottom"
        x={40}
        y={430}
        width={80}
        height={50}
        number={5}
        isSelected={selectedLocation === "booth-left-top-bottom"}
        onClick={onBoothClickSpecial}
      />

      <Booth
        id="booth-left-bottom-bottom"
        x={170}
        y={430}
        width={80}
        height={50}
        number={6}
        isSelected={selectedLocation === "booth-left-bottom-bottom"}
        onClick={onBoothClickSpecial}
      />

      <Booth
        id="booth-right-top-bottom"
        x={350}
        y={430}
        width={80}
        height={50}
        number={7}
        isSelected={selectedLocation === "booth-right-top-bottom"}
        onClick={onBoothClickSpecial}
      />

      <Booth
        id="booth-right-bottom-bottom"
        x={470}
        y={430}
        width={80}
        height={50}
        number={8}
        isSelected={selectedLocation === "booth-right-bottom-bottom"}
        onClick={onBoothClickSpecial}
      />

      {/* --- NEW BIG RIGHT-SIDE BOOTHS (9–16) --- */}

      {/* Top vertical booth (9–12) */}
      {[0, 1, 2, 3].map((i) => {
        const id = `booth-vertical-top-${i + 9}`;
        const y = 100 + i * 35;
        return (
          <Booth
            key={id}
            id={id}
            x={630}
            y={y}
            width={50}
            height={30}
            number={i + 9}
            isSelected={selectedLocation === id}
            onClick={onBoothClickSpecial}
            fontSize={13}
            textY={y + 20}
          />
        );
      })}

      {/* Bottom vertical booth (13–16) */}
      {[0, 1, 2, 3].map((i) => {
        const id = `booth-vertical-bottom-${i + 13}`;
        const y = 270 + i * 35;
        return (
          <Booth
            key={id}
            id={id}
            x={630}
            y={y}
            width={50}
            height={30}
            number={i + 13}
            isSelected={selectedLocation === id}
            onClick={onBoothClickSpecial}
            fontSize={13}
            textY={y + 20}
          />
        );
      })}
    </>
  );
};

export default Booths;
