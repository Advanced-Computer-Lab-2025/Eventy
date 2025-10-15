import React from "react";

interface BoothProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  number: number;
  isSelected: boolean;
  onClick: (id: string) => void;
  fontSize?: number;
  textY?: number;
}

const Booth: React.FC<BoothProps> = ({
  id,
  x,
  y,
  width,
  height,
  number,
  isSelected,
  onClick,
  fontSize = 16,
  textY
}) => {
  const textYPosition = textY !== undefined ? textY : y + height / 2 + 5;
  
  return (
    <g onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="6"
        ry="6"
        fill={isSelected ? "url(#boothSelected)" : "url(#boothGradient)"}
        stroke="#C47A1C"
        strokeWidth="1.5"
        filter="url(#boothShadow)"
      />
      <text
        x={x + width / 2}
        y={textYPosition}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill={isSelected ? "#FFF" : "#5C3B0B"}
      >
        {number}
      </text>
    </g>
  );
};

export default Booth;
