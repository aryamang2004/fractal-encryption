class FractalEncryption {
    constructor(iterations, seed) {
        this.iterations = iterations;
        this.seed = seed;
        this.canvas = document.getElementById('fractalCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'fractalCanvas';
            document.querySelector('.glass-effect').appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.initCanvas();
        this.time = 0;
        this.points = [];
    }

    initCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        
        // Adjusted to be FULLY inside with margin
        this.visualRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35; // Reduced to 35%
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    textToBinary(text) {
        return text.split('').map(char => 
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join('');
    }

    binaryToText(binary) {
        try {
            const chunks = binary.match(/.{8}/g) || [];
            return chunks.map(chunk => 
                String.fromCharCode(parseInt(chunk, 2))
            ).join('');
        } catch (error) {
            console.error('Decryption error:', error);
            return 'Error: Invalid encrypted data';
        }
    }

    encrypt(text) {
        if (!text) return '';
        
        const binary = this.textToBinary(text);
        this.points = this.generatePoints(binary);
        this.startAnimation();
        
        return binary;
    }

    decrypt(binary) {
        if (!binary) return '';
        
        this.points = this.generatePoints(binary);
        this.startAnimation();
        
        return this.binaryToText(binary);
    }

    generatePoints(binary) {
        const points = [];
        const safeRadius = this.visualRadius * 0.9;
        
        // Create main circle of points
        binary.split('').forEach((bit, i, arr) => {
            const angle = (i / arr.length) * Math.PI * 2;
            
            // Calculate position on circle
            let x = this.centerX + Math.cos(angle) * safeRadius;
            let y = this.centerY + Math.sin(angle) * safeRadius;
            
            // Add slight offset for visual interest
            if (i % 3 === 0) {
                x += Math.cos(angle) * 20;
                y += Math.sin(angle) * 20;
            }
            
            points.push({
                x, y,
                originalX: x,
                originalY: y,
                bit,
                angle,
                radius: safeRadius,
                energy: 1,
                phase: Math.random() * Math.PI * 2,
                connections: [] // Store nearby points for connections
            });
        });

        // Calculate connections between nearby points
        points.forEach((point, i) => {
            points.forEach((otherPoint, j) => {
                if (i !== j) {
                    const distance = Math.hypot(
                        otherPoint.x - point.x,
                        otherPoint.y - point.y
                    );
                    if (distance < this.visualRadius * 0.3) {
                        point.connections.push(j);
                    }
                }
            });
        });

        return points;
    }

    getFractalOffset(x, y, centerX, centerY, index) {
        const time = this.time;
        const scale = 100;
        
        // Create fractal noise pattern
        const noise1 = this.noise(x/scale + time, y/scale);
        const noise2 = this.noise(x/scale + time * 0.5, y/scale + time * 0.5);
        
        return {
            x: noise1 * 50,
            y: noise2 * 50
        };
    }

    noise(x, y) {
        // Simple noise function
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        return Math.sin(X * 12.9898 + Y * 78.233) * 43758.5453123 % 1;
    }

    startAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.animate();
    }

    animate = () => {
        this.time += 0.01;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Gentle circular wave motion
        this.points.forEach(point => {
            const waveOffset = Math.sin(this.time + point.angle) * 5;
            point.x = point.originalX + Math.cos(point.angle) * waveOffset;
            point.y = point.originalY + Math.sin(point.angle) * waveOffset;
        });

        this.drawConnections();
        this.drawPoints();

        requestAnimationFrame(this.animate);
    }

    drawGrid() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gridSize = 50;
        const offset = this.time * 20 % gridSize;

        this.ctx.strokeStyle = 'rgba(15, 244, 198, 0.1)';
        this.ctx.lineWidth = 1;

        // Draw perspective grid
        for (let x = -gridSize; x < width + gridSize; x += gridSize) {
            const xPos = x + offset;
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.lineTo(xPos - height/2, height);
            this.ctx.stroke();
        }

        for (let y = -gridSize; y < height + gridSize; y += gridSize) {
            const yPos = y + offset;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yPos);
            this.ctx.lineTo(width, yPos - width/2);
            this.ctx.stroke();
        }
    }

    drawConnections() {
        this.points.forEach((point, i) => {
            // Draw connections only to nearby points
            point.connections.forEach(j => {
                const otherPoint = this.points[j];
                
                this.ctx.strokeStyle = 'rgba(15, 244, 198, 0.4)';
                this.ctx.lineWidth = 0.8;
                
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(otherPoint.x, otherPoint.y);
                this.ctx.stroke();

                // Add flowing particles along connections
                const particleCount = 2;
                for (let p = 0; p < particleCount; p++) {
                    const progress = ((this.time * 0.5) + p/particleCount) % 1;
                    const px = point.x + (otherPoint.x - point.x) * progress;
                    const py = point.y + (otherPoint.y - point.y) * progress;

                    this.ctx.fillStyle = 'rgba(15, 244, 198, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
        });
    }

    drawPoints() {
        this.points.forEach(point => {
            // Draw glow
            const glowSize = 12;
            const gradient = this.ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, glowSize
            );
            
            const color = point.bit === '1' ? 
                'rgba(15, 244, 198,' : 
                'rgba(255, 45, 85,';
            
            gradient.addColorStop(0, color + ' 0.3)');
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw core point
            this.ctx.fillStyle = point.bit === '1' ? '#0FF4C6' : '#FF2D55';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    addEffects() {
        // Add scanlines
        const scanlineHeight = 2;
        for (let y = 0; y < this.canvas.height; y += 4) {
            const offset = Math.sin(this.time * 2 + y * 0.1) * 2;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, y + offset, this.canvas.width, scanlineHeight);
        }

        // Add vignette
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

// Global instance
let fractalEncryption;

// Encryption function
function encrypt() {
    const input = document.getElementById('inputText').value;
    if (!input) {
        document.getElementById('outputText').value = 'Please enter text to encrypt';
        return;
    }
    
    const iterations = Math.max(1, Math.min(20, parseInt(document.getElementById('iterations').value) || 5));
    const seed = Math.max(1, Math.min(1000, parseInt(document.getElementById('seed').value) || 42));

    fractalEncryption = new FractalEncryption(iterations, seed);
    const encrypted = fractalEncryption.encrypt(input);
    document.getElementById('outputText').value = encrypted;
}

// Decryption function
function decrypt() {
    const input = document.getElementById('inputText').value;
    if (!input) {
        document.getElementById('outputText').value = 'Please enter text to decrypt';
        return;
    }
    
    const iterations = Math.max(1, Math.min(20, parseInt(document.getElementById('iterations').value) || 5));
    const seed = Math.max(1, Math.min(1000, parseInt(document.getElementById('seed').value) || 42));

    fractalEncryption = new FractalEncryption(iterations, seed);
    const decrypted = fractalEncryption.decrypt(input);
    document.getElementById('outputText').value = decrypted;
}

// Initialize on window load
window.addEventListener('load', () => {
    fractalEncryption = new FractalEncryption(5, 42);
});

// Handle window resize
window.addEventListener('resize', () => {
    if (fractalEncryption) {
        fractalEncryption.initCanvas();
    }
});

// Cleanup on window unload
window.addEventListener('unload', () => {
    if (fractalEncryption) {
        fractalEncryption.cleanup();
    }
}); 
