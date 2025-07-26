export const exhibitSections = [
  /* ───────────────── Welcome ───────────────── */
  {
    name: "Welcome",
    fillBlanks: false, 
    exhibits: [
      {
        title: "Welcome!",
        description: `You've arrived at Andy Yao's portfolio website.\n
WASD to move, Q and E to move the platform, Space to jump. Have fun and don't fall off :)`,
      },
    ],
  },

  /* ───────────────── About ───────────────── */
  {
    name: "About",
    containerPath: "/models/container.glb",
    fillBlanks: false,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "About",
        description: `That's me, off to the left!`,
      },
    ],
  },

  /* ───────────────── Prior Experience ───────────────── */
  {
    name: "Prior Experience",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      /* … up to 5 … */
    ],
  },

  /* ───────────────── Personal Projects ───────────────── */
  {
    name: "Personal Projects",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "V²/R",
        description: `First-place winner of MHacks 24…`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU",
      },
      /* … more projects … */
    ],
  },
];
