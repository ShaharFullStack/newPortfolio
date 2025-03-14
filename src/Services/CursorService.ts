export class CursorService {
  private cursor: HTMLDivElement;
  private cursorDot: HTMLDivElement;
  private animationFrame: number | null = null;
  private lastMousePosition = { x: 0, y: 0 };
  private dotPosition = { x: 0, y: 0 };
  private isEnabled: boolean = true;
  private mouseMoveThrottle: number = 0;
  private throttleInterval: number = 16; // Roughly 60fps

  constructor() {
    this.cursor = document.createElement('div');
    this.cursorDot = document.createElement('div');
  }

  public initialize() {
    // Create and append cursor elements
    this.cursor.classList.add('cursor');
    this.cursorDot.classList.add('cursor-dot');
    
    document.body.appendChild(this.cursor);
    document.body.appendChild(this.cursorDot);
    
    // Initial positioning
    this.cursor.style.width = '20px';
    this.cursor.style.height = '20px';
    this.cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    this.cursor.style.transform = 'translate(-50%, -50%)';
    this.cursorDot.style.transform = 'translate(-50%, -50%)';
    
    // Optimize cursor movement with requestAnimationFrame
    const updateCursorPosition = () => {
      // Update main cursor immediately
      this.cursor.style.left = `${this.lastMousePosition.x}px`;
      this.cursor.style.top = `${this.lastMousePosition.y}px`;
      
      // Apply easing to dot movement for smooth trailing effect
      this.dotPosition.x += (this.lastMousePosition.x - this.dotPosition.x) * 0.2;
      this.dotPosition.y += (this.lastMousePosition.y - this.dotPosition.y) * 0.2;
      
      this.cursorDot.style.left = `${this.dotPosition.x}px`;
      this.cursorDot.style.top = `${this.dotPosition.y}px`;
      
      this.animationFrame = requestAnimationFrame(updateCursorPosition);
    };
    
    // Start animation loop
    this.animationFrame = requestAnimationFrame(updateCursorPosition);
    
    // Update mouse position on mouse move with throttling
    document.addEventListener('mousemove', (e) => {
      if (!this.isEnabled) return;
      
      // Throttle updates to prevent excessive processing
      const now = performance.now();
      if (now - this.mouseMoveThrottle < this.throttleInterval) return;
      this.mouseMoveThrottle = now;
      
      this.lastMousePosition.x = e.clientX;
      this.lastMousePosition.y = e.clientY;
    });
    
    // Expand cursor on clickable elements with delegated event handling
    document.addEventListener('mouseover', (e) => {
      if (!this.isEnabled) return;
      const target = e.target as HTMLElement;
      
      if (this.isClickableElement(target)) {
        this.expandCursor();
      }
    });
    
    // Return cursor to normal size with delegated event handling
    document.addEventListener('mouseout', (e) => {
      if (!this.isEnabled) return;
      const target = e.target as HTMLElement;
      
      if (this.isClickableElement(target)) {
        this.shrinkCursor();
      }
    });
    
    // Add click animation
    document.addEventListener('mousedown', () => {
      if (!this.isEnabled) return;
      this.cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
      this.cursorDot.style.transform = 'translate(-50%, -50%) scale(0.7)';
    });
    
    document.addEventListener('mouseup', () => {
      if (!this.isEnabled) return;
      this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    
    // Add sparkle effect on click with debouncing
    let lastSparkleTime = 0;
    const sparkleThrottle = 100; // Limit sparkle creation to every 100ms
    
    document.addEventListener('click', (e) => {
      if (!this.isEnabled) return;
      
      const now = performance.now();
      if (now - lastSparkleTime < sparkleThrottle) return;
      lastSparkleTime = now;
      
      this.createSparkle(e.clientX, e.clientY);
    });
    
    // Add keyboard accessibility - pressing Escape will toggle the custom cursor
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleCursor();
      }
    });
    
    // Check if cursor is visible when window regains focus
    window.addEventListener('focus', () => {
      if (this.isEnabled) {
        document.body.style.cursor = 'none';
      }
    });
  }
  
  // Helper to check if element is clickable
  private isClickableElement(element: HTMLElement): boolean {
    return (
      element.tagName === 'BUTTON' || 
      element.tagName === 'A' || 
      element.classList.contains('section-indicator') ||
      element.classList.contains('navigation-instructions') ||
      element.classList.contains('nav-button')
    );
  }
  
  // Expand cursor for interactive elements
  private expandCursor() {
    this.cursor.style.width = '40px';
    this.cursor.style.height = '40px';
    this.cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    // Add smooth transition
    this.cursor.style.transition = 'width 0.2s, height 0.2s, background-color 0.2s';
  }
  
  // Shrink cursor back to normal
  private shrinkCursor() {
    this.cursor.style.width = '20px';
    this.cursor.style.height = '20px';
    this.cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    // Add smooth transition
    this.cursor.style.transition = 'width 0.2s, height 0.2s, background-color 0.2s';
  }
  
  // Toggle custom cursor on/off
  public toggleCursor() {
    this.isEnabled = !this.isEnabled;
    
    if (this.isEnabled) {
      document.body.style.cursor = 'none';
      this.cursor.style.display = 'block';
      this.cursorDot.style.display = 'block';
    } else {
      document.body.style.cursor = 'auto';
      this.cursor.style.display = 'none';
      this.cursorDot.style.display = 'none';
    }
  }

  // Method to create multiple sparkles for a more impressive effect
  private createSparkle(x: number, y: number) {
    const sparkleCount = 5;
    const maxOffset = 10;
    
    // Create multiple sparkles with staggered timing for more natural effect
    for (let i = 0; i < sparkleCount; i++) {
      // Stagger sparkle creation by a few milliseconds
      setTimeout(() => {
        this.createSingleSparkle(
          x + (Math.random() * maxOffset * 2 - maxOffset), 
          y + (Math.random() * maxOffset * 2 - maxOffset),
          300 + Math.random() * 500 // Random duration between 300ms and 800ms
        );
      }, i * 20); // Stagger by 20ms each
    }
  }
  
  // Create a single sparkle element with optimized rendering
  private createSingleSparkle(x: number, y: number, duration: number) {
    const sparkle = document.createElement('div');
    sparkle.style.position = 'fixed';
    sparkle.style.width = '5px';
    sparkle.style.height = '5px';
    sparkle.style.borderRadius = '50%';
    sparkle.style.backgroundColor = 'white';
    sparkle.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.8)';
    sparkle.style.zIndex = '999';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.transform = 'translate(-50%, -50%)';
    sparkle.style.willChange = 'transform, opacity'; // Optimize for animation performance
    
    document.body.appendChild(sparkle);
    
    // Animate sparkle with Web Animations API for better performance
    const sparkleAnimation = sparkle.animate([
      { opacity: 1, transform: 'translate(-50%, -50%) scale(0)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(10)' }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)'
    });
    
    // Remove sparkle after animation
    sparkleAnimation.onfinish = () => {
      if (document.body.contains(sparkle)) {
        document.body.removeChild(sparkle);
      }
    };
  }
  
  // Clean up method to remove event listeners and elements
  public destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (document.body.contains(this.cursor)) {
      document.body.removeChild(this.cursor);
    }
    
    if (document.body.contains(this.cursorDot)) {
      document.body.removeChild(this.cursorDot);
    }
    
    document.body.style.cursor = 'auto';
  }
}

// Creating a singleton instance of the service
export const cursorService = new CursorService();