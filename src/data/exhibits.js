export const exhibitSections = [
  /* ------------------------------------------------------------------ */
  {
    name: "Welcome",
    fillBlanks: false,
    exhibits: [
      {
        title: "Welcome!",
        description: `You've arrived at Andy Yao's portfolio website.

WASD to move, Q / E to move the platform.
Right-click and drag to look around.

Have fun exploring!`,
      },
    ],
  },

  /* ------------------------------------------------------------------ */
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
In this website, you'll be able to find projects I've done over the years\n
Along with some extras`,
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    name: "Prior Experience",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "Orbit Inc.",
        description: `VR Intern (Mar – Jul 2025).\nBuilt investor-facing demos that pair Orbit’s vestibular
biotech with an FPV-drone sim and a co-op XR horror game. Also designed an AWS stack
(ElastiCache + Lambda + S3) and a biometric pipeline that streams >100 Hz at <30 ms latency.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "Mixel Studios",
        description: `Full-Stack Dev (Feb 2025 – present).\nEngineered a Janus/WebRTC infrastructure that
delivers 50+ concurrent Unity streams to hundreds of viewers, and rolled out a
node-based XR annotation tool for live broadcast graphics.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "University of Michigan",
        description: `XR Instructional Asst. (Dec 2024 – present).\nMentorED 30+ students each term in
EECS 440 “Extended Reality & Society,” providing office hours and remote support across projects using Unity and Unreal Engine.`,
        videoUrl: ""
      },
      {
        modelPath: "/models/model.glb",
        title: "Sandia National Labs",
        description: `Mission Tech Intern (May 2024 – Mar 2025).\nCreated “JARVIS,” a secure Unity plugin
powered by an LLM for voice-controlled simulation state changes; boosted function
lookup speed 3× with Milvus VectorDB and presented at the 2024 Sandia XR Conference.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "The Next Adventure",
        description: `Always looking for the next project. If you have something you'd like to show off, let’s chat at andyyao15@gmail.com`
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    name: "Personal Projects",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "ChemCreator VR",
        description: `Unity VR lab that teaches Lewis structures & VSEPR theory. Demoed to 100+
high-school students; EdTech winner at +Tech Jam and finalist in the Michigan Business Challenge.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "Arcane Spell Language",
        description: `Multiplayer VR wizard-dueling where spells are cast with real ASL gestures.
Built with Unity XR, Photon, and Meta Building Blocks.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "The Emperor & the Artist",
        description: `WIP 8thwall AR project. I just wanted to show off this model :D`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "The Infinite Portfolio",
        description: `You’re standing in it — an endlessly scrolling 3D museum powered by React Three Fiber and Rapier physics.`,
        videoUrl: ""
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    name: "Hackathon Projects",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "V²/R",
        description: `First Place, MHacks 17.\nA VR breadboard simulator with a graph-based digital twin that lets
students wire circuits and watch real-time current flow.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "LABuddy",
        description: `Best in AI, SpartaHacks 10.\nAR smart-glasses assistant that recognizes lab equipment and
dictates contextual safety tips and procedures.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "Social Brew",
        description: `Finalist, RH × SnapAR Hackathon.\n CONT.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "VSAT",
        description: `Third Place, MHacks 16\n CONT!`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "Wireless Walker",
        description: `Third Place, Spartahacks 8\n CONT.`,
        videoUrl: ""
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    name: "Activities & Organizations",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "Alternate Reality Initiative",
        description: `President of U-M’s XR student org. Lead 90-minute workshops on Unity &
Unreal; partnered with Visit Detroit on an AR historic-sites tour and merged XR Midwest Hackathon into MHacks with $20 k funding.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "The Big City: Lost & Found in VR",
        description: `Game-dev specialist for a 3-hour interactive stage performance. Built
virtual-production scenes in Unreal Engine with mocap-driven animation.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelPath: "/models/model.glb",
        title: "XR Midwest × MHacks",
        description: `Initiated and organized the 2025 XR track at MHacks, securing $50k in sponsorship and supporting AR/VR projects
in a 600+ student hackathon.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    name: "Miscellaneous",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelPath: "/models/model.glb",
        title: "History",
        description: ``
      },
      {
        modelPath: "/models/model.glb",
        title: "Virtual Reality",
        description: ``
      },
      {
        modelPath: "/models/model.glb",
        title: "Epistemology",
        description: ``
      },
      {
        modelPath: "/models/model.glb",
        title: "Game Design",
        description: `”`
      },
      {
        modelPath: "/models/model.glb",
        title: "Running",
        description: `I just like running. Congrats for making it to the 'top' of the tower.`
      },
    ],
  },
];
