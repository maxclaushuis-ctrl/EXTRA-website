declare module 'canvas-confetti' {
  export interface Options {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    shapes?: ('square' | 'circle' | 'star')[];
    zIndex?: number;
    colors?: string[];
    angle?: number;
    scalar?: number;
  }

  export default function confetti(options?: Options): Promise<null>;
}