import React, { useRef, Suspense } from 'react'
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, extend, useThree } from 'react-three-fiber';
import FPSStats from "react-fps-stats";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Stars } from '@react-three/drei';
import Glow from '../Glow';

import earthImg from '../assets/img/earthmap1k.jpg';
import moonImg from '../assets/img/moonmap1k.jpg';
import venusImg from '../assets/img/venusmap1k.jpg';
import marsImg from '../assets/img/marsmap1k.jpg';
extend({ OrbitControls })
const sunPivotPoint = new THREE.Object3D();
const earthPivotPoint = new THREE.Object3D();
const venusPivotPoint = new THREE.Object3D();
const marsPivotPoint = new THREE.Object3D();

const BASE_EARTH_SIZE = .2;
const BASE_EARTH_REVOLUTION_SPEED = 0.001;
const BASE_EARTH_ROTATION_SPEED = 0.01;
const BASE_EARTH_DISTANCE = 5;

function Sun(props) {
  const mesh = useRef();

  useFrame(() => {
    mesh.current.add(sunPivotPoint);
    mesh.current.add(earthPivotPoint);
    mesh.current.add(marsPivotPoint);
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
function Venus(props) {
  const mesh = useRef();
  const texture = useLoader(THREE.TextureLoader, venusImg);

  useFrame(() => {
    venusPivotPoint.add(mesh.current)
    mesh.current.rotation.y -= (BASE_EARTH_ROTATION_SPEED / 24300) * 100;
    venusPivotPoint.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 61) * 100;
    venusPivotPoint.position.x = 0.5;
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1, 1, 1]}
    >
      <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.949, 32, 32]} />
      <meshPhongMaterial
        specular="0xFF0000"
        map={texture}
      />
    </mesh>
  )
}

function Earth(props) {
  const mesh = useRef();
  const texture = useLoader(THREE.TextureLoader, earthImg);
  
  useFrame(() => {
    sunPivotPoint.add(mesh.current)
    mesh.current.add(earthPivotPoint);
    mesh.current.rotation.y += BASE_EARTH_ROTATION_SPEED;
    mesh.current.rotation.z = -23.5;
    sunPivotPoint.rotation.y += BASE_EARTH_REVOLUTION_SPEED;
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1, 1, 1]}
    >
      <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE, 32, 32]} />
      <meshPhongMaterial
        specular="0xFF0000"
        map={texture}
      />
    </mesh>
  )
}

function Moon(props) {
  const mesh = useRef();
  const texture = useLoader(THREE.TextureLoader, moonImg);
  useFrame(() => {
    earthPivotPoint.add(mesh.current);
    earthPivotPoint.rotation.y -= BASE_EARTH_REVOLUTION_SPEED * 2.74;
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1, 1, 1]}
    >
      <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.2724, 32, 32]} />
      <meshPhongMaterial
        map={texture}
      />
    </mesh>
  )
}

function Mars(props) {
  const mesh = useRef();
  const texture = useLoader(THREE.TextureLoader, marsImg);

  useFrame(() => {
    marsPivotPoint.add(mesh.current)
    mesh.current.rotation.y += BASE_EARTH_ROTATION_SPEED * 1.1;
    marsPivotPoint.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 188.07118412046543) * 100;
    marsPivotPoint.position.x = 0.5;
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1, 1, 1]}
    >
      <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.532, 32, 32]} />
      <meshPhongMaterial
        specular="0xFF0000"
        map={texture}
      />
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
        <Venus position={[BASE_EARTH_DISTANCE * 0.723, 0, 0]} />
        <group>
          <Earth
            position={[BASE_EARTH_DISTANCE, 0, 0]}
            onClick={() => console.log("click")}
          />
          <Moon
            position={[.4, 0, 0]}
            rotation={[.5, 0, 0]}
          />
        </group>
        <Mars position={[BASE_EARTH_DISTANCE * 1.52, 0, 0]} />
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
}}
}
