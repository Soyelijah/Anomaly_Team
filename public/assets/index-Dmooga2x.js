// Shim for CharacterViewer module
const w = (typeof window !== 'undefined' ? (window.React || window.parent?.React) : null) || {};

const Bo = (w && w.createContext) ? w.createContext({}) : { Provider: () => null, Consumer: () => null };

const dn = w.forwardRef ? w.forwardRef((s, f) => {
  const { alt: v, color: d, size: y = 16, weight: b = "regular", mirrored: S, children: H, weights: x, ...h } = s;
  const iconData = x && x.get ? x.get(b) : null;
  return w.createElement(
    "svg",
    {
      ref: f,
      xmlns: "http://www.w3.org/2000/svg",
      width: y,
      height: y,
      fill: d || "currentColor",
      viewBox: "0 0 256 256",
      transform: S ? "scale(-1, 1)" : undefined,
      ...h,
    },
    v ? w.createElement("title", null, v) : null,
    H,
    iconData
  );
}) : () => null;

const $6 = [
  "#00000000","#000000","#8c8a8d","#ffffff","#fe0000","#ff8a00",
  "#ffff00","#8cff01","#00ff00","#01ff8d","#00ffff","#008aff",
  "#0000fe","#8c00ff","#ff00fe","#ff008c"
];

function Qh(s) {
  if (!s || typeof s !== "string" || !/^[0-9a-f]{64}$/i.test(s)) return null;
  return Array.from(s, v => $6[parseInt(v, 16)]);
}

const eu = async (fn) => await fn();

function createJSX(type, props) {
  if (!props) return w.createElement(type);
  const { children, key, ...rest } = props;
  const config = key !== undefined ? { ...rest, key } : rest;
  if (Array.isArray(children)) {
    return w.createElement(type, config, ...children);
  } else if (children !== undefined) {
    return w.createElement(type, config, children);
  } else {
    return w.createElement(type, config);
  }
}

const ge = {
  jsx: createJSX,
  jsxs: createJSX,
  Fragment: w.Fragment
};

const Ir = w.forwardRef ? w.forwardRef((props, ref) => {
  return w.createElement('svg', {
    ref,
    xmlns: "http://www.w3.org/2000/svg",
    width: props.size || 20,
    height: props.size || 20,
    fill: props.color || "currentColor",
    viewBox: "0 0 256 256",
    ...props
  }, w.createElement('path', {
    d: "M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
  }));
}) : () => null;

const tu = w.forwardRef ? w.forwardRef((props, ref) => {
  return w.createElement('svg', {
    ref,
    xmlns: "http://www.w3.org/2000/svg",
    width: props.size || 16,
    height: props.size || 16,
    fill: props.color || "currentColor",
    viewBox: "0 0 256 256",
    ...props
  }, w.createElement('path', {
    d: "M216,128a88,88,0,0,1-88,88,88,88,0,0,1-88-88,88,88,0,0,1,88-88A88,88,0,0,1,216,128Z",
    opacity: "0.2"
  }), w.createElement('path', {
    d: "M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z"
  }));
}) : () => null;

export {
  w as r,
  dn as p,
  Qh as d,
  eu as _,
  ge as j,
  Ir as n,
  tu as s
};
