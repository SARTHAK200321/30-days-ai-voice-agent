const recordToggle = document.getElementById("recordToggle");
const day9Audio = document.getElementById("day9Audio");
const day9Status = document.getElementById("day9Status");
const day9Reply = document.getElementById("day9Reply");
const errorMsgDay9 = document.getElementById("errorMsgDay9");
const chatContainer = document.getElementById("chatContainer");

let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let stream;
const sessionId = "demo-session-1"; // You can replace with dynamic session ID

recordToggle.addEventListener("click", async () => {
  if (!isRecording) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        day9Status.textContent = "Processing...";
        errorMsgDay9.style.display = "none";

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.wav");

        try {
          const response = await fetch(`http://127.0.0.1:8000/agent/chat/${sessionId}`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.error) {
            day9Status.textContent = "❌ Error: " + data.error;
            errorMsgDay9.style.display = "block";
            errorMsgDay9.textContent = data.error;
            return;
          }

          // Show messages in chat view
          appendChatMessage("user", data.transcript || "No transcript.");
          appendChatMessage("bot", data.llm_reply || "No reply.");

          // Show response text separately (optional)
          day9Reply.textContent = data.llm_reply || "No reply.";

          // Play Murf-generated audio
          day9Audio.src = data.murf_audio_url;
          day9Audio.play();

          day9Status.textContent = "✅ Completed!";
        } catch (err) {
          console.error(err);
          day9Status.textContent = "❌ Pipeline failed.";
          errorMsgDay9.style.display = "block";
          errorMsgDay9.textContent = "Backend error occurred.";
        }
      };

      mediaRecorder.start();
      recordToggle.textContent = "⏹ Stop Recording";
      recordToggle.classList.add("recording");
      day9Status.textContent = "🎙 Recording...";
      isRecording = true;

    } catch (err) {
      console.error("Microphone error:", err);
      day9Status.textContent = "❌ Microphone access denied.";
      errorMsgDay9.style.display = "block";
      errorMsgDay9.textContent = "Please allow microphone access.";
    }

  } else {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
    recordToggle.textContent = "🎙 Start Recording";
    recordToggle.classList.remove("recording");
    day9Status.textContent = "⏹ Stopped. Processing...";
    isRecording = false;
  }
});

// Append chat messages
function appendChatMessage(role, message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-message", role === "user" ? "chat-user" : "chat-bot");

  const label = document.createElement("strong");
  label.textContent = role === "user" ? "You:" : "AI:";

  msgDiv.appendChild(label);
  msgDiv.append(" " + message);

  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll
}
