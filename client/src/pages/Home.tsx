import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import OnboardingScreen from "@/components/OnboardingScreen";

const Home = () => {
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (name: string, videoUrl: string) => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log("Creating room with:", { username: name, videoUrl });
      
      const response = await apiRequest("POST", "/api/rooms", {
        username: name,
        videoUrl,
      });
      
      const data = await response.json();
      console.log("Room created successfully:", data);
      
      // Store username in session storage for later use
      sessionStorage.setItem("username", name);
      
      // Redirect to the room
      console.log(`Redirecting to: /room/${data.roomId}`);
      setLocation(`/room/${data.roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setError("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (name: string, roomId: string) => {
    if (!name || !roomId) {
      setError("Please enter your name and a room ID");
      return;
    }
    
    // Store user info in sessionStorage for later use
    sessionStorage.setItem("username", name);
    
    // Redirect to the room
    setLocation(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-dark">
      <OnboardingScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isLoading={isCreating}
        error={error}
      />
    </div>
  );
};

export default Home;
