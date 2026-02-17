import { logger } from './logger';

interface WebGLInfo {
  vendor: string;
  renderer: string;
  version: string;
  shaderVersion: string;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

// WebGL Debugger Utility
export class WebGLDebugger {
  static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl');
    } catch (error: unknown) {
      logger.debug('WebGL support check failed.', {
        error: getErrorMessage(error),
      });
      return false;
    }
  }

  static getWebGLInfo(): WebGLInfo | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');

      if (!gl) {
        return null;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      return {
        vendor: debugInfo
          ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
          : gl.getParameter(gl.VENDOR),
        renderer: debugInfo
          ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shaderVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      };
    } catch (error: unknown) {
      logger.debug('WebGL info extraction failed.', {
        error: getErrorMessage(error),
      });
      return null;
    }
  }

  static logWebGLInfo(): void {
    if (!this.checkWebGLSupport()) {
      logger.warn('WebGL is not supported on this device.');
      return;
    }

    const info = this.getWebGLInfo();
    if (info) {
      logger.info('WebGL runtime information.', { ...info });
    }
  }

  static validateShader(
    gl: WebGLRenderingContext,
    shaderSource: string,
    type: number
  ): boolean {
    const shader = gl.createShader(type);
    if (!shader) {
      return false;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      logger.error('Shader compilation failed.', {
        shaderType: type === gl.VERTEX_SHADER ? 'vertex' : 'fragment',
        error,
      });
      gl.deleteShader(shader);
      return false;
    }

    gl.deleteShader(shader);
    return true;
  }
}

// Performance monitoring for WebGL
export class WebGLPerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;

  start(): void {
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.monitor();
  }

  private monitor(): void {
    this.frameCount += 1;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastTime)
      );

      if (this.fps < 30) {
        logger.warn('Low FPS detected in WebGL performance monitor.', {
          fps: this.fps,
        });
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.monitor());
  }

  getFPS(): number {
    return this.fps;
  }
}

// Initialize WebGL debugging in development
if (typeof window !== 'undefined') {
  WebGLDebugger.logWebGLInfo();
}
