import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useAudio } from './UseSound';
import * as THREE from 'three';

export function Player({ onRaise, onLower, directionRef, isMobile }) {
  const playerRef = useRef();
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();

  const yaw   = useRef(-Math.PI / 2);
  const pitch = useRef(0);

  const MOVE_SPEED = 6;
  const JUMP_IMPULSE = 70;
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const onGround = useRef(true);

  const footstep = useAudio('/audio/footsteps.mp3', { loop: true, volume: 3 });
  const floor = useAudio('/audio/loopedMachine.mp3', { loop: true, volume: 1 });

  const prevKeysRef = useRef({ jump: false, floor: false });

  useEffect(() => {
    const dragging = { current: false };

    const onMouseDown = (e) => {
      if (e.button === 2) dragging.current = true;
    };
    const onMouseUp = (e) => {
      if (e.button === 2) dragging.current = false;
    };
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      yaw.current -= e.movementX * 0.002;
      pitch.current = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pitch.current - e.movementY * 0.002)
      );
    };

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
    let moveDir = new THREE.Vector3();

    if (isMobile && directionRef.current) {
      switch (directionRef.current) {
        case 'up':    moveDir.set(0, 0, -1); break;
        case 'down':  moveDir.set(0, 0, 1);  break;
        case 'left':  moveDir.set(-1, 0, 0); break;
        case 'right': moveDir.set(1, 0, 0);  break;
        default:      moveDir.set(0, 0, 0);  break;
      }
    } else {
      const forward = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
      const strafe  = -(keys.right ? 1 : 0) + (keys.left ? 1 : 0);
      moveDir.set(strafe, 0, forward);
    }

    if (moveDir.lengthSq() > 0) {
      moveDir
        .normalize()
        .applyAxisAngle(Y_AXIS, yaw.current)
        .multiplyScalar(MOVE_SPEED);
      footstep.resume();
    } else {
      footstep.pause();
    }

    const curVel = rb.linvel();
    rb.setLinvel({ x: moveDir.x, y: curVel.y, z: moveDir.z }, true);

    if (keys.jump && !prevKeysRef.current.jump && onGround.current) {
      rb.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
    }

    onGround.current = Math.abs(curVel.y) < 0.001;

    const offset = new THREE.Vector3(0, 0.75, 0);
    const camDir = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(-1, 0, 0), pitch.current)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    const pos = rb.translation();
    camera.position.set(pos.x + offset.x, pos.y + offset.y, pos.z + offset.z);
    camera.lookAt(
      pos.x + camDir.x,
      pos.y + offset.y + camDir.y,
      pos.z + camDir.z
    );

    // Raise/lower logic
    if (keys.raise) {
      onRaise?.();
      if (!prevKeysRef.current.floor || !floor.isPlaying()) {
        floor.play();
      }
    } else if (keys.lower) {
      onLower?.();
      if (!prevKeysRef.current.floor || !floor.isPlaying()) {
        floor.play();
      }
    } else {
      if (prevKeysRef.current.floor || !floor.isPlaying) {
        floor.pause();
      }
    }

    prevKeysRef.current = {
      jump: keys.jump,
      floor: keys.lower || keys.raise,
    };
  });

  return (
    <RigidBody
      ref={playerRef}
      position={[0, 5, 0]}
      type="dynamic"
      colliders={false}
      mass={1}
      enabledRotations={[false, false, false]}
      canSleep={false}
      linearDamping={0.8}
    >
      <CapsuleCollider args={[0.5, 1]} />
      <mesh>
        <capsuleGeometry args={[0.5, 1, 8, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  );
}
