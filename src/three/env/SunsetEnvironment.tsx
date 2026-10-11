import { Environment, Lightformer } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Reflections for brass, gold and polished marble, built from code (no HDR
 * files): a warm sunset dome plus a few glowing "windows" and lamp panels,
 * rendered once into an environment cube map.
 */
export function SunsetEnvironment() {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vDir; void main(){
          float h = vDir.y;
          vec3 c = mix(vec3(0.16, 0.07, 0.03), vec3(1.0, 0.55, 0.25), smoothstep(-0.4, 0.05, h));
          c = mix(c, vec3(0.9, 0.6, 0.55), smoothstep(0.05, 0.4, h));
          c = mix(c, vec3(0.35, 0.35, 0.55), smoothstep(0.4, 1.0, h));
          float s = max(dot(normalize(vDir), normalize(vec3(0.0, 0.07, -1.0))), 0.0);
          c *= 0.7; c += vec3(1.6, 1.0, 0.45) * pow(s, 24.0);
          gl_FragColor = vec4(c, 1.0); }`,
      }),
    [],
  )
  return (
    <Environment resolution={256} frames={1} background={false}>
      <mesh material={dome} scale={100}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      {/* the bright doorway behind, warm lamp glow in front and to the sides */}
      <Lightformer form="rect" intensity={2.6} color="#ffd6a0" position={[0, 2, -8]} scale={[3, 5, 1]} />
      <Lightformer form="circle" intensity={1.4} color="#ffb060" position={[-3, 1, 4]} scale={1.2} />
      <Lightformer form="circle" intensity={1.4} color="#ffb060" position={[3, 1, 4]} scale={1.2} />
      <Lightformer form="rect" intensity={0.6} color="#fff0dc" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
    </Environment>
  )
}
