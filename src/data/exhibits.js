export const exhibitSections = [
  /* ───────────────── Welcome ───────────────── */
  {
    name: "Welcome",
    fillBlanks: false, 
    exhibits: [
      {
        title: "Welcome!",
        description: `You've arrived at Andy Yao's portfolio website.\n
WASD to move, Q and E to move the platform \n
Right-click with your mouse to move the Camera \n
Have fun!`,
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
        description: `That's me, off to the left!\n
I've always been amazed by what software can do, how it can make us feel\n
In this website, you'll be able to find project I've done over the years\n
(along with some unrelated hobbies)`,
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
