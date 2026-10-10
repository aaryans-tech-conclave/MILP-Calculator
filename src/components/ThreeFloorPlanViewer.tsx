import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { ARCHITECTURAL_LAYOUTS, BUCKET_THEMES, FLOOR_NAMES } from '../data/initialData';
import { BucketAllocation, Shop } from '../types/allocation';
import { formatINR } from '../utils/formatters';
import { RotateCcw, ZoomIn, ZoomOut, Layers, Eye } from 'lucide-react';

interface ThreeFloorPlanViewerProps {
  allocations: BucketAllocation[];
  shops: Shop[];
  rates: Record<number, number>;
  hoveredShop: { floor: number; id: string } | null;
  onHoverShop: (shop: { floor: number; id: string } | null) => void;
  selectedBucketId: number | null;
}

export const ThreeFloorPlanViewer: React.FC<ThreeFloorPlanViewerProps> = ({
  allocations,
  shops,
  rates,
  hoveredShop,
  onHoverShop,
  selectedBucketId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [spacing, setSpacing] = useState<number>(7); // vertical gap between floors
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    shopId: string;
    floor: number;
    area?: number;
    value?: number;
    bucketId?: number;
    label: string;
  } | null>(null);

  // Map each shop key to its assigned bucket ID
  const shopToBucket = useMemo(() => {
    const map = new Map<string, number>();
    allocations.forEach(bucket => {
      bucket.shops.forEach(s => {
        map.set(`${s.floor}_${s.id}`, bucket.bucketId);
      });
    });
    return map;
  }, [allocations]);

  // Lookup for shop metadata
  const shopMetaLookup = useMemo(() => {
    const map = new Map<string, Shop>();
    shops.forEach(s => {
      map.set(`${s.floor}_${s.id}`, s);
    });
    return map;
  }, [shops]);

  // References to three scene elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const floorGroupsRef = useRef<Map<number, THREE.Group>>(new Map());
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 85 });

  const floors = [0, 1, 2, 4];

  // Helper to create floor label canvas texture
  const createFloorLabelTexture = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 256, 64);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 252, 60);
      ctx.fillStyle = '#F9FAFB';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF9FAFB);
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    cameraRef.current = camera;

    const updateCameraPosition = () => {
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi) + 12;
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 10, 0);
    };
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight1.position.set(40, 70, 50);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf1f5f9, 0.4);
    dirLight2.position.set(-40, 30, -50);
    scene.add(dirLight2);

    // Floor Groups
    const floorGroups = new Map<number, THREE.Group>();
    const meshes = new Map<string, THREE.Mesh>();
    meshesRef.current = meshes;
    floorGroupsRef.current = floorGroups;

    // Ground plane grid (subtle)
    const gridHelper = new THREE.GridHelper(90, 18, 0xCBD5E1, 0xE2E8F0);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Coordinate conversions:
    // Layout coords: x in 0..100, y in 0..100
    // Real 3D scale: width ~ 24 units, depth ~ 50 units (matching architectural aspect ratio 1:2.1)
    const scaleX = 26;
    const scaleZ = 54;
    const offsetX = -scaleX / 2;
    const offsetZ = -scaleZ / 2;

    floors.forEach((floorNum, idx) => {
      const group = new THREE.Group();
      group.position.y = idx * spacing;
      floorGroups.set(floorNum, group);
      scene.add(group);

      // Floor Base Plate (Slab)
      const slabGeo = new THREE.BoxGeometry(scaleX + 2, 0.5, scaleZ + 2);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xEEF2F6,
        roughness: 0.7,
        metalness: 0.05,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, -0.25, 0);
      slab.receiveShadow = true;
      group.add(slab);

      // Floor Border Outline
      const slabEdges = new THREE.EdgesGeometry(slabGeo);
      const slabLine = new THREE.LineSegments(
        slabEdges,
        new THREE.LineBasicMaterial({ color: 0x94A3B8, linewidth: 1 })
      );
      slabLine.position.copy(slab.position);
      group.add(slabLine);

      // Floor Label Sprite
      const labelTexture = createFloorLabelTexture(FLOOR_NAMES[floorNum] || `Floor ${floorNum}`);
      const spriteMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
      const labelSprite = new THREE.Sprite(spriteMat);
      labelSprite.scale.set(8, 2, 1);
      labelSprite.position.set(-(scaleX / 2) - 5, 1.2, offsetZ);
      group.add(labelSprite);

      // Add Shop Meshes
      const layoutItems = ARCHITECTURAL_LAYOUTS[floorNum] || [];
      layoutItems.forEach(item => {
        const itemWidth = (item.width / 100) * scaleX;
        const itemDepth = (item.height / 100) * scaleZ;
        const itemX = offsetX + (item.x / 100) * scaleX + itemWidth / 2;
        const itemZ = offsetZ + (item.y / 100) * scaleZ + itemDepth / 2;
        const itemHeight = item.zone === 'amenity' ? 0.9 : 1.6;

        const boxGeo = new THREE.BoxGeometry(
          Math.max(0.5, itemWidth - 0.2),
          itemHeight,
          Math.max(0.5, itemDepth - 0.2)
        );

        // Initial default material
        const defaultColor = item.zone === 'amenity' ? 0xD1D5DB : 0xE2E8F0;
        const boxMat = new THREE.MeshStandardMaterial({
          color: defaultColor,
          roughness: 0.45,
          metalness: 0.1,
        });

        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.set(itemX, itemHeight / 2, itemZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Custom metadata on mesh for raycasting
        mesh.userData = {
          floor: floorNum,
          id: item.id,
          label: item.label,
          zone: item.zone,
        };

        // Wireframe edges for crisp architectural feel
        const edges = new THREE.EdgesGeometry(boxGeo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 1 })
        );
        mesh.add(line);

        group.add(mesh);
        meshes.set(`${floorNum}_${item.id}`, mesh);
      });
    });

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Mouse Interaction (Orbit Controls)
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;

        cameraAngleRef.current.theta += deltaX * 0.007;
        cameraAngleRef.current.phi = Math.max(
          0.15,
          Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.007)
        );

        updateCameraPosition();
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      } else {
        // Raycast for hovering
        const normX = (mouseX / rect.width) * 2 - 1;
        const normY = -(mouseY / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);

        const allMeshes: THREE.Mesh[] = [];
        meshes.forEach(m => allMeshes.push(m));

        const intersects = raycaster.intersectObjects(allMeshes, false);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const { floor, id, label, zone } = hit.userData;

          if (zone !== 'amenity') {
            const shopMeta = shopMetaLookup.get(`${floor}_${id}`);
            const bucketId = shopToBucket.get(`${floor}_${id}`);

            setActiveTooltip({
              x: mouseX + 12,
              y: mouseY - 10,
              shopId: id,
              floor,
              label,
              area: shopMeta?.area,
              value: shopMeta ? shopMeta.area * (rates[floor] || 0) : undefined,
              bucketId,
            });
            onHoverShop({ floor, id });
          } else {
            setActiveTooltip(null);
            onHoverShop(null);
          }
        } else {
          setActiveTooltip(null);
          onHoverShop(null);
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(
        35,
        Math.min(150, cameraAngleRef.current.radius + e.deltaY * 0.08)
      );
      updateCameraPosition();
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  // Update Floor Spacing
  useEffect(() => {
    floors.forEach((floorNum, idx) => {
      const group = floorGroupsRef.current.get(floorNum);
      if (group) {
        group.position.y = idx * spacing;
      }
    });
  }, [spacing]);

  // Update Dynamic Bucket Colors and Hover States
  useEffect(() => {
    meshesRef.current.forEach((mesh, key) => {
      const { floor, id, zone } = mesh.userData;
      if (zone === 'amenity') return;

      const bucketId = shopToBucket.get(key);
      const isHovered = hoveredShop && hoveredShop.floor === floor && hoveredShop.id === id;
      const isBucketFiltered = selectedBucketId !== null && bucketId === selectedBucketId;

      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (bucketId) {
        const theme = BUCKET_THEMES.find(t => t.id === bucketId);
        const hexColor = theme ? parseInt(theme.hex.replace('#', '0x'), 16) : 0xCBD5E1;

        mat.color.setHex(hexColor);
        mat.roughness = 0.4;

        if (isHovered) {
          mat.emissive.setHex(0x334155);
          mesh.scale.set(1.06, 1.25, 1.06);
        } else if (selectedBucketId !== null && !isBucketFiltered) {
          mat.color.setHex(0xE2E8F0);
          mat.opacity = 0.45;
          mat.transparent = true;
          mat.emissive.setHex(0x000000);
          mesh.scale.set(1, 1, 1);
        } else {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.emissive.setHex(0x000000);
          mesh.scale.set(1, 1, 1);
        }
      } else {
        // Unallocated shop
        mat.color.setHex(0xE2E8F0);
        mat.emissive.setHex(isHovered ? 0x222222 : 0x000000);
        mesh.scale.set(1, 1, 1);
      }
    });
  }, [shopToBucket, hoveredShop, selectedBucketId]);

  const resetView = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 85 };
    if (cameraRef.current) {
      const { theta, phi, radius } = cameraAngleRef.current;
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = radius * Math.cos(phi) + 12;
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 10, 0);
    }
  };

  const adjustZoom = (delta: number) => {
    cameraAngleRef.current.radius = Math.max(35, Math.min(150, cameraAngleRef.current.radius + delta));
    if (cameraRef.current) {
      const { theta, phi, radius } = cameraAngleRef.current;
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = radius * Math.cos(phi) + 12;
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 10, 0);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#F9FAFB] border border-gray-200 rounded-lg overflow-hidden flex flex-col select-none">
      {/* 3D View Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 shadow-xs">
        <span className="font-semibold text-gray-900 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-gray-700" /> 3D Isometric Model
        </span>
        <span className="text-gray-300">|</span>
        <span>Drag to rotate</span>
        <span className="text-gray-300">·</span>
        <span>Scroll to zoom</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-md border border-gray-200 shadow-xs">
        <button
          onClick={() => adjustZoom(-15)}
          title="Zoom In"
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => adjustZoom(15)}
          title="Zoom Out"
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Camera View"
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Vertical Floor Gap Slider */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 shadow-xs">
        <Layers className="w-3.5 h-3.5 text-gray-500" />
        <span className="font-medium">Floor Spacing:</span>
        <input
          type="range"
          min={3}
          max={14}
          step={0.5}
          value={spacing}
          onChange={e => setSpacing(parseFloat(e.target.value))}
          className="w-20 accent-gray-900 cursor-pointer"
        />
        <span className="text-gray-500 tabular-nums w-6">{spacing}</span>
      </div>

      {/* 3D Canvas Mounting Area */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating Tooltip */}
      {activeTooltip && (
        <div
          className="absolute z-30 pointer-events-none bg-gray-900/95 text-white text-xs rounded-md shadow-lg py-1.5 px-2.5 backdrop-blur-xs border border-gray-700 transition-opacity"
          style={{
            left: `${Math.min(activeTooltip.x, (mountRef.current?.clientWidth || 300) - 180)}px`,
            top: `${Math.max(10, activeTooltip.y)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3 font-semibold pb-1 border-b border-gray-700">
            <span>{activeTooltip.label}</span>
            <span className="text-gray-300 font-normal">{FLOOR_NAMES[activeTooltip.floor] || `Floor ${activeTooltip.floor}`}</span>
          </div>
          <div className="pt-1 space-y-0.5 text-gray-300 tabular-nums">
            {activeTooltip.area !== undefined && (
              <div className="flex justify-between gap-4">
                <span>Super Built Area:</span>
                <span className="font-medium text-white">{activeTooltip.area.toLocaleString()} sq.ft</span>
              </div>
            )}
            {activeTooltip.value !== undefined && (
              <div className="flex justify-between gap-4">
                <span>Total Value:</span>
                <span className="font-medium text-white">{formatINR(activeTooltip.value)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-gray-800">
              <span>Assigned Bucket:</span>
              {activeTooltip.bucketId ? (
                <span className="font-bold text-amber-300">
                  {BUCKET_THEMES.find(t => t.id === activeTooltip.bucketId)?.label}
                </span>
              ) : (
                <span className="text-gray-400">Unallocated</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
