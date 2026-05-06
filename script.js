const canvas = document.querySelector("#particle-field");
const context = canvas.getContext("2d");
const pointer = { x: 0, y: 0, active: false };

let width = 0;
let height = 0;
let pixelRatio = 1;
let particles = [];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createParticle() {
  const speed = randomBetween(0.08, 0.32);
  const angle = randomBetween(0, Math.PI * 2);

  return {
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: randomBetween(1.2, 2.8),
    anchorPull: randomBetween(0.002, 0.006),
  };
}

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const targetCount = Math.round(Math.min(95, Math.max(48, width * height / 18000)));
  particles = Array.from({ length: targetCount }, createParticle);
}

function moveParticle(particle) {
  particle.x += particle.vx;
  particle.y += particle.vy;

  if (particle.x < -40) particle.x = width + 40;
  if (particle.x > width + 40) particle.x = -40;
  if (particle.y < -40) particle.y = height + 40;
  if (particle.y > height + 40) particle.y = -40;

  if (!pointer.active) return;

  const dx = pointer.x - particle.x;
  const dy = pointer.y - particle.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 260) {
    const pull = (1 - distance / 260) * particle.anchorPull;
    particle.vx += dx * pull;
    particle.vy += dy * pull;
  }

  particle.vx *= 0.992;
  particle.vy *= 0.992;
}

function drawLine(first, second, opacity, widthOverride = 1) {
  context.beginPath();
  context.moveTo(first.x, first.y);
  context.lineTo(second.x, second.y);
  context.strokeStyle = `rgba(100, 145, 190, ${opacity})`;
  context.lineWidth = widthOverride;
  context.stroke();
}

function draw() {
  context.clearRect(0, 0, width, height);

  const connectionDistance = width < 700 ? 128 : 168;

  for (const particle of particles) {
    moveParticle(particle);
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const first = particles[i];
      const second = particles[j];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);

      if (distance < connectionDistance) {
        drawLine(first, second, (1 - distance / connectionDistance) * 0.42);
      }
    }
  }

  if (pointer.active) {
    for (const particle of particles) {
      const distance = Math.hypot(pointer.x - particle.x, pointer.y - particle.y);

      if (distance < 230) {
        drawLine(pointer, particle, (1 - distance / 230) * 0.5, 1.15);
      }
    }
  }

  for (const particle of particles) {
    const glow = context.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.radius * 5
    );

    glow.addColorStop(0, "rgba(145, 190, 230, 0.72)");
    glow.addColorStop(0.35, "rgba(105, 155, 205, 0.22)");
    glow.addColorStop(1, "rgba(105, 155, 205, 0)");

    context.fillStyle = glow;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius * 5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(160, 205, 240, 0.72)";
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  }

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

resize();
draw();
