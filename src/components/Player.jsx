import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useAudio } from './UseSound';
import * as THREE from 'three';

export function Player ({ onRaise, onLower, directionRef, isMobile }) {
  const playerRef = useRef();
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();

  const yaw   = useRef(-Math.PI/2);
  const pitch = useRef(0);

  const MOVE_SPEED   = 6;
  const JUMP_IMPULSE = 70;
  const Y_AXIS       = new THREE.Vector3(0, 1, 0);
  const onGround     = useRef(true);

  /* audio */
  const footstep = useAudio('/audio/footsteps.mp3', { loop:true, volume:3 });
  const floor    = useAudio('/audio/loopedMachine.mp3', { loop:true, volume:1 });

  const prevKeys = useRef({ jump:false, floor:false });

  /* ───── mouse drag (desktop) ───── */
  useEffect(() => {
    const mDrag = { current:false };
    const onMD  = e => { if (e.button===2) mDrag.current=true; };
    const onMU  = e => { if (e.button===2) mDrag.current=false; };
    const onMM  = e => {
      if (!mDrag.current) return;
      yaw.current   -= e.movementX * 0.002;
      pitch.current  = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch.current - e.movementY*0.002));
    };
    window.addEventListener('mousedown', onMD);
    window.addEventListener('mouseup',   onMU);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('contextmenu', e => e.preventDefault());
    return () => {
      window.removeEventListener('mousedown', onMD);
      window.removeEventListener('mouseup',   onMU);
      window.removeEventListener('mousemove', onMM);
    };
  }, []);

  /* ───── touch drag (mobile) ───── */
  useEffect(() => {
    if (!isMobile) return;

    const tDrag = { current:false };
    const last  = { x:0, y:0 };

    const isJoystick = t => t.target.closest('.joystick-zone') !== null;

    const onTS = e => {
      if (e.touches.length!==1) return;
      const t=e.touches[0];
      if (isJoystick(t)) return;
      tDrag.current=true;
      last.x=t.clientX; last.y=t.clientY;
      e.preventDefault();
    };

    const onTM = e => {
      if (!tDrag.current) return;
      const t=e.touches[0];
      const dx=t.clientX-last.x, dy=t.clientY-last.y;
      last.x=t.clientX; last.y=t.clientY;
      yaw.current   -= dx*0.002;
      pitch.current  = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch.current - dy*0.002));
      e.preventDefault();
    };

    const onTE = () => { tDrag.current=false; };

    window.addEventListener('touchstart', onTS, { passive:false });
    window.addEventListener('touchmove',  onTM, { passive:false });
    window.addEventListener('touchend',   onTE);
    return () => {
      window.removeEventListener('touchstart', onTS);
      window.removeEventListener('touchmove',  onTM);
      window.removeEventListener('touchend',   onTE);
    };
  }, [isMobile]);

  /* ───── main frame loop ───── */
  useFrame(() => {
    const rb = playerRef.current;
    if (!rb) return;

    const keys = getKeys();
    let move = new THREE.Vector3();

    /* keyboard or joystick */
    if (isMobile && directionRef.current) {
      switch (directionRef.current) {
        case 'up':    move.set( 0,0,1); break;
        case 'down':  move.set( 0,0, -1); break;
        case 'left':  move.set(1,0, 0); break;
        case 'right': move.set(-1,0, 0); break;
        default:                     move.set(0,0,0);
      }
    } else {
      const fwd = (keys.forward?1:0)-(keys.backward?1:0);
      const str =-(keys.right?1:0)+(keys.left?1:0);
      move.set(str,0,fwd);
    }

    if (move.lengthSq()>0) {
      move.normalize()
          .applyAxisAngle(Y_AXIS, yaw.current)
          .multiplyScalar(MOVE_SPEED);
      footstep.resume();
    } else { footstep.pause(); }

    const curVel = rb.linvel();
    rb.setLinvel({ x:move.x, y:curVel.y, z:move.z }, true);

    if (keys.jump && !prevKeys.current.jump && onGround.current) {
      rb.applyImpulse({x:0, y:JUMP_IMPULSE, z:0}, true);
    }

    onGround.current = Math.abs(curVel.y) < 0.001;

    /* camera follow */
    const offset = new THREE.Vector3(0,0.75,0);
    const camDir = new THREE.Vector3(0,0,1)
      .applyAxisAngle(new THREE.Vector3(-1,0,0), pitch.current)
      .applyAxisAngle(new THREE.Vector3( 0,1,0), yaw.current);

    const pos = rb.translation();
    camera.position.set(pos.x+offset.x, pos.y+offset.y, pos.z+offset.z);
    camera.lookAt(pos.x+camDir.x, pos.y+offset.y+camDir.y, pos.z+camDir.z);

    /* raise / lower */
    if (keys.raise)   { onRaise?.(); floor.play(); }
    else if (keys.lower){ onLower?.(); floor.play(); }
    else floor.pause();

    prevKeys.current = { jump:keys.jump, floor:keys.lower||keys.raise };
  });

  return (
    <RigidBody
      ref={playerRef}
      position={[0,5,0]}
      type="dynamic"
      colliders={false}
      mass={1}
      enabledRotations={[false,false,false]}
      canSleep={false}
      linearDamping={0.8}
    >
      <CapsuleCollider args={[0.5,1]} />
      <mesh>
        <capsuleGeometry args={[0.5,1,8,16]} />
        <meshStandardMaterial color="white"/>
      </mesh>
    </RigidBody>
  );
}
