(() => {
  const svg = document.getElementById('speedometer');
  if (!svg || typeof gsap === 'undefined') {
    return;
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = (value) => (prefersReduced ? 0 : value);

  const needle = svg.querySelector('#needle');
  const arc = svg.querySelector('#arc');
  const glow = svg.querySelector('#glow');
  const ticks = svg.querySelectorAll('[data-tick]');

  const valueEl = document.querySelector('[data-readout="value"]');
  const maxEl = document.querySelector('[data-readout="max"]');

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const formatNumber = (value) =>
    Number(value).toLocaleString('ru-RU', {
      maximumFractionDigits: 0,
    });

  const arcLength = arc ? arc.getTotalLength() : 0;
  const glowLength = glow ? glow.getTotalLength() : 0;
  const arcBounds = arc ? arc.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
  const center = {
    x: arcBounds.x + arcBounds.width / 2,
    y: arcBounds.y + arcBounds.height / 2,
  };

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
      opacity: 0.4,
    });
  }

  if (needle) {
    const originX = Number.isFinite(center.x) ? center.x : 301;
    const originY = Number.isFinite(center.y) ? center.y : 269;
    gsap.set(needle, {
      transformOrigin: `${originX}px ${originY}px`,
      rotation: -120,
    });
  }

  if (ticks.length) {
    gsap.set(ticks, {
      transformOrigin: '50% 100%',
      scaleY: 0.25,
      opacity: 0,
    });
  }

  let maxValue = 0;

  const controls = {
    setNeedle(angle, options = {}) {
      if (!needle) return gsap.timeline();
      const { ease = 'power2.out', immediate = false, duration: d = 0.8 } = options;
      const tween = immediate
        ? gsap.set(needle, { rotation: angle })
        : gsap.to(needle, { rotation: angle, ease, duration: duration(d) });
      return tween;
    },
    setArcProgress(progress, options = {}) {
      if (!arc) return gsap.timeline();
      const {
        ease = 'power2.out',
        duration: d = 1,
        color,
        width,
        opacity,
        immediate = false,
      } = options;
      const clamped = clamp(progress, 0, 1);
      const props = {
        strokeDashoffset: arcLength * (1 - clamped),
      };
      if (typeof color === 'string') {
        props.stroke = color;
      }
      if (typeof width === 'number') {
        props.strokeWidth = width;
      }
      if (typeof opacity === 'number') {
        props.opacity = opacity;
      }
      if (immediate || duration(d) === 0) {
        return gsap.set(arc, props);
      }
      return gsap.to(arc, { ...props, ease, duration: duration(d) });
    },
    setGlowProgress(progress, options = {}) {
      if (!glow) return gsap.timeline();
      const {
        ease = 'power2.out',
        duration: d = 1,
        color,
        width,
        opacity,
        immediate = false,
      } = options;
      const clamped = clamp(progress, 0, 1);
      const props = {
        strokeDashoffset: glowLength * (1 - clamped),
      };
      if (typeof color === 'string') {
        props.stroke = color;
      }
      if (typeof width === 'number') {
        props.strokeWidth = width;
      }
      if (typeof opacity === 'number') {
        props.opacity = opacity;
      }
      if (immediate || duration(d) === 0) {
        return gsap.set(glow, props);
      }
      return gsap.to(glow, { ...props, ease, duration: duration(d) });
    },
    revealTicks() {
      if (!ticks.length) return gsap.timeline();
      const tl = gsap.timeline();
      tl.to(ticks, {
        opacity: 1,
        scaleY: 1,
        ease: 'power2.out',
        duration: duration(0.35),
        stagger: duration(0.05),
      });
      return tl;
    },
    setValue(value, options = {}) {
      if (!valueEl) return gsap.timeline();
      const { ease = 'power2.out', duration: d = 0.8, updateMax = true } = options;
      const start = Number(valueEl.dataset.rawValue || valueEl.textContent.replace(/\s/g, '').replace(',', '.')) || 0;
      const target = Number(value) || 0;
      const proxy = { v: start };
      const tween = gsap.to(proxy, {
        v: target,
        ease,
        duration: duration(d),
        onUpdate: () => {
          valueEl.textContent = formatNumber(proxy.v);
          valueEl.dataset.rawValue = proxy.v;
          if (updateMax && proxy.v > maxValue) {
            maxValue = proxy.v;
            if (maxEl) {
              maxEl.textContent = formatNumber(maxValue);
              maxEl.dataset.rawValue = maxValue;
            }
          }
        },
        onComplete: () => {
          valueEl.textContent = formatNumber(target);
          valueEl.dataset.rawValue = target;
        },
      });
      return tween;
    },
    setMax(value, options = {}) {
      if (!maxEl) return gsap.timeline();
      const { ease = 'power2.out', duration: d = 0.6 } = options;
      const start = Number(maxEl.dataset.rawValue || maxEl.textContent.replace(/\s/g, '').replace(',', '.')) || 0;
      const target = Number(value) || 0;
      maxValue = Math.max(maxValue, target);
      const proxy = { v: start };
      return gsap.to(proxy, {
        v: maxValue,
        ease,
        duration: duration(d),
        onUpdate: () => {
          maxEl.textContent = formatNumber(proxy.v);
          maxEl.dataset.rawValue = proxy.v;
        },
        onComplete: () => {
          maxEl.textContent = formatNumber(maxValue);
          maxEl.dataset.rawValue = maxValue;
        },
      });
    },
  };

  const intro = () => {
    const master = gsap.timeline({
      defaults: { ease: 'power2.out' },
      delay: 0.2,
      paused: true,
    });
    master.add(controls.setNeedle(-120, { immediate: true }));
    master.add(controls.setArcProgress(0, { immediate: true }), 0);
    master.add(controls.setGlowProgress(0, { immediate: true, opacity: 0.25, width: 20 }), 0);
    master.add(controls.revealTicks(), 0.1);
    master.add(controls.setNeedle(-30, { duration: 1.4 }), 0.4);
    master.add(controls.setArcProgress(0.45, { duration: 1.4, color: '#3F4140', width: 2.5 }), 0.4);
    master.add(
      controls.setGlowProgress(0.45, { duration: 1.4, color: '#ff0032', width: 26, opacity: 0.48 }),
      0.4
    );
    master.add(controls.setValue(54, { duration: 1.2 }), 0.4);
    master.add(controls.setNeedle(48, { duration: 1.6 }), 2);
    master.add(
      controls.setArcProgress(0.76, { duration: 1.6, color: '#ff0032', width: 3.4, opacity: 1 }),
      2
    );
    master.add(
      controls.setGlowProgress(0.76, { duration: 1.6, color: '#ff4d6c', width: 32, opacity: 0.68 }),
      2
    );
    master.add(controls.setValue(118, { duration: 1.6 }), 2);
    master.add(controls.setNeedle(14, { duration: 1.3 }), 4);
    master.add(controls.setArcProgress(0.52, { duration: 1.3, color: '#3F4140', width: 2.6 }), 4);
    master.add(
      controls.setGlowProgress(0.52, { duration: 1.3, color: '#ff2247', width: 28, opacity: 0.52 }),
      4
    );
    master.add(controls.setValue(82, { duration: 1.1 }), 4);
    master.add(controls.setMax(118, { duration: 0.8 }), 2);
    return master;
  };

  let introTimeline;

  const playIntro = () => {
    if (prefersReduced) {
      return gsap.timeline();
    }
    if (!introTimeline) {
      introTimeline = intro();
    }
    introTimeline.restart(true);
    return introTimeline;
  };

  controls.playIntro = playIntro;
  window.speedometerControls = controls;

  if (prefersReduced) {
    if (ticks.length) {
      gsap.set(ticks, { opacity: 1, scaleY: 1 });
    }
    controls.setArcProgress(0.65, { immediate: true, color: '#ff0032', width: 3, opacity: 1 });
    controls.setGlowProgress(0.65, { immediate: true, color: '#ff0032', width: 28, opacity: 0.55 });
    controls.setNeedle(30, { immediate: true });
    controls.setValue(96, { updateMax: true });
    return;
  }

  const scheduleIntro = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(playIntro);
    });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    scheduleIntro();
  } else {
    window.addEventListener('DOMContentLoaded', scheduleIntro, { once: true });
  }
})();
