import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { RigidBody, CapsuleCollider  } from '@react-three/rapier';
import * as THREE from 'three';

export function Player({
  onRaise,
  onLower,
}) {
  const playerRef = useRef();
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();

  const yaw = useRef(0);
  const pitch = useRef(0);
  const MOVE_SPEED = 6;
  const JUMP_IMPULSE = 70;
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const onGround = useRef(true);

  useEffect(() => {
    const onMouseDown = (e) => (
      (e.button === 2) ? dragging.current = true : null
    );
    const onMouseUp = (e) => (
      (e.button === 2) ? dragging.current = false : null
    );
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      yaw.current -= e.movementX * 0.002;
      pitch.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.current - e.movementY * 0.002));
    };

    const dragging = { current: false };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useFrame((_, delta) => {
    const rb = playerRef.current;
    if (!rb) return;

    const keys = getKeys();
    const forward  = (keys.forward  ? 1 : 0) - (keys.backward ? 1 : 0);
    const strafe   = -(keys.right    ? 1 : 0) + (keys.left     ? 1 : 0);
    const moveDir  = new THREE.Vector3(strafe, 0, forward);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize()
             .applyAxisAngle(Y_AXIS, yaw.current)
             .multiplyScalar(MOVE_SPEED);
    }

    const curVel = rb.linvel();
    rb.setLinvel({ x: moveDir.x, y: curVel.y, z: moveDir.z }, true);

    if (keys.jump && onGround.current) {
      rb.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
    }
    onGround.current = Math.abs(curVel.y) < 0.001; //not too efficient
    
    const offset = new THREE.Vector3(0, 0.75, 0);
    const camDir = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(-1, 0, 0), pitch.current)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    const pos = rb.translation();
    camera.position.set(pos.x + offset.x, pos.y + offset.y, pos.z + offset.z);
    camera.lookAt(pos.x + camDir.x, pos.y + offset.y + camDir.y, pos.z + camDir.z);

    if (keys.raise) onRaise?.();
    if (keys.lower) onLower?.();
  });

  return (
    <RigidBody 
      position={[0, 5, 0]}
      type='dynamic'
      colliders={false}
      mass={1}
      enabledRotations={[false, false, false]}
      canSleep={false}
      linearDamping={0.8}
      ref={playerRef}>
        <CapsuleCollider args={[0.5, 1]} />
        <mesh>
          <capsuleGeometry args={[0.5, 1, 8, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
    </RigidBody>
  );
}
