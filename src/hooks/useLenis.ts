import { useEffect, RefObject } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useLenis = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
    };
  }, []);
};

/**
 * Hook to provide silky smooth momentum scrolling to inner modal containers
 */
export const useContainerLenis = (
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Detect touch screens — never hijack touch scrolling on mobile/tablet so native 120Hz momentum scroll is preserved
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) return;

    const wrapper = containerRef.current;
    const content = (wrapper.firstElementChild as HTMLElement) || wrapper;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      syncTouch: false,
    });

    let animId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    };
    animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
    };
  }, [containerRef, enabled]);
};
