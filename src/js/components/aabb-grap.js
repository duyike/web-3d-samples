/* global AFRAME, THREE */

/**
 * Handles events coming from the hand-controls
 * Determines if the entity is grabbed or released.
 * Updates its position and rotation to move along the controller.
 * Use aframe-aabb-collider to determine the intersected entitry.
 */
AFRAME.registerComponent("aabb-grab", {
  init: function () {
    this.GRABBED_STATE = "grabbed";
    // Bind event handlers
    this.onGripOpen = this.onGripOpen.bind(this);
    this.onGripClose = this.onGripClose.bind(this);
    this.currentPosition = new THREE.Vector3();
    this.currentRotation = new THREE.Euler();
  },

  play: function () {
    var el = this.el;
    el.addEventListener("buttondown", this.onGripClose);
    el.addEventListener("buttonup", this.onGripOpen);
  },

  pause: function () {
    var el = this.el;
    el.addEventListener("buttondown", this.onGripClose);
    el.addEventListener("buttonup", this.onGripOpen);
  },

  tick: function () {
    var hitEl = this.hitEl;
    var position;
    if (!hitEl) {
      return;
    }
    this.updateDelta();
    position = hitEl.getAttribute("position");
    hitEl.setAttribute("position", {
      x: position.x + this.deltaPosition.x,
      y: position.y + this.deltaPosition.y,
      z: position.z + this.deltaPosition.z,
    });
    hitEl.object3D.rotation.x += this.deltaRotation.x;
    hitEl.object3D.rotation.y += this.deltaRotation.y;
    hitEl.object3D.rotation.z += this.deltaRotation.z;
  },

  onGripClose: function (evt) {
    if (this.grabbing) {
      return;
    }
    this.grabbing = true;
    this.pressedButtonId = evt.detail.id;
    delete this.previousPosition;
    this.grabHitting();
  },

  onGripOpen: function (evt) {
    var hitEl = this.hitEl;
    if (this.pressedButtonId !== evt.detail.id) {
      return;
    }
    this.grabbing = false;
    if (!hitEl) {
      return;
    }
    hitEl.removeState(this.GRABBED_STATE);
    hitEl.emit("grabend");
    this.hitEl = undefined;
  },

  grabHitting: function () {
    var hitEl = this.el.components["aabb-collider"].intersectedEls[0];
    if (
      !hitEl ||
      hitEl.is(this.GRABBED_STATE) ||
      !this.grabbing ||
      this.hitEl
    ) {
      return;
    }
    hitEl.addState(this.GRABBED_STATE);
    hitEl.emit("grabstart");
    this.hitEl = hitEl;
  },

  updateDelta: function () {
    // detal postition
    var currentPosition = this.currentPosition;
    this.el.object3D.updateMatrixWorld();
    currentPosition.setFromMatrixPosition(this.el.object3D.matrixWorld);
    if (!this.previousPosition) {
      this.previousPosition = new THREE.Vector3();
      this.previousPosition.copy(currentPosition);
    }
    var previousPosition = this.previousPosition;
    var deltaPosition = {
      x: currentPosition.x - previousPosition.x,
      y: currentPosition.y - previousPosition.y,
      z: currentPosition.z - previousPosition.z,
    };
    this.previousPosition.copy(currentPosition);
    this.deltaPosition = deltaPosition;

    // delta rotation
    var currentRotation = this.currentRotation;
    currentRotation.copy(this.el.object3D.rotation);
    if (!this.previousRotation) {
      this.previousRotation = new THREE.Euler();
      this.previousRotation.copy(currentRotation);
    }
    var previousRotation = this.previousRotation;
    var deltaRotation = {
      x: currentRotation.x - previousRotation.x,
      y: currentRotation.y - previousRotation.y,
      z: currentRotation.z - previousRotation.z,
    };
    this.previousRotation.copy(currentRotation);
    this.deltaRotation = deltaRotation;
  },
});
