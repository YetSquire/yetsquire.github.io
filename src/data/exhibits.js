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
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb",
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
        modelScale: 1, modelRotation: [0, 1.57, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/orbit.glb", //Orbit Logo
        title: "Orbit Inc.",
        description: `VR Intern (Mar – Jul 2025).\nBuilt investor-facing demos that pair Orbit’s vestibular biotech with an FPV-drone sim and a co-op XR horror game. Also designed an AWS stack (ElastiCache + Lambda + S3) and a biometric pipeline that streams >100 Hz at <30 ms latency.`,
        videoUrl: ""
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/camera.glb", //Video camera
        title: "Mixel Studios",
        description: `Full-Stack Dev (Feb 2025 – present).\nEngineered a Janus/WebRTC infrastructure that delivers 50+ concurrent Unity streams to hundreds of viewers, and rolled out a node-based XR annotation tool for live broadcast graphics.`,
        videoUrl: ""
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/m.glb", //block-M
        title: "University of Michigan",
        description: `XR Instructional Asst. (Dec 2024 – present).\nMentored 30+ students each term in EECS 440 “Extended Reality & Society,” providing office hours and remote support across projects using Unity and Unreal Engine.`,
        videoUrl: ""
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //Thunderbird
        title: "Sandia National Labs",
        description: `Mission Tech Intern (May 2024 – Mar 2025).\nCreated “JARVIS,” a secure Unity plugin powered by an LLM for voice-controlled simulation state changes; boosted function lookup speed 3× with Milvus VectorDB and presented at the 2024 Sandia XR Conference.`,
        videoUrl: "" //put in the research video
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //map
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
        modelScale: 0.25, modelRotation: [1.57, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/ballAndStick.glb",
        title: "ChemCreator VR",
        description: `Unity VR lab that teaches Lewis structures & VSEPR theory. Demoed to 100+
high-school students; EdTech winner at +Tech Jam and finalist in the Michigan Business Challenge.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //fireball model
        title: "Arcane Spell Language",
        description: `Multiplayer VR wizard-dueling where spells are cast with real ASL gestures.
Built with Unity XR, Photon, and Meta Building Blocks.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      { 
        modelScale: 0.01, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/dragon.glb", //DRAGOOOOOON
        title: "The Emperor & the Artist",
        description: `WIP 8thwall AR project. I just wanted to show off this model :D\nIt's a publically available stl for 3D printing that I colored and rigged.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "", //Recursive model? Mirror?
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
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //breadboard
        title: "V²/R",
        description: `First Place, MHacks 17.\nA VR breadboard simulator with a graph-based digital twin that lets
students wire circuits and watch real-time current flow.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //glasses
        title: "LABuddy",
        description: `Best in AI, SpartaHacks 10.\nAR smart-glasses assistant that recognizes lab equipment and
dictates contextual safety tips and procedures.`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", // Witch's cauldron
        title: "Social Brew",
        description: `Finalist, RH × SnapAR Hackathon.\n Social Brew is a multiplayer AR experience built for Snap Spectacles. Players approach a shared virtual cauldron in physical space (using Snap Sync Kit), select quests, and interact with others. Active quests appear as floating markers above users’ heads using custom head-binding logic, and successful high-fives (inspired by Snap’s example project) complete quests and unlock magical AR ingredients. These can be tossed into the cauldron to receive wearable visual effects`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", // Desk
        title: "VSAT",
        description: `Third Place, MHacks 16.\nVSAT (Virtual SAT) is a VR testing environment designed to help students mentally prepare for high-pressure exams like the SAT. Born from the experience of feeling underprepared not academically, but emotionally, the tool simulates real testing environments while embedding authentic practice problems inside. The goal: ease pre-exam anxiety by familiarizing students with the format, pacing, and stress of an actual test. More info: https://devpost.com/software/vsat`,
        videoUrl: "https://www.youtube.com/watch?v=kLf05NDoUnU"
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", // Umbrella, tissue box, and ultrasonic
        title: "Wireless Walker",
        description: `Third Place, SpartaHacks 8.\nWireless Walker is an ultrasonic walking cane built with Arduino components and whatever else was on hand at the moment. Designed and built by a team of high schoolers at a college hackathon, the device used a tissue box as casing, an umbrella as a handle, and ultrasonic sensors for obstacle detection—wrapped up with lots of duct tape. More info: https://devpost.com/software/wireless-walker`,
        videoUrl: ""
      }
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    name: "Activities & Organizations",
    containerPath: "/models/container.glb",
    fillBlanks: true,
    exhibits: [
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //ARI guy
        title: "Alternate Reality Initiative",
        description: `President of U-M’s XR student org. Lead 90-minute workshops on Unity & Unreal; partnered with Visit Detroit on an AR historic-sites tour and merged XR Midwest Hackathon into MHacks with $20 k funding.`,
        // videoUrl: ""
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //Hannah's model :)
        title: "The Big City: Lost & Found in VR",
        description: `Game-dev specialist for a 3-hour interactive stage performance. Built virtual-production scenes in Unreal Engine with mocap-driven animation.`,
        // videoUrl: ""
      },
      {
        modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb", //Honestly idk
        title: "XR Midwest × MHacks",
        description: `Initiated and organized the 2025 XR track at MHacks, securing $50k in sponsorship from Snapchat, Holos.io, Sandia National Labs
 and supporting AR/VR projects in a 600+ student hackathon.`,
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  // {
  //   name: "Miscellaneous",
  //   containerPath: "/models/container.glb",
  //   fillBlanks: true,
  //   exhibits: [
  //     {
  //       modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb",
  //       title: "History",
  //       description: ``
  //     },
  //     {
  //       modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb",
  //       title: "Virtual Reality",
  //       description: ``
  //     },
  //     {
  //       modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb",
  //       title: "Epistemology",
  //       description: ``
  //     },
  //     {
  //       modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb",
  //       title: "Game Design",
  //       description: `”`
  //     },
  //     {
  //       modelScale: 1, modelRotation: [0, 0, 0], modelOrigin: [-1.5, 0.25, 0], modelPath: "/models/andy.glb",
  //       title: "Running",
  //       description: `I just like running. Congrats for making it to the 'top' of the tower.`
  //     },
  //   ],
  // },
];
