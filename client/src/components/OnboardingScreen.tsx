import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

interface OnboardingScreenProps {
  onCreateRoom: (name: string, videoUrl: string) => void;
  onJoinRoom: (name: string, roomId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const OnboardingScreen = ({
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
  error = null,
}: OnboardingScreenProps) => {
  const [activeTab, setActiveTab] = useState<string>("create");
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [joinName, setJoinName] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    if (!name || !videoUrl) return;
    onCreateRoom(name, videoUrl);
  };

  const handleJoinRoom = () => {
    if (!joinName || !roomId) return;
    onJoinRoom(joinName, roomId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark bg-opacity-95 p-4">
      <Card className="max-w-md w-full bg-darkgray shadow-2xl">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <span className="text-primary">Couple</span>
              <span className="mx-2">Movie Night</span>
              <i className="fas fa-film text-secondary"></i>
            </h1>
            <p className="text-gray-300">Watch together, stay connected</p>
          </div>

          <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex justify-center space-x-4 mb-6 bg-transparent">
              <TabsTrigger 
                value="create" 
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "create" 
                    ? "bg-primary text-white" 
                    : "text-gray-300"
                }`}
              >
                Create Room
              </TabsTrigger>
              <TabsTrigger 
                value="join" 
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "join" 
                    ? "bg-primary text-white" 
                    : "text-gray-300"
                }`}
              >
                Join Room
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-lightgray border-0 text-white focus:ring-2 focus:ring-primary"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <Label htmlFor="video-url" className="text-sm font-medium text-gray-300">
                  Video URL (YouTube or MP4)
                </Label>
                <Input
                  id="video-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-lightgray border-0 text-white focus:ring-2 focus:ring-primary"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="pt-2">
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-6 hover:opacity-90"
                  onClick={handleCreateRoom}
                  disabled={isLoading || !name || !videoUrl}
                >
                  {isLoading ? (
                    <div className="loader w-5 h-5 border-2 border-white rounded-full border-t-transparent"></div>
                  ) : (
                    "Create Private Room"
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div>
                <Label htmlFor="join-name" className="text-sm font-medium text-gray-300">
                  Your Name
                </Label>
                <Input
                  id="join-name"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="bg-lightgray border-0 text-white focus:ring-2 focus:ring-primary"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <Label htmlFor="room-id" className="text-sm font-medium text-gray-300">
                  Room ID
                </Label>
                <Input
                  id="room-id"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-lightgray border-0 text-white focus:ring-2 focus:ring-primary"
                  placeholder="Enter room ID"
                />
              </div>

              <div className="pt-2">
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-6 hover:opacity-90"
                  onClick={handleJoinRoom}
                  disabled={!joinName || !roomId}
                >
                  Join Room
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-destructive/20 border border-destructive rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{error}</span>
            </div>
          )}

          <div className="text-center text-sm text-gray-400 mt-4">
            <p>By using this service, you agree to our Privacy Policy and Terms of Service.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingScreen;
