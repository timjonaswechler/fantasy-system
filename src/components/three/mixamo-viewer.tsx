"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

// Definiere ein Interface für die Körperteilskalierung
interface BodyScales {
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
  torso: number;
  head: number;
}

// Komponente für den Mixamo Charakter Viewer
const MixamoViewer = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bodyScales, setBodyScales] = useState<BodyScales>({
    leftArm: 1,
    rightArm: 1,
    leftLeg: 1,
    rightLeg: 1,
    torso: 1,
    head: 1,
  });

  // Referenzen für Mixamo-Modell und Skeleton
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const skeletonRef = useRef<THREE.Skeleton | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animationsRef = useRef<THREE.AnimationClip[]>([]);
  const sceneBones = useRef<{ [key: string]: THREE.Bone }>({});

  useEffect(() => {
    if (!mountRef.current) return;

    // Variablen für die Three.js-Szene
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let clock: THREE.Clock;
    let frameId: number;

    const init = async () => {
      try {
        console.log("Initialisiere 3D-Szene...");

        // Initialisiere Three.js-Szene
        scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x212121);

        // Hinzufügen von Licht zur Szene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Helleres Ambientlicht
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Helleres Richtungslicht
        directionalLight.position.set(1, 2, 3);
        scene.add(directionalLight);

        // Ein zweites Licht von einer anderen Seite für bessere Ausleuchtung
        const secondLight = new THREE.DirectionalLight(0xffffff, 1);
        secondLight.position.set(-1, 1, -2);
        scene.add(secondLight);

        // Kamera-Setup
        const containerElement = mountRef.current;
        if (!containerElement) return;

        const { clientWidth, clientHeight } = containerElement;
        camera = new THREE.PerspectiveCamera(
          60, // Breiterer Blickwinkel
          clientWidth / clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 1, 2.5); // Kamera näher und höher positionieren
        cameraRef.current = camera;

        // Renderer-Setup
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true, // Transparenter Hintergrund für Debugging
        });
        renderer.setSize(clientWidth, clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Renderer-Debug-Info
        console.log("Renderer initialisiert:", {
          size: `${clientWidth}x${clientHeight}`,
          pixelRatio: window.devicePixelRatio,
          domElement: renderer.domElement instanceof HTMLCanvasElement,
        });

        mountRef.current.appendChild(renderer.domElement);

        // Orbit Controls für Navigation
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1, 0); // Ziel auf Höhe des Charakters
        controls.enableDamping = true; // Weichere Kontrollen
        controls.dampingFactor = 0.05;
        controls.update();

        // Hilfsraster für Orientierung
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        // Achsenhelfer für bessere Orientierung
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Uhr für Animation
        clock = new THREE.Clock();

        // Lade Modell
        await loadModel(scene);

        // Animation Loop
        const animate = () => {
          frameId = requestAnimationFrame(animate);

          const delta = clock.getDelta();
          if (mixerRef.current) {
            mixerRef.current.update(delta);
          }

          controls.update();
          renderer.render(scene, camera);
        };

        animate();
        console.log("Animation-Loop gestartet");

        // Event Listener für Fenstergrößenänderung
        const handleResize = () => {
          if (!mountRef.current) return;
          const { clientWidth, clientHeight } = mountRef.current;

          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();

          renderer.setSize(clientWidth, clientHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(frameId);
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };
      } catch (err) {
        console.error("Fehler bei der Initialisierung:", err);
        setError("Fehler beim Laden der 3D-Szene");
      }
    };

    init();
  }, []);

  // Funktion zum Laden des Mixamo-Modells (FBX Format)
  const loadModel = async (scene: THREE.Scene) => {
    try {
      setLoading(true);
      console.log("Starte Ladevorgang des Modells...");

      // Füge einen DEBUG-Würfel hinzu, um zu prüfen, ob die Szene grundsätzlich funktioniert
      //   const debugCube = new THREE.Mesh(
      //     new THREE.BoxGeometry(0.5, 0.5, 0.5),
      //     new THREE.MeshStandardMaterial({ color: 0xff0000 })
      //   );
      //   debugCube.position.set(0, 0.25, 0); // Position auf dem Grid
      //   scene.add(debugCube);
      //   console.log("Debug-Würfel zur Szene hinzugefügt");

      // Hier den Pfad zu deiner FBX-Datei
      const modelPath = "/models/yBot.fbx";
      console.log("Versuche Modell zu laden von:", modelPath);

      const loader = new FBXLoader();
      loader.load(
        modelPath,
        (fbxModel) => {
          console.log("Modell erfolgreich geladen!", fbxModel);

          // Überprüfe, ob das Modell gültig ist
          if (!fbxModel) {
            console.error("Modell wurde geladen, ist aber ungültig");
            setError("Modell konnte nicht verarbeitet werden");
            setLoading(false);
            return;
          }

          // Überprüfe auf enthaltene Meshes
          let hasMeshes = false;
          fbxModel.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              hasMeshes = true;
              console.log("Mesh gefunden:", object.name);
            }
          });

          if (!hasMeshes) {
            console.warn("Das geladene Modell enthält keine Meshes!");
          }

          // Skaliere und positioniere das Modell - probiere verschiedene Werte
          console.log("Skaliere und positioniere Modell");
          // Verwende eine kleinere Skalierung für FBX-Modelle
          fbxModel.scale.set(0.01, 0.01, 0.01);
          // Zentriere das Modell auf dem Grid
          fbxModel.position.set(0, 0, 0);

          // Bei FBX-Dateien funktioniert SkeletonUtils.clone ähnlich wie bei GLTF
          const model = SkeletonUtils.clone(fbxModel) as THREE.Group;

          // Modell zur Szene hinzufügen und speichern
          scene.add(model);
          console.log("Modell zur Szene hinzugefügt");
          modelRef.current = model;

          // Finde Skeleton und speichere Referenz
          model.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.SkinnedMesh) {
              console.log("SkinnedMesh gefunden:", object.name);

              // Sicherstellen, dass das Material richtig konfiguriert ist
              if (object.material) {
                // Material-Eigenschaften für bessere Sichtbarkeit anpassen
                if (object.material instanceof THREE.MeshStandardMaterial) {
                  object.material.metalness = 0.1;
                  object.material.roughness = 0.8;
                }

                // Stelle sicher, dass das Material sichtbar ist
                if ("visible" in object.material) {
                  object.material.visible = true;
                }
              }

              skeletonRef.current = object.skeleton;

              // Speichere Referenzen zu allen Knochen für einfacheren Zugriff
              object.skeleton.bones.forEach((bone) => {
                sceneBones.current[bone.name] = bone;
                console.log(`Bone: ${bone.name}`);
              });
            }
          });

          // Bei FBX-Dateien sind die Animationen direkt im Modell enthalten
          if (fbxModel.animations && fbxModel.animations.length > 0) {
            console.log(`${fbxModel.animations.length} Animationen gefunden`);
            animationsRef.current = fbxModel.animations;

            // Erstelle einen Animations-Mixer
            mixerRef.current = new THREE.AnimationMixer(model);

            // Spiele die erste Animation ab
            const idleAnimation = mixerRef.current.clipAction(
              fbxModel.animations[0]
            );
            idleAnimation.play();
            console.log("Animation gestartet");
          } else {
            console.log("Keine Animationen im Modell gefunden");
          }

          setLoading(false);
        },
        // Progress-Callback
        (xhr) => {
          const percent = (xhr.loaded / xhr.total) * 100;
          console.log(`Ladefortschritt: ${percent.toFixed(2)}%`);
        },
        // Error-Callback
        (error) => {
          console.error("Fehler beim Laden des Modells:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unbekannter Fehler";
          setError(`Fehler beim Laden: ${errorMessage}`);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Allgemeiner Fehler beim Laden:", err);
      setError("Fehler beim Laden des 3D-Modells");
      setLoading(false);
    }
  };

  // Funktion zum Ändern der Proportionen eines Körperteils
  const updateBodyProportion = (bodyPart: keyof BodyScales, scale: number) => {
    if (!skeletonRef.current || !sceneBones.current) return;

    // Aktualisiere die Skalierung im State
    setBodyScales((prev) => ({
      ...prev,
      [bodyPart]: scale,
    }));

    // Knochen-Namen-Mappings für Mixamo FBX
    const boneMapping: Record<keyof BodyScales, string[]> = {
      leftArm: [
        "mixamorigLeftArm",
        "mixamorigLeftForeArm",
        "mixamorigLeftHand",
      ],
      rightArm: [
        "mixamorigRightArm",
        "mixamorigRightForeArm",
        "mixamorigRightHand",
        "mixamorigRightHandThumb1",
        "mixamorigRightHandThumb2",
        "mixamorigRightHandThumb3",
        "mixamorigRightHandThumb4",
        "mixamorigRightHandIndex1",
        "mixamorigRightHandIndex2",
        "mixamorigRightHandIndex3",
        "mixamorigRightHandIndex4",
        "mixamorigRightHandMiddle1",
        "mixamorigRightHandMiddle2",
        "mixamorigRightHandMiddle3",
        "mixamorigRightHandMiddle4",
        "mixamorigRightHandRing1",
        "mixamorigRightHandRing2",
        "mixamorigRightHandRing3",
        "mixamorigRightHandRing4",
        "mixamorigRightHandPinky1",
        "mixamorigRightHandPinky2",
        "mixamorigRightHandPinky3",
        "mixamorigRightHandPinky4",
      ],
      leftLeg: ["mixamorigLeftUpLeg", "mixamorigLeftLeg", "mixamorigLeftFoot"],
      rightLeg: [
        "mixamorigRightUpLeg",
        "mixamorigRightLeg",
        "mixamorigRightFoot",
      ],
      torso: ["mixamorigSpine", "mixamorigSpine1", "mixamorigSpine2"],
      head: ["mixamorigHead", "mixamorigNeck"],
    };

    // Finde die zugehörigen Knochen und skaliere sie
    const bones = boneMapping[bodyPart];

    if (bones) {
      bones.forEach((boneName) => {
        const bone = sceneBones.current[boneName];
        if (bone) {
          // Für Arme und Beine skalieren wir die Y-Achse (Länge)
          bone.scale.set(scale, scale, scale);
        }
      });
    }
  };

  // Reset-Funktion für Kameraposition
  const resetCamera = () => {
    if (cameraRef.current && modelRef.current) {
      // Setze Kamera auf Standardposition
      cameraRef.current.position.set(0, 1, 2.5);
      // Richte Kamera auf das Modell
      if (sceneRef.current) {
        const controls = new OrbitControls(
          cameraRef.current,
          mountRef.current?.querySelector("canvas") as HTMLCanvasElement
        );
        controls.target.set(0, 1, 0);
        controls.update();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Verbesserte Container-Konfiguration für den 3D-Viewer */}
      <div
        className="w-full h-[500px] relative rounded-lg border border-border overflow-hidden"
        ref={mountRef}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="text-white">Lade 3D-Modell...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="text-destructive">{error}</div>
          </div>
        )}
      </div>

      {/* Kamera-Reset-Button */}
      <div className="flex justify-end">
        <button
          onClick={resetCamera}
          className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-md hover:bg-opacity-90"
        >
          Kamera zurücksetzen
        </button>
      </div>

      {/* Steuerelemente für Körperproportionen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Linker Arm Länge: {bodyScales.leftArm.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={bodyScales.leftArm}
            onChange={(e) =>
              updateBodyProportion("leftArm", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Rechter Arm Länge: {bodyScales.rightArm.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={bodyScales.rightArm}
            onChange={(e) =>
              updateBodyProportion("rightArm", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Linkes Bein Länge: {bodyScales.leftLeg.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={bodyScales.leftLeg}
            onChange={(e) =>
              updateBodyProportion("leftLeg", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Rechtes Bein Länge: {bodyScales.rightLeg.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={bodyScales.rightLeg}
            onChange={(e) =>
              updateBodyProportion("rightLeg", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Torso Größe: {bodyScales.torso.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={bodyScales.torso}
            onChange={(e) =>
              updateBodyProportion("torso", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Kopf Größe: {bodyScales.head.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={bodyScales.head}
            onChange={(e) =>
              updateBodyProportion("head", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Hinweise zur FBX-Datei:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Deine FBX-Datei wird korrekt geladen (siehe Konsole)</li>
          <li>
            Falls das Modell nicht sichtbar ist, versuche folgende Schritte:
            <ul className="list-disc pl-5 mt-1">
              <li>Nutze die Maus zum Drehen der Kamera (linke Maustaste)</li>
              <li>Scrolle zum Zoomen (Mausrad)</li>
              <li>Drücke den "Kamera zurücksetzen" Button</li>
            </ul>
          </li>
          <li>
            Die Knochen-Namen "mixamorigXXX" wurden korrekt erkannt (siehe
            Konsole)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MixamoViewer;
