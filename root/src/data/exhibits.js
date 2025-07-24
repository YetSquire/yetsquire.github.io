export const exhibits = [
  {
    containerPath: '/models/container.glb',
    modelPath:     '/models/model.glb',
    title:         'Welcome!',
    description:   `You've arrived at Andy Yao's portfolio website. Please refer to the menu below for directions
    
    WASD to move, Q and E to move the platform, Space to jump. Have fun and don't fall off :)`,
  },
  {
    containerPath: '/models/container.glb',
    modelPath:     '/models/model.glb',
    title:         'About',
    description:   `That's me, off to the left!`,
  },
  {
    containerPath: '/models/container.glb',
    modelPath:     '/models/model.glb',
    title:         'V²/R',
    description:   `First-place winner of MHacks 24
    What it does
V²/R is an educational VR breadboard simulator that aims to bring the equipment of a hardware lab to the hands of students. Upon exiting the splash screen, the user will be placed in a simulated environment (that resembles EECS building 215/216 lab). The user is provided with three circuit elements: resistors, wires, and LEDs. For connectivity, a sized down breadboard is available for the student. Eely the IA has lab slides for the student on the projector screen, for which the user can toggle through and read about as they figure out how to build the circuit.

The user can place the three elements on nodes of the circuit. Upon completing their circuit, the user can then activate the power supply. The power supply will then simulate the circuit, first ensuring the connections between elements on the circuit and then evaluating the various voltages and currents across each element. This will also evaluate the LED, lighting it up.

How we built it
We utilized Unity, Blender, and Github to complete this project. A Github repository was used as a form of version control between the three members, allowing us to view each others progress as the day went on. Unity formed the backbone of our VR implementation and is stored on the Github repository link below. We also utilized many mesh and .fbx files to simulate the lab environment, as well as recorded audio and imagery for the lab.

For distribution of work, a team member worked on evaluation of the circuit, a team member worked on the interactivity with the circuit board as well as overall integration, and a team member worked on 3d modeling and auxiliary implementations.

Check out https://devpost.com/software/v-r for more details!`,
    videoUrl:      'https://www.youtube.com/watch?v=kLf05NDoUnU',
  }
]