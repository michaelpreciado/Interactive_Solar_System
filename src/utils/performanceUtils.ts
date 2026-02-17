export interface PerformanceSettings {
  planetGeometryDetail: number;
  moonGeometryDetail: number;
  orbitSegments: number;
  enableAtmosphere: boolean;
  enableRings: boolean;
  enableMoonFeatures: boolean;
  enableOrbitalLights: boolean;
  enableStarfield: boolean;
  starfieldCount: number;
  shadowMapSize: number;
  enableShadows: boolean;
  maxLights: number;
  pixelRatio: number;
  enableAnimations: boolean;
  animationFrameRate: number;
  enableGlassEffects: boolean;
  enableRippleEffects: boolean;
  backdropBlurStrength: number;
}

type PerformanceTier = 'low' | 'medium' | 'high';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export interface DeviceCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  memory: number;
  cores: number;
  pixelRatio: number;
  renderer: string;
  vendor: string;
  performanceTier: PerformanceTier;
  supportsWebGL2: boolean;
}

interface Disposable {
  dispose: () => void;
}

interface ThreeLikeObject {
  geometry?: Disposable;
  material?: Disposable | Disposable[] | Record<string, unknown>;
  texture?: Disposable;
  children?: ThreeLikeObject[];
}

const DEFAULT_PERFORMANCE_SETTINGS: Record<
  PerformanceTier,
  PerformanceSettings
> = {
  low: {
    planetGeometryDetail: 16,
    moonGeometryDetail: 12,
    orbitSegments: 32,
    enableAtmosphere: false,
    enableRings: true,
    enableMoonFeatures: false,
    enableOrbitalLights: false,
    enableStarfield: true,
    starfieldCount: 1000,
    shadowMapSize: 512,
    enableShadows: false,
    maxLights: 2,
    pixelRatio: 1.5,
    enableAnimations: true,
    animationFrameRate: 30,
    enableGlassEffects: false,
    enableRippleEffects: false,
    backdropBlurStrength: 5,
  },
  medium: {
    planetGeometryDetail: 32,
    moonGeometryDetail: 20,
    orbitSegments: 64,
    enableAtmosphere: true,
    enableRings: true,
    enableMoonFeatures: true,
    enableOrbitalLights: true,
    enableStarfield: true,
    starfieldCount: 3000,
    shadowMapSize: 1024,
    enableShadows: true,
    maxLights: 4,
    pixelRatio: 2,
    enableAnimations: true,
    animationFrameRate: 60,
    enableGlassEffects: true,
    enableRippleEffects: true,
    backdropBlurStrength: 20,
  },
  high: {
    planetGeometryDetail: 64,
    moonGeometryDetail: 32,
    orbitSegments: 128,
    enableAtmosphere: true,
    enableRings: true,
    enableMoonFeatures: true,
    enableOrbitalLights: true,
    enableStarfield: true,
    starfieldCount: 5000,
    shadowMapSize: 2048,
    enableShadows: true,
    maxLights: 8,
    pixelRatio: 2,
    enableAnimations: true,
    animationFrameRate: 60,
    enableGlassEffects: true,
    enableRippleEffects: true,
    backdropBlurStrength: 25,
  },
};

export const detectDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isTablet: false,
      memory: 4,
      cores: 4,
      pixelRatio: 1,
      renderer: '',
      vendor: '',
      performanceTier: 'medium',
      supportsWebGL2: false,
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(
    userAgent
  );

  const browserNavigator = navigator as NavigatorWithMemory;
  const memory = browserNavigator.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency || 4;
  const pixelRatio = window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const webglContext = gl as WebGLRenderingContext | null;
  const renderer = webglContext
    ? String(webglContext.getParameter(webglContext.RENDERER) || '')
    : '';
  const vendor = webglContext
    ? String(webglContext.getParameter(webglContext.VENDOR) || '')
    : '';

  let performanceTier: PerformanceTier = 'medium';
  if (isMobile) {
    if (memory <= 2 || cores <= 2) {
      performanceTier = 'low';
    } else if (memory >= 6 && cores >= 6) {
      performanceTier = 'high';
    }
  } else if (memory >= 8 && cores >= 8) {
    performanceTier = 'high';
  } else if (memory <= 4 || cores <= 4) {
    performanceTier = 'low';
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isTablet,
    memory,
    cores,
    pixelRatio,
    renderer,
    vendor,
    performanceTier,
    supportsWebGL2: !!document.createElement('canvas').getContext('webgl2'),
  };
};

export const getPerformanceSettings = (): PerformanceSettings => {
  const capabilities = detectDeviceCapabilities();
  const selectedSettings =
    DEFAULT_PERFORMANCE_SETTINGS[capabilities.performanceTier];

  return {
    ...selectedSettings,
    enableAtmosphere: capabilities.isMobile
      ? false
      : selectedSettings.enableAtmosphere,
    enableShadows: capabilities.isMobile
      ? false
      : selectedSettings.enableShadows,
    enableGlassEffects: capabilities.isMobile
      ? false
      : selectedSettings.enableGlassEffects,
    enableRippleEffects: capabilities.isMobile
      ? false
      : selectedSettings.enableRippleEffects,
    backdropBlurStrength: capabilities.isMobile
      ? Math.min(selectedSettings.backdropBlurStrength, 10)
      : selectedSettings.backdropBlurStrength,
    pixelRatio: Math.min(capabilities.pixelRatio, selectedSettings.pixelRatio),
  };
};

export const createMemoryMonitor = () => {
  const memoryWarningThreshold = 0.8;

  return {
    checkMemoryUsage: (): { warning: boolean; usage: number } => {
      const browserPerformance = performance as PerformanceWithMemory;
      const memory = browserPerformance.memory;

      if (!memory || !memory.jsHeapSizeLimit) {
        return { warning: false, usage: 0 };
      }

      const usedPercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return {
        warning: usedPercent > memoryWarningThreshold,
        usage: usedPercent,
      };
    },

    triggerGarbageCollection: (): void => {
      const maybeGC = (window as Window & { gc?: () => void }).gc;
      if (typeof maybeGC === 'function') {
        maybeGC();
      }
    },
  };
};

export const createPerformanceMonitor = () => {
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;

  return {
    update: (): number => {
      frameCount += 1;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }

      return fps;
    },
    getFPS: (): number => fps,
    shouldReduceQuality: (): boolean => fps < 30,
    shouldIncreaseQuality: (): boolean => fps > 55,
  };
};

const isDisposable = (value: unknown): value is Disposable => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'dispose' in value &&
      typeof (value as Disposable).dispose === 'function'
  );
};

const disposeMaterial = (
  material: Disposable | Record<string, unknown>
): void => {
  Object.values(material).forEach((value) => {
    if (isDisposable(value)) {
      value.dispose();
    }
  });

  if (isDisposable(material)) {
    material.dispose();
  }
};

export const disposeObject3D = (
  object: ThreeLikeObject | null | undefined
): void => {
  if (!object) {
    return;
  }

  if (object.geometry && isDisposable(object.geometry)) {
    object.geometry.dispose();
  }

  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => disposeMaterial(material));
    } else {
      disposeMaterial(object.material);
    }
  }

  if (object.texture && isDisposable(object.texture)) {
    object.texture.dispose();
  }

  object.children?.forEach((child) => disposeObject3D(child));
};

export const throttle = <T extends (...args: never[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  if (limit <= 0) {
    throw new Error('throttle limit must be greater than 0 milliseconds');
  }

  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (inThrottle) {
      return;
    }

    func(...args);
    inThrottle = true;
    setTimeout(() => {
      inThrottle = false;
    }, limit);
  };
};

export const debounce = <T extends (...args: never[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  if (delay < 0) {
    throw new Error('debounce delay must be 0 or more milliseconds');
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};
