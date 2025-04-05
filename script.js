// --- Scene Setup ---
const scene = new THREE.Scene();
const canvas = document.getElementById('solar-system-canvas');

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30; // Start further back initially
camera.position.y = 10; // Look slightly down

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true, // Smoother edges
    alpha: true // Allows for transparent background
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Improve performance on high-density displays
renderer.setClearColor(0x000000, 1); // Set solid black background

// --- Lighting ---
// Soft ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft white light (Original)
scene.add(ambientLight);

// Point light (simulating the Sun)
const pointLight = new THREE.PointLight(0xffffff, 1.5, 300); // Intense white light (Original)
pointLight.position.set(0, 0, 0); // Positioned at the center (where the sun will be)
scene.add(pointLight);

// Optional: Add light helper for debugging
// const lightHelper = new THREE.PointLightHelper(pointLight);
// scene.add(lightHelper);

// --- Controls ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Adds inertia to camera movement
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // Keep panning relative to the scene origin
controls.minDistance = 5; // Prevent zooming too close
controls.maxDistance = 400; // Increase max zoom out distance - KEEP THIS ADJUSTMENT
controls.maxPolarAngle = Math.PI / 1.8; // Limit vertical rotation slightly

/* // --- Post-processing (Bloom Effect) --- Still Disabled
const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0, // strength - Reduced slightly
    0.3, // radius - Reduced slightly
    0.95 // threshold - Increased significantly to make only brighter areas bloom
);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
*/

// --- Celestial Bodies Data ---
const sunRadius = 5;
// Realistic Colors (Original)
const planetData = [
    { name: 'Mercury', radius: 0.5, distance: 10, color: 0xaaaaaa, orbitSpeed: 0.04, rotationSpeed: 0.01 },
    { name: 'Venus', radius: 0.9, distance: 15, color: 0xffe4b5, orbitSpeed: 0.025, rotationSpeed: 0.005 },
    { name: 'Earth', radius: 1, distance: 22, color: 0x6fa8dc, orbitSpeed: 0.015, rotationSpeed: 0.02 },
    { name: 'Mars', radius: 0.7, distance: 30, color: 0xff6347, orbitSpeed: 0.01, rotationSpeed: 0.018 },
    { name: 'Jupiter', radius: 3.5, distance: 50, color: 0xffd700, orbitSpeed: 0.005, rotationSpeed: 0.04 },
    { name: 'Saturn', radius: 3, distance: 70, color: 0xf4a460, orbitSpeed: 0.003, rotationSpeed: 0.035, hasRing: true },
    { name: 'Uranus', radius: 2, distance: 90, color: 0xadd8e6, orbitSpeed: 0.002, rotationSpeed: 0.025 },
    { name: 'Neptune', radius: 1.9, distance: 110, color: 0x4682b4, orbitSpeed: 0.001, rotationSpeed: 0.028 },
];

const planetMeshes = [];
const orbitContainers = [];
const orbitLines = [];

// --- Create Sun ---
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
// Use MeshBasicMaterial for the sun as it emits light
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00, wireframe: false }); // Bright yellow (Original)
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);
// Move the point light slightly away from the surface to avoid artifacts if needed
pointLight.position.set(0, 0, 0); // Keep it centered for now

// --- Create Planets, Containers, and Orbits ---
planetData.forEach(data => {
    // Planet Mesh
    const geometry = new THREE.SphereGeometry(data.radius, 32, 16);
    // Use MeshStandardMaterial for realism
    const material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8, metalness: 0.2 }); // Original settings
    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.position.x = data.distance;
    planetMesh.userData = data; // Store data for potential interactions
    planetMeshes.push(planetMesh);

    // Orbit Container (Pivot)
    const container = new THREE.Object3D();
    container.add(planetMesh);
    scene.add(container);
    orbitContainers.push(container);

    // Create Saturn's Rings
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.radius * 1.3, data.radius * 2.2, 32);
        // Standard material for rings
        const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaa6a, side: THREE.DoubleSide, roughness: 0.8 }); // Original settings
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2.2; // Tilt the rings
        // ringMesh.rotation.y = Math.PI / 5; // Optional tilt
        planetMesh.add(ringMesh); // Add ring directly to planet so it rotates with it
    }

    // Orbit Line
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * data.distance, 0, Math.sin(theta) * data.distance));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    // Subtle white orbit lines
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }); // Original settings
    const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);
});

// --- Create Background Stars ---
function addStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    const starCount = 10000; // Increased number of stars

    for (let i = 0; i < starCount; i++) {
        // Distribute stars further out and more spread out
        const x = THREE.MathUtils.randFloatSpread(2000); // Wider spread on X
        const y = THREE.MathUtils.randFloatSpread(2000); // Wider spread on Y
        const z = THREE.MathUtils.randFloatSpread(2000); // Wider spread on Z
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff, // White stars (Original)
        size: 0.7,       // Original size
        sizeAttenuation: true // Stars further away appear smaller
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// Add the stars to the scene
addStars();

// Adjust camera start position based on new scale
camera.position.z = 150;
camera.position.y = 40;
controls.maxDistance = 400; // Increase max zoom out distance

// --- Resize Handling ---
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // composer.setSize(window.innerWidth, window.innerHeight); // Resize composer too - Temporarily Disabled
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// --- Animation Loop ---
const clock = new THREE.Clock(); // Use clock for smoother animation

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Time since last frame

    // Update controls (for damping)
    controls.update();

    // Animate planet orbits and rotations
    orbitContainers.forEach((container, index) => {
        const data = planetData[index];
        container.rotation.y += data.orbitSpeed * delta * 10; // Adjust multiplier for visible speed
    });

    planetMeshes.forEach((mesh, index) => {
        const data = planetData[index];
        mesh.rotation.y += data.rotationSpeed * delta * 10; // Adjust multiplier for visible speed
    });

    // Optional: Make sun slightly pulse or rotate?
    // sunMesh.rotation.y += 0.001;

    // Render the scene using the composer for post-processing effects
    // composer.render(); // Temporarily Disabled
    renderer.render(scene, camera); // Revert to standard renderer
}

// --- Start Animation ---
animate();

console.log("Three.js scene initialized.");
// Next steps: Create Sun and Planets 