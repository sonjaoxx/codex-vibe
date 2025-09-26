const SPEED_TARGET = 132;
const NEEDLE_TARGET = 118; // degrees relative to original orientation

const animateNeedle = (needle, angle) => {
  return gsap.to(needle, {
    rotation: angle,
    duration: 2.2,
    ease: "power3.out",
  });
};

const animateTicks = (ticks) => {
  return gsap.fromTo(
    ticks,
    {
      opacity: 0,
      scale: 0.2,
      transformOrigin: "50% 50%",
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.05,
      ease: "power2.out",
    }
  );
};

const animateArc = (arc, glow) => {
  const tl = gsap.timeline();
  tl.to(
    arc,
    {
      strokeWidth: 22,
      stroke: "#ff5a6a",
      duration: 1.4,
      ease: "power2.out",
    },
    0
  ).to(
    glow,
    {
      strokeWidth: 26,
      stroke: "#ff335a",
      duration: 1.4,
      ease: "power2.out",
    },
    0
  ).to(
    arc,
    {
      stroke: "#ff0032",
      strokeWidth: 18,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    }
  ).to(
    glow,
    {
      stroke: "rgba(255, 50, 90, 0.9)",
      strokeWidth: 22,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    },
    "<"
  );
  return tl;
};

const animateValue = (element, target) => {
  const counter = { value: 0 };
  return gsap.to(counter, {
    value: target,
    duration: 2.2,
    ease: "power3.out",
    onUpdate: () => {
      element.textContent = Math.round(counter.value).toString();
    },
  });
};

const setReducedMotionState = (needle, ticks, arc, glow, valueEl) => {
  gsap.set(ticks, { opacity: 1 });
  gsap.set(arc, { strokeWidth: 18 });
  gsap.set(glow, { strokeWidth: 22, stroke: "rgba(255, 50, 90, 0.9)" });
  gsap.set(needle, { rotation: NEEDLE_TARGET });
  valueEl.textContent = Math.round(SPEED_TARGET).toString();
};

document.addEventListener("DOMContentLoaded", () => {
  const needle = document.getElementById("needle");
  const arc = document.getElementById("arc");
  const glow = document.getElementById("glow");
  const ticks = gsap.utils.toArray(".tick");
  const valueEl = document.querySelector('[data-role="value"]');

  if (!needle || !arc || !glow || !valueEl || !ticks.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    setReducedMotionState(needle, ticks, arc, glow, valueEl);
    return;
  }

  const master = gsap.timeline({ delay: 0.35 });

  master.add(animateTicks(ticks), 0);
  master.add(animateArc(arc, glow), 0.1);
  master.add(animateNeedle(needle, NEEDLE_TARGET), 0.4);
  master.add(animateValue(valueEl, SPEED_TARGET), 0.4);

  master.to(
    ".speedometer__readout",
    {
      opacity: 1,
      duration: 0.8,
      ease: "power1.out",
    },
    0.2
  );
});
