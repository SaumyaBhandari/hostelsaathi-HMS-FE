import { useState, useRef, useCallback, useEffect } from 'react';

export default function WebcamCapture({ onCapture, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);

    // Effect to attach stream to video element after component renders
    useEffect(() => {
        if (stream && videoRef.current && isCameraActive) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play().catch(err => {
                    console.error('Video play error:', err);
                });
            };
        }
    }, [stream, isCameraActive]);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const startCamera = useCallback(async () => {
        try {
            setError('');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            // Set camera active first so video element renders
            setIsCameraActive(true);
            // Then set the stream (useEffect will attach it to video)
            setStream(mediaStream);
        } catch (err) {
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Camera access denied. Please allow camera permissions.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
            } else {
                setError('Failed to access camera. Please try again.');
            }
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    }, [stream]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL (base64 JPEG)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
    }, [stopCamera]);

    const retake = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    const confirmCapture = useCallback(() => {
        if (capturedImage && onCapture) {
            onCapture(capturedImage);
        }
    }, [capturedImage, onCapture]);

    const handleClose = useCallback(() => {
        stopCamera();
        if (onClose) onClose();
    }, [stopCamera, onClose]);

    return (
        <div className="webcam-modal-overlay" onClick={handleClose}>
            <div className="webcam-modal" onClick={e => e.stopPropagation()}>
                <div className="webcam-header">
                    <h3>📷 Take Photo</h3>
                    <button className="btn-close" onClick={handleClose}>×</button>
                </div>

                <div className="webcam-content">
                    {error && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    {!isCameraActive && !capturedImage && (
                        <div className="webcam-placeholder">
                            <div className="placeholder-icon">📷</div>
                            <p>Click the button below to start camera</p>
                            <button className="btn btn-primary" onClick={startCamera}>
                                Start Camera
                            </button>
                        </div>
                    )}

                    {isCameraActive && (
                        <div className="webcam-preview">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="webcam-video"
                                style={{ display: 'block', width: '100%', backgroundColor: '#000' }}
                            />
                            <div className="webcam-overlay">
                                <div className="face-guide" />
                            </div>
                        </div>
                    )}

                    {capturedImage && (
                        <div className="webcam-preview">
                            <img src={capturedImage} alt="Captured" className="captured-image" />
                        </div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                <div className="webcam-actions">
                    {isCameraActive && (
                        <>
                            <button className="btn btn-secondary" onClick={stopCamera}>
                                Cancel
                            </button>
                            <button className="btn btn-primary btn-capture" onClick={capturePhoto}>
                                📸 Capture
                            </button>
                        </>
                    )}

                    {capturedImage && (
                        <>
                            <button className="btn btn-secondary" onClick={retake}>
                                ↻ Retake
                            </button>
                            <button className="btn btn-primary" onClick={confirmCapture}>
                                ✓ Use Photo
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
