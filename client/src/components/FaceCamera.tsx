import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

interface Props {
  onDescriptor: (descriptor: Float32Array, photo: string) => void;
  onError?: (msg: string) => void;
  buttonLabel?: string;
  compact?: boolean;
}

export default function FaceCamera({ onDescriptor, onError, buttonLabel = "Capture Face", compact = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Load models
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (!cancelled) setModelsLoaded(true);
      } catch {
        if (!cancelled) {
          setCameraError("Failed to load face detection models.");
          onError?.("Failed to load face detection models.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Start camera
  useEffect(() => {
    if (!modelsLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setCameraError("Camera access denied. Please allow camera permissions.");
          onError?.("Camera access denied.");
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [modelsLoaded]);

  // Real-time face detection overlay
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;

    const detect = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks();

      setFaceDetected(!!detection);

      if (canvasRef.current && video) {
        const canvas = canvasRef.current;
        const dims = faceapi.matchDimensions(canvas, video, true);
        faceapi.draw.drawDetections(canvas, detection ? faceapi.resizeResults([detection], dims) : []);
        faceapi.draw.drawFaceLandmarks(canvas, detection ? faceapi.resizeResults([detection], dims) : []);
      }
    };

    intervalRef.current = window.setInterval(detect, 300);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modelsLoaded]);

  const capture = useCallback(async () => {
    if (!videoRef.current || detecting) return;
    setDetecting(true);

    try {
      const video = videoRef.current;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        onError?.("No face detected. Please make sure your face is clearly visible and well-lit.");
        return;
      }

      // Capture photo
      const offscreen = document.createElement("canvas");
      offscreen.width = video.videoWidth;
      offscreen.height = video.videoHeight;
      offscreen.getContext("2d")!.drawImage(video, 0, 0);
      const photo = offscreen.toDataURL("image/jpeg", 0.7);

      onDescriptor(detection.descriptor, photo);
    } catch {
      onError?.("Face detection failed. Please try again.");
    } finally {
      setDetecting(false);
    }
  }, [detecting, onDescriptor, onError]);

  if (loading) {
    return (
      <div className="face-camera__loading">
        <div className="spinner" />
        <p>Loading face detection models...</p>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="face-camera__error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p>{cameraError}</p>
      </div>
    );
  }

  return (
    <div className={`face-camera${compact ? " face-camera--compact" : ""}`}>
      <div className="face-camera__viewport">
        <video ref={videoRef} autoPlay muted playsInline className="face-camera__video" />
        <canvas ref={canvasRef} className="face-camera__overlay" />
        <div className={`face-camera__indicator ${faceDetected ? "face-camera__indicator--ok" : ""}`}>
          {faceDetected ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Face Detected</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Position your face</>
          )}
        </div>
      </div>

      <button
        className="button button--primary face-camera__capture"
        onClick={capture}
        disabled={detecting || !faceDetected}
      >
        {detecting ? "Detecting..." : buttonLabel}
      </button>
    </div>
  );
}
