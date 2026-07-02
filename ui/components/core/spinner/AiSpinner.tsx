import React from "react";
import styled, { css, keyframes } from "styled-components";

// Animation for spinning
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled component for the spinner container
const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100px; // Adjust as needed
  height: 100px; // Adjust as needed
`;

// Styled component for individual circles
const Circle = styled.div`
  position: absolute;
  width: 20px; // Circle size, adjust as needed
  height: 20px; // Circle size, adjust as needed
  border-radius: 50%;
  background: transparent;
  border: 2px solid #999; // Border color, adjust as needed

  // Dynamic styles based on props
  ${({ i }) => css`
    animation: ${spin} ${i % 2 === 0 ? 20 : 10}s linear infinite;
    animation-direction: ${i % 2 === 0 ? "reverse" : "normal"};
    transform-origin: ${50 - i * 3}px ${50 - i * 3}px; // Adjust spacing
  `}
`;

const AiSpinner = () => {
  // Generate 15 circles with unique styling
  const circles = Array.from({ length: 15 }, (_, i) => (
    <Circle
      key={i}
      i={i + 1}
    />
  ));

  return <SpinnerContainer>{circles}</SpinnerContainer>;
};

export default AiSpinner;
