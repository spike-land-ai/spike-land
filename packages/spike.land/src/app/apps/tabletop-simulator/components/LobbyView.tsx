"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Dices,
  Gamepad2,
  LogIn,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LobbyViewProps {
  inputRoomCode: string;
  connectionStatus: "idle" | "connecting" | "connected" | "error";
  errorMessage: string | null;
  isCreatingRoom: boolean;
  setInputRoomCode: (code: string) => void;
  createRoom: () => Promise<void>;
  joinRoom: () => void;
}

export function LobbyView({
  inputRoomCode,
  connectionStatus,
  errorMessage,
  isCreatingRoom,
  setInputRoomCode,
  createRoom,
  joinRoom,
}: LobbyViewProps) {
  const isConnecting = connectionStatus === "connecting" || isCreatingRoom;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md text-center space-y-8"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            <span>3D Multiplayer Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            Tabletop Sim
          </h1>
          <p className="text-zinc-400 text-lg">
            Gather your friends for board games and RPGs in a shared 3D space.
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        <div className="grid gap-6">
          {/* Create Room */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Start a New Session
              </CardTitle>
              <CardDescription>
                Create a private room and invite your friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => void createRoom()}
                disabled={isConnecting}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                {isCreatingRoom ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500">
                Or join existing
              </span>
            </div>
          </div>

          {/* Join Room */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <LogIn className="w-5 h-5 text-emerald-400" />
                Join by Code
              </CardTitle>
              <CardDescription>
                Enter the 6-character code from your host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={inputRoomCode}
                  onChange={e => setInputRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && joinRoom()}
                  placeholder="CODE123"
                  maxLength={6}
                  disabled={isConnecting}
                  className="bg-black/40 border-white/10 text-center font-mono text-lg tracking-widest uppercase focus-visible:ring-emerald-500/50 disabled:opacity-50"
                />
                <Button
                  onClick={joinRoom}
                  disabled={inputRoomCode.length < 3 || isConnecting}
                  variant="secondary"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-60"
                >
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex items-center gap-6 text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="text-xs">Real-time Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dices className="w-4 h-4" />
              <span className="text-xs">Physics Dice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-xs">3D Board</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            Powered by WebRTC &amp; React Three Fiber
          </p>
        </div>
      </motion.div>
    </div>
  );
}
