(() => {
  const svg = document.getElementById('speedometer');
  if (!svg || typeof gsap === 'undefined') {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const arc = svg.querySelector('#arc');
  const glow = svg.querySelector('#glow');
  const needle = svg.querySelector('#needle');
  const ticks = svg.querySelectorAll('[data-tick]');

  const getLength = (path) => (path ? path.getTotalLength() : 0);
  const arcLength = getLength(arc);
  const glowLength = getLength(glow);

  if (arc) {
    gsap.set(arc, {
      strokeDasharray: arcLength,
      strokeDashoffset: arcLength,
      opacity: 1,
    });
  }

  if (glow) {
    gsap.set(glow, {
      strokeDasharray: glowLength,
      strokeDashoffset: glowLength,
      opacity: 0.35,
    });
  }

  if (ticks.length) {
    gsap.set(ticks, {
      transformOrigin: '50% 100%',
      scaleY: 0.2,
      opacity: 0,
    });
  }

  if (needle) {
    const origin = arc ? arc.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
    const originX = origin.x + origin.width / 2 || 301;
    const originY = origin.y + origin.height / 2 || 269;
    gsap.set(needle, {
      transformOrigin: `${originX}px ${originY}px`,
      rotation: -120,
    });
  }

  const setArcProgress = (element, length, progress, options = {}) => {
    if (!element) return;
    const { stroke, strokeWidth, opacity } = options;
    const props = {
      strokeDashoffset: length * (1 - progress),
    };
    if (typeof stroke === 'string') props.stroke = stroke;
    if (typeof strokeWidth === 'number') props.strokeWidth = strokeWidth;
    if (typeof opacity === 'number') props.opacity = opacity;
    gsap.set(element, props);
  };

  const playAnimation = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.add(() => {
      setArcProgress(arc, arcLength, 0, { stroke: '#3F4140', strokeWidth: 2 });
      setArcProgress(glow, glowLength, 0, { stroke: '#ff0032', strokeWidth: 22, opacity: 0.42 });
    });

    if (ticks.length) {
      tl.to(ticks, {
        opacity: 1,
        scaleY: 1,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power2.out',
      }, 0.1);
    }

    if (arc) {
      tl.to(arc, {
        strokeDashoffset: arcLength * 0.35,
        stroke: '#3F4140',
        strokeWidth: 2.4,
        duration: 1.6,
        ease: 'power3.out',
      }, 0);
    }

    if (glow) {
      tl.to(glow, {
        strokeDashoffset: glowLength * 0.35,
        stroke: '#ff2247',
        strokeWidth: 28,
        opacity: 0.6,
        duration: 1.6,
        ease: 'power3.out',
      }, 0);
    }

    if (needle) {
      tl.to(needle, {
        rotation: 76,
        duration: 1.8,
        ease: 'power3.out',
      }, 0);

      tl.to(needle, {
        rotation: 48,
        duration: 1.2,
        ease: 'power2.inOut',
      }, '>-0.2');
    }

    if (arc) {
      tl.to(arc, {
        strokeDashoffset: arcLength * 0.45,
        stroke: '#3F4140',
        strokeWidth: 2.2,
        duration: 1.1,
      }, '-=0.8');
    }

    if (glow) {
      tl.to(glow, {
        strokeDashoffset: glowLength * 0.45,
        stroke: '#ff0032',
        strokeWidth: 24,
        opacity: 0.5,
        duration: 1.1,
      }, '-=0.8');
    }

    return tl;
  };

  const settleState = () => {
    setArcProgress(arc, arcLength, 0.55, { stroke: '#3F4140', strokeWidth: 2.2 });
    setArcProgress(glow, glowLength, 0.55, { stroke: '#ff0032', strokeWidth: 24, opacity: 0.48 });
    if (ticks.length) {
      gsap.set(ticks, { opacity: 1, scaleY: 1 });
    }
    if (needle) {
      gsap.set(needle, { rotation: 48 });
    }
  };

  if (prefersReducedMotion) {
    settleState();
    return;
  }

  const start = () => {
    requestAnimationFrame(() => {
      playAnimation();
    });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
    window.addEventListener('load', start, { once: true });
  }
})();
