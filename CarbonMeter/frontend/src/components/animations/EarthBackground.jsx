import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './earthAnimation.css';

const EarthBackground = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const earthGroupRef = useRef(null);
  const cloudsRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Store mount reference for cleanup
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup - positioned to show full Earth
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, -0.5, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x4a9eff, 0.3);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    // Texture loader
    const textureLoader = new THREE.TextureLoader();

    // Earth group (container for all Earth layers)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -0.5, 0);
    earthGroupRef.current = earthGroup;
    scene.add(earthGroup);

    // Load textures from Open Energy Maps
    const dayTexture = textureLoader.load(
      'https://www.openenergymaps.org/earth/earth_daymap.jpeg'
    );
    const nightTexture = textureLoader.load(
      'https://www.openenergymaps.org/earth/earth_nightmap.jpeg'
    );
    const normalTexture = textureLoader.load(
      'https://www.openenergymaps.org/earth/earth_normal_map.jpeg'
    );
    const specularTexture = textureLoader.load(
      'https://www.openenergymaps.org/earth/earth_specular_map.jpeg'
    );
    const cloudsTexture = textureLoader.load(
      'https://www.openenergymaps.org/earth/earth_clouds.png'
    );

    // Earth sphere with day/night textures (reduced size for full visibility)
    const earthGeometry = new THREE.SphereGeometry(3.3, 64, 64);
    
    // Custom shader material for day/night blending
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        normalMap: { value: normalTexture },
        specularMap: { value: specularTexture },
        lightDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D normalMap;
        uniform sampler2D specularMap;
        uniform vec3 lightDirection;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Sample textures
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec3 normal = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
          float specular = texture2D(specularMap, vUv).r;

          // Calculate lighting
          vec3 normalizedNormal = normalize(vNormal + normal * 0.3);
          float lightIntensity = max(dot(normalizedNormal, lightDirection), 0.0);

          // Smooth day/night transition
          float dayNightMix = smoothstep(-0.1, 0.3, lightIntensity);

          // Blend day and night textures
          vec3 color = mix(nightColor.rgb * 0.8, dayColor.rgb, dayNightMix);

          // Add specular highlights on oceans
          if (specular > 0.5 && dayNightMix > 0.3) {
            vec3 viewDir = normalize(-vPosition);
            vec3 reflectDir = reflect(-lightDirection, normalizedNormal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            color += vec3(0.3) * spec * specular;
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // Clouds layer
    const cloudsGeometry = new THREE.SphereGeometry(3.35, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    cloudsRef.current = cloudsMesh;
    earthGroup.add(cloudsMesh);

    // Atmospheric glow
    const atmosphereGeometry = new THREE.SphereGeometry(3.48, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x4a9eff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 3000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }
    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.8,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate Earth (slow, cinematic)
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.y += 0.0003;
      }

      // Rotate clouds slower
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.00018;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (currentMount && rendererRef.current) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      // Dispose geometries and materials
      if (earthGeometry) earthGeometry.dispose();
      if (earthMaterial) earthMaterial.dispose();
      if (cloudsGeometry) cloudsGeometry.dispose();
      if (cloudsMaterial) cloudsMaterial.dispose();
      if (atmosphereGeometry) atmosphereGeometry.dispose();
      if (atmosphereMaterial) atmosphereMaterial.dispose();
      if (starsGeometry) starsGeometry.dispose();
      if (starsMaterial) starsMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className="earth-canvas-container" />;
};

export default EarthBackground;