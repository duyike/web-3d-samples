import * as THREE from "three";

const DAMPING = 0.03;
const DRAG = 1 - DAMPING;

const TIMESTEP = 18 / 1000;
const TIMESTEP_SQ = TIMESTEP * TIMESTEP;

const diff = new THREE.Vector3();

class Particle {
  constructor(x, y, z, mass, clothFunction) {
    this.position = new THREE.Vector3();
    this.previous = new THREE.Vector3();
    this.original = new THREE.Vector3();
    this.a = new THREE.Vector3(0, 0, 0); // acceleration
    this.mass = mass;
    this.invMass = 1 / mass;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
    this.pins = [];

    // init
    clothFunction(x, y, this.position); // position
    clothFunction(x, y, this.previous); // previous
    clothFunction(x, y, this.original);
  }

  // Force -> Acceleration
  addForce(force) {
    this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
  }

  // Performs Verlet integration
  integrate(timesq) {
    const newPos = this.tmp.subVectors(this.position, this.previous);
    newPos.multiplyScalar(DRAG).add(this.position);
    newPos.add(this.a.multiplyScalar(timesq));

    this.tmp = this.previous;
    this.previous = this.position;
    this.position = newPos;

    this.a.set(0, 0, 0);
  }
}

export class Cloth {
  constructor(mass, w = 10, h = 10, restDistance = 25) {
    this.w = w;
    this.h = h;
    this.restDistance = restDistance;
    this.MASS = mass;
    this.clothFunction = this.plane(w * restDistance, h * restDistance);
    this.pins = [];
    this.gravity = new THREE.Vector3();
    this.aerodynamic = new THREE.Vector3();
    this.clothGeometry = {};
    this.tmpForce = new THREE.Vector3();

    const particles = [];
    const constraints = [];

    // Create particles

    for (let v = 0; v <= h; v++) {
      for (let u = 0; u <= w; u++) {
        const p = new Particle(u / w, v / h, 0, this.MASS, this.clothFunction);
        particles.push(p);
      }
    }

    // Structural
    for (let v = 0; v < h; v++) {
      for (let u = 0; u < w; u++) {
        constraints.push([
          particles[index(u, v)],
          particles[index(u, v + 1)],
          this.restDistance,
        ]);

        constraints.push([
          particles[index(u, v)],
          particles[index(u + 1, v)],
          this.restDistance,
        ]);
      }
    }

    for (let u = w, v = 0; v < h; v++) {
      constraints.push([
        particles[index(u, v)],
        particles[index(u, v + 1)],
        this.restDistance,
      ]);
    }

    for (let v = h, u = 0; u < w; u++) {
      constraints.push([
        particles[index(u, v)],
        particles[index(u + 1, v)],
        this.restDistance,
      ]);
    }

    // While many systems use shear and bend springs,
    // the relaxed constraints model seems to be just fine
    // using structural springs.
    // Shear
    // const diagonalDist = Math.sqrt(restDistance * restDistance * 2);

    // for (v=0;v<h;v++) {
    // 	for (u=0;u<w;u++) {

    // 		constraints.push([
    // 			particles[index(u, v)],
    // 			particles[index(u+1, v+1)],
    // 			diagonalDist
    // 		]);

    // 		constraints.push([
    // 			particles[index(u+1, v)],
    // 			particles[index(u, v+1)],
    // 			diagonalDist
    // 		]);

    // 	}
    // }

    this.particles = particles;
    this.constraints = constraints;

    function index(u, v) {
      return u + v * (w + 1);
    }

    this.index = index;
  }

  plane(width, height) {
    return function (u, v, target) {
      const x = (u - 0.5) * width;
      const y = (v + 0.5) * height;
      const z = 0;
      target.set(x, y, z);
    };
  }

  addPin(index) {
    this.pins.push(index);
  }

  // simulate(timesq) {
  //   // aerodynamics force simulate
  //   const windForce = new THREE.Vector3();
  //   const windStrength = Math.cos(timesq / 7000) * 20 + 40;
  //   windForce.set(
  //     Math.sin(timesq / 2000),
  //     Math.cos(timesq / 3000),
  //     Math.sin(timesq / 1000)
  //   );
  //   windForce.normalize();
  //   windForce.multiplyScalar(windStrength);
  //   let indx;
  //   const normal = new THREE.Vector3();
  //   const indices = this.clothGeometry.index;
  //   const normals = this.clothGeometry.attributes.normal;

  //   for (let i = 0, il = indices.count; i < il; i += 3) {
  //     for (let j = 0; j < 3; j++) {
  //       indx = indices.getX(i + j);
  //       normal.fromBufferAttribute(normals, indx);
  //       this.tmpForce
  //         .copy(normal)
  //         .normalize()
  //         .multiplyScalar(normal.dot(windForce));
  //       this.particles[indx].addForce(this.tmpForce);
  //     }
  //   }
  //   // gravity force simulate
  //   this.particles.forEach((p) => {
  //     p.addForce(this.gravity);
  //     p.integrate(timesq);
  //   });
  //   this.pin();
  // }

  simulate(now) {
    const windForce = this.simulateWind(now);

    // Aerodynamics forces
    const particles = this.particles;

    let indx;
    const normal = new THREE.Vector3();
    const indices = this.clothGeometry.index;
    const normals = this.clothGeometry.attributes.normal;

    for (let i = 0, il = indices.count; i < il; i += 3) {
      for (let j = 0; j < 3; j++) {
        indx = indices.getX(i + j);
        normal.fromBufferAttribute(normals, indx);
        this.tmpForce
          .copy(normal)
          .normalize()
          .multiplyScalar(normal.dot(windForce));
        particles[indx].addForce(this.tmpForce);
      }
    }

    for (let i = 0, il = particles.length; i < il; i++) {
      const particle = particles[i];
      particle.addForce(this.gravity);
      particle.integrate(TIMESTEP_SQ);
    }

    // Start Constraints
    const constraints = this.constraints;
    const il = constraints.length;

    for (let i = 0; i < il; i++) {
      const constraint = constraints[i];
      this.satisfyConstraints(constraint[0], constraint[1], constraint[2]);
    }

    // Pin Constraints
    for (let i = 0, il = this.pins.length; i < il; i++) {
      const xy = this.pins[i];
      const p = particles[xy];
      p.position.copy(p.original);
      p.previous.copy(p.original);
    }
  }

  render() {
    const p = this.particles;
    for (let i = 0, il = p.length; i < il; i++) {
      const v = p[i].position;
      this.clothGeometry.attributes.position.setXYZ(i, v.x, v.y, v.z);
    }
    this.clothGeometry.attributes.position.needsUpdate = true;
    this.clothGeometry.computeVertexNormals();
  }

  pin() {
    this.pins.forEach((index) => {
      const p = this.particles[index];
      p.position.copy(p.original);
      p.previous.copy(p.original);
    });
  }

  satisfyConstraints(p1, p2, distance) {
    diff.subVectors(p2.position, p1.position);
    const currentDist = diff.length();
    if (currentDist === 0) return; // prevents division by 0
    const correction = diff.multiplyScalar(1 - distance / currentDist);
    const correctionHalf = correction.multiplyScalar(0.5);
    p1.position.add(correctionHalf);
    p2.position.sub(correctionHalf);
  }

  simulateWind(now) {
    const windForce = new THREE.Vector3();
    const windStrength = Math.cos(now / 7000) * 20 + 80;

    windForce.set(
      Math.sin(now / 2000),
      Math.cos(now / 3000),
      Math.sin(now / 1000)
    );
    windForce.normalize();
    windForce.multiplyScalar(windStrength);
    return windForce;
  }
}
