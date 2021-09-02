/* global AFRAME, THREE, Ammo */

AFRAME.registerComponent("shaking", {
  schema: {},

  init: function () {},

  play: function () {},

  pause: function () {},

  tick: function () {
    Ammo.then(() => {
      if (!this.el || !this.el.body) {
        console.log("ignore");
        return;
      }
      const x = this.getRandomArbitrary(-0.1, 0.1);
      const z = this.getRandomArbitrary(-0.1, 0.1);
      const impulse = new Ammo.btVector3(x, 0, z);
      this.el.body.applyCentralForce(impulse);
      Ammo.destroy(impulse);
    });
  },

  getRandomArbitrary: function (min, max) {
    return Math.random() * (max - min) + min;
  },
});
