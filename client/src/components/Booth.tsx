import React from "react";

interface BoothProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  number: number | string;
  isSelected: boolean;
  onClick: (id: string) => void;
  fontSize?: number;
  textY?: number;
  verticalText?: boolean;
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
  textY,
  verticalText = false
}) => {
  const textYPosition = textY !== undefined ? textY : y + height / 2 + 5;
  
  const renderText = () => {
    if (verticalText && typeof number === 'string') {
      // Render each word individually with specific x and y coordinates
      
      return (
        <>
            {/* Special */}
            <text
              x={657}
              y={60}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight="bold"
              fill={isSelected ? "#FFF" : "#5C3B0B"}
              transform={`rotate(90 625 100)`}
            >
              Special
            </text>
            
            {/* needs */}
            <text
              x={653}
              y={70}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight="bold"
              fill={isSelected ? "#FFF" : "#5C3B0B"}
              transform={`rotate(90 620 100)`}
            >
              needs
            </text>
            
            {/* shop */}
            <text
              x={648}
              y={80}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight="bold"
              fill={isSelected ? "#FFF" : "#5C3B0B"}
              transform={`rotate(90 615 100)`}
            >
              shop
            </text>
        </>
      );
    } else {
      return (
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
      );
    }
  };
  
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
      {renderText()}
    </g>
  );
};

export default Booth;
