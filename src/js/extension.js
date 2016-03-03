THREE.Vector3.prototype.toFixed = function(d) {
  d = d || 3
  return "(" + this.x.toFixed(d) + "," + this.y.toFixed(d) + "," + this.z.toFixed(d) + ")";
}
