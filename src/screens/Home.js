import React, { useRef, Suspense, useState } from 'react'
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, extend, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Stars } from '@react-three/drei';
import { OldGlow } from '../Glow';
import { AtmosphereShader } from '../shaders/AtmosphereShader';

import earthImg from '../assets/img/earthmap1k.jpg';
import moonImg from '../assets/img/moonmap1k.jpg';
import venusImg from '../assets/img/venusmap1k.jpeg';
import mercuryImg from '../assets/img/mercurymap1k.jpg';
import marsImg from '../assets/img/marsmap1k.jpg';
import jupiterImg from '../assets/img/jupitermap1k.jpg';
import saturnImg from '../assets/img/saturnmap1k.jpg';
import saturnRingImg from '../assets/img/saturnringmap1k.png';
import uranusImg from '../assets/img/uranusmap1k.jpg';
import starMapImg from '../assets/img/starmap4k.jpg';
import neptuneImg from '../assets/img/neptunemap1k.jpg';

extend({ OrbitControls })

const BASE_EARTH_SIZE = .125;
const BASE_EARTH_REVOLUTION_SPEED = 0.0001;
const BASE_EARTH_ROTATION_SPEED = 0.001;
const ASTRONOMICAL_UNIT = 8;

const Sun = React.forwardRef((props, ref) => {
  const mesh = useRef();

  const handleSunClick = (e) => {
    e.stopPropagation();
    props.onClick?.(e);
  };

  return (
    <mesh
      {...props}
      ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        mesh.current = node;
      }}
      scale={[1.1,1.1,1.1]}
      name="sun"
      onClick={handleSunClick}
      onPointerDown={handleSunClick}
    >
      <sphereGeometry attach="geometry" args={[1, 32, 32]} />
      <meshLambertMaterial
        emissive="#FA6400"
        emissiveIntensity={10}
      />
    </mesh>
  )
})

function Mercury(props) {
  const mesh = useRef();
  const mercuryGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, mercuryImg);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y -= (BASE_EARTH_REVOLUTION_SPEED / 245.83333333333334) * 100;
    }
  })

  const handleMercuryClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 0.387, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={mercuryGroup}
      position={[ASTRONOMICAL_UNIT * 0.387, 0, 0]}
      onClick={handleMercuryClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleMercuryClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.383, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
};

function Venus(props) {
  const mesh = useRef();
  const venusGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, venusImg);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y -= (BASE_EARTH_REVOLUTION_SPEED / 24300) * 100;
    }
  })

  const handleVenusClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 0.723, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={venusGroup}
      position={[ASTRONOMICAL_UNIT * 0.723, 0, 0]}
      onClick={handleVenusClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleVenusClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.949, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Earth(props) {
  const mesh = useRef();
  const earthGroup = useRef();
  const atmosphereRef = useRef();
  const texture = useLoader(THREE.TextureLoader, earthImg);
  const { camera } = useThree();
  
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += BASE_EARTH_ROTATION_SPEED;
    }
    // Update viewVector and sunPosition for the atmosphere shader
    if (atmosphereRef.current) {
      atmosphereRef.current.material.uniforms.viewVector.value.copy(camera.position);
      // Sun is at origin (0, 0, 0)
      atmosphereRef.current.material.uniforms.sunPosition.value.set(0, 0, 0);
    }
  })

  const handleEarthClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      {...props}
      ref={earthGroup}
      position={[ASTRONOMICAL_UNIT, 0, 0]}
      onClick={handleEarthClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleEarthClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
      {/* Atmosphere with custom shader */}
      <mesh ref={atmosphereRef} scale={[1.04, 1.04, 1.04]} onClick={handleEarthClick}>
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE, 128, 128]} />
        <shaderMaterial
          attach="material"
          args={[AtmosphereShader]}
          uniforms-glowColor-value={new THREE.Color(0x47b5e1)}
          uniforms-c-value={0.5}
          uniforms-p-value={5.0}
          uniforms-viewVector-value={camera.position}
          uniforms-sunPosition-value={new THREE.Vector3(0, 0, 0)}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
      <Moon />
    </group>
  )
}

function Moon(props) {
  const mesh = useRef();
  const moonGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, moonImg);
  
  useFrame(() => {
    if (mesh.current && moonGroup.current) {
      moonGroup.current.rotation.y += BASE_EARTH_REVOLUTION_SPEED * 13.37;
      moonGroup.current.rotation.x = Math.PI / 36;
    }
  })

  return (
    <group ref={moonGroup}>
      <mesh
        ref={mesh}
        position={[0.5, 0, 0]}
        rotation={[0, Math.PI, 0]}
        scale={[1, 1, 1]}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.27, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Mars(props) {
  const mesh = useRef();
  const marsGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, marsImg);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += BASE_EARTH_ROTATION_SPEED * 1.1;
    }
  })

  const handleMarsClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 1.52, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={marsGroup}
      position={[ASTRONOMICAL_UNIT * 1.52, 0, 0]}
      onClick={handleMarsClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleMarsClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 0.532, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Jupiter(props) {
  const mesh = useRef();
  const jupiterGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, jupiterImg);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y -= (BASE_EARTH_ROTATION_SPEED / 41.66666666666667) * 100;
    }
  })

  const handleJupiterClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 5.20, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={jupiterGroup}
      position={[ASTRONOMICAL_UNIT * 5.20, 0, 0]}
      onClick={handleJupiterClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleJupiterClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 9.45, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Uranus(props) {
  const mesh = useRef();
  const uranusGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, uranusImg);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y -= (BASE_EARTH_ROTATION_SPEED / 70.85234875) * 100;
    }
  })

  const handleUranusClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 19.22, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={uranusGroup}
      position={[ASTRONOMICAL_UNIT * 19.22, 0, 0]}
      onClick={handleUranusClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleUranusClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 4, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Neptune(props) {
  const mesh = useRef();
  const neptuneGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, neptuneImg);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y -= (BASE_EARTH_ROTATION_SPEED / 16.11) * 100;
    }
  })

  const handleNeptuneClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 30.07, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={neptuneGroup}
      position={[ASTRONOMICAL_UNIT * 30.07, 0, 0]}
      onClick={handleNeptuneClick}
    >
      <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onClick={handleNeptuneClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 4, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Saturn(props) {
  const saturnGroup = useRef();
  const planet = useRef();
  const ring = useRef();
  const texture = useLoader(THREE.TextureLoader, saturnImg);
  const ringTexture = useLoader(THREE.TextureLoader, saturnRingImg);
  const v3 = new THREE.Vector3();

  const ringGeometry = new THREE.RingBufferGeometry(3, 6, 32);
  var pos = ringGeometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    v3.fromBufferAttribute(pos, i);
    ringGeometry.attributes.uv.setXY(i, v3.length() < 4 ? 0 : 1, 1);
  }
  const ringMaterial = new THREE.MeshBasicMaterial({
    map: ringTexture,
    side: THREE.DoubleSide,
    transparent: true,
    color: 0x353535
  });

  useFrame(() => {
    if (planet.current && ring.current) {
      planet.current.rotation.y -= (BASE_EARTH_ROTATION_SPEED / 45.83333333333333) * 100;
      
      ring.current.position.x = planet.current.position.x;
      ring.current.position.y = planet.current.position.y;
      ring.current.position.z = planet.current.position.z;
      ring.current.rotation.x = 30;
      ring.current.rotation.y = -0.2;
    }
  });

  const handleSaturnGroupClick = (e) => {
    e.stopPropagation();
    const pos = new THREE.Vector3(ASTRONOMICAL_UNIT * 9.58, 0, 0);
    props.onClick?.(e, pos);
  };

  return (
    <group 
      ref={saturnGroup}
      position={[ASTRONOMICAL_UNIT * 9.58, 0, 0]}
      onClick={handleSaturnGroupClick}
    >
      <mesh
        ref={ring}
        onClick={handleSaturnGroupClick}
      >
        <mesh geometry={ringGeometry} material={ringMaterial} scale={[.5, .5, .5]} />
      </mesh>
      <mesh
        ref={planet}
        scale={[1, 1, 1]}
        onClick={handleSaturnGroupClick}
      >
        <sphereGeometry attach="geometry" args={[BASE_EARTH_SIZE * 11.21, 32, 32]} />
        <meshPhongMaterial
          map={texture}
        />
      </mesh>
    </group>
  )
}

function Universe(props) {
  const mesh = useRef();
  const texture = useLoader(THREE.TextureLoader, starMapImg);

  useFrame(() => {
    mesh.current.rotation.x = 0;
    mesh.current.rotation.y = -10
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={[1, 1, 1]}
    >
      <sphereGeometry attach="geometry" args={[512, 512, 512]} />
      <meshBasicMaterial
        side={THREE.BackSide}
        map={texture}
      />
    </mesh>
  )
}

const Scene = () => {
  const {
    camera,
    gl: { domElement }
  } = useThree();
  const sunRef = useRef();
  const controlsRef = useRef();
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(0, 0, 5));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [initialClickPosition, setInitialClickPosition] = useState(null);
  const [followingPlanet, setFollowingPlanet] = useState(null);
  const [planetPivotRef, setPlanetPivotRef] = useState(null);
  const [planetDistance, setPlanetDistance] = useState(0);
  
  // Refs for pivot points
  const mercuryPivotRef = useRef();
  const venusPivotRef = useRef();
  const earthPivotRef = useRef();
  const marsPivotRef = useRef();
  const jupiterPivotRef = useRef();
  const saturnPivotRef = useRef();
  const uranusPivotRef = useRef();
  const neptunePivotRef = useRef();
  
  const handlePlanetClick = (position, planetRef, planetName) => {
    setFollowingPlanet(planetName);
    
    switch(planetName) {
      case 'Mercury':
        setPlanetPivotRef(mercuryPivotRef);
        setPlanetDistance(1.5);
        break;
      case 'Venus':
        setPlanetPivotRef(venusPivotRef);
        setPlanetDistance(1.8);
        break;
      case 'Earth':
        setPlanetPivotRef(earthPivotRef);
        setPlanetDistance(2);
        break;
      case 'Mars':
        setPlanetPivotRef(marsPivotRef);
        setPlanetDistance(1.6);
        break;
      case 'Jupiter':
        setPlanetPivotRef(jupiterPivotRef);
        setPlanetDistance(8);
        break;
      case 'Saturn':
        setPlanetPivotRef(saturnPivotRef);
        setPlanetDistance(10);
        break;
      case 'Uranus':
        setPlanetPivotRef(uranusPivotRef);
        setPlanetDistance(4);
        break;
      case 'Neptune':
        setPlanetPivotRef(neptunePivotRef);
        setPlanetDistance(4);
        break;
      default:
        setPlanetDistance(2);
        break;
    }
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    setIsTransitioning(true);
  };

  useFrame((state, delta) => {
    if (mercuryPivotRef.current) {
      mercuryPivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 24.084873374401095) * 100;
    }
    if (venusPivotRef.current) {
      venusPivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 61) * 100;
    }
    if (earthPivotRef.current) {
      earthPivotRef.current.rotation.y += BASE_EARTH_REVOLUTION_SPEED;
    }
    if (marsPivotRef.current) {
      marsPivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 188.07118412046543) * 100;
    }
    if (jupiterPivotRef.current) {
      jupiterPivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 1186) * 100;
    }
    if (saturnPivotRef.current) {
      saturnPivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 2939.986310746064) * 100;
    }
    if (uranusPivotRef.current) {
      uranusPivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 8400) * 100;
    }
    if (neptunePivotRef.current) {
      neptunePivotRef.current.rotation.y += (BASE_EARTH_REVOLUTION_SPEED / 164000.79132) * 100;
    }
    
    if (followingPlanet && planetPivotRef?.current) {
      const planetGroup = planetPivotRef.current.children[0];
      
      if (planetGroup) {
        const planetWorldPos = new THREE.Vector3();
        planetGroup.getWorldPosition(planetWorldPos);
        
        if (isTransitioning) {
          const sunToPlaneDirection = planetWorldPos.clone().normalize();
          const cameraDistance = planetDistance;
          
          const cameraPos = planetWorldPos.clone()
            .sub(sunToPlaneDirection.clone().multiplyScalar(cameraDistance * 0.8))
            .add(new THREE.Vector3(0, cameraDistance * 0.3, 0));
          
          camera.position.lerp(cameraPos, 0.05);
          camera.lookAt(planetWorldPos);
          
          if (camera.position.distanceTo(cameraPos) < 0.2) {
            setIsTransitioning(false);
            
            if (controlsRef.current) {
              controlsRef.current.enabled = true;
              controlsRef.current.target.copy(planetWorldPos);
              controlsRef.current.minDistance = planetDistance * 0.3;
              controlsRef.current.maxDistance = planetDistance * 3;
              controlsRef.current.update();
            }
          }
        } else {
          const currentOffset = camera.position.clone().sub(controlsRef.current?.target || planetWorldPos);
          
          camera.position.copy(planetWorldPos.clone().add(currentOffset));
          
          if (controlsRef.current) {
            controlsRef.current.target.copy(planetWorldPos);
            controlsRef.current.update();
          }
        }
      }
    } else if (isTransitioning && initialClickPosition) {
      camera.position.lerp(targetPosition, 0.02);
      
      camera.lookAt(initialClickPosition);
      
      if (camera.position.distanceTo(targetPosition) < 0.1) {
        setIsTransitioning(false);
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.target.copy(initialClickPosition);
          controlsRef.current.minDistance = 1;
          controlsRef.current.maxDistance = 5;
          controlsRef.current.update();
        }
      }
    }
  });

  React.useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera]);

  const handleSunClick = (e) => {
    setFollowingPlanet(null);
    setPlanetPivotRef(null);
    
    const initialPos = new THREE.Vector3(0, 0, 5);
    const sunPos = new THREE.Vector3(0, 0, 0);
    
    setTargetPosition(initialPos);
    setInitialClickPosition(sunPos);
    setIsTransitioning(true);
  };

  return (
    <>
      <Suspense fallback={null}>
        <pointLight position={[0, 0, -2.5]} intensity={.5} color="white" />
        
        <Universe position={[0, 0, 0]} />
        <Stars
          depth={40}
          count={8000}
          factor={5}
          saturation={0}
          fade
        />
        <object3D ref={mercuryPivotRef}>
          <Mercury 
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Mercury');
            }}
          />
        </object3D>
        <object3D ref={venusPivotRef}>
          <Venus 
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Venus');
            }}
          />
        </object3D>
        <object3D ref={earthPivotRef}>
          <Earth
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Earth');
            }}
          />
        </object3D>
        <object3D ref={marsPivotRef}>
          <Mars 
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Mars');
            }}
          />
        </object3D>
        <object3D ref={jupiterPivotRef}>
          <Jupiter 
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Jupiter');
            }}
          />
        </object3D>
        <object3D ref={saturnPivotRef}>
          <Saturn
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Saturn');
            }}
          />
        </object3D>
        <object3D ref={uranusPivotRef}>
          <Uranus 
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Uranus');
            }}
          />
        </object3D>
        <object3D ref={neptunePivotRef}>
          <Neptune 
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Neptune');
            }}
          />
        </object3D>
        <Sun 
          ref={sunRef} 
          position={[0, 0, 0]} 
          onClick={handleSunClick}
        />
        <OldGlow sunRef={sunRef} />
      </Suspense>
      <orbitControls 
        ref={controlsRef}
        args={[camera, domElement]} 
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={1}
        maxDistance={5}
        enablePan={false}
      />
    </>
  )
}

export default function Home() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  )
}
