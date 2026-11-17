import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const STAGE_COLORS: Record<string, string> = {
  Stage_1_Mature_Green: '#6B8E23',
  Stage_2_Green_Yellow_Transition: '#A2C11C',
  Stage_3_Early_Ripening: '#EEDC5B',
  Stage_4_Fully_Yellow: '#FFD700',
  Stage_5_Yellow_Spotted: '#B8860B',
}

interface BananaModel3DProps {
  stage?: string | null
}

export default function BananaModel3D({ stage }: BananaModel3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const currentColor = STAGE_COLORS[stage ?? ''] ?? STAGE_COLORS.Stage_3_Early_Ripening
  const currentColorRef = useRef(currentColor)
  currentColorRef.current = currentColor
  const [error, setError] = useState(false)

  useEffect(() => {
    if (materialRef.current) materialRef.current.color.set(currentColor)
  }, [currentColor])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let frame = 0
    let model: THREE.Group | undefined
    let scaledSize: THREE.Vector3 | undefined
    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      setError(true)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x806030, 2))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2)
    keyLight.position.set(3, 4, 5)
    scene.add(keyLight)

    const fitCamera = () => {
      if (!scaledSize) return

      const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov) / 2
      const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
      const horizontalHalfExtent = Math.hypot(scaledSize.x, scaledSize.z) / 2
      const verticalHalfExtent = scaledSize.y / 2
      const distance = Math.max(
        horizontalHalfExtent / Math.tan(horizontalHalfFov),
        verticalHalfExtent / Math.tan(verticalHalfFov),
      )

      camera.position.set(0, 0, distance * 1.15)
      camera.lookAt(0, 0, 0)
    }

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      if (!clientWidth || !clientHeight) return
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      fitCamera()
      renderer.setSize(clientWidth, clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    new GLTFLoader().load(
      '/banana.glb',
      (gltf) => {
        if (disposed) return
        const loadedModel = gltf.scene
        const bounds = new THREE.Box3().setFromObject(loadedModel)
        const center = bounds.getCenter(new THREE.Vector3())
        const size = bounds.getSize(new THREE.Vector3())
        const largestDimension = Math.max(size.x, size.y, size.z)
        if (largestDimension <= 0) {
          setError(true)
          return
        }

        const scale = 2.8 / largestDimension
        scaledSize = size.multiplyScalar(scale)
        const material = new THREE.MeshStandardMaterial({
          color: currentColorRef.current,
          roughness: 0.78,
          metalness: 0,
          map: null,
        })
        const originalMaterials = new Set<THREE.Material>()
        const originalTextures = new Set<THREE.Texture>()
        loadedModel.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return

          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((originalMaterial) => {
            originalMaterials.add(originalMaterial)
            Object.values(originalMaterial).forEach((value) => {
              if (value instanceof THREE.Texture) originalTextures.add(value)
            })
          })
          object.material = material
        })
        originalTextures.forEach((texture) => texture.dispose())
        originalMaterials.forEach((originalMaterial) => originalMaterial.dispose())
        materialRef.current = material

        model = new THREE.Group()
        model.scale.setScalar(scale)
        model.position.copy(center).multiplyScalar(-scale)
        model.add(loadedModel)
        scene.add(model)
        fitCamera()
      },
      undefined,
      () => {
        if (!disposed) setError(true)
      },
    )

    const animate = () => {
      if (model) model.rotation.y += 0.004
      renderer.render(scene, camera)
      frame = window.requestAnimationFrame(animate)
    }
    animate()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      materialRef.current = null
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
          meshMaterials.forEach((material) => {
            materials.add(material)
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) textures.add(value)
            })
          })
        }
      })
      textures.forEach((texture) => texture.dispose())
      materials.forEach((material) => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className="relative h-64 overflow-hidden rounded-xl bg-brand-50 dark:bg-brand-500/10">
      <div ref={mountRef} className="h-full w-full" aria-label="Rotating 3D banana model" />
      {error && (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-black dark:text-white">
          The 3D banana model could not be loaded.
        </p>
      )}
    </div>
  )
}
