// Modern connecting dots animation using ES6+ features
class ConnectingDots {
    constructor(containerId = 'connecting-dots', canvasId = 'canvas') {
      // Configuration options
      this.config = {
        dotColor: 'rgba(51, 255, 0, 0.9)',
        lineColor: 'rgba(51, 255, 0, 0.5)',
        dotDensity: 20,
        connectionRadius: 150,
        dotRadius: { min: 2, max: 4 },
        animationSpeed: { min: 1, max: 2 }
      };
  
      // Animation state
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.target = { x: this.width / 2, y: this.height / 2 };
      this.points = [];
      this.animateHeader = true;
      this.animationFrameId = null;
      this.resizeTimeout = null;
      this.isResizing = false;
  
      // DOM elements
      this.container = document.getElementById(containerId);
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
  
      // Initialize
      this.initCanvas();
      this.initPoints();
      this.setupEventListeners();
      this.startAnimation();
    }
  
    initCanvas() {
      if (!this.container || !this.canvas) {
        console.error('Container or canvas element not found');
        return;
      }
      
      this.container.style.height = `${this.height}px`;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  
    initPoints() {
      // Create points in a grid pattern with some randomness
      const { dotDensity } = this.config;
      const stepX = this.width / dotDensity;
      const stepY = this.height / dotDensity;
  
      for (let x = 0; x < this.width; x += stepX) {
        for (let y = 0; y < this.height; y += stepY) {
          const px = x + Math.random() * stepX;
          const py = y + Math.random() * stepY;
          
          this.points.push({
            x: px,
            y: py,
            originX: px,
            originY: py,
            vx: 0,
            vy: 0,
            speed: Math.random() * 0.5 + 0.2,
            active: 0,
            circle: new Circle(
              { x: px, y: py },
              this.getRandomInRange(this.config.dotRadius.min, this.config.dotRadius.max),
              this.config.dotColor
            )
          });
        }
      }
  
      // Find nearest neighbors for each point (more efficient approach)
      this.calculateNeighbors();
    }
  
    calculateNeighbors() {
      // Use a more efficient approach to find neighbors
      this.points.forEach(point => {
        point.neighbors = this.points
          .filter(p => p !== point)
          .map(p => ({
            point: p,
            distance: this.getDistance(point, p)
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
          .map(n => n.point);
      });
    }
  
    setupEventListeners() {
      // Bind the event handlers to preserve 'this' context
      this.boundHandleMouseMove = this.handleMouseMove.bind(this);
      this.boundHandleTouch = this.handleTouch.bind(this);
      this.boundHandleResize = this.handleResize.bind(this);
      this.boundHandleScroll = this.handleScroll.bind(this);
      
      // Mouse/touch movement
      if ('ontouchstart' in window) {
        window.addEventListener('touchmove', this.boundHandleTouch);
      } else {
        window.addEventListener('mousemove', this.boundHandleMouseMove);
      }
      
      // Resize and scroll
      window.addEventListener('resize', this.boundHandleResize);
      window.addEventListener('scroll', this.boundHandleScroll);
    }
  
    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.target.x = e.clientX - rect.left;
      this.target.y = e.clientY - rect.top;
    }
  
    handleTouch(e) {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.target.x = e.touches[0].clientX - rect.left;
        this.target.y = e.touches[0].clientY - rect.top;
      }
    }
  
    handleScroll() {
      this.animateHeader = document.body.scrollTop <= this.height;
    }
  
    handleResize() {
        // Clear any existing resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        // Set resizing flag
        this.isResizing = true;

        // Debounce resize handling
        this.resizeTimeout = setTimeout(() => {
            // Update dimensions
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            
            // Update container and canvas dimensions
            if (this.container && this.canvas) {
                this.container.style.height = `${this.height}px`;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                
                // Reset target to center
                this.target = { x: this.width / 2, y: this.height / 2 };
                
                // Clear existing points
                this.points = [];
                
                // Reinitialize points with new dimensions
                this.initPoints();
                
                // Reset animation frame if needed
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.startAnimation();
                }
            }

            // Clear resizing flag
            this.isResizing = false;
        }, 250); // Debounce for 250ms
    }
  
    startAnimation() {
      // Start animation loop
      this.points.forEach(point => this.animatePoint(point));
      this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }
  
    render() {
        // Skip rendering if currently resizing
        if (this.isResizing) {
            this.animationFrameId = requestAnimationFrame(this.render.bind(this));
            return;
        }

        if (this.animateHeader) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // Update and draw points
            this.points.forEach(point => {
                // Update position with velocity
                point.x += point.vx;
                point.y += point.vy;
                
                // Boundary check with improved handling
                if (point.x < 0) {
                    point.x = 0;
                    point.vx *= -1;
                } else if (point.x > this.width) {
                    point.x = this.width;
                    point.vx *= -1;
                }
                
                if (point.y < 0) {
                    point.y = 0;
                    point.vy *= -1;
                } else if (point.y > this.height) {
                    point.y = this.height;
                    point.vy *= -1;
                }
                
                // Calculate activity based on distance to cursor
                const distance = Math.sqrt(this.getDistance(this.target, point));
                const maxDistance = this.config.connectionRadius * 2;
                
                if (distance < this.config.connectionRadius) {
                    point.active = 0.5;
                    point.circle.active = 0.8;
                } else if (distance < maxDistance) {
                    point.active = 0.3 * (1 - distance / maxDistance);
                    point.circle.active = 0.5 * (1 - distance / maxDistance);
                } else {
                    point.active = 0;
                    point.circle.active = 0.1;
                }
                
                // Draw connecting lines and the circle
                this.drawConnections(point);
                point.circle.draw(this.ctx);
                point.circle.pos = point; // Update circle position
            });
        }
        
        this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }
  
    animatePoint(point) {
      // Use physics-based movement instead of TweenLite
      const randomAngle = Math.random() * Math.PI * 2;
      const range = 50;
      
      // Create a target within range of origin
      const targetX = point.originX + Math.cos(randomAngle) * range;
      const targetY = point.originY + Math.sin(randomAngle) * range;
      
      // Set velocity towards target
      const dx = targetX - point.x;
      const dy = targetY - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.1) {
        point.vx = (dx / distance) * point.speed;
        point.vy = (dy / distance) * point.speed;
      } else {
        // When close to target, set new target
        setTimeout(() => this.animatePoint(point), 
          this.getRandomInRange(this.config.animationSpeed.min, this.config.animationSpeed.max) * 1000);
      }
    }
  
    drawConnections(point) {
      if (!point.active) return;
      
      point.neighbors.forEach(neighbor => {
        // Only draw if both points are somewhat active
        if (neighbor.active > 0) {
          const opacity = point.active * 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(point.x, point.y);
          this.ctx.lineTo(neighbor.x, neighbor.y);
          this.ctx.strokeStyle = this.config.lineColor.replace('0.5', opacity);
          this.ctx.stroke();
        }
      });
    }
  
    // Utility methods
    getDistance(p1, p2) {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    
    getRandomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }
  
    // Public methods
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.points = [];
      this.initPoints();
    }
    
    destroy() {
        // Clean up event listeners and animation
        if (this.boundHandleMouseMove) {
            window.removeEventListener('mousemove', this.boundHandleMouseMove);
        }
        if (this.boundHandleTouch) {
            window.removeEventListener('touchmove', this.boundHandleTouch);
        }
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
        }
        if (this.boundHandleScroll) {
            window.removeEventListener('scroll', this.boundHandleScroll);
        }
        
        // Clear any pending timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Clear points array
        this.points = [];
    }
  }
  
  class Circle {
    constructor(pos, radius, color) {
      this.pos = pos;
      this.radius = radius;
      this.baseColor = color;
      this.active = 0;
    }
    
    draw(ctx) {
      // Only draw if somewhat active
      if (this.active < 0.01) return;
      
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, false);
      
      // Use base color with active opacity
      ctx.fillStyle = this.baseColor.replace('0.9', this.active);
      ctx.fill();
    }
  }
  
  // Initialize on DOM ready with error handling
  document.addEventListener('DOMContentLoaded', () => {
    try {
        const connectingDots = new ConnectingDots();
        
        // Handle Electron window events if in Electron environment
        if (window.electron) {
            window.electron.onResize(() => {
                connectingDots.handleResize();
            });
        }
        
        // Optional: expose to window for customization
        window.connectingDots = connectingDots;
    } catch (error) {
        console.error('Error initializing ConnectingDots:', error);
    }
  });