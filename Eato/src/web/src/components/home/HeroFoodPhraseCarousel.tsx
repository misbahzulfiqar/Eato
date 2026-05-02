import { useEffect, useRef, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

const PHRASES = [
  'Nutritious Food',
  'Wholesome Food',
  'Fresh Food',
  'Fitness Food',
  'Balanced Diet',
] as const;

const AUTOPLAY_MS = 3200;

/**
 * shadcn Carousel (Embla): rotates hero phrases; active phrase animates in from +20px / opacity 0 → 1.
 */
export function HeroFoodPhraseCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lastSnap = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!api) return;
    lastSnap.current = null;

    const handler = () => {
      const i = api.selectedScrollSnap();
      setSelected(i);
      const prev = lastSnap.current;
      lastSnap.current = i;
      if (prev !== null) {
        setAnimKey((k) => k + 1);
      }
    };

    api.on('select', handler);
    handler();
    return () => {
      api.off('select', handler);
    };
  }, [api]);

  useEffect(() => {
    if (!api || reduceMotion) return;
    const id = window.setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [api, reduceMotion]);

  if (reduceMotion) {
    return <span className="inline-block">{PHRASES[0]}</span>;
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true, duration: 0 }}
      className="mx-auto inline-block w-[min(92vw,19rem)] sm:w-[22rem] md:w-[26rem] lg:w-[28rem]"
      aria-label="Rotating food taglines"
    >
      <CarouselContent className="-ml-0">
        {PHRASES.map((phrase, i) => (
          <CarouselItem key={phrase} className="basis-full pl-0">
            <div className="flex justify-center text-center">
              {i === selected ? (
                <span key={animKey} className="hero-food-phrase-in inline-block">
                  {phrase}
                </span>
              ) : (
                <span className="inline-block opacity-0" aria-hidden>
                  {phrase}
                </span>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
