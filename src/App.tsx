import { useState, useEffect, useCallback } from "react";
import { AppSidebar, type TabType } from "@/components/app-sidebar";
import { LiveStreamSettings } from "@/view/live-stream-settings";
import { MoreSettings } from "@/view/more-settings";
import { LiveComments } from "@/view/live-comments";
import { Navbar } from "@/components/navbar";
import { StatusBar } from "@/components/status-bar";
import { LoginScreen } from "@/screens/login-screen";
import { LoadingScreen } from "@/screens/loading-screen";
import { useConfigStore } from "@/store/config";
import { Toaster } from "@/components/ui/sonner";
import { UserProfile } from "@/view/user-profile";
import { LiveRoomManager } from "@/view/manager/live-room-manager";
import { useWsStore } from "./store/ws";

type AuthState = "loading" | "login" | "authenticated";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [authState, setAuthState] = useState<AuthState>("loading");

  const init = useConfigStore((state) => state.init);
  const isInitialized = useConfigStore((state) => state.isInitialized);
  const theme = useConfigStore((state) => state.config.theme);
  const initListeners = useWsStore((state) => state.initListeners);

  useEffect(() => {
    const listener = initListeners();

    return () => {
      listener.then((f) => f());
    };
  }, [initListeners]);

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
              <main className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto max-w-2xl">
                  {activeTab === "account" && (
                    <UserProfile onLogout={handleLogout} />
                  )}
                  {activeTab === "stream" && <LiveStreamSettings />}
                  {activeTab === "comments" && <LiveComments />}
                  {activeTab === "manager" && <LiveRoomManager />}
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
    <div className="flex h-screen flex-col overflow-hidden border border-border bg-background shadow-2xl">
      <Navbar />
      {isInitialized ? (
        renderContent()
      ) : (
        <div className="flex flex-1 items-center justify-center p-8">
          初始化中...
        </div>
      )}
      <Toaster />
    </div>
  );
}
