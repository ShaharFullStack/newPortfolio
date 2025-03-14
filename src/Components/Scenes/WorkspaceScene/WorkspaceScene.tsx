import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BackButton } from '../../UI/BackButton/BackButton';
import './WorkspaceScene.css';

interface ProjectData {
    id: number;
    title: string;
    description: string;
    technologies: string[];
    image?: string;
    link: string;
    position: { x: number; y: number; z: number };
}

interface ProjectDisplay {
    display: THREE.Mesh;
    label: THREE.Mesh;
    project: ProjectData;
}

export function WorkspaceScene(): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);

    // Refs for Three.js objects
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const projectDisplaysRef = useRef<ProjectDisplay[]>([]);
    const mouseRef = useRef(new THREE.Vector2());

    // Updated project data with the repositories
    const projects = useMemo<ProjectData[]>(() => [
        {
            id: 1,
            title: "3D Flight Simulator",
            description: "An immersive flight simulator built with Three.js featuring realistic physics, terrain rendering, and aircraft controls.",
            technologies: ["Three.js", "JavaScript", "WebGL", "Physics Engine"],
            link: "https://github.com/ShaharFullStack/3DFlightSimulator",
            position: { x: -1.5, y: 0.5, z: -0.8 }
        },
        {
            id: 2,
            title: "Balloon Game",
            description: "A fun arcade-style game where players control a balloon through various obstacles and challenges.",
            technologies: ["JavaScript", "Canvas API", "HTML5", "CSS3"],
            link: "https://github.com/ShaharFullStack/BalloonGame",
            position: { x: 0, y: 0.5, z: -1 }
        },
        {
            id: 3,
            title: "Gui Tab",
            description: "A modern, customizable tab component library for building intuitive user interfaces.",
            technologies: ["React", "TypeScript", "CSS-in-JS", "Storybook"],
            link: "https://github.com/ShaharFullStack/GuiTab",
            position: { x: 1.5, y: 0.5, z: -0.8 }
        },
        {
            id: 4,
            title: "Vacation Management",
            description: "A comprehensive system for managing employee vacations, time-off requests, and team availability.",
            technologies: ["React", "Node.js", "MongoDB", "Express"],
            link: "https://github.com/ShaharFullStack/vacation-management",
            position: { x: 0, y: 0.5, z: -2 }
        }
    ], []);

    // Cache for textures and geometries
    const geometryCache = useRef<Map<string, THREE.BufferGeometry>>(new Map());
    const materialCache = useRef<Map<string, THREE.Material>>(new Map());
    const textureCache = useRef<Map<string, THREE.Texture>>(new Map());

    // Handle mouse move with throttling
    const lastMouseMoveTime = useRef(0);
    const onMouseMove = useCallback((event: MouseEvent) => {
        // Throttle to max 60fps (16.7ms)
        const now = performance.now();
        if (now - lastMouseMoveTime.current < 16.7) return;
        lastMouseMoveTime.current = now;

        // Calculate mouse position in normalized device coordinates
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, []);

    // Handle mouse click
    const onMouseClick = useCallback(() => {
        if (isLoading || !sceneRef.current || !cameraRef.current) return;

        // Create raycaster on demand rather than storing as a ref
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouseRef.current, cameraRef.current);

        // Get all objects that intersect with the ray
        const projectDisplays = projectDisplaysRef.current;
        const allDisplays = projectDisplays.map(item => item.display);
        const allLabels = projectDisplays.map(item => item.label);
        const intersects = raycaster.intersectObjects([...allDisplays, ...allLabels], false);

        if (intersects.length > 0) {
            // Find the project associated with the clicked object
            const projectId = intersects[0].object.userData.projectId as number;
            const project = projects.find(p => p.id === projectId);

            if (project) {
                setActiveProject(project);
            }
        } else {
            // If clicked elsewhere, close active project
            setActiveProject(null);
        }
    }, [isLoading, projects]);

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

    // Handle back button
    const handleBack = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // Create canvas texture utility function
    const createCanvasTexture = useCallback((
        width: number, 
        height: number, 
        drawFunction: (ctx: CanvasRenderingContext2D) => void
    ): THREE.Texture => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        if (context) {
            drawFunction(context);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
        
        // Fallback empty texture if context creation fails
        return new THREE.Texture();
    }, []);

    // Get or create cached geometry
    const getGeometry = useCallback((key: string, createFunc: () => THREE.BufferGeometry): THREE.BufferGeometry => {
        if (!geometryCache.current.has(key)) {
            geometryCache.current.set(key, createFunc());
        }
        return geometryCache.current.get(key)!;
    }, []);

    // Get or create cached material
    const getMaterial = useCallback((key: string, createFunc: () => THREE.Material): THREE.Material => {
        if (!materialCache.current.has(key)) {
            materialCache.current.set(key, createFunc());
        }
        return materialCache.current.get(key)!;
    }, []);

    useEffect(() => {
        // Store a reference to container to avoid React hook issues
        const container = containerRef.current;
        if (!container) return;

        // Initialize scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Subtle ambient lighting for the entire scene
        scene.background = new THREE.Color(0x111827);
        scene.fog = new THREE.Fog(0x111827, 5, 20);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        camera.position.set(0, 9.7, 3);
        cameraRef.current = camera;

        // Renderer with optimized settings
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap; // Less intensive shadow map
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        // Lighting setup - reduced complexity
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Main directional light with optimized shadow settings
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 512; // Reduced for performance
        mainLight.shadow.mapSize.height = 512;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 30;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        scene.add(mainLight);

        // Add some accent lights around the workspace - use fewer lights
        const accentLight = new THREE.PointLight(0x6495ED, 1, 8);
        accentLight.position.set(0, 2, -1);
        scene.add(accentLight);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.5;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 10;
        controls.maxPolarAngle = Math.PI / 2;
        controlsRef.current = controls;

        // Create cached geometries and materials
        const floorGeometry = getGeometry('floor', () => new THREE.PlaneGeometry(50, 50));
        const floorMaterial = getMaterial('floor', () => new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        }));
        
        const deskGeometry = getGeometry('desk', () => new THREE.BoxGeometry(4, 0.1, 2));
        const deskMaterial = getMaterial('desk', () => new THREE.MeshStandardMaterial({
            color: 0x5c4033,
            roughness: 0.7,
            metalness: 0.2
        }));
        
        const legGeometry = getGeometry('leg', () => new THREE.BoxGeometry(0.1, 0.8, 0.1));
        const legMaterial = getMaterial('leg', () => new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.5,
            metalness: 0.7
        }));

        // Create a simple floor
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Create a desk
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.y = 0.8;
        desk.position.z = -1;
        desk.receiveShadow = true;
        desk.castShadow = true;
        scene.add(desk);

        // Create desk legs with instance reuse
        const createLeg = (x: number, z: number) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.4, z);
            leg.castShadow = true;
            scene.add(leg);
            return leg;
        };

        // Create the four legs
        createLeg(-1.9, -0.1);
        createLeg(1.9, -0.1);
        createLeg(-1.9, -1.9);
        createLeg(1.9, -1.9);

        // Computer monitor geometries and materials
        const monitorBaseGeometry = getGeometry('monitorBase', () => new THREE.BoxGeometry(0.4, 0.05, 0.3));
        const monitorStandGeometry = getGeometry('monitorStand', () => new THREE.BoxGeometry(0.05, 0.4, 0.05));
        const monitorScreenGeometry = getGeometry('monitorScreen', () => new THREE.BoxGeometry(1.2, 0.7, 0.05));

        const monitorMaterial = getMaterial('monitor', () => new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.2,
            metalness: 0.8
        }));

        const screenMaterial = getMaterial('screen', () => new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x222222,
            emissiveIntensity: 0.2
        }));

        // Monitor base
        const monitorBase = new THREE.Mesh(monitorBaseGeometry, monitorMaterial);
        monitorBase.position.set(0, 0.875, -1.5);
        monitorBase.castShadow = true;
        scene.add(monitorBase);

        // Monitor stand
        const monitorStand = new THREE.Mesh(monitorStandGeometry, monitorMaterial);
        monitorStand.position.set(0, 1.1, -1.5);
        monitorStand.castShadow = true;
        scene.add(monitorStand);

        // Monitor screen
        const monitorScreen = new THREE.Mesh(monitorScreenGeometry, screenMaterial);
        monitorScreen.position.set(0, 1.4, -1.5);
        monitorScreen.castShadow = true;
        scene.add(monitorScreen);

        // Project display geometry and material with instancing
        const displayGeometry = getGeometry('projectDisplay', () => new THREE.BoxGeometry(1, 1, 0.05));
        const displayMaterial = getMaterial('projectDisplay', () => new THREE.MeshStandardMaterial({
            color: 0x2a3a4a,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x1a2a3a,
            emissiveIntensity: 0.3
        }));
        
        const labelGeometry = getGeometry('projectLabel', () => new THREE.PlaneGeometry(0.9, 0.45));

        // Create floating project displays
        const projectDisplays: ProjectDisplay[] = [];

        projects.forEach(project => {
            // Create a "floating display" for each project
            const display = new THREE.Mesh(displayGeometry, displayMaterial);
            display.position.set(
                project.position.x,
                project.position.y + 5.2,
                project.position.z
            );
            display.userData = { projectId: project.id };
            display.castShadow = true;
            scene.add(display);

            // Create texture for label once and reuse
            const labelTexture = createCanvasTexture(512, 512, (context) => {
                // Create text for the project title
                context.fillStyle = '#ffffff';
                context.font = 'bold 36px Arial';
                context.textAlign = 'center';
                context.fillText(project.title, 256, 50);

                // Add a preview image placeholder
                context.fillStyle = '#333344';
                context.fillRect(128, 70, 256, 128);

                context.fillStyle = '#aaaaff';
                context.font = '20px Arial';
                context.fillText('Project Preview', 256, 130);
            });
            
            // Store texture in cache for cleanup
            textureCache.current.set(`label-${project.id}`, labelTexture);

            // Create a material using the texture
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: labelTexture,
                transparent: true,
                opacity: 0.9
            });
            materialCache.current.set(`label-${project.id}`, labelMaterial);

            // Create label mesh
            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            label.position.set(
                project.position.x,
                project.position.y + 1.2,
                project.position.z + 0.03
            );
            label.userData = { projectId: project.id };
            scene.add(label);

            // Store reference to the display
            projectDisplays.push({ display, label, project });
        });

        // Store project displays for interaction
        projectDisplaysRef.current = projectDisplays;

        // Set up event listeners
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', onMouseClick);
        window.addEventListener('resize', handleResize);

        // Animation loop with optimized update frequencies
        let lastUpdate = 0;
        const animationInterval = 1000 / 60; // Target 60fps
        
        const animate = (time: number) => {
            animationFrameId.current = requestAnimationFrame(animate);
            
            // Limit update frequency
            if (time - lastUpdate < animationInterval) return;
            lastUpdate = time;
            
            // Update controls
            if (controlsRef.current) {
                controlsRef.current.update();
            }

            // Optimize by using time-based animation with lower frequency updates
            // Only animate every other frame to improve performance
            if (Math.floor(time / 30) % 2 === 0) {
                // Animate project displays (gentle floating) with optimized calculations
                projectDisplays.forEach((item, index) => {
                    const time = Date.now() * 0.005; // Reduced frequency
                    const offsetY = Math.sin(time + index) * 0.05;
    
                    // Apply floating animation
                    item.display.position.y = item.project.position.y + 1.2 + offsetY;
                    item.label.position.y = item.project.position.y + 1.2 + offsetY;
    
                    // Rotate slightly for a nicer effect
                    item.display.rotation.y = Math.sin(time * 0.5 + index) * 0.1;
                    item.label.rotation.y = Math.sin(time * 0.5 + index) * 0.1;
                });
            }

            // Render scene
            renderer.render(scene, camera);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        // Simulate loading progress more efficiently
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10; // Faster loading
            if (progress >= 100) {
                clearInterval(progressInterval);
                progress = 100;
                setIsLoading(false);
            }
            setLoadingProgress(progress);
        }, 80);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onMouseClick);
            window.removeEventListener('resize', handleResize);

            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }

            if (container && rendererRef.current) {
                container.removeChild(rendererRef.current.domElement);
            }

            clearInterval(progressInterval);

            // Dispose of resources efficiently
            geometryCache.current.forEach(geometry => geometry.dispose());
            materialCache.current.forEach(material => material.dispose());
            textureCache.current.forEach(texture => texture.dispose());
            
            // Clear caches
            geometryCache.current.clear();
            materialCache.current.clear();
            textureCache.current.clear();

            // Dispose of renderer
            rendererRef.current?.dispose();
            if (controlsRef.current) {
                controlsRef.current.dispose();
            }
        };
    }, [
        projects, 
        onMouseMove, 
        onMouseClick, 
        handleResize, 
        getGeometry, 
        getMaterial,
        createCanvasTexture
    ]);

    return (
        <div className="workspace-scene">
            {/* Loading overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <div className="loading-title">Loading Workspace</div>
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

            {/* Project details panel */}
            {activeProject && (
                <div className="project-panel">
                    <button
                        className="close-button"
                        onClick={() => setActiveProject(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="project-title">{activeProject.title}</h2>

                    <div className="project-preview">
                        <div className="preview-placeholder">
                            <span className="preview-text">Project Preview</span>
                        </div>
                    </div>

                    <div className="project-description">
                        <h3 className="section-title">Description</h3>
                        <p className="description-text">{activeProject.description}</p>
                    </div>

                    <div className="project-technologies">
                        <h3 className="section-title">Technologies</h3>
                        <div className="technology-tags">
                            {activeProject.technologies.map((tech, index) => (
                                <span
                                    key={index}
                                    className="technology-tag"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="project-links">
                        <a
                            href={activeProject.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link"
                        >
                            View Project
                        </a>
                    </div>
                </div>
            )}

            {/* Three.js container */}
            <div ref={containerRef} className="canvas-container" />
        </div>
    );
}