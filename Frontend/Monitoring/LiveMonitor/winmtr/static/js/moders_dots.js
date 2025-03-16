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
      // Mouse/touch movement
      if ('ontouchstart' in window) {
        window.addEventListener('touchmove', this.handleTouch.bind(this));
      } else {
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
      }
      
      // Resize and scroll
      window.addEventListener('resize', this.handleResize.bind(this));
      window.addEventListener('scroll', this.handleScroll.bind(this));
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
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      
      this.container.style.height = `${this.height}px`;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      
      // Re-initialize points
      this.points = [];
      this.initPoints();
    }
  
    startAnimation() {
      // Start animation loop
      this.points.forEach(point => this.animatePoint(point));
      this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }
  
    render() {
      if (this.animateHeader) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update and draw points
        this.points.forEach(point => {
          // Update position with velocity
          point.x += point.vx;
          point.y += point.vy;
          
          // Boundary check
          if (point.x < 0 || point.x > this.width) point.vx *= -1;
          if (point.y < 0 || point.y > this.height) point.vy *= -1;
          
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
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('touchmove', this.handleTouch);
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('scroll', this.handleScroll);
      
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
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
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const connectingDots = new ConnectingDots();
    
    // Optional: expose to window for customization
    window.connectingDots = connectingDots;
  });