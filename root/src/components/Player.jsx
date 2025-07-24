import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function Player({
  onRaise,
  onLower,
  platformX,
  platformZ,
  platformWidth,
  platformDepth,
  floorY,
  platformRef
}) {
  const playerRef = useRef();
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();

  const yaw = useRef(0);
  const pitch = useRef(0);
  const velocity = useRef(new THREE.Vector3());
  const onPlatform = useRef(true); // Assume we start on platform

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
    if (!playerRef.current || !platformRef.current) return;

    const pos = playerRef.current.position;
    const platPos = platformRef.current.position;

    const keys = getKeys();
    const halfW = platformWidth / 2;
    const halfD = platformDepth / 2;

    const isOn = (
      pos.x >= platformX - halfW && pos.x <= platformX + halfW &&
      pos.z >= platformZ - halfD && pos.z <= platformZ + halfD &&
      Math.abs(pos.y - (platPos.y + 1)) < 1.5
    );

    if (isOn) {
      // Stay locked to platform Y, allow movement on XZ
      onPlatform.current = true;
      const targetY = platPos.y + 1.1;
      pos.y = THREE.MathUtils.lerp(pos.y, targetY, delta * 10);

      const moveDir = new THREE.Vector3(
        (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
        0,
        (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0)
      ).normalize();

      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      moveDir.multiplyScalar(5 * delta);

      playerRef.current.position.x -= moveDir.x;
      playerRef.current.position.z -= moveDir.z;

      // Q/E input
      if (keys.raise) onRaise?.();
      if (keys.lower) onLower?.();

    } else {
      // Apply gravity
      onPlatform.current = false;
      velocity.current.y -= 30 * delta; // gravity
      pos.y += velocity.current.y * delta;
    }

    // Update camera
    const camOffset = new THREE.Vector3(0, 0.75, 0);
    const camDir = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(-1, 0, 0), pitch.current)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    camera.position.copy(pos).add(camOffset);
    camera.lookAt(pos.clone().add(camDir));
  });

  return (
    <mesh ref={playerRef}>
      <capsuleGeometry args={[0.5, 1, 8, 16]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}
