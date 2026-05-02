import { useEffect, useMemo, useRef, useState } from 'react';

type BurstParticle = {
  id: number;
  dx: number;
  dy: number;
  size: number;
  hue: number;
};

const PLATE_IMAGE_SRC = '/Logo-plate-image.png';

export default function FloatingHomeLogo() {
  const [x, setX] = useState(18);
  const [swappedRight, setSwappedRight] = useState(false);
  const [phase, setPhase] = useState(0);
  const [burst, setBurst] = useState<BurstParticle[]>([]);
  const [burstActive, setBurstActive] = useState(false);
  const rafRef = useRef<number | null>(null);
  const burstIdRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setPhase((p) => p + 0.02);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!burst.length) return;
    const startId = window.requestAnimationFrame(() => setBurstActive(true));
    const t = window.setTimeout(() => {
      setBurstActive(false);
      setBurst([]);
    }, 520);
    return () => {
      window.cancelAnimationFrame(startId);
      window.clearTimeout(t);
    };
  }, [burst]);

  const yOffset = useMemo(() => Math.sin(phase) * 22, [phase]);

  const onBurst = () => {
    const nextSwappedRight = !swappedRight;
    setSwappedRight(nextSwappedRight);
    const maxX = Math.max(18, window.innerWidth - 120);
    setX(nextSwappedRight ? maxX : 18);

    const count = 14;
    const particles: BurstParticle[] = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 20 + Math.random() * 34;
      burstIdRef.current += 1;
      particles.push({
        id: burstIdRef.current,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 7,
        hue: Math.floor(Math.random() * 360),
      });
    }
    setBurst(particles);
  };

  return (
    <div className="pointer-events-none hidden md:block">
      <button
        type="button"
        className="pointer-events-auto fixed z-[250] cursor-pointer p-0 leading-none"
        style={{ left: `${x}px`, top: `calc(50% + ${yOffset}px)`, transform: 'translateY(-50%)' }}
        onClick={onBurst}
        aria-label="Eato floating logo"
      >
        <img
          src={PLATE_IMAGE_SRC}
          alt="Eato plate logo"
          className="block h-[100px] w-[100px] object-cover"
        />

        {burst.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: `hsl(${p.hue} 95% 58%)`,
              transform: burstActive
                ? `translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px))`
                : 'translate(-50%, -50%)',
              opacity: burstActive ? 0 : 1,
              transition: 'transform 480ms ease-out, opacity 480ms ease-out',
            }}
          />
        ))}
      </button>
    </div>
  );
}

