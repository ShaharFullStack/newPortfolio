import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BackButton } from '../../UI/BackButton/BackButton';
import './ContactScene.css';

export function ContactScene(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Cache for resources
  const resourcesRef = useRef<{
    geometries: Map<string, THREE.BufferGeometry>;
    materials: Map<string, THREE.Material>;
    textures: Map<string, THREE.Texture>;
  }>({
    geometries: new Map(),
    materials: new Map(),
    textures: new Map()
  });
  
  // Contact information
  const contactInfo = {
    name: "Shahar Maoz",
    email: "rakloze@gmail.com",
    linkedin: "www.linkedin.com/in/shaharmaozh",
    github: "https://github.com/ShaharFullStack"
  };

  // Create canvas texture with caching
  const createCanvasTexture = useCallback((
    key: string,
    width: number, 
    height: number, 
    drawFunction: (ctx: CanvasRenderingContext2D) => void
  ): THREE.Texture => {
    // Check if we already have this texture cached
    if (resourcesRef.current.textures.has(key)) {
      return resourcesRef.current.textures.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    if (context) {
      drawFunction(context);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Cache the texture
      resourcesRef.current.textures.set(key, texture);
      
      return texture;
    }
    
    // Fallback empty texture if context creation fails
    const fallback = new THREE.Texture();
    resourcesRef.current.textures.set(key, fallback);
    return fallback;
  }, []);

  // Create or get cached geometry
  const getGeometry = useCallback((key: string, createFunc: () => THREE.BufferGeometry): THREE.BufferGeometry => {
    if (!resourcesRef.current.geometries.has(key)) {
      resourcesRef.current.geometries.set(key, createFunc());
    }
    return resourcesRef.current.geometries.get(key)!;
  }, []);

  // Create or get cached material
  const getMaterial = useCallback((key: string, createFunc: () => THREE.Material): THREE.Material => {
    if (!resourcesRef.current.materials.has(key)) {
      resourcesRef.current.materials.set(key, createFunc());
    }
    return resourcesRef.current.materials.get(key)!;
  }, []);

  // Handle back button
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Handle window resize with throttling
  const lastResizeTime = useRef(0);
  const handleResize = useCallback(() => {
    // Throttle to max 5 resize events per second
    const now = performance.now();
    if (now - lastResizeTime.current < 200) return;
    lastResizeTime.current = now;

    if (cameraRef.current && rendererRef.current) {
      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }, []);
  
  useEffect(() => {
    // Store a reference to container to avoid React hook issues
    const container = containerRef.current;
    if (!container) return;
    
    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Setup environment with a warmer tone for contact page
    scene.background = new THREE.Color(0x1c3144); // Deep blue
    scene.fog = new THREE.Fog(0x1c3144, 8, 20);
    
    // Camera setup with optimized settings
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      100
    );
    camera.position.set(0, 1.7, 5);
    cameraRef.current = camera;
    
    // Renderer with optimized settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      stencil: false, // Disable stencil buffer for performance
      precision: "mediump" // Use medium precision for better performance
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    
    container.appendChild(renderer.domElement);
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main light with optimized shadow settings
    const mainLight = new THREE.DirectionalLight(0xffd9ca, 1); // Warm light
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 30;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);
    
    // Create accent lights for a more inviting atmosphere
    const goldLight = new THREE.PointLight(0xffd700, 2, 10);
    goldLight.position.set(-3, 2, 3);
    scene.add(goldLight);
    
    const blueLight = new THREE.PointLight(0x5da9e9, 2, 10);
    blueLight.position.set(3, 2, 3);
    scene.add(blueLight);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2;
    // Limit horizontal rotation
    controls.minAzimuthAngle = -Math.PI / 3;
    controls.maxAzimuthAngle = Math.PI / 3;
    // Set target
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;
    
    // Create a circular floor
    const floorGeometry = getGeometry('floor', () => new THREE.CircleGeometry(10, 32));
    const floorMaterial = getMaterial('floor', () => new THREE.MeshStandardMaterial({ 
      color: 0x2a5f7a, 
      roughness: 0.8,
      metalness: 0.2
    }));
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create background environment (stars/particles)
    const particleCount = 500;
    const particlesGeometry = getGeometry('particles', () => {
      const geometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleSizes = new Float32Array(particleCount);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 15 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i3 + 2] = radius * Math.cos(phi);
        
        particleSizes[i] = Math.random() * 0.1 + 0.02;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
      
      return geometry;
    });
    
    // Star material
    const particleMaterial = getMaterial('particles', () => new THREE.PointsMaterial({
      size: 0.1,
      color: 0xb0c4de, // Light steel blue
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    
    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);
    
    // Create contact info panel
    const contactPanel = (() => {
      // Create contact panel texture
      const texture = createCanvasTexture(
        'contact-panel',
        1024,
        768,
        (context) => {
          // Background
          const gradient = context.createLinearGradient(0, 0, 0, context.canvas.height);
          gradient.addColorStop(0, 'rgba(30, 50, 70, 0.85)');
          gradient.addColorStop(1, 'rgba(20, 35, 55, 0.85)');
          context.fillStyle = gradient;
          context.fillRect(0, 0, context.canvas.width, context.canvas.height);
          
          // Border
          context.strokeStyle = '#5da9e9'; // Blue border
          context.lineWidth = 8;
          context.strokeRect(8, 8, context.canvas.width - 16, context.canvas.height - 16);
          
          // Header
          context.fillStyle = '#ffd700'; // Gold
          context.font = 'bold 70px Arial';
          context.textAlign = 'center';
          context.fillText('Contact Me', context.canvas.width / 2, 90);
          
          // Name
          context.fillStyle = '#ffffff';
          context.font = 'bold 50px Arial';
          context.fillText(contactInfo.name, context.canvas.width / 2, 170);
          
          // Placeholder for image - create a circular area
          context.fillStyle = '#2a5f7a';
          context.beginPath();
          context.arc(context.canvas.width / 2, 300, 120, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = '#5da9e9';
          context.lineWidth = 5;
          context.stroke();
          
          // Text indicating image placeholder
          context.fillStyle = '#ffffff';
          context.font = '20px Arial';
          context.fillText('Profile Image', context.canvas.width / 2, 305);
          
          // Contact details
          context.textAlign = 'left';
          const startY = 460;
          const lineHeight = 50;
          
          context.fillStyle = '#ffd700'; // Gold
          context.font = 'bold 30px Arial';
          context.fillText('Email:', 200, startY);
          context.fillText('LinkedIn:', 200, startY + lineHeight);
          context.fillText('GitHub:', 200, startY + lineHeight * 2);
          
          context.fillStyle = '#ffffff';
          context.font = '30px Arial';
          context.fillText(contactInfo.email, 320, startY);
          context.fillText(contactInfo.linkedin, 320, startY + lineHeight);
          context.fillText(contactInfo.github, 320, startY + lineHeight * 2);
          
          // Footer
          context.textAlign = 'center';
          context.fillStyle = '#b0c4de'; // Light steel blue
          context.font = 'italic 24px Arial';
          context.fillText("Let's work together on your next project!", context.canvas.width / 2, startY + lineHeight * 3 + 20);
        }
      );
      
      // Create material
      const material = getMaterial('contact-panel', () => new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95
      }));
      
      // Create panel mesh
      const geometry = getGeometry('contact-panel', () => new THREE.PlaneGeometry(4, 3));
      const panel = new THREE.Mesh(geometry, material);
      
      // Position and add to scene
      panel.position.set(0, 2, -1);
      scene.add(panel);
      
      return panel;
    })();
    
    // Create floating social media icons
    const createSocialIcon = (type: string, position: THREE.Vector3) => {
      const texture = createCanvasTexture(
        `icon-${type}`,
        256,
        256,
        (context) => {
          // Background
          context.fillStyle = '#2a5f7a';
          context.beginPath();
          context.arc(128, 128, 120, 0, Math.PI * 2);
          context.fill();
          
          // Border
          context.strokeStyle = '#5da9e9';
          context.lineWidth = 8;
          context.stroke();
          
          // Icon text (simplified)
          context.fillStyle = '#ffffff';
          context.font = 'bold 100px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          // Show first letter as icon
          context.fillText(type.charAt(0).toUpperCase(), 128, 128);
        }
      );
      
      const material = getMaterial(`icon-${type}`, () => new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9
      }));
      
      const geometry = getGeometry('social-icon', () => new THREE.CircleGeometry(0.4, 32));
      const icon = new THREE.Mesh(geometry, material);
      
      icon.position.copy(position);
      scene.add(icon);
      
      return icon;
    };
    
    // Create social media icons in a semicircle around the panel
    const emailIcon = createSocialIcon('email', new THREE.Vector3(-3, 2, 0));
    const linkedinIcon = createSocialIcon('linkedin', new THREE.Vector3(-2, 3, 0));
    const githubIcon = createSocialIcon('github', new THREE.Vector3(2, 3, 0));
    
    // Create floating particles around icons for effect
    const createIconParticles = (icon: THREE.Mesh, color: number) => {
      const particleCount = 30;
      const geometry = getGeometry(`particles-${color.toString(16)}`, () => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const radius = 0.5 + Math.random() * 0.2;
          
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.sin(angle) * radius;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
      });
      
      const material = getMaterial(`particles-${color.toString(16)}`, () => new THREE.PointsMaterial({
        color: color,
        size: 0.03,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      }));
      
      const iconParticles = new THREE.Points(geometry, material);
      iconParticles.position.copy(icon.position);
      scene.add(iconParticles);
      
      return iconParticles;
    };
    
    const emailParticles = createIconParticles(emailIcon, 0xff6347); // Tomato
    const linkedinParticles = createIconParticles(linkedinIcon, 0x4682b4); // Steel blue
    const githubParticles = createIconParticles(githubIcon, 0x9370db); // Medium purple
    
    // Animation loop with frame skipping for better performance
    let frameCount = 0;
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      
      frameCount++;
      
      // Update controls every frame (essential)
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Limit intensive animations to every 2nd or 3rd frame
      if (frameCount % 3 === 0) {
        // Animate background particles (slow rotation)
        particles.rotation.y += 0.0005;
        
        // Animate the contact panel (subtle floating)
        contactPanel.position.y = 2 + Math.sin(Date.now() * 0.0008) * 0.05;
        
        // Animate icons
        const time = Date.now() * 0.001;
        emailIcon.rotation.z = Math.sin(time * 0.5) * 0.1;
        linkedinIcon.rotation.z = Math.sin(time * 0.5 + 1) * 0.1;
        githubIcon.rotation.z = Math.sin(time * 0.5 + 2) * 0.1;
        
        // Animate particles around icons
        emailParticles.rotation.z += 0.01;
        linkedinParticles.rotation.z -= 0.01;
        githubParticles.rotation.z += 0.015;
      }
      
      // Render scene every frame
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Simulate loading progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(progressInterval);
        progress = 100;
        setTimeout(() => setIsLoading(false), 100);
      }
      setLoadingProgress(progress);
    }, 80);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (container && rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      clearInterval(progressInterval);
      
      // Dispose of resources efficiently
      resourcesRef.current.geometries.forEach(geometry => geometry.dispose());
      resourcesRef.current.materials.forEach(material => material.dispose());
      resourcesRef.current.textures.forEach(texture => texture.dispose());
      
      // Clear caches
      resourcesRef.current.geometries.clear();
      resourcesRef.current.materials.clear();
      resourcesRef.current.textures.clear();
      
      // Dispose of renderer
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, [navigate, createCanvasTexture, getGeometry, getMaterial, handleResize]);
  
  return (
    <div className="contact-scene">
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-title">Loading Contact Environment</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(loadingProgress)}%</div>
          </div>
        </div>
      )}
      
      {/* Back button */}
      <BackButton onClick={handleBack} />
      
      {/* Profile image overlay that will be displayed on top of the 3D scene */}
      {!isLoading && (
        <div className="profile-image-container">
          <img 
            src="/path/to/your/image.jpg" 
            alt="Shahar Maoz"
            className="profile-image"
          />
        </div>
      )}
      
      {/* Optional contact form overlay */}
      {!isLoading && (
        <div className="contact-form-container">
          <button className="contact-button">Send Message</button>
        </div>
      )}
      
      {/* Three.js container */}
      <div ref={containerRef} className="canvas-container" />
    </div>
  );
}