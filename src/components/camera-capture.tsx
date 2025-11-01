"use client";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";

type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};
/**
 * CameraCapture
 * - Start/stop camera and show a live preview.
 * - Capture sends the current frame via onCapture, but does not auto-stop the camera.
 * - Shows the last captured photo preview.
 */
export function CameraCapture({
  onCapture,
  disabled = false,
  className = "",
}: CameraCaptureProps) {
  const {
    videoRef,
    isActive,
    isCapturing,
    lastPhoto,
    error,
    start,
    stop,
    capture,
  } = useCamera();
  const handleCapture = useCallback(async () => {
    try {
      const dataUrl = await capture();
      await onCapture(dataUrl);
    } catch (_e) {
      // Capture error - user can retry
    }
  }, [capture, onCapture]);
  return (
    <div
      className={`flex flex-col items-end gap-2 rounded-md p-2${className ?? ""}`}
    >
      {/* Always render the video so the ref is ready when start() is called */}
      <video
        autoPlay
        className={
          "h-auto w-56 rounded-md border border-gray-300 bg-black shadow" +
          (isActive ? "block" : "hidden")
        }
        muted
        ref={videoRef}
      />
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-700 text-xs">
          {error}
        </div>
      )}
      {isActive ? (
        <div className="flex gap-2">
          <Button
            disabled={disabled || isCapturing}
            onClick={handleCapture}
            variant="primary"
          >
            {isCapturing ? "Capturing…" : "Capture"}
          </Button>
          <Button onClick={stop} variant="outline">
            Stop Camera
          </Button>
        </div>
      ) : (
        <Button disabled={disabled} onClick={start} variant="primary">
          Start Camera
        </Button>
      )}
      {lastPhoto && (
        <img
          alt="Last captured"
          className="h-auto w-40 rounded-md border border-gray-300 bg-white shadow-md"
          height={120}
          src={lastPhoto}
          width={160}
        />
      )}
    </div>
  );
}
