export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

export const cinematicReveal = {
  hidden: { opacity: 0, scale: 0.94, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.11 } },
};

export const floatOrb = {
  animate: {
    y: [0, -28, 0],
    x: [0, 14, 0],
    scale: [1, 1.04, 1],
    transition: { duration: 10, repeat: Infinity, ease: "easeInOut" },
  },
};

export const profileRing = {
  animate: {
    rotate: 360,
    transition: { duration: 8, repeat: Infinity, ease: "linear" },
  },
};

export const badgeBounce = {
  animate: {
    y: [0, -6, 0],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};
