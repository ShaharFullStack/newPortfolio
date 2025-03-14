import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './AboutScene.css';
import { BackButton } from '../../UI/BackButton/BackButton';

// Define interfaces for typed content
interface SkillCategory {
  category: string;
  items: string[];
}

interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
}

interface AboutContent {
  name: string;
  title: string;
  bio: string;
  tagline: string;
  skills: SkillCategory[];
  experience: Experience[];
  education: Education[];
  topSkills: string[];
}

export function AboutScene(): JSX.Element {
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
  
  // About content - updated with CV information
  const aboutContent: AboutContent = {
    name: "Shahar Maoz",
    title: "Full Stack Developer",
    tagline: "Crafting software | Composing melodies | Painting ideas",
    bio: "Full Stack Developer combining creativity and technology. With over 15 years as a musician and educator, I bring a unique perspective to software development, blending technical expertise with artistic thinking. Skilled in JavaScript, TypeScript, React, Node.js, SQL, Docker, and AI technologies like machine learning and generative AI, I focus on building innovative, user-friendly solutions. My background in teaching sharpens my ability to collaborate effectively and explain complex ideas clearly.",
    topSkills: ["ChatGPT", "Remote Work", "Artificial Intelligence (AI)"],
    skills: [
      { 
        category: "Development", 
        items: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Cloud", "AI"]
      },
      { 
        category: "Music & Education", 
        items: ["Guitar Teaching", "Ensemble Direction", "Curriculum Development", "Special Needs Education"] 
      },
      { 
        category: "Tools & Technologies", 
        items: ["SQL", "Docker", "Git", "Machine Learning", "Generative AI"] 
      }
    ],
    experience: [
      {
        role: "Full Stack Developer",
        company: "Freelance",
        period: "February 2023 - Present",
        description: "Developing with JavaScript, TypeScript, Node.js, React, Python, Cloud, and AI technologies"
      },
      {
        role: "Principal CEO",
        company: "Maozduo",
        period: "June 2020 - Present",
        description: "Leading a musical duo with performances, instruction, and workshops. Combining professional musicianship with business management."
      },
      {
        role: "Music Teacher",
        company: "A.D Gordon Elementary school, Izhak Shamir Elementary",
        period: "September 2017 - February 2022",
        description: "Cultivated a unique teaching approach to inspire connections between children and music. Conducted a choir of 200 children in a prestigious performance attended by the President of Israel."
      },
      {
        role: "Department Manager, Guitar Teacher and Band Instructor",
        company: "Conservatory Of Music Hod Hasharon",
        period: "September 2017 - 2019",
        description: "Founded and managed the Rock-Pop Department, instructing student bands and teaching guitar, bass, improvisation, and music theory."
      }
    ],
    education: [
      {
        degree: "Computer Programming",
        institution: "John Bryce",
        year: "June 2024 - December 2024"
      },
      {
        degree: "Guitar",
        institution: "The Jerusalem Academy of Music and Dance",
        year: ""
      },
      {
        degree: "Psychology",
        institution: "The Open University of Israel",
        year: ""
      }
    ]
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
    
    // Setup environment - purple theme reflecting creativity and technology
    scene.background = new THREE.Color(0x2a0a3a);
    scene.fog = new THREE.Fog(0x2a0a3a, 8, 20);
    
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
    
    // Lighting setup with reduced complexity
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Main light with optimized shadow settings
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024; // Reduced from 2048
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 30;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);
    
    // Create accent lights that represent the dual tech/music background
    const purpleLight = new THREE.PointLight(0x9370DB, 2, 10); // Purple for creativity/coding
    purpleLight.position.set(-3, 2, 3);
    scene.add(purpleLight);

    const goldLight = new THREE.PointLight(0xffd700, 1.5, 10); // Gold for music
    goldLight.position.set(3, 2, 3);
    scene.add(goldLight);
    
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
    const floorGeometry = getGeometry('floor', () => new THREE.CircleGeometry(10, 32)); // Reduced segments
    const floorMaterial = getMaterial('floor', () => new THREE.MeshStandardMaterial({ 
      color: 0x331144, 
      roughness: 0.8,
      metalness: 0.2
    }));
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create background environment (stars) with optimized parameters
    const starCount = 500; // Reduced from 1000
    const starsGeometry = getGeometry('stars', () => {
      const geometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      
      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const radius = 15 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = radius * Math.cos(phi);
        
        starSizes[i] = Math.random() * 0.1 + 0.02;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
      
      return geometry;
    });
    
    // Star material with cached instance
    const starMaterial = getMaterial('stars', () => new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    
    const stars = new THREE.Points(starsGeometry, starMaterial);
    scene.add(stars);

    // Create musical notes floating in the background to represent musical background
    const createMusicalNotes = () => {

      const notes: THREE.Sprite[] = [];
      const noteCount = 8;
      
      for (let i = 0; i < noteCount; i++) {
        // Create note geometries - alternating between quarter and eighth notes
        const noteType = i % 2 === 0 ? 'quarter' : 'eighth';
        
        const noteTexture = createCanvasTexture(
          `note-${i}`,
          128,
          128,
          (ctx) => {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 80px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Use actual musical note symbols
            ctx.fillText(noteType === 'quarter' ? '♩' : '♪', 64, 64);
          }
        );
        
        const noteMaterial = getMaterial(`note-${i}`, () => new THREE.SpriteMaterial({
          map: noteTexture,
          transparent: true,
          opacity: 0.8,
        })) as THREE.SpriteMaterial;
        
        const note = new THREE.Sprite(noteMaterial);
        
        // Position randomly in the background
        const angle = (i / noteCount) * Math.PI * 2;
        const radius = 5 + Math.random() * 3;
        note.position.set(
          Math.cos(angle) * radius,
          3 + Math.random() * 2,
          Math.sin(angle) * radius - 5
        );
        
        note.scale.set(0.5, 0.5, 0.5);
        scene.add(note);
        notes.push(note);
      }
      
      return notes;
    };    const musicalNotes = createMusicalNotes();
    
    // Create 3D panels for content with efficient canvas rendering
    const createContentPanel = (
      key: string,
      content: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, 
      width: number, 
      height: number, 
      position: { x: number; y: number; z: number }, 
      rotation: { x: number; y: number; z: number }
    ): THREE.Mesh => {
      // Create texture with caching
      const texture = createCanvasTexture(
        `panel-${key}`,
        1024,
        1024 * (height / width),
        (context) => {
          // Background
          context.fillStyle = 'rgba(30, 15, 45, 0.85)';
          context.fillRect(0, 0, context.canvas.width, context.canvas.height);
          
          // Border
          context.strokeStyle = '#a55eea';
          context.lineWidth = 8;
          context.strokeRect(8, 8, context.canvas.width - 16, context.canvas.height - 16);
          
          // Content (passed as parameter)
          content(context, context.canvas.width, context.canvas.height);
        }
      );
      
      // Create material with caching
      const material = getMaterial(`panel-${key}`, () => new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95
      }));
      
      // Create panel mesh with cached geometry
      const geometry = getGeometry(`panel-${width}-${height}`, () => new THREE.PlaneGeometry(width, height));
      const panel = new THREE.Mesh(geometry, material);
      
      // Set position and rotation
      panel.position.set(position.x, position.y, position.z);
      panel.rotation.set(rotation.x, rotation.y, rotation.z);
      
      scene.add(panel);
      
      return panel;
    };
    
    // Bio panel with efficient text rendering and updated content
    const bioPanel = createContentPanel(
      'bio',
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Header
        ctx.fillStyle = '#a55eea';
        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('About Me', width / 2, 100);
        
        // Name and title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px Arial';
        ctx.fillText(aboutContent.name, width / 2, 180);
        
        ctx.fillStyle = '#e1b0ff';
        ctx.font = '40px Arial';
        ctx.fillText(aboutContent.title, width / 2, 240);
        
        // Tagline
        ctx.fillStyle = '#ffd700'; // Gold for music reference
        ctx.font = 'italic 28px Arial';
        ctx.fillText(aboutContent.tagline, width / 2, 290);
        
        // Bio text
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'left';
        
        // Wrap text to fit width
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
          const words = text.split(' ');
          let line = '';
          let testLine = '';
          let lineCount = 0;
          
          for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, y + (lineCount * lineHeight));
              line = words[n] + ' ';
              lineCount++;
            } else {
              line = testLine;
            }
          }
          
          ctx.fillText(line, x, y + (lineCount * lineHeight));
          return lineCount + 1;
        };
        
        const bioY = wrapText(aboutContent.bio, 80, 350, width - 160, 40) * 40 + 350;
        
        // Top Skills section
        ctx.fillStyle = '#ffd700'; // Gold
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Top Skills', width / 2, bioY + 20);
        
        // Draw skill badges
        const skillsY = bioY + 80;
        const badgeWidth = 180;
        const badgeHeight = 40;
        const badgeSpacing = 30;
        
        aboutContent.topSkills.forEach((skill, index) => {
          const badgeX = width / 2 - ((aboutContent.topSkills.length - 1) * (badgeWidth + badgeSpacing)) / 2 + index * (badgeWidth + badgeSpacing);
          
          // Badge background
          ctx.fillStyle = '#a55eea';
          ctx.beginPath();
          ctx.roundRect(badgeX - badgeWidth/2, skillsY - badgeHeight/2, badgeWidth, badgeHeight, 10);
          ctx.fill();
          
          // Badge text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Arial';
          ctx.fillText(skill, badgeX, skillsY + 7);
        });
      },
      4, 4,
      { x: 0, y: 2, z: -1 },
      { x: 0, y: 0, z: 0 }
    );
    
    // Experience panel with reused context - highlighting dual career
    const experiencePanel = createContentPanel(
      'experience',
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Header
        ctx.fillStyle = '#a55eea';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Experience', width / 2, 80);
        
        ctx.textAlign = 'left';
        let expY = 150;
        
        // Current tech role highlighted
        aboutContent.experience.slice(0, 2).forEach(exp => {
          // Role and company - use gold for first tech role
          ctx.fillStyle = exp.role.includes("Full Stack") ? '#ffd700' : '#ffffff';
          ctx.font = 'bold 40px Arial';
          ctx.fillText(`${exp.role}`, 60, expY);
          
          ctx.fillStyle = '#e1b0ff';
          ctx.font = '35px Arial';
          ctx.fillText(`${exp.company} | ${exp.period}`, 60, expY + 50);
          
          // Description
          ctx.fillStyle = '#ffffff';
          ctx.font = '28px Arial';
          ctx.fillText(exp.description, 60, expY + 100);
          
          expY += 200;
        });
        
        // Divider between tech and music careers
        ctx.strokeStyle = '#a55eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, expY - 50);
        ctx.lineTo(width - 100, expY - 50);
        ctx.stroke();
        
        // Musical note symbol to represent music career
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('♪ Music Education Experience ♪', width / 2, expY);
        
        expY += 70;
        ctx.textAlign = 'left';
        
        // Music career highlights
        aboutContent.experience.slice(2, 4).forEach(exp => {
          // Create badges for years of experience
          ctx.fillStyle = '#9370DB'; // Purple
          ctx.beginPath();
          ctx.roundRect(60, expY, 50, 30, 8);
          ctx.fill();
          
          // Extract years from period
          const years = exp.period.match(/\d+/g);
          const yearText = years && years.length > 0 ? years[0] : "2";
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${yearText}y`, 85, expY + 20);
          
          // Role and company
          ctx.textAlign = 'left';
          ctx.fillStyle = '#e1b0ff';
          ctx.font = 'bold 32px Arial';
          ctx.fillText(`${exp.role}`, 130, expY + 25);
          
          // Company
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Arial';
          ctx.fillText(`${exp.company}`, 130, expY + 60);
          
          // Description preview - shortened for space
          const shortDesc = exp.description.length > 80 
            ? exp.description.substring(0, 80) + "..."
            : exp.description;
            
          ctx.fillStyle = '#cccccc';
          ctx.font = '20px Arial';
          ctx.fillText(shortDesc, 130, expY + 90);
          
          expY += 140;
        });
      },
      3.5, 4,
      { x: 4, y: 2, z: 2 },
      { x: 0, y: -Math.PI / 4, z: 0 }
    );
    
    // Create education panel on the left side
    const educationPanel = createContentPanel(
      'education',
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Header
        ctx.fillStyle = '#a55eea';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Education', width / 2, 80);
        
        ctx.textAlign = 'left';
        let eduY = 150;
        
        // Current/upcoming tech education
        const currentEdu = aboutContent.education[0];
        
        // Highlight current education with special visual
        ctx.fillStyle = '#333355';
        ctx.beginPath();
        ctx.roundRect(40, eduY - 30, width - 80, 100, 15);
        ctx.fill();
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(45, eduY - 25, width - 90, 90);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(currentEdu.degree, 60, eduY);
        
        ctx.fillStyle = '#e1b0ff';
        ctx.font = '30px Arial';
        ctx.fillText(currentEdu.institution, 60, eduY + 40);
        
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right';
        ctx.font = 'bold 24px Arial';
        ctx.fillText("In Progress", width - 60, eduY + 30);
        
        eduY += 130;
        ctx.textAlign = 'left';
        
        // Other education
        aboutContent.education.slice(1).forEach(edu => {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px Arial';
          ctx.fillText(edu.degree, 60, eduY);
          
          ctx.fillStyle = '#e1b0ff';
          ctx.font = '28px Arial';
          ctx.fillText(edu.institution, 60, eduY + 40);
          
          eduY += 100;
        });
        
        // Add skills comparison section
        eduY += 30;
        
        // Display development and music skills side by side
        const techSkills = aboutContent.skills[0];
        const musicSkills = aboutContent.skills[1];
        
        // Left side - tech skills
        ctx.fillStyle = '#a55eea';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(techSkills.category, width / 4, eduY);
        
        // Right side - music skills
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(musicSkills.category, width * 3 / 4, eduY);
        
        // Draw dividing line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, eduY + 20);
        ctx.lineTo(width / 2, eduY + 200);
        ctx.stroke();
        
        // List skills on both sides
        ctx.textAlign = 'center';
        let skillY = eduY + 50;
        
        // Find the longer skill list
        const maxSkills = Math.max(techSkills.items.length, musicSkills.items.length);
        
        for (let i = 0; i < maxSkills; i++) {
          // Left column - tech skills
          if (i < techSkills.items.length) {
            ctx.fillStyle = '#ccccff';
            ctx.font = '24px Arial';
            ctx.fillText(techSkills.items[i], width / 4, skillY);
          }
          
          // Right column - music skills
          if (i < musicSkills.items.length) {
            ctx.fillStyle = '#ffffcc';
            ctx.font = '24px Arial';
            ctx.fillText(musicSkills.items[i], width * 3 / 4, skillY);
          }
          
          skillY += 35;
        }
      },
      3, 4,
      { x: -4, y: 2, z: 2 },
      { x: 0, y: Math.PI / 4, z: 0 }
    );
    
    // Create a floating avatar/profile display
    const avatarSize = 2;
    const avatarGeometry = getGeometry('avatar', () => new THREE.CircleGeometry(avatarSize / 2, 24)); // Reduced segments
    
    // Create avatar texture with caching
    const avatarTexture = createCanvasTexture(
      'avatar',
      512,
      512,
      (context) => {
        // Draw a placeholder avatar (represents both tech and music)
        context.fillStyle = '#331144'; // Background
        context.beginPath();
        context.arc(256, 256, 250, 0, Math.PI * 2);
        context.fill();
        
        // Add a gradient border representing dual career
        const gradient = context.createLinearGradient(50, 50, 450, 450);
        gradient.addColorStop(0, '#a55eea'); // Tech (purple)
        gradient.addColorStop(1, '#ffd700'); // Music (gold)
        
        context.strokeStyle = gradient;
        context.lineWidth = 15;
        context.beginPath();
        context.arc(256, 256, 240, 0, Math.PI * 2);
        context.stroke();
        
        // Add initials
        context.fillStyle = '#ffffff';
        context.font = 'bold 200px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('SM', 256, 256);
        
        // Add tech and music icons on opposite sides
        context.font = 'bold 80px Arial';
        
        // Tech icon (code brackets) on left
        context.fillText('</>', 120, 120);
        
        // Music icon (note) on right
        context.fillText('♪', 380, 380);
      }
    );
    
    // Create avatar material with caching
    const avatarMaterial = getMaterial('avatar', () => new THREE.MeshBasicMaterial({
      map: avatarTexture,
      transparent: true,
      opacity: 0.95
    }));
    
    // Create avatar mesh
    const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);
    avatar.position.set(-1, 2, 0.5);
    avatar.rotation.y = Math.PI / 8;
    scene.add(avatar);
    
    // Create particle effect around the avatar with optimized count
    const particleCount = 50; // Reduced from 100
    const particlesGeometry = getGeometry('avatar-particles', () => {
      const geometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const radius = avatarSize / 2 + 0.1 + Math.random() * 0.3;
        
        particlePositions[i * 3] = Math.cos(theta) * radius;
        particlePositions[i * 3 + 1] = Math.sin(theta) * radius;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      return geometry;
    });
    
    // Create particle material with caching - dual-colored particles
    const particleMaterial = getMaterial('avatar-particles', () => {
      // Create array of colors alternating between purple and gold
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        if (i % 2 === 0) {
          // Purple (tech)
          colors[i3] = 0.65;
          colors[i3 + 1] = 0.37;
          colors[i3 + 2] = 0.94;
        } else {
          // Gold (music)
          colors[i3] = 1.0;
          colors[i3 + 1] = 0.84;
          colors[i3 + 2] = 0.0;
        }
      }
      
      const material = new THREE.PointsMaterial({
        size: 0.05,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        vertexColors: true
      });
      
      // Custom particles with different colors
    //   const particlesGeometry = getGeometry('avatar-particles', () => {
    //     const geometry = new THREE.BufferGeometry();
    //     const particlePositions = new Float32Array(particleCount * 3);
        
    //     for (let i = 0; i < particleCount; i++) {
    //       const theta = Math.random() * Math.PI * 2;
    //       const radius = avatarSize / 2 + 0.1 + Math.random() * 0.3;
          
    //       particlePositions[i * 3] = Math.cos(theta) * radius;
    //       particlePositions[i * 3 + 1] = Math.sin(theta) * radius;
    //       particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    //     }
        
    //     geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    //     geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    //     return geometry;
    //   });
      
      return material;
    });
    
    const avatarParticles = new THREE.Points(particlesGeometry, particleMaterial);
    avatarParticles.position.copy(avatar.position);
    avatarParticles.rotation.copy(avatar.rotation);
    scene.add(avatarParticles);
    
    // Create visual representations of dual careers (tech and music)
    const createDualCareerSymbols = () => {
      // Tech symbols - floating code blocks
      const createCodeBlock = (position: THREE.Vector3, text: string) => {
        const texture = createCanvasTexture(
          `code-${text}`,
          256,
          128,
          (ctx) => {
            // Background
            ctx.fillStyle = 'rgba(40, 44, 52, 0.9)'; // Dark code editor background
            ctx.fillRect(0, 0, 256, 128);
            
            // Border
            ctx.strokeStyle = '#a55eea';
            ctx.lineWidth = 3;
            ctx.strokeRect(3, 3, 250, 122);
            
            // Code text
            ctx.fillStyle = '#e5c07b'; // Function color
            ctx.font = '20px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('function', 20, 40);
            
            ctx.fillStyle = '#61afef'; // Function name color
            ctx.fillText(text, 90, 40);
            
            ctx.fillStyle = '#abb2bf'; // Syntax color
            ctx.fillText('() {', 90 + ctx.measureText(text).width, 40);
            
            ctx.fillStyle = '#98c379'; // String color
            ctx.fillText("  return 'Hello World';", 20, 70);
            
            ctx.fillStyle = '#abb2bf';
            ctx.fillText('}', 20, 100);
          }
        );
        
        const material = getMaterial(`code-${text}`, () => new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.8
        }));
        
        const geometry = getGeometry('code-block', () => new THREE.PlaneGeometry(1.5, 0.8));
        const codeBlock = new THREE.Mesh(geometry, material);
        
        codeBlock.position.copy(position);
        scene.add(codeBlock);
        
        return codeBlock;
      };
      
      // Music symbols - floating sheet music
      const createSheetMusic = (position: THREE.Vector3) => {
        const texture = createCanvasTexture(
          'sheet-music',
          256,
          128,
          (ctx) => {
            // Background (music sheet)
            ctx.fillStyle = 'rgba(255, 250, 240, 0.9)';
            ctx.fillRect(0, 0, 256, 128);
            
            // Border
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(3, 3, 250, 122);
            
            // Staff lines
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            
            const staffY = 30;
            const lineSpacing = 10;
            
            // Draw 5 staff lines
            for (let i = 0; i < 5; i++) {
              ctx.beginPath();
              ctx.moveTo(20, staffY + i * lineSpacing);
              ctx.lineTo(236, staffY + i * lineSpacing);
              ctx.stroke();
            }
            
            const staffY2 = 90;
            
            // Draw second staff
            for (let i = 0; i < 5; i++) {
              ctx.beginPath();
              ctx.moveTo(20, staffY2 + i * lineSpacing);
              ctx.lineTo(236, staffY2 + i * lineSpacing);
              ctx.stroke();
            }
            
            // Draw treble clef
            ctx.fillStyle = '#000000';
            ctx.font = '40px serif';
            ctx.fillText('𝄞', 20, staffY + 30);
            ctx.fillText('𝄞', 20, staffY2 + 30);
            
            // Draw time signature
            ctx.font = '28px serif';
            ctx.fillText('4', 60, staffY + 25); 
            ctx.fillText('4', 60, staffY + 45);
            
            ctx.fillText('4', 60, staffY2 + 25); 
            ctx.fillText('4', 60, staffY2 + 45);
            
            // Draw some notes
            ctx.font = '20px serif';
            for (let i = 0; i < 5; i++) {
              ctx.fillText('♩', 90 + i * 30, staffY + 20 + (i % 3) * 10);
              ctx.fillText('♪', 90 + i * 30, staffY2 + 30 - (i % 3) * 10);
            }
          }
        );
        
        const material = getMaterial('sheet-music', () => new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.8
        }));
        
        const geometry = getGeometry('sheet-music', () => new THREE.PlaneGeometry(1.5, 0.8));
        const sheetMusic = new THREE.Mesh(geometry, material);
        
        sheetMusic.position.copy(position);
        scene.add(sheetMusic);
        
        return sheetMusic;
      };
      
      // Create tech symbols
      const codeBlock1 = createCodeBlock(new THREE.Vector3(-2.5, 3.5, -2), 'developerMode');
      const codeBlock2 = createCodeBlock(new THREE.Vector3(2, 4, -3), 'createSound');
      
      // Create music symbols
      const sheetMusic1 = createSheetMusic(new THREE.Vector3(0, 3.5, -3));
      const sheetMusic2 = createSheetMusic(new THREE.Vector3(3, 3, -2));
      
      return { codeBlocks: [codeBlock1, codeBlock2], musicSheets: [sheetMusic1, sheetMusic2] };
    };
    
    const careerSymbols = createDualCareerSymbols();
    
    // Animation loop with frame skipping for better performance
    let frameCount = 0;
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      
      frameCount++;
      
      // Update controls every frame (essential)
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Limit intensive animations to every other frame
      if (frameCount % 2 === 0) {
        // Animate background stars (slow rotation)
        stars.rotation.y += 0.0006; // Reduced rotation speed
        
        // Animate the musical notes
        musicalNotes.forEach((note, index) => {
          const time = Date.now() * 0.001;
          note.position.y += Math.sin(time + index) * 0.002;
          note.rotation.z = Math.sin(time * 0.5 + index) * 0.1;
        });
      }
      
      // Run these animations every 3 frames for better performance
      if (frameCount % 3 === 0) {
        // Animate avatar particles
        avatarParticles.rotation.z += 0.01;
      
        // Pulse the particles with reduced frequency
        const time = Date.now() * 0.0005; // Reduced time factor
        const particleMat = particleMaterial as THREE.PointsMaterial;
        particleMat.size = 0.04 + Math.sin(time * 2) * 0.02;
        
        // Animate panels (subtle floating) with reduced frequency
        bioPanel.position.y = 2 + Math.sin(Date.now() * 0.0008) * 0.05;
        experiencePanel.position.y = 2 + Math.sin(Date.now() * 0.0008 + 1) * 0.05;
        educationPanel.position.y = 2 + Math.sin(Date.now() * 0.0008 + 2) * 0.05;
        
        // Animate career symbols
        careerSymbols.codeBlocks.forEach((block, index) => {
          block.position.y += Math.sin(time * 2 + index) * 0.002;
          block.rotation.z = Math.sin(time + index) * 0.05;
        });
        
        careerSymbols.musicSheets.forEach((sheet, index) => {
          sheet.position.y += Math.sin(time * 2 + index + Math.PI) * 0.002;
          sheet.rotation.z = Math.sin(time + index + Math.PI) * 0.05;
        });
      }
      
      // Render scene every frame
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Simulate loading progress more efficiently
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10; // Faster loading (10% increments)
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
      
      // Store ref value in a variable to avoid closure issues
      const resources = resourcesRef.current;
      
      // Dispose of resources efficiently
      resources.geometries.forEach(geometry => geometry.dispose());
      resources.materials.forEach(material => material.dispose());
      resources.textures.forEach(texture => texture.dispose());
      
      // Clear caches
      resources.geometries.clear();
      resources.materials.clear();
      resources.textures.clear();
      
      // Dispose of renderer
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, createCanvasTexture, getGeometry, getMaterial]);
  
  return (
    <div className="about-scene">
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-title">Loading About Environment</div>
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
      
      {/* Three.js container */}
      <div ref={containerRef} className="canvas-container" />
    </div>
  );
};