/*
 * Título 3D real (WebGL) para "WECARE".
 * O texto HTML continua na página para SEO e leitores de tela; quando o 3D
 * fica pronto, ele aparece por cima no mesmo lugar. Sem WebGL, fica a versão CSS.
 */
import * as THREE from "../vendor/three/three.module.min.js";
import { FontLoader } from "../vendor/three/FontLoader.js";
import { TextGeometry } from "../vendor/three/TextGeometry.js";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";

const title = document.querySelector("[data-hero-title]");
const host = document.querySelector("[data-hero3d]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

async function init() {
  if (!title || !host || !webglOk()) return;

  const res = await fetch(new URL("../vendor/three/inter-black-wecare.json", import.meta.url));
  const font = new FontLoader().parse(await res.json());

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  // geometria do texto com chanfro para captar reflexos
  const geo = new TextGeometry("WECARE", {
    font, size: 1, height: 0.34, curveSegments: 10,
    bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.028, bevelOffset: 0, bevelSegments: 5
  });
  geo.computeBoundingBox();
  geo.center();
  const bb = geo.boundingBox;
  const textW = bb.max.x - bb.min.x;
  const textH = bb.max.y - bb.min.y;

  const face = new THREE.MeshPhysicalMaterial({
    color: 0xb3121a, metalness: 0.3, roughness: 0.18,
    clearcoat: 1, clearcoatRoughness: 0.06, reflectivity: 0.6
  });
  const side = new THREE.MeshPhysicalMaterial({
    color: 0x6e0a0e, metalness: 0.35, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2
  });
  const mesh = new THREE.Mesh(geo, [face, side]);
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);

  // iluminação: chave branca, recorte vermelho e preenchimento suave
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xff2a33, 30, 20);
  rim.position.set(4, -1, -2);
  scene.add(rim);
  const rim2 = new THREE.PointLight(0xff5560, 12, 20);
  rim2.position.set(-4, 2, -1.5);
  scene.add(rim2);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // enquadra o texto para ocupar a largura da palavra HTML
  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // a palavra HTML ocupa ~86% da largura do host; deixa folga extra para a rotação
    const visibleW = textW / 0.8;
    const dist = visibleW / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.set(0, -textH * 0.04, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // interação
  let mx = 0, my = 0;
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(host);

  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  let rx = 0, ry = 0;

  function frame(now) {
    const t = (now - start) / 1000;
    const intro = reduceMotion ? 1 : ease(Math.min(t / 1.6, 1));
    const scroll = Math.min(window.scrollY / window.innerHeight, 1);

    // uma entrada única; depois o título só responde ao cursor e à rolagem
    const targetY = mx * 0.3 + (1 - intro) * -1.1;
    const targetX = my * 0.15 + scroll * 0.35 + (1 - intro) * 0.35;
    rx += (targetX - rx) * 0.07;
    ry += (targetY - ry) * 0.07;
    group.rotation.set(rx, ry, 0);
    group.scale.setScalar(0.85 + intro * 0.15);

    // a luz de recorte acompanha o cursor para "varrer" o vermelho
    rim.position.x = 4 + mx * 6;
    rim.position.y = -1 - my * 4;

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    frame(start + 2000);
  } else {
    renderer.setAnimationLoop((now) => {
      if (visible && !document.hidden) frame(now);
    });
  }

  requestAnimationFrame(() => title.classList.add("is-3d"));
}

init().catch(() => { /* mantém a versão CSS */ });
