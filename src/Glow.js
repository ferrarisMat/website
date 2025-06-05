import * as THREE from 'three'
import React, { useRef, useState, useEffect, useMemo } from 'react'
import { extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { EclipseShader } from './shaders/EclipseShader'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, FilmPass })

export function Glow({ children }) {
  const { gl, camera, size } = useThree()
  const [scene, setScene] = useState()
  const composer = useRef()
  useEffect(() => void scene && composer.current.setSize(size.width, size.height), [size, scene])
  useFrame(() => scene && composer.current.render(), 1)
  return (
    <>
      <scene ref={setScene}>{children}</scene>
      <effectComposer ref={composer} args={[gl]}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        <unrealBloomPass attachArray="passes" args={[new THREE.Vector2(1024, 1024), 1.5, 1, 0]} />
      </effectComposer>
    </>
  )
}

export function OldGlow({ sunRef }) {
  const composer = useRef()
  const { scene, gl, size, camera } = useThree()
  const aspect = useMemo(() => new THREE.Vector2(1024, 1024), [])
  const eclipsePass = useRef()
  
  useEffect(() => void composer.current.setSize(size.width, size.height), [size])
  
  useFrame(() => {
    if (sunRef.current && eclipsePass.current) {
      // Update sun position in shader
      const sunPosition = new THREE.Vector3()
      sunRef.current.getWorldPosition(sunPosition)
      sunPosition.project(camera)
      eclipsePass.current.uniforms.sunPosition.value = sunPosition
    }
    composer.current.render()
  }, 1)
  
  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <shaderPass 
        ref={eclipsePass}
        attachArray="passes"
        args={[EclipseShader]}
        uniforms-tDiffuse-value={null}
        uniforms-tDepth-value={null}
        uniforms-sunRadius-value={3.1}
        uniforms-intensity-value={2.0}
      />
      <unrealBloomPass 
        attachArray="passes" 
        args={[
          aspect,
          2.3, 
          0.2,
          0.7
        ]} 
        toneMapping={THREE.NoToneMapping}
      />
    </effectComposer>
  )
}