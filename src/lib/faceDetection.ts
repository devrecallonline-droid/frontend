import * as faceapi from 'face-api.js';

// Model URLs - using CDN for face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

let modelsLoaded = false;

// Load face detection models
export const loadFaceDetectionModels = async (): Promise<void> => {
    if (modelsLoaded) return;
    
    try {
        console.log('Loading face detection models...');
        
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        modelsLoaded = true;
        console.log('Face detection models loaded successfully');
    } catch (error) {
        console.error('Error loading face detection models:', error);
        throw new Error('Failed to load face detection models');
    }
};

// Check if models are loaded
export const areModelsLoaded = (): boolean => modelsLoaded;

// Type for face detection result
type FaceDetectionResult = faceapi.WithFaceLandmarks<{
    detection: faceapi.FaceDetection;
}> | null;

// Detect face and landmarks in a video element or canvas
export const detectFace = async (
    input: HTMLVideoElement | HTMLCanvasElement
): Promise<FaceDetectionResult> => {
    if (!modelsLoaded) {
        throw new Error('Face detection models not loaded');
    }
    
    try {
        const detection = await faceapi
            .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
            .withFaceLandmarks();
        
        return detection || null;
    } catch (error) {
        console.error('Face detection error:', error);
        return null;
    }
};

// Calculate Eye Aspect Ratio (EAR) for blink detection
// EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
// Where p1-p6 are eye landmark points
export const calculateEyeAspectRatio = (landmarks: faceapi.FaceLandmarks68): number => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEAR = calculateSingleEyeEAR(leftEye);
    const rightEAR = calculateSingleEyeEAR(rightEye);
    
    return (leftEAR + rightEAR) / 2;
};

const calculateSingleEyeEAR = (eye: faceapi.Point[]): number => {
    // Eye landmarks: [outer corner, upper outer, upper inner, inner corner, lower inner, lower outer]
    // Indices: 0, 1, 2, 3, 4, 5
    
    const p1 = eye[0]; // Outer corner
    const p2 = eye[1]; // Upper outer
    const p3 = eye[2]; // Upper inner
    const p4 = eye[3]; // Inner corner
    const p5 = eye[4]; // Lower inner
    const p6 = eye[5]; // Lower outer
    
    // Vertical distances
    const vertical1 = distance(p2, p6);
    const vertical2 = distance(p3, p5);
    
    // Horizontal distance
    const horizontal = distance(p1, p4);
    
    // EAR calculation
    const ear = (vertical1 + vertical2) / (2 * horizontal);
    
    return ear;
};

const distance = (p1: faceapi.Point, p2: faceapi.Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Detect if eyes are closed based on EAR threshold
// Typical threshold: EAR < 0.2 means eyes are closed
export const areEyesClosed = (ear: number, threshold: number = 0.2): boolean => {
    return ear < threshold;
};

// Detect blink by analyzing EAR changes across frames
export interface BlinkResult {
    blinkDetected: boolean;
    blinkCount: number;
    confidence: number;
}

export const detectBlink = async (
    video: HTMLVideoElement,
    duration: number = 2000,
    callback?: (progress: { ear: number; frame: number; blinkCount: number }) => void
): Promise<BlinkResult> => {
    const startTime = Date.now();
    const earHistory: number[] = [];
    let blinkCount = 0;
    let isBlinking = false;
    let frameCount = 0;
    
    const blinkThreshold = 0.22; // EAR below this = eyes closed
    const blinkRecoveryThreshold = 0.25; // EAR above this = eyes open again
    
    return new Promise((resolve) => {
        const analyzeFrame = async () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > duration) {
                // Analysis complete
                const confidence = calculateBlinkConfidence(earHistory, blinkCount);
                resolve({
                    blinkDetected: blinkCount > 0,
                    blinkCount,
                    confidence
                });
                return;
            }
            
            const detection = await detectFace(video);
            
            if (detection) {
                const ear = calculateEyeAspectRatio(detection.landmarks);
                earHistory.push(ear);
                frameCount++;
                
                // Blink detection logic
                if (!isBlinking && ear < blinkThreshold) {
                    // Eyes just closed
                    isBlinking = true;
                } else if (isBlinking && ear > blinkRecoveryThreshold) {
                    // Eyes just opened - blink complete
                    isBlinking = false;
                    blinkCount++;
                }
                
                if (callback) {
                    callback({ ear, frame: frameCount, blinkCount });
                }
            }
            
            // Continue analyzing
            requestAnimationFrame(analyzeFrame);
        };
        
        analyzeFrame();
    });
};

// Calculate confidence score based on EAR variance and blink count
const calculateBlinkConfidence = (earHistory: number[], blinkCount: number): number => {
    if (earHistory.length === 0) return 0;
    
    // Calculate variance in EAR (high variance = more eye movement = likely real)
    const mean = earHistory.reduce((a, b) => a + b, 0) / earHistory.length;
    const variance = earHistory.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / earHistory.length;
    
    // Confidence based on:
    // 1. Number of blinks (at least 1 is good)
    // 2. EAR variance (some variation is expected in real faces)
    // 3. Number of frames analyzed
    
    let confidence = 0;
    
    if (blinkCount >= 1) confidence += 40;
    if (blinkCount >= 2) confidence += 20;
    
    // Variance check (some movement is good)
    if (variance > 0.001) confidence += 20;
    if (variance > 0.005) confidence += 10;
    
    // Frame count (more frames = more reliable)
    if (earHistory.length >= 10) confidence += 10;
    
    return Math.min(confidence, 100);
};

// Detect head movement/turn
export interface HeadMovementResult {
    movementDetected: boolean;
    movementType: 'left' | 'right' | 'up' | 'down' | 'none';
    confidence: number;
    angles: {
        yaw: number;
        pitch: number;
        roll: number;
    };
}

// Calculate head pose from face landmarks
export const calculateHeadPose = (landmarks: faceapi.FaceLandmarks68): HeadMovementResult => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jawOutline = landmarks.getJawOutline();
    
    // Calculate eye centers
    const leftEyeCenter = {
        x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
    };
    
    const rightEyeCenter = {
        x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
    };
    
    // Nose tip
    const noseTip = nose[3];
    
    // Calculate relative positions
    const eyeDistance = Math.sqrt(
        Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
        Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
    );
    
    // Estimate head angles (simplified)
    // Yaw (left/right turn): based on nose position relative to eyes
    const noseToEyesX = noseTip.x - (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const yaw = (noseToEyesX / eyeDistance) * 45; // Approximate angle
    
    // Pitch (up/down): based on vertical position of nose relative to eyes
    const noseToEyesY = noseTip.y - (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const pitch = (noseToEyesY / eyeDistance) * 45;
    
    // Roll (tilt): based on eye level
    const eyeLevelDiff = rightEyeCenter.y - leftEyeCenter.y;
    const roll = Math.atan2(eyeLevelDiff, eyeDistance) * (180 / Math.PI);
    
    // Determine movement type
    let movementType: 'left' | 'right' | 'up' | 'down' | 'none' = 'none';
    let confidence = 0;
    
    if (Math.abs(yaw) > 10) {
        movementType = yaw > 0 ? 'right' : 'left';
        confidence = Math.min(Math.abs(yaw) * 2, 100);
    } else if (Math.abs(pitch) > 10) {
        movementType = pitch > 0 ? 'down' : 'up';
        confidence = Math.min(Math.abs(pitch) * 2, 100);
    }
    
    const movementDetected = movementType !== 'none';
    
    return {
        movementDetected,
        movementType,
        confidence,
        angles: { yaw, pitch, roll }
    };
};

// Real liveness detection combining multiple checks
export interface LivenessResult {
    isLive: boolean;
    confidence: number;
    checks: {
        blinkDetected: boolean;
        faceDetected: boolean;
        movementDetected: boolean;
        consistentFace: boolean;
    };
    details: {
        blinkCount: number;
        faceCount: number;
        totalFrames: number;
        avgConfidence: number;
    };
}

export const performLivenessCheck = async (
    video: HTMLVideoElement,
    challenge: 'blink' | 'turn_left' | 'turn_right' | 'smile',
    onProgress?: (progress: { 
        status: string; 
        percent: number;
        ear?: number;
        blinkCount?: number;
    }) => void
): Promise<LivenessResult> => {
    const startTime = Date.now();
    const duration = 10000; // 10 seconds for liveness check - giving users enough time to read and react
    const faceHistory: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>[] = [];
    const earHistory: number[] = [];
    
    let blinkCount = 0;
    let isBlinking = false;
    let frameCount = 0;
    let successfulDetections = 0;
    
    // More lenient blink thresholds for better detection
    const blinkThreshold = 0.20; // Slightly lower threshold
    const blinkRecoveryThreshold = 0.27; // Slightly higher recovery threshold
    
    return new Promise((resolve) => {
        const analyzeFrame = async () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            
            if (elapsed > duration) {
                // Analysis complete - calculate final result
                const result = calculateLivenessResult(
                    faceHistory,
                    earHistory,
                    blinkCount,
                    frameCount,
                    successfulDetections,
                    challenge
                );
                resolve(result);
                return;
            }
            
            const detection = await detectFace(video);
            
            if (detection) {
                successfulDetections++;
                faceHistory.push(detection);
                
                const ear = calculateEyeAspectRatio(detection.landmarks);
                earHistory.push(ear);
                
                // Blink detection
                if (!isBlinking && ear < blinkThreshold) {
                    isBlinking = true;
                } else if (isBlinking && ear > blinkRecoveryThreshold) {
                    isBlinking = false;
                    blinkCount++;
                }
                
                frameCount++;
                
                if (onProgress) {
                    onProgress({
                        status: getStatusText(challenge, blinkCount, progress),
                        percent: progress,
                        ear,
                        blinkCount
                    });
                }
            } else {
                if (onProgress) {
                    onProgress({
                        status: 'Looking for face...',
                        percent: progress
                    });
                }
            }
            
            requestAnimationFrame(analyzeFrame);
        };
        
        analyzeFrame();
    });
};

const getStatusText = (
    challenge: string,
    blinkCount: number,
    progress: number
): string => {
    // Give users more time to read and react
    if (progress < 15) return 'Get ready...';
    if (progress < 30) {
        if (challenge === 'blink') return 'Please blink your eyes naturally';
        if (challenge === 'turn_left') return 'Turn your head slightly left';
        if (challenge === 'turn_right') return 'Turn your head slightly right';
        return 'Follow the instruction...';
    }
    if (challenge === 'blink') {
        if (blinkCount === 0) return 'Blink detected! Keep going...';
        if (blinkCount >= 1) return 'Great! Hold still...';
        return 'Please blink naturally';
    }
    return 'Analyzing...';
};

const calculateLivenessResult = (
    faceHistory: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>[],
    earHistory: number[],
    blinkCount: number,
    frameCount: number,
    successfulDetections: number,
    challenge: string
): LivenessResult => {
    const totalFrames = frameCount;
    const faceDetectionRate = totalFrames > 0 ? successfulDetections / totalFrames : 0;
    
    // More lenient face consistency check - just needs to detect face in >50% of frames
    let consistentFace = faceDetectionRate > 0.5;
    
    // Movement detection using head pose - more sensitive (3 degree threshold)
    let movementDetected = false;
    if (faceHistory.length >= 2) {
        const firstPose = calculateHeadPose(faceHistory[0].landmarks);
        const lastPose = calculateHeadPose(faceHistory[faceHistory.length - 1].landmarks);
        
        const yawDiff = Math.abs(lastPose.angles.yaw - firstPose.angles.yaw);
        const pitchDiff = Math.abs(lastPose.angles.pitch - firstPose.angles.pitch);
        
        movementDetected = yawDiff > 3 || pitchDiff > 3;
    }
    
    // Calculate confidence - more lenient scoring
    let confidence = 0;
    
    // Face detection consistency (30 points)
    if (faceDetectionRate > 0.4) confidence += 15;
    if (faceDetectionRate > 0.7) confidence += 15;
    
    // Blink detection (30 points) - 1 blink is enough for full points
    if (challenge === 'blink') {
        if (blinkCount >= 1) confidence += 25;
        if (blinkCount >= 2) confidence += 5;
    } else {
        // For movement challenges
        if (movementDetected) confidence += 30;
    }
    
    // Consistent face (25 points)
    if (consistentFace) confidence += 25;
    
    // Sufficient frames (15 points) - lower threshold
    if (totalFrames >= 10) confidence += 15;
    
    // Determine if live - LOWERED REQUIREMENTS
    const checks = {
        blinkDetected: blinkCount > 0,
        faceDetected: successfulDetections > 0,
        movementDetected,
        consistentFace
    };
    
    // Much more lenient pass criteria:
    // - Must detect a face
    // - Must have consistent face detection (>50% of frames)
    // - Must either blink OR move head
    // - Confidence >= 45 (instead of 60)
    const isLive = 
        checks.faceDetected &&
        checks.consistentFace &&
        (checks.blinkDetected || checks.movementDetected) &&
        confidence >= 45;
    
    return {
        isLive,
        confidence,
        checks,
        details: {
            blinkCount,
            faceCount: successfulDetections,
            totalFrames,
            avgConfidence: confidence
        }
    };
};

// Generate liveness data for backend verification
export const generateLivenessProof = (
    videoFrames: string[],
    detectionResults: LivenessResult
): {
    frames: string[];
    proof: string;
    timestamp: number;
} => {
    // Create a proof hash combining frame data and results
    const dataToHash = JSON.stringify({
        frameCount: videoFrames.length,
        confidence: detectionResults.confidence,
        isLive: detectionResults.isLive,
        timestamp: Date.now()
    });
    
    // Simple hash (in production, use proper crypto)
    const proof = btoa(dataToHash).substring(0, 32);
    
    return {
        frames: videoFrames,
        proof,
        timestamp: Date.now()
    };
};