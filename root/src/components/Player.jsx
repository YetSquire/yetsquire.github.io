import { RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useRef, useEffect} from 'react';
import * as THREE from 'three';

export function Player({ onRaise, onLower, floorY }) {
    const body = useRef();
    const { camera } = useThree();
    const { rapier, world } = useRapier();
    const speed = 5;
    const jumpImpulse = 5;

    const yaw = useRef(0);   // y axis
    const pitch = useRef(0); // x axis
    const dragging = useRef(false);

    const [, getKeys] = useKeyboardControls();

    useEffect(() => {
    const handleRightClick = (e) => e.preventDefault();
    window.addEventListener('contextmenu', handleRightClick);

    const onMouseDown = () => { dragging.current = true };
    const onMouseUp = () => { dragging.current = false };
    const onMouseMove = (e) => {
        if (!dragging.current) return;
        yaw.current -= e.movementX * 0.002;
        pitch.current -= e.movementY * 0.002;
        pitch.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.current)); // clamp
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('contextmenu', handleRightClick);
    };
    }, []);


    useFrame(() => {
    const keys = getKeys();

    const dir = new THREE.Vector3(
    -(keys.right ? 1 : 0) + (keys.left ? 1 : 0),
    0,
    -(keys.backward ? 1 : 0) + (keys.forward ? 1 : 0)
    );

    if (dir.length() > 0) {
        dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
        body.current.setLinvel({ x: dir.x * speed, y: 0, z: dir.z * speed }, true);
    }

    const targetY = floorY+1;
    if (
      !isNaN(body.current.translation().x) &&
      !isNaN(body.current.translation().z) &&
      !isNaN(targetY)
    ) {
      body.current.setTranslation({ x: body.current.translation().x, y: targetY, z: body.current.translation().z }, true);
    }
    const pos = body.current.translation();

    // const linvel = body.current.linvel();
    // const grounded = Math.abs(linvel.y) < 0.05; // simplistic grounded check
    // if (keys.jump && grounded) {
    //   body.current.applyImpulse({ x: 0, y: jumpImpulse, z: 0 }, true);
    // }

    // Raise/lower floor (call parent's state setter)
    
    if (keys.raise) onRaise?.();
    if (keys.lower) onLower?.();

    // Position camera with rotation
    const offset = new THREE.Vector3(0, 0.75, 0);
    const camDir = new THREE.Vector3(0, 0, 1)
        .applyAxisAngle(new THREE.Vector3(-1, 0, 0), pitch.current)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    
    camera.position.set(pos.x + offset.x, pos.y + offset.y, pos.z + offset.z);
    camera.lookAt(pos.x + camDir.x, pos.y + offset.y + camDir.y, pos.z + camDir.z);
    });

  return (
    <RigidBody ref={body} linearDamping={10} type="dynamic">
        <CapsuleCollider args={[0.5, 1]} />
    </RigidBody>
  );
}
