import { useEffect, useRef } from 'react';

interface MagneticCursorOptions {
  strength?: number;
  radius?: number;
  enabled?: boolean;
  smoothness?: number;
}

const lerp = (current: number, target: number, factor: number) => {
  return current * (1 - factor) + target * factor;
};

export const useMagneticCursor = (
  ref: React.RefObject<HTMLElement>,
  options: MagneticCursorOptions = {}
) => {
  const { 
    strength = 0.2, 
    radius = 100, 
    enabled = true,
    smoothness = 0.1 
  } = options;
  
  const position = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;
    
    const element = ref.current;
    if (!element) return;

    const animate = () => {
      position.current = {
        x: lerp(position.current.x, targetPosition.current.x, smoothness),
        y: lerp(position.current.y, targetPosition.current.y, smoothness)
      };

      element.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < radius) {
        const strengthFactor = (1 - distance / radius) * strength;
        targetPosition.current = {
          x: distanceX * strengthFactor,
          y: distanceY * strengthFactor
        };
      } else {
        targetPosition.current = { x: 0, y: 0 };
      }
    };

    const handleMouseLeave = () => {
      targetPosition.current = { x: 0, y: 0 };
    };

    document.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ref, strength, radius, enabled, smoothness]);
}; 