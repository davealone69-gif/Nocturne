import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  FACE_DEFAULTS,
  irisColor,
  sculptPoint,
  skinColor,
  type FaceParams,
} from "../lib/face";

type Props = {
  params?: FaceParams;
};

export function FaceStage({ params = FACE_DEFAULTS }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.className = "stage";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0.05, 3.4);

    scene.add(new THREE.AmbientLight(0xf1eee8, 0.45));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.4);
    key.position.set(1.4, 1.8, 2.2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8aa0b8, 0.5);
    fill.position.set(-2, 0.4, 1.2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xc45a4a, 0.25);
    rim.position.set(0, 0.2, -2);
    scene.add(rim);

    const head = new THREE.Group();
    scene.add(head);

    const skin = new THREE.MeshPhysicalMaterial({
      color: skinColor(params.skin, params.presentation),
      roughness: 0.48,
      metalness: 0,
      sheen: 0.35,
      sheenColor: new THREE.Color("#e7b6a4"),
      clearcoat: 0.06,
    });
    const geo = new THREE.SphereGeometry(1, 72, 56);
    head.add(new THREE.Mesh(geo, skin));

    const eyeMat = new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.25 });
    const irisMat = new THREE.MeshStandardMaterial({ color: "#3a2a22", roughness: 0.35 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: "#0b0b0c", roughness: 0.2 });
    const eyes = new THREE.Group();
    head.add(eyes);
    for (const side of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), eyeMat);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 12), irisMat);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), pupilMat);
      iris.position.z = 0.055;
      pupil.position.z = 0.07;
      const eye = new THREE.Group();
      eye.add(white, iris, pupil);
      eye.userData.side = side;
      eyes.add(eye);
    }

    const hairMat = new THREE.MeshStandardMaterial({ color: "#1a1412", roughness: 0.72 });
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat,
    );
    hair.position.y = 0.16;
    hair.scale.set(1.04, 0.82, 1.04);
    head.add(hair);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.55, 24), skin);
    neck.position.y = -1.05;
    head.add(neck);

    const fangMat = new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.25 });
    const fangs = new THREE.Group();
    for (const side of [-1, 1]) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.08, 8), fangMat);
      fang.rotation.x = Math.PI;
      fang.position.set(side * 0.055, -0.38, 0.92);
      fangs.add(fang);
    }
    head.add(fangs);

    const metal = new THREE.MeshStandardMaterial({ color: "#8d9398", metalness: 0.85, roughness: 0.28 });
    const cyber = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.06), metal);
    cyber.position.set(-0.48, 0.22, 0.72);
    cyber.rotation.y = -0.5;
    cyber.rotation.z = 0.2;
    head.add(cyber);

    const apply = (next: FaceParams) => {
      skin.color.set(skinColor(next.skin, next.presentation));
      skin.sheenColor.set(next.presentation === "vampire" ? "#c9b4b8" : "#e7b6a4");
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const base = geo.userData.base as Float32Array;
      for (let i = 0; i < pos.count; i += 1) {
        const [x, y, z] = sculptPoint(base[i * 3]!, base[i * 3 + 1]!, base[i * 3 + 2]!, next);
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      const gap = 0.2 * next.eyeGap;
      eyes.children.forEach((eye) => {
        const side = eye.userData.side as number;
        eye.position.set(side * gap, 0.16, 0.78);
        eye.scale.setScalar(0.85 * next.eyeSize);
        const iris = eye.children[1] as THREE.Mesh;
        const mat = iris.material as THREE.MeshStandardMaterial;
        const mechanical = next.presentation === "cyborg" && side < 0;
        mat.color.set(mechanical ? "#7ee7ff" : irisColor(next.presentation));
        mat.emissive.set(
          mechanical ? "#1a6cff" : next.presentation === "vampire" ? "#3a0508" : "#000000",
        );
      });
      fangs.visible = next.presentation === "vampire";
      cyber.visible = next.presentation === "cyborg";
      rim.intensity = next.presentation === "vampire" ? 0.7 : 0.2;
      hair.visible = next.presentation !== "cyborg";
    };

    const src = geo.attributes.position as THREE.BufferAttribute;
    const base = new Float32Array(src.count * 3);
    for (let i = 0; i < src.count; i += 1) {
      const x = src.getX(i);
      const y = src.getY(i);
      const z = src.getZ(i);
      const len = Math.hypot(x, y, z) || 1;
      base[i * 3] = x / len;
      base[i * 3 + 1] = y / len;
      base[i * 3 + 2] = z / len;
    }
    geo.userData.base = base;
    apply(paramsRef.current);

    let yaw = 0.35;
    let pitch = 0.08;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const place = () => {
      head.rotation.order = "YXZ";
      head.rotation.y = yaw;
      head.rotation.x = pitch;
    };
    place();

    const onDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      yaw += (event.clientX - lastX) * 0.008;
      pitch = Math.max(-0.6, Math.min(0.45, pitch + (event.clientY - lastY) * 0.006));
      lastX = event.clientX;
      lastY = event.clientY;
      place();
    };
    const onUp = () => {
      dragging = false;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    const resize = () => {
      const width = el.clientWidth || 1;
      const height = el.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    let frame = 0;
    let lastParams = paramsRef.current;
    const loop = () => {
      if (paramsRef.current !== lastParams) {
        lastParams = paramsRef.current;
        apply(lastParams);
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      geo.dispose();
      skin.dispose();
      eyeMat.dispose();
      irisMat.dispose();
      pupilMat.dispose();
      hairMat.dispose();
      hair.geometry.dispose();
      neck.geometry.dispose();
      fangMat.dispose();
      metal.dispose();
      cyber.geometry.dispose();
      eyes.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      fangs.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} className="stage-wrap" />;
}
