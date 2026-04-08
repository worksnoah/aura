export function startAuraSpeechRecognition({ onTranscript, onStateChange, onError }) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.(new Error("Speech recognition not supported in this browser."));
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onstart = () => {
    onStateChange?.("listening");
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (transcript) {
      onTranscript?.(transcript);
    }
  };

  recognition.onerror = (event) => {
    onStateChange?.("idle");
    onError?.(new Error(event.error || "Speech recognition failed"));
  };

  recognition.onend = () => {
    onStateChange?.("idle");
  };

  recognition.start();
  return recognition;
}