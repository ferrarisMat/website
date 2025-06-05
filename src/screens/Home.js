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


const ORBITAL_PERIODS = {
  mercury: 88,
  venus: 225,
  earth: 365,
  mars: 687,
  jupiter: 4333,
  saturn: 10759,
  uranus: 30687,
  neptune: 60190,
  moon: 27.3
};

const BASE_EARTH_SIZE = .125;


const ASTRONOMICAL_UNIT = 8;

const calculatePlanetPosition = (orbitalPeriod, referenceDate = new Date('2000-01-01')) => {
  const now = new Date();
  const daysSinceReference = (now - referenceDate) / (1000 * 60 * 60 * 24);
  const orbitsCompleted = daysSinceReference / orbitalPeriod;
  const currentPosition = (orbitsCompleted % 1) * 2 * Math.PI;
  
  return currentPosition;
};

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

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += props.baseEarthRotationSpeed * (1 / 58.6) * delta;
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

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y -= props.baseEarthRotationSpeed * (1 / 243) * delta;
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
  
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += props.baseEarthRotationSpeed * delta;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.material.uniforms.viewVector.value.copy(camera.position);
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
      <Moon baseMoonRevolutionSpeed={props.baseMoonRevolutionSpeed} />
    </group>
  )
}

function Moon(props) {
  const mesh = useRef();
  const moonGroup = useRef();
  const texture = useLoader(THREE.TextureLoader, moonImg);
  
  useFrame((state, delta) => {
    if (mesh.current && moonGroup.current) {
      moonGroup.current.rotation.y += props.baseMoonRevolutionSpeed * delta;
      moonGroup.current.rotation.x = Math.PI / 20;
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

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += props.baseEarthRotationSpeed * (1 / 1.03) * delta;
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

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += props.baseEarthRotationSpeed * (1 / 0.41) * delta;
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

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y -= props.baseEarthRotationSpeed * (1 / 0.72) * delta;
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

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += props.baseEarthRotationSpeed * (1 / 0.67) * delta;
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

  useFrame((state, delta) => {
    if (planet.current && ring.current) {
      planet.current.rotation.y += props.baseEarthRotationSpeed * (1 / 0.45) * delta;
      
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

const Scene = ({ dayHours, baseEarthRotationSpeed, baseEarthRevolutionSpeed, baseMoonRevolutionSpeed, onGoToPlanet }) => {
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
  const [planetsInitialized, setPlanetsInitialized] = useState(false);
  
  const mercuryPivotRef = useRef();
  const venusPivotRef = useRef();
  const earthPivotRef = useRef();
  const marsPivotRef = useRef();
  const jupiterPivotRef = useRef();
  const saturnPivotRef = useRef();
  const uranusPivotRef = useRef();
  const neptunePivotRef = useRef();
  
  const handlePlanetClick = React.useCallback((position, planetRef, planetName) => {
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
  }, [mercuryPivotRef, venusPivotRef, earthPivotRef, marsPivotRef, jupiterPivotRef, saturnPivotRef, uranusPivotRef, neptunePivotRef]);

  useFrame((state, delta) => {
    // Initialize planet positions on first frame when refs are ready
    if (!planetsInitialized && mercuryPivotRef.current && venusPivotRef.current && earthPivotRef.current) {
      mercuryPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.mercury);
      venusPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.venus);
      earthPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.earth);
      marsPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.mars);
      jupiterPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.jupiter);
      saturnPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.saturn);
      uranusPivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.uranus);
      neptunePivotRef.current.rotation.y = calculatePlanetPosition(ORBITAL_PERIODS.neptune);
      setPlanetsInitialized(true);
      return; // Skip movement on initialization frame
    }


    if (mercuryPivotRef.current) {
      mercuryPivotRef.current.rotation.y += baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.mercury) * delta;
    }
    if (venusPivotRef.current) {
      venusPivotRef.current.rotation.y += baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.venus) * delta;
    }
    if (earthPivotRef.current) {
      earthPivotRef.current.rotation.y += baseEarthRevolutionSpeed * delta;
    }
    if (marsPivotRef.current) {
      marsPivotRef.current.rotation.y += baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.mars) * delta;
    }
    if (jupiterPivotRef.current) {
      jupiterPivotRef.current.rotation.y += baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.jupiter) * delta;
    }
    if (saturnPivotRef.current) {
      saturnPivotRef.current.rotation.y += baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.saturn) * delta;
    }
    if (uranusPivotRef.current) {
      uranusPivotRef.current.rotation.y -= baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.uranus) * delta;
    }
    if (neptunePivotRef.current) {
      neptunePivotRef.current.rotation.y -= baseEarthRevolutionSpeed * (ORBITAL_PERIODS.earth / ORBITAL_PERIODS.neptune) * delta;
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

  const handleSunClick = React.useCallback((e) => {
    setFollowingPlanet(null);
    setPlanetPivotRef(null);
    
    const initialPos = new THREE.Vector3(0, 0, 5);
    const sunPos = new THREE.Vector3(0, 0, 0);
    
    setTargetPosition(initialPos);
    setInitialClickPosition(sunPos);
    setIsTransitioning(true);
  }, []);

  const goToPlanet = React.useCallback((planetName) => {
    const planetPositions = {
      'Mercury': new THREE.Vector3(ASTRONOMICAL_UNIT * 0.387, 0, 0),
      'Venus': new THREE.Vector3(ASTRONOMICAL_UNIT * 0.723, 0, 0),
      'Earth': new THREE.Vector3(ASTRONOMICAL_UNIT, 0, 0),
      'Mars': new THREE.Vector3(ASTRONOMICAL_UNIT * 1.52, 0, 0),
      'Jupiter': new THREE.Vector3(ASTRONOMICAL_UNIT * 5.20, 0, 0),
      'Saturn': new THREE.Vector3(ASTRONOMICAL_UNIT * 9.58, 0, 0),
      'Uranus': new THREE.Vector3(ASTRONOMICAL_UNIT * 19.22, 0, 0),
      'Neptune': new THREE.Vector3(ASTRONOMICAL_UNIT * 30.07, 0, 0),
      'Sun': new THREE.Vector3(0, 0, 0)
    };

    if (planetName === 'Sun') {
      handleSunClick();
    } else {
      const position = planetPositions[planetName];
      if (position) {
        handlePlanetClick(position, null, planetName);
      }
    }
  }, [handleSunClick, handlePlanetClick]);

  // Expose goToPlanet function to parent component
  React.useEffect(() => {
    if (onGoToPlanet) {
      onGoToPlanet.current = goToPlanet;
    }
  }, [onGoToPlanet, goToPlanet]);

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
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Mercury');
            }}
          />
        </object3D>
        <object3D ref={venusPivotRef}>
          <Venus 
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Venus');
            }}
          />
        </object3D>
        <object3D ref={earthPivotRef}>
          <Earth
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            baseMoonRevolutionSpeed={baseMoonRevolutionSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Earth');
            }}
          />
        </object3D>
        <object3D ref={marsPivotRef}>
          <Mars 
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Mars');
            }}
          />
        </object3D>
        <object3D ref={jupiterPivotRef}>
          <Jupiter 
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Jupiter');
            }}
          />
        </object3D>
        <object3D ref={saturnPivotRef}>
          <Saturn
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Saturn');
            }}
          />
        </object3D>
        <object3D ref={uranusPivotRef}>
          <Uranus 
            baseEarthRotationSpeed={baseEarthRotationSpeed}
            onClick={(e, pos) => {
              handlePlanetClick(pos, e.target, 'Uranus');
            }}
          />
        </object3D>
        <object3D ref={neptunePivotRef}>
          <Neptune 
            baseEarthRotationSpeed={baseEarthRotationSpeed}
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
  const [dayHours, setDayHours] = useState(24);
  const goToPlanetRef = useRef();

  // Calculate speeds based on current dayHours
  const baseEarthRotationSpeed = (2 * Math.PI) / (dayHours * 3600);
  const baseEarthRevolutionSpeed = (2 * Math.PI) / (365 * dayHours * 3600);
  const baseMoonRevolutionSpeed = (2 * Math.PI) / (ORBITAL_PERIODS.moon * dayHours * 3600);

  const handleDayHoursChange = (e) => {
    setDayHours(parseFloat(e.target.value));
  };

  return (
    <>
      <div className='gui' style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        minWidth: '200px',
      }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Time Speed: {dayHours.toFixed(2)} hours/day
          </label>
                     <input
             type="range"
             min="0.01"
             max="24"
             step="0.01"
             value={dayHours}
             onChange={handleDayHoursChange}
            style={{
              width: '100%',
              height: '5px',
              backgroundColor: '#333',
              outline: 'none',
              borderRadius: '5px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
            <span>Ultra Fast</span>
            <span>Realistic</span>
          </div>
          <button onClick={() => setDayHours(24)}>Reset</button>
          <button onClick={() => setDayHours(1)}>1 hour/day</button>
          <button onClick={() => setDayHours(0.001)}>3,6 seconds/day</button>
          <button onClick={() => setDayHours(0.0001)}>360 ms/day</button>
        </div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
           <p>Earth rotation: {dayHours < 1 ? `${(dayHours * 60).toFixed(2)} min` : `${dayHours.toFixed(1)} hours`}</p>
           <p>Earth orbit: {dayHours < 1 ? `${(365 * dayHours).toFixed(2)} hours` : `${(365 * dayHours / 24).toFixed(1)} days`}</p>
        </div>
        <div style={{ fontSize: '12px', color: '#ccc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '10px' }}>
          <button onClick={() => goToPlanetRef.current?.('Sun')} style={{ padding: '5px', fontSize: '11px' }}>Go to Sun</button>
          <button onClick={() => goToPlanetRef.current?.('Mercury')} style={{ padding: '5px', fontSize: '11px' }}>Go to Mercury</button>
          <button onClick={() => goToPlanetRef.current?.('Venus')} style={{ padding: '5px', fontSize: '11px' }}>Go to Venus</button>
          <button onClick={() => goToPlanetRef.current?.('Earth')} style={{ padding: '5px', fontSize: '11px' }}>Go to Earth</button>
          <button onClick={() => goToPlanetRef.current?.('Mars')} style={{ padding: '5px', fontSize: '11px' }}>Go to Mars</button>
          <button onClick={() => goToPlanetRef.current?.('Jupiter')} style={{ padding: '5px', fontSize: '11px' }}>Go to Jupiter</button>
          <button onClick={() => goToPlanetRef.current?.('Saturn')} style={{ padding: '5px', fontSize: '11px' }}>Go to Saturn</button>
          <button onClick={() => goToPlanetRef.current?.('Uranus')} style={{ padding: '5px', fontSize: '11px' }}>Go to Uranus</button>
          <button onClick={() => goToPlanetRef.current?.('Neptune')} style={{ padding: '5px', fontSize: '11px' }}>Go to Neptune</button>
        </div>
      </div>
      <Canvas>
        <Scene 
          dayHours={dayHours}
          baseEarthRotationSpeed={baseEarthRotationSpeed}
          baseEarthRevolutionSpeed={baseEarthRevolutionSpeed}
          baseMoonRevolutionSpeed={baseMoonRevolutionSpeed}
          onGoToPlanet={goToPlanetRef}
        />
      </Canvas>
    </>
  )
}
