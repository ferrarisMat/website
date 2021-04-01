import React, { useRef, Suspense } from 'react'
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, extend, useThree } from 'react-three-fiber';
import FPSStats from "react-fps-stats";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Stars } from '@react-three/drei';
import Glow from '../Glow';
extend({ OrbitControls })
const sunPivotPoint = new THREE.Object3D();
function Sun(props) {
  const mesh = useRef();

  useFrame(() => {
    mesh.current.add(sunPivotPoint);
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1.1,1.1,1.1]}
    >
      <sphereGeometry attach="geometry" args={[1, 32, 32]} />
      <meshLambertMaterial
        emissive="orange"
        emissiveIntensity={3}
        color={'orange'}
      />
      <Glow />
    </mesh>
  )
}
const Scene = () => {
  const {
    camera,
    gl: { domElement }
  } = useThree()
  return (
    <>
      <Suspense fallback={null}>
        <pointLight position={[0, 0, -2.5]} intensity={.5} color="white" />
        <Sun position={[0, 0, -2.5]} />
        <Stars
          radius={200}
          depth={100}
          count={8000}
          factor={5}
          saturation={0}
          fade
        />
      </Suspense>
      <orbitControls args={[camera, domElement]} />
    </>
  )
}

export default function Home() {
  return (
    <>
      <FPSStats />
      <Canvas>
        <Scene />
      </Canvas>
    </>
  )
}