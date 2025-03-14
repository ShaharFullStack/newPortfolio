import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './ParticleNavigation.css';

export function ParticleNavigation(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState<string>("Home");
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const navigate = useNavigate();

  // Track if a section is being hovered
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  // Track mouse position for overall scene tilt
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Flag to track if text has been formed
  const [textFormed, setTextFormed] = useState<boolean>(false);
  // Current view index (0: Home, 1: Projects, 2: About, 3: Contact)
  const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);

  // Define the navigateCarousel function at component level so it's accessible to UI elements
  const navigateCarouselRef = useRef<(direction: 'next' | 'prev', navigateToPage?: boolean) => void>();

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.051, 1000);
    camera.position.z = 15; // Camera distance for better perspective

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Renderer with higher quality settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // Pure black background
    renderer.setPixelRatio(window.devicePixelRatio);

    // Save a reference to the container for cleanup
    const currentContainer = containerRef.current;
    
    if (currentContainer) {
      currentContainer.appendChild(renderer.domElement);
    }

    // Particles setup
    const particles: {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      targetX: number;
      targetY: number;
      targetZ: number;
      originalX: number; // Original position for returning
      originalY: number;
      originalZ: number;
      section: string | null;
      interactive: boolean;
      size: number; // Individual particle size
      baseSize: number; // Base size for scaling effects
    }[] = [];

    const numParticles = 100000; // Particle count for density

    // Create initial random particle system
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(numParticles * 3);
    const particleSizes = new Float32Array(numParticles);

    for (let i = 0; i < numParticles; i++) {
      const i3 = i * 3;
      // Initial scattered positions
      particlePositions[i3] = (Math.random() - 0.5) * 30;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 30;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 30;

      // Random particle sizes for depth effect
      const size = Math.random() * 0.06 + 0.02;
      particleSizes[i] = size;

      particles.push({
        x: particlePositions[i3],
        y: particlePositions[i3 + 1],
        z: particlePositions[i3 + 2],
        originalX: particlePositions[i3],
        originalY: particlePositions[i3 + 1],
        originalZ: particlePositions[i3 + 2],
        vx: 0,
        vy: 0,
        vz: 0,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        section: null,
        interactive: false,
        size: size,
        baseSize: size
      });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    // Create a standard PointsMaterial
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.08,
      sizeAttenuation: true,
      map: createParticleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    // Add color attribute for individual particle coloring
    const colors = new Float32Array(numParticles * 3);
    for (let i = 0; i < numParticles; i++) {
      colors[i * 3] = 1.0;     // R
      colors[i * 3 + 1] = 1.0; // G
      colors[i * 3 + 2] = 1.0; // B
    }
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    function createParticleTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d');

      if (!context) return new THREE.Texture();

      // Black background
      context.fillStyle = 'black';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw a circle
      context.beginPath();
      context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 4, 0, Math.PI * 2, false);

      // White gradient
      const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 4
      );
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      context.fillStyle = gradient;
      context.fill();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }

    // Create particle system
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Function to create text points with higher density
    const createTextPoints = (text: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const context = canvas.getContext('2d');

      if (!context) return [];

      // Clear canvas completely
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'black';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text with high contrast
      context.fillStyle = 'white';
      context.font = 'bold 100px Arial, Helvetica, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      // Make text thick with multiple passes
      for (let i = 0; i < 0.01; i++) {
        context.fillText(text, canvas.width / 2, canvas.height / 2);
      }

      // Extract points from the text with high density
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const textPoints: { x: number; y: number; z: number }[] = [];

      // Small skip value for high density
      const skip = 1;
      for (let y = 0; y < canvas.height; y += skip) {
        for (let x = 0; x < canvas.width; x += skip) {
          const i = (y * canvas.width + x) * 4;
          // Lower threshold to capture more pixels
          if (imageData.data[i] > 200) {
            // Map canvas coordinates to 3D space
            const tx = (x / canvas.width - 0.5) * 20;
            const ty = -(y / canvas.height - 0.5) * 20;
            // Less Z-variation for clearer text
            const tz = (Math.random() - 0.5) * 0.5;
            textPoints.push({ x: tx, y: ty, z: tz });
          }
        }
      }

      console.log(`Created ${textPoints.length} points for text "${text}"`);

      return textPoints;
    };

    // Create text points for navigation sections
    const homePoints = createTextPoints("Home");
    const projectsPoints = createTextPoints("Projects");
    const aboutPoints = createTextPoints("About");
    const contactPoints = createTextPoints("Contact");

    // Map section names to their points
    const sectionPoints: { [key: string]: { x: number; y: number; z: number }[] } = {
      Home: homePoints,
      Projects: projectsPoints,
      About: aboutPoints,
      Contact: contactPoints
    };

    // Section order for 3D carousel navigation
    const sectionOrder = ["Home", "Projects", "About", "Contact"];

    // Brighter colors for better visibility
    const sectionColors: { [key: string]: THREE.Color } = {
      Home: new THREE.Color(0x47A0FF),     // Bright Blue
      Projects: new THREE.Color(0x00E5BA), // Bright Teal
      About: new THREE.Color(0xB467FF),    // Bright Purple
      Contact: new THREE.Color(0xFF6B47)   // Bright Coral
    };

    // 3D positions for each section in the carousel
    const getPositionForSection = (sectionName: string, viewIndex: number) => {
      const sectionIndex = sectionOrder.indexOf(sectionName);

      // Calculate relative position in the 3D carousel (0 = front, 1 = right, 2 = back, 3 = left)
      const relativePosition = (sectionIndex - viewIndex + 4) % 4;

      switch (relativePosition) {
        case 0: // Front (center, closer to camera)
          return { x: 0, y: 0, z: 2 };
        case 1: // Right
          return { x: 20, y: 0, z: -15 };
        case 2: // Back (behind, further from camera)
          return { x: 0, y: 15, z: -20 };
        case 3: // Left
          return { x: -20, y: 0, z: -15 };
        default:
          return { x: 0, y: 0, z: 0 };
      }
    };

    // Update section centers based on current view
    const updateSectionCenters = (viewIndex: number) => {
      const centers = {
        Home: new THREE.Vector3(
          getPositionForSection("Home", viewIndex).x,
          getPositionForSection("Home", viewIndex).y,
          getPositionForSection("Home", viewIndex).z
        ),
        Projects: new THREE.Vector3(
          getPositionForSection("Projects", viewIndex).x,
          getPositionForSection("Projects", viewIndex).y,
          getPositionForSection("Projects", viewIndex).z
        ),
        About: new THREE.Vector3(
          getPositionForSection("About", viewIndex).x,
          getPositionForSection("About", viewIndex).y,
          getPositionForSection("About", viewIndex).z
        ),
        Contact: new THREE.Vector3(
          getPositionForSection("Contact", viewIndex).x,
          getPositionForSection("Contact", viewIndex).y,
          getPositionForSection("Contact", viewIndex).z
        )
      };
      return centers;
    };

    // Assign target positions for all sections in 3D carousel
    const assignTargets = (viewIndex: number) => {
      const colorAttribute = particleGeometry.attributes.color;
      const sizeAttribute = particleGeometry.attributes.size;

      console.log(`Updating 3D carousel to view index: ${viewIndex}`);

      // We're not using sectionCenters anymore, so we can remove this line
      // No need to call updateSectionCenters here since we're not using the result

      // Reset all particle section assignments
      for (let i = 0; i < numParticles; i++) {
        particles[i].section = null;
        particles[i].interactive = false;
      }

      // Distribute particles evenly across all four sections
      const particlesPerSection = Math.floor(numParticles * 0.9 / 4); // Use 90% of particles for text
      let particleIndex = 0;

      // Process each section
      sectionOrder.forEach(section => {
        const points = sectionPoints[section];
        const position = getPositionForSection(section, viewIndex);
        const sectionColor = sectionColors[section];

        // Calculate text opacity/size based on position (front = full, back = dimmer)
        const relativePosition = (sectionOrder.indexOf(section) - viewIndex + 4) % 4;
        let opacityFactor = 1.0;
        let sizeFactor = 1.0;

        switch (relativePosition) {
          case 0: // Front
            opacityFactor = 1.0;
            sizeFactor = 1.0;
            break;
          case 1: // Right
          case 3: // Left
            opacityFactor = 0.6;
            sizeFactor = 0.8;
            break;
          case 2: // Back
            opacityFactor = 0.3;
            sizeFactor = 0.6;
            break;
        }

        // Calculate how many points to use - ensure enough for visibility
        const pointsNeeded = Math.min(particlesPerSection, points.length);
        const stride = Math.max(1, Math.floor(points.length / pointsNeeded));

        // Assign particles to text positions
        for (let i = 0; i < pointsNeeded && particleIndex < numParticles; i++) {
          const pointIndex = (i * stride) % points.length;
          const point = points[pointIndex];

          particles[particleIndex].targetX = point.x + position.x;
          particles[particleIndex].targetY = point.y + position.y;
          particles[particleIndex].targetZ = point.z + position.z;
          particles[particleIndex].section = section;
          particles[particleIndex].interactive = true;

          // Base size for text particles - adjusted by section position
          const baseSize = 0.01 * sizeFactor;
          particles[particleIndex].baseSize = baseSize;
          sizeAttribute.array[particleIndex] = baseSize;

          // Set color with opacity based on position
          colorAttribute.setXYZ(
            particleIndex,
            sectionColor.r * opacityFactor,
            sectionColor.g * opacityFactor,
            sectionColor.b * opacityFactor
          );

          particleIndex++;
        }
      });

      // Fill remaining particles with background
      for (let i = particleIndex; i < numParticles; i++) {
        particles[i].targetX = (Math.random() - 0.5) * 40;
        particles[i].targetY = (Math.random() - 0.5) * 40;
        particles[i].targetZ = (Math.random() - 0.5) * 10 - 10; // Push background behind

        colorAttribute.setXYZ(i, 0.3, 0.3, 0.5); // Subtle background color

        const baseSize = 0.02 + Math.random() * 0.01; // Smaller background particles
        particles[i].baseSize = baseSize;
        sizeAttribute.array[i] = baseSize;
      }

      colorAttribute.needsUpdate = true;
      sizeAttribute.needsUpdate = true;

      // Mark text as formed
      if (!textFormed) {
        setTextFormed(true);
      }
    };

    // Initialize with all sections in 3D carousel layout
    console.log("Initial 3D carousel setup");
    assignTargets(currentViewIndex);

    // Navigation function to rotate carousel - assign to ref for access outside effect
    navigateCarouselRef.current = (direction: 'next' | 'prev') => {
      if (isTransitioning) return;

      setIsTransitioning(true);

      // Calculate new view index
      let newViewIndex = currentViewIndex;
      if (direction === 'next') {
        newViewIndex = (currentViewIndex + 1) % 4;
      } else {
        newViewIndex = (currentViewIndex - 1 + 4) % 4;
      }

      // Update current section based on what's now in front
      const newSection = sectionOrder[newViewIndex];
      setCurrentSection(newSection);
      setCurrentViewIndex(newViewIndex);

      // Add burst effect during transition
      for (let i = 0; i < numParticles; i++) {
        particles[i].vx += (Math.random() - 0.5) * 0.3;
        particles[i].vy += (Math.random() - 0.5) * 0.3;
        particles[i].vz += (Math.random() - 0.5) * 0.3;
      }

      // Update particle targets for new view
      assignTargets(newViewIndex);

      // Navigate in the app if needed
      navigate(`/${newSection.toLowerCase()}`);

      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 800);
    }

    // Animation with improved stability
    const animateParticles = () => {
      const positions = particleGeometry.attributes.position.array;

      // Stronger physics for text particles
      const textStiffness = 0.4;
      const textDamping = 0.92;
      // Gentler physics for background
      const bgStiffness = 0.1;
      const bgDamping = 0.92;

      for (let i = 0; i < numParticles; i++) {
        const i3 = i * 3;
        const particle = particles[i];

        // Different parameters based on particle type
        const isTextParticle = particle.section !== null;
        const stiffness = isTextParticle ? textStiffness : bgStiffness;
        const damping = isTextParticle ? textDamping : bgDamping;

        // Spring physics with distance limiting
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const dz = particle.targetZ - particle.z;

        // Apply spring forces with limiting to prevent overshooting
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const maxForce = 0.2; // Maximum force to prevent overshooting

        // Apply forces proportional to distance
        if (distanceSquared > 1) {
          // Calculate normalized force with limiting
          const forceMagnitude = Math.min(maxForce, stiffness * Math.sqrt(distanceSquared));
          const normalizedDx = dx / Math.sqrt(distanceSquared);
          const normalizedDy = dy / Math.sqrt(distanceSquared);
          const normalizedDz = dz / Math.sqrt(distanceSquared);

          particle.vx += normalizedDx * forceMagnitude;
          particle.vy += normalizedDy * forceMagnitude;
          particle.vz += normalizedDz * forceMagnitude;
        } else {
          // Close to target - apply direct weak force
          particle.vx += dx * stiffness * 0.5;
          particle.vy += dy * stiffness * 0.5;
          particle.vz += dz * stiffness * 0.5;
        }

        // Apply damping
        particle.vx *= damping;
        particle.vy *= damping;
        particle.vz *= damping;

        // Random jitter only for background particles
        if (!isTextParticle && Math.random() < 0.01) {
          particle.vx += (Math.random() - 0.5) * 0.001;
          particle.vy += (Math.random() - 0.5) * 0.001;
          particle.vz += (Math.random() - 0.5) * 0.001;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // Update geometry
        positions[i3] = particle.x;
        positions[i3 + 1] = particle.y;
        positions[i3 + 2] = particle.z;
      }

      particleGeometry.attributes.position.needsUpdate = true;
    };

    // Setup raycaster for interaction
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points!.threshold = 0.9; // Larger threshold for easier selection
    const mouse = new THREE.Vector2();

    // Throttle mouse move processing for performance
    let lastProcessedTime = 0;
    const throttleThreshold = 50; // Process at most every 50ms for smooth performance

    // Track horizontal mouse movement for potential navigation
    let lastMouseX = 0;
    let mouseDeltaX = 0;

    const onMouseMove = (event: MouseEvent) => {
      // Calculate normalized mouse position (always update this part)
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;

      // Calculate mouse delta X for detecting swipe direction
      mouseDeltaX = event.clientX - lastMouseX;
      lastMouseX = event.clientX;

      // Throttle heavy processing for better performance
      const now = performance.now();
      if (now - lastProcessedTime < throttleThreshold) {
        // Still update mouse position for scene tilting with reduced sensitivity
        setMousePosition({
          x: normalizedX * 0.5, // Reduced sensitivity
          y: normalizedY * 0.5
        });
        return;
      }

      lastProcessedTime = now;

      // Update mouse position for raycaster and scene tilting
      mouse.x = normalizedX;
      mouse.y = normalizedY;

      // Update mouse position state for tilting with reduced sensitivity
      setMousePosition({
        x: normalizedX * 0.5, // Reduced sensitivity
        y: normalizedY * 0.5
      });

      // Check for horizontal swipe gestures (rotate carousel but don't navigate to page)
      if (Math.abs(mouseDeltaX) > 20 && !isTransitioning && navigateCarouselRef.current) {
        if (mouseDeltaX > 0) {
          // Only rotate the 3D carousel visually, don't change pages
          const newViewIndex = (currentViewIndex - 1 + 4) % 4;
          setCurrentViewIndex(newViewIndex);
          assignTargets(newViewIndex);
        } else {
          // Only rotate the 3D carousel visually, don't change pages
          const newViewIndex = (currentViewIndex + 1) % 4;
          setCurrentViewIndex(newViewIndex);
          assignTargets(newViewIndex);
        }
        return; // Skip further processing during rotation
      }

      // Only process interactions if not transitioning
      if (textFormed && !isTransitioning) {
        // Update raycaster
        raycaster.setFromCamera(mouse, camera);

        // Find intersections
        const intersects = raycaster.intersectObject(particleSystem);

        // Determine hovered section
        let newHoveredSection: string | null = null;

        if (intersects.length > 0) {
          const index = intersects[0].index !== undefined ? intersects[0].index : 0;
          newHoveredSection = particles[index].section;
        }

        // Update hovered section if changed
        if (newHoveredSection !== hoveredSection) {
          setHoveredSection(newHoveredSection);
        }
      }
    };

    // Handle click for direct navigation to page
    const onMouseClick = () => {
      if (hoveredSection && !isTransitioning && navigateCarouselRef.current) {
        // If clicking on a section, navigate to that section's page
        const targetIndex = sectionOrder.indexOf(hoveredSection);

        if (targetIndex !== currentViewIndex) {
          // First, visually rotate to the section
          setCurrentViewIndex(targetIndex);
          setCurrentSection(hoveredSection);
          assignTargets(targetIndex);

          // Then navigate to the page
          navigate(`/${hoveredSection.toLowerCase()}`);

          // Set transitioning to prevent multiple clicks
          setIsTransitioning(true);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 800);
        } else {
          // If clicking the current section, just navigate to its page
          navigate(`/${hoveredSection.toLowerCase()}`);
        }
      }
    };

    // Handle key navigation (visual rotation only, no page navigation)
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTransitioning || !navigateCarouselRef.current) return;

      switch (event.key) {
        case 'ArrowLeft':
          navigateCarouselRef.current('prev'); // Don't navigate to page
          break;
        case 'ArrowRight':
          navigateCarouselRef.current('next'); // Don't navigate to page
          break;
        case 'Enter':
          // Navigate to the current section's page if Enter is pressed
          navigate(`/${currentSection.toLowerCase()}`);
          break;
      }
    };

    // Add event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('keydown', onKeyDown);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Animate particles
      animateParticles();

      // Tilt the system based on mouse position (with smoothing)
      const targetRotationX = -mousePosition.y * 0.05;
      const targetRotationY = mousePosition.x * 0.05;

      // Smooth dampening (5% movement toward target per frame)
      particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
      particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;

      // Gentle breathing animation
      const time = Date.now() * 0.01;
      particleSystem.rotation.z = Math.sin(time * 0.2) * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup with proper React refs handling
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onMouseClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', handleResize);

      // Proper way to handle cleanup with refs
      if (currentContainer && renderer.domElement.parentNode === currentContainer) {
        currentContainer.removeChild(renderer.domElement);
      }
    };
  }, [hoveredSection, currentSection, isTransitioning, navigate, mousePosition, textFormed, currentViewIndex]);

  return (
    <div className="particle-navigation">
      {/* Current section indicator */}
      <div className="section-indicator">
        <span className="section-label">Navigate: </span>
        <span className="section-name">{hoveredSection || currentSection}</span>
      </div>

      {/* 3D Navigation instructions */}
      <div className="navigation-instructions">
        Rotate view with arrows or mouse swipe, click on a section to navigate
      </div>

      {/* Container for Three.js */}
      <div
        ref={containerRef}
        className="canvas-container"
      />

      {/* Optional navigation controls */}
      <div className="carousel-controls">
        <button
          className="nav-button prev-button"
          onClick={() => !isTransitioning && navigateCarouselRef.current && navigateCarouselRef.current('prev')}
          aria-label="Previous section"
        >
          ‹
        </button>
        <button
          className="nav-button next-button"
          onClick={() => !isTransitioning && navigateCarouselRef.current && navigateCarouselRef.current('next')}
          aria-label="Next section"
        >
          ›
        </button>
      </div>
    </div>
  );
}