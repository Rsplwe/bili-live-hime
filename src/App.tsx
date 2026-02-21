import { useState, useEffect, useCallback } from "react";
import { AppSidebar, type TabType } from "@/components/app-sidebar";
import { LiveStreamSettings } from "@/view/live-stream-settings";
import { MoreSettings } from "@/view/more-settings";
import { LiveComments } from "@/view/live-comments";
import { OBSSettings } from "@/view/obs-settings";
import { Navbar } from "@/components/navbar";
import { StatusBar } from "@/components/status-bar";
import { LoginScreen } from "@/screens/login-screen";
import { LoadingScreen } from "@/screens/loading-screen";
import { useConfigStore } from "@/store/config";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { UserProfile } from "@/view/user-profile";
import { LiveRoomManager } from "@/view/manager/live-room-manager";
import { useWsStore } from "./store/ws";
import { connectToOBS } from "@/lib/obs-manager";

type AuthState = "loading" | "login" | "authenticated";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [authState, setAuthState] = useState<AuthState>("loading");

  const init = useConfigStore((state) => state.init);
  const isInitialized = useConfigStore((state) => state.isInitialized);
  const theme = useConfigStore((state) => state.config.theme);
  const initListeners = useWsStore((state) => state.initListeners);
  const obsConfig = useConfigStore((state) => state.config.obsConfig);

  useEffect(() => {
    const listener = initListeners();

    return () => {
      listener.then((f) => f());
    };
  }, [initListeners]);

  // 启动时自动连接 OBS
  useEffect(() => {
    if (isInitialized && obsConfig.autoConnect) {
      connectToOBS({
        address: obsConfig.address,
        password: obsConfig.password || undefined,
      })
        .then(() => {
          toast.success("OBS 已自动连接");
        })
        .catch((error) => {
          console.error("自动连接 OBS 失败:", error);
          // 不显示错误提示，避免启动时频繁打扰用户
        });
    }
  }, [isInitialized, obsConfig]);

  useEffect(() => {
    if (!isInitialized) {
      init();
    }
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [init, isInitialized, theme]);

  const handleValidationComplete = useCallback((isValid: boolean) => {
    if (isValid) {
      setAuthState("authenticated");
    } else {
      setAuthState("login");
    }
  }, []);

  const handleLoginSuccess = () => {
    setAuthState("loading");
  };

  const handleLogout = () => {
    const state = useConfigStore.getState();
    state.clearAuth();
    setAuthState("login");
  };

  const renderContent = () => {
    switch (authState) {
      case "loading":
        return (
          <LoadingScreen onValidationComplete={handleValidationComplete} />
        );
      case "login":
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      case "authenticated":
        return (
          <>
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
              <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  {activeTab === "account" && (
                    <UserProfile onLogout={handleLogout} />
                  )}
                  {activeTab === "stream" && <LiveStreamSettings />}
                  {activeTab === "comments" && <LiveComments />}
                  {activeTab === "manager" && <LiveRoomManager />}
                  {activeTab === "obs" && <OBSSettings />}
                  {activeTab === "settings" && <MoreSettings />}
                </div>
              </main>
            </div>
            <StatusBar />
          </>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background shadow-2xl overflow-hidden border border-border">
      <Navbar />
      {isInitialized ? (
        renderContent()
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          初始化中...
        </div>
      )}
      <Toaster />
    </div>
  );
}
