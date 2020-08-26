// Animation

export function tweenTo(
  object,
  property,
  target,
  time,
  easing,
  onchange,
  oncomplete
) {
  const tween = {
    object,
    property,
    propertyBeginValue: object[property],
    target,
    easing,
    time,
    change: onchange,
    complete: oncomplete,
    start: Date.now(),
  };

  return tween;
}
