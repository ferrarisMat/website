import React, { useRef, Suspense, useMemo, useState, useEffect }  from 'react';
import { Canvas, useFrame, useLoader, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Aurl from '../assets/akfn/A.svg';
import Kurl from '../assets/akfn/K.svg';
import Furl from '../assets/akfn/F.svg';
import Nurl from '../assets/akfn/N.svg';
import SixteenUrl from '../assets/akfn/16.svg';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { MeshReflectorMaterial } from '@react-three/drei';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { useSpring, animated } from '@react-spring/three';
import videoUrl from '../assets/video.mp4';

extend({ OrbitControls })

const SvgShape = ({ shape, color, index, onPointerOver, onPointerOut, scale }) => {
  return (
    <mesh 
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      scale={scale}
    >
      <meshLambertMaterial
        attach="material"
        color={color || 0x15F4EE}
        emissive={color || 0x15F4EE}
        emissiveIntensity={5}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={index * -0.1}
        depthWrite={true}
      />
      <shapeBufferGeometry attach="geometry" args={[shape]} />
    </mesh>
  )
}

const SvgAsync = React.memo(({ url, sceneRef, color, onPointerOver, onPointerOut, scale }) => {
  const { paths } = useLoader(SVGLoader, url)
  const shapes = useMemo(
    () =>
      paths.flatMap((path, index) =>{
        return path.toShapes(true).map(shape => ({ index, shape, color: path.color }))
      }
        
      ),
    [paths]
  )
  return (
    <>
      <group
        ref={sceneRef}
        children={shapes.map((props, key) => {
          return (
            <SvgShape 
              key={key} 
              {...props} 
              color={color} 
              scale={scale}
              onPointerOver={onPointerOver}
              onPointerOut={onPointerOut}
            />
          )
        })}
        rotation={[-Math.PI * 2, 0, Math.PI]}
        scale={[-0.01, 0.01, 0.01]}
      />
    </>
  )
});

function useBlink(){
  const [isBlinking, setIsBlinking] = useState(false);
  const [isOver, setIsOver] = useState(true);
  const [hasMouseLeft, setHasMouseLeft] = useState(false);

  const timeoutRef = useRef();
  useFrame(() => {
    var random_boolean = Math.random() < 0.3;
    if(!isOver){
      setIsBlinking(random_boolean);
    }
  });

  useEffect(() => {
    var random_boolean = Math.random() < 0.6;
    setIsBlinking(random_boolean)
    setIsOver(random_boolean)
  }, [])

  useEffect(() => {
    if(hasMouseLeft){
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsOver(false);
      }, Math.random() * (100000 - 10000) + 10000)
    }
  }, [hasMouseLeft])

  return ({
    onPointerOver: () => {
      setIsOver(true);
      setHasMouseLeft(false);
      setIsBlinking(false);
      clearTimeout(timeoutRef.current);
    },
    onPointerOut: () => {
      setHasMouseLeft(true);
      var random_boolean = Math.random() < 0.5;
      if(random_boolean) {
        setHasMouseLeft(false);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsOver(false);
        }, Math.random() * (30000 - 3000) + 3000)
      }
    }, 
    color: isBlinking ? 0x1C1C1C : undefined
  })
}

function A(){
  const ARef = useRef()
  useFrame(() => {
    if(ARef.current){
      ARef.current.position.x = -1.2;
    }
  });

  const {onPointerOver, onPointerOut, color} = useBlink();
  
  return (
    <SvgAsync
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      url={Aurl} 
      color={color} 
      sceneRef={ARef} 
      lightPosition={[-0.75, -0.5, 0]}
    />
  )
}

function K(){
  const {onPointerOver, onPointerOut, color} = useBlink();
  return  (
    <SvgAsync 
      url={Kurl}
      lightPosition={[0.4, -0.5, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      color={color}
    />
  )
}

function F(){
  const FRef = useRef();
  const {onPointerOver, onPointerOut, color} = useBlink();
  useFrame(() => {
    if(FRef.current){
      FRef.current.position.x = -1.15;
      FRef.current.position.y = -1.2;
    }
  })
  return  (
    <SvgAsync 
      url={Furl} 
      sceneRef={FRef} 
      lightPosition={[-0.85, -1.7, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      color={color}
    />
  )
}

function N(){
  const NRef = useRef();
  const {onPointerOver, onPointerOut, color} = useBlink();
  useFrame(() => {
    if(NRef.current){
      NRef.current.position.y = -1.2;
    }
  })
  return  (
    <SvgAsync 
      url={Nurl} 
      sceneRef={NRef} 
      lightPosition={[0.45, -1.7, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      color={color}
    />
  )
}

function Sixteen(){
  const SixteenRef = useRef();
  useFrame(() => {
    if(SixteenRef.current){
      SixteenRef.current.position.y = -2.3;
      SixteenRef.current.position.x = 1;
      SixteenRef.current.position.z = -0.1;
    }
  })
  return  (
    <SvgAsync
      url={SixteenUrl} 
      sceneRef={SixteenRef} 
      color={0xFFFFFF}
      scale={0.7}
    />
  )
}

function BoxDoor(props) {
  const mesh = useRef();

  useFrame(() => {
    if(mesh.current){
      mesh.current.position.z = -0.15
    }
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1.1,1.1,1.1]}
    >
      <boxBufferGeometry attach="geometry" args={[3.3, 3.3, 0.1]} />
      <MeshReflectorMaterial
        blur={[100, 100]}
        mixBlur={0}
        mirror={0.5}
        resolution={2048}
      />
    </mesh>
  )
}

function BoxBG(props) {
  const mesh = useRef();

  useFrame(() => {
    if(mesh.current){
      mesh.current.position.z = -2
    }
  })

  const [video] = useState(() => {
    const vid = document.createElement("video");
    vid.src = videoUrl;
    vid.crossOrigin = "Anonymous";
    return vid;
  });

  useEffect(() => {
    if(props.isPlaying){
      video.src = videoUrl;
      video.play();
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [props, video])

  useFrame(() => {
    if(video.currentTime === video.duration){
      props.onVideoEnd();
      video.currentTime = 0;
    }
  })

  const { scale } = useSpring({ 
    scale: props.isPlaying ? [2.3,1.13,1.13] : [1.13,1.13,1.13],
    delay: !props.isPlaying ? 0 : 200 
  })

  return (
    <animated.mesh
      {...props}
      ref={mesh}
      scale={scale}
    >
      <boxBufferGeometry attach="geometry" args={[3.3, 3.3, 3.3]}/>
      <meshBasicMaterial color={0xFFFFFF}>
        <videoTexture attach="map" args={[video]} />
      </meshBasicMaterial>
    </animated.mesh>
  )
}

function Plane(props) {
  const mesh = useRef();

  useFrame(() => {
    if(mesh.current){
      mesh.current.position.z = -0.2
    }
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1.1,1.1,1.1]}
    >
      <boxBufferGeometry attach="geometry" args={[32, 32, 0.1]} />
      <meshPhongMaterial
        color={0x555555}
      />
    </mesh>
  )
}

function AKFNGroup(){
  const groupRef = useRef();
  useFrame(() => {
    groupRef.current.position.x = 0.12;
    groupRef.current.position.y = 1.05;
  })
  return (
    <group ref={groupRef}>
      <A />
      <K />
      <F />
      <N />
      <Sixteen />
    </group>
  )
}

const Scene = () => {
  const {
    camera,
  } = useThree();
  const [isOpen, setIsOpen] = useState(false);
  
  const groupRef = useRef();
  const innerGroupRef = useRef();
  const lightRef = useRef();

  camera.position.z = 4.5
  const { rotation } = useSpring({ 
    rotation: isOpen ? THREE.Math.degToRad(-100) : 0,
    delay: !isOpen ? 200 : 0 
  })
  
  useFrame((el) => {
    if(innerGroupRef.current){
      innerGroupRef.current.position.x = 2;
    }
    if(groupRef.current){
      groupRef.current.position.x = -2;
    }
    if(lightRef.current){
      lightRef.current.position.x = el.mouse.x * 2;
      lightRef.current.position.y = el.mouse.y * 2;
      lightRef.current.position.z = 0.4
    }
  })

  return (
    <>
      <Suspense fallback={null}>
        {/* <ambientLight intensity={0.1} color="#D1D1D1" /> */}
        <pointLight ref={lightRef} intensity={0.6} color={0xFFFFFF} castShadow />
        <animated.group ref={groupRef} rotation-y={rotation}>
          <group ref={innerGroupRef} onClick={() => setIsOpen(!isOpen)}>
            <AKFNGroup />
            <BoxDoor />
          </group>
        </animated.group>
        <Plane />
        <BoxBG isPlaying={isOpen} onVideoEnd={(e) => setIsOpen(false)} />
      </Suspense>
    </>
  )
}

export default function AKFN() {
  return (
    <Canvas linear gl={{
        powerPreference: "high-performance",
        alpha: false,
        antialias: false,
        stencil: false,
        depth: false
      }}>
      <Scene />
      <EffectComposer multisampling={0} disableNormalPass={true}>
        <Bloom intensity={1.5} luminanceThreshold={0.6} luminanceSmoothing={0.4} height={700} />
        <Noise opacity={0.2} />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </Canvas>
  )
}