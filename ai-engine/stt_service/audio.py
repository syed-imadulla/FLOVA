import subprocess
import io
import wave
import numpy as np

def convert_audio_to_16k_mono_wav(audio_bytes: bytes, input_format: str = "webm") -> bytes:
    """
    Converts incoming audio bytes (WebM, OGG, MP4, WAV, MP3) into 16 kHz 16-bit mono PCM WAV
    using ffmpeg subprocess.
    """
    cmd = [
        "ffmpeg",
        "-y",
        "-f", input_format if input_format in ["webm", "ogg", "mp4", "wav", "mp3"] else "webm",
        "-i", "pipe:0",
        "-acodec", "pcm_s16le",
        "-ac", "1",
        "-ar", "16000",
        "-f", "wav",
        "pipe:1"
    ]
    try:
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate(input=audio_bytes, timeout=10)
        if process.returncode != 0:
            # Fallback attempt letting ffmpeg auto-detect format
            fallback_cmd = [
                "ffmpeg",
                "-y",
                "-i", "pipe:0",
                "-acodec", "pcm_s16le",
                "-ac", "1",
                "-ar", "16000",
                "-f", "wav",
                "pipe:1"
            ]
            fallback_proc = subprocess.Popen(
                fallback_cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = fallback_proc.communicate(input=audio_bytes, timeout=10)
            if fallback_proc.returncode != 0:
                raise RuntimeError(f"FFmpeg audio conversion failed: {stderr.decode(errors='ignore')}")
        return stdout
    except subprocess.TimeoutExpired:
        raise TimeoutError("Audio conversion timed out after 10 seconds.")

def load_wav_as_numpy(wav_bytes: bytes) -> tuple[np.ndarray, int]:
    """
    Loads 16-bit PCM WAV bytes into a normalized float32 numpy array and sample rate.
    """
    with io.BytesIO(wav_bytes) as bio:
        with wave.open(bio, "rb") as wf:
            sample_rate = wf.getframerate()
            num_channels = wf.getnchannels()
            num_frames = wf.getnframes()
            raw_data = wf.readframes(num_frames)
            
            # 16-bit signed integer PCM
            audio_array = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32)
            
            # Downmix to mono if multi-channel
            if num_channels > 1:
                audio_array = audio_array.reshape(-1, num_channels).mean(axis=1)
                
            # Normalize to [-1.0, 1.0]
            if len(audio_array) > 0 and np.max(np.abs(audio_array)) > 0:
                audio_array = audio_array / 32768.0
                
            return audio_array, sample_rate
