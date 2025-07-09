use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

// Import the `console.log` function from the `console` module
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro for easier console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Enable panic hook for better error messages
#[cfg(feature = "console_error_panic_hook")]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

// Use wee_alloc as the global allocator for smaller WASM binary
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// 3D Vector structure
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct Vec3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[wasm_bindgen]
impl Vec3 {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Vec3 {
        Vec3 { x, y, z }
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f64 {
        self.x
    }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.y
    }

    #[wasm_bindgen(getter)]
    pub fn z(&self) -> f64 {
        self.z
    }

    pub fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
}

// Planet data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct PlanetData {
    name: String,
    position: Vec3,
    radius: f64,
    color: String,
    orbit_radius: f64,
    orbit_speed: f64,
    axial_tilt: f64,
    day_length: f64,
    year_length: f64,
    temperature: f64,
    moons: u32,
    mass: f64,
    density: f64,
}

#[wasm_bindgen]
impl PlanetData {
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn position(&self) -> Vec3 {
        self.position
    }

    #[wasm_bindgen(getter)]
    pub fn radius(&self) -> f64 {
        self.radius
    }

    #[wasm_bindgen(getter)]
    pub fn color(&self) -> String {
        self.color.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn orbit_radius(&self) -> f64 {
        self.orbit_radius
    }

    #[wasm_bindgen(getter)]
    pub fn orbit_speed(&self) -> f64 {
        self.orbit_speed
    }

    #[wasm_bindgen(getter)]
    pub fn axial_tilt(&self) -> f64 {
        self.axial_tilt
    }

    #[wasm_bindgen(getter)]
    pub fn day_length(&self) -> f64 {
        self.day_length
    }

    #[wasm_bindgen(getter)]
    pub fn year_length(&self) -> f64 {
        self.year_length
    }

    #[wasm_bindgen(getter)]
    pub fn temperature(&self) -> f64 {
        self.temperature
    }

    #[wasm_bindgen(getter)]
    pub fn moons(&self) -> u32 {
        self.moons
    }

    #[wasm_bindgen(getter)]
    pub fn mass(&self) -> f64 {
        self.mass
    }

    #[wasm_bindgen(getter)]
    pub fn density(&self) -> f64 {
        self.density
    }
}

// Orbital elements structure for VSOP87-based calculations
#[derive(Debug, Clone, Copy)]
struct OrbitalElements {
    a: f64,      // Semi-major axis (AU)
    e: f64,      // Eccentricity
    i: f64,      // Inclination (degrees)
    omega: f64,  // Longitude of ascending node (degrees)
    w: f64,      // Argument of perihelion (degrees)
    m0: f64,     // Mean anomaly at epoch (degrees)
    n: f64,      // Mean motion (degrees/day)
}

// Planet orbital elements at J2000.0 epoch
static PLANET_ELEMENTS: &[(&str, OrbitalElements)] = &[
    ("Mercury", OrbitalElements {
        a: 0.387098, e: 0.205635, i: 7.004, omega: 48.331, w: 29.124, m0: 174.796, n: 4.0923,
    }),
    ("Venus", OrbitalElements {
        a: 0.723332, e: 0.006773, i: 3.394, omega: 76.678, w: 54.884, m0: 50.115, n: 1.6021,
    }),
    ("Earth", OrbitalElements {
        a: 1.000001, e: 0.016709, i: 0.000, omega: 0.000, w: 102.937, m0: 100.464, n: 0.9856,
    }),
    ("Mars", OrbitalElements {
        a: 1.523679, e: 0.093941, i: 1.849, omega: 49.558, w: 286.502, m0: 19.373, n: 0.5240,
    }),
    ("Jupiter", OrbitalElements {
        a: 5.204267, e: 0.048775, i: 1.303, omega: 100.464, w: 273.867, m0: 20.020, n: 0.0831,
    }),
    ("Saturn", OrbitalElements {
        a: 9.582017, e: 0.055723, i: 2.484, omega: 113.665, w: 339.392, m0: 317.020, n: 0.0334,
    }),
    ("Uranus", OrbitalElements {
        a: 19.229411, e: 0.047318, i: 0.772, omega: 74.006, w: 96.998, m0: 142.238, n: 0.0116,
    }),
    ("Neptune", OrbitalElements {
        a: 30.103658, e: 0.008678, i: 1.767, omega: 131.784, w: 272.856, m0: 256.228, n: 0.0060,
    }),
];

// Planet physical data
static PLANET_DATA: &[(&str, f64, &str, f64, f64, f64, f64, f64, u32, f64, f64)] = &[
    ("Mercury", 0.383, "#8c7853", 0.387, 0.034, 1407.6, 87.97, 340.0, 0, 0.055, 5.427),
    ("Venus", 0.949, "#ffc649", 0.723, 177.4, 5832.5, 224.7, 737.0, 0, 0.815, 5.243),
    ("Earth", 1.0, "#6b93d6", 1.0, 23.4, 24.0, 365.25, 288.0, 1, 1.0, 5.514),
    ("Mars", 0.532, "#c1440e", 1.524, 25.2, 24.6, 687.0, 210.0, 2, 0.107, 3.933),
    ("Jupiter", 11.21, "#d8ca9d", 5.204, 3.1, 9.9, 4331.0, 165.0, 79, 317.8, 1.326),
    ("Saturn", 9.45, "#fad5a5", 9.582, 26.7, 10.7, 10747.0, 134.0, 82, 95.2, 0.687),
    ("Uranus", 4.01, "#4fd0e4", 19.229, 97.8, 17.2, 30589.0, 76.0, 27, 14.5, 1.271),
    ("Neptune", 3.88, "#4b70dd", 30.104, 28.3, 16.1, 59800.0, 72.0, 14, 17.1, 1.638),
];

// Convert degrees to radians
fn deg_to_rad(degrees: f64) -> f64 {
    degrees * PI / 180.0
}

// Solve Kepler's equation for eccentric anomaly using Newton's method
fn solve_kepler(mean_anomaly: f64, eccentricity: f64) -> f64 {
    let mut e = mean_anomaly;
    for _ in 0..10 {
        let delta_e = (e - eccentricity * e.sin() - mean_anomaly) / (1.0 - eccentricity * e.cos());
        e -= delta_e;
        if delta_e.abs() < 1e-12 {
            break;
        }
    }
    e
}

// Calculate planet position from orbital elements
fn calculate_planet_position(elements: &OrbitalElements, julian_date: f64) -> Vec3 {
    let days_since_epoch = julian_date - 2451545.0; // J2000.0 epoch
    
    // Calculate mean anomaly
    let mean_anomaly = deg_to_rad(elements.m0 + elements.n * days_since_epoch);
    
    // Solve Kepler's equation for eccentric anomaly
    let eccentric_anomaly = solve_kepler(mean_anomaly, elements.e);
    
    // Calculate true anomaly
    let true_anomaly = 2.0 * ((1.0 + elements.e).sqrt() * (eccentric_anomaly / 2.0).tan())
        .atan2((1.0 - elements.e).sqrt());
    
    // Calculate distance from Sun
    let r = elements.a * (1.0 - elements.e * eccentric_anomaly.cos());
    
    // Position in orbital plane
    let x_orb = r * true_anomaly.cos();
    let y_orb = r * true_anomaly.sin();
    
    // Convert to ecliptic coordinates
    let cos_omega = deg_to_rad(elements.omega).cos();
    let sin_omega = deg_to_rad(elements.omega).sin();
    let cos_w = deg_to_rad(elements.w).cos();
    let sin_w = deg_to_rad(elements.w).sin();
    let cos_i = deg_to_rad(elements.i).cos();
    let sin_i = deg_to_rad(elements.i).sin();
    
    let x = (cos_omega * cos_w - sin_omega * sin_w * cos_i) * x_orb
        + (-cos_omega * sin_w - sin_omega * cos_w * cos_i) * y_orb;
    
    let y = (sin_omega * cos_w + cos_omega * sin_w * cos_i) * x_orb
        + (-sin_omega * sin_w + cos_omega * cos_w * cos_i) * y_orb;
    
    let z = (sin_w * sin_i) * x_orb + (cos_w * sin_i) * y_orb;
    
    // Scale for visualization
    let scale = 2.0;
    Vec3::new(x * scale, z * scale, y * scale)
}

// Main function to calculate all planet positions
#[wasm_bindgen]
pub fn planet_positions(julian_date: f64) -> Vec<PlanetData> {
    set_panic_hook();
    
    let mut planets = Vec::new();
    
    for (i, (name, elements)) in PLANET_ELEMENTS.iter().enumerate() {
        let position = calculate_planet_position(elements, julian_date);
        let (_, radius, color, orbit_radius, axial_tilt, day_length, year_length, temperature, moons, mass, density) = PLANET_DATA[i];
        
        let planet = PlanetData {
            name: name.to_string(),
            position,
            radius,
            color: color.to_string(),
            orbit_radius,
            orbit_speed: 365.25 / year_length, // Speed relative to Earth
            axial_tilt,
            day_length,
            year_length,
            temperature,
            moons,
            mass,
            density,
        };
        
        planets.push(planet);
    }
    
    planets
}

// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn main() {
    set_panic_hook();
    console_log!("Solar System WASM module initialized");
} 