import { useState, useEffect, useCallback } from "react"
import { AppSidebar, type TabType } from "@/components/app-sidebar"
import { LiveStreamSettings } from "@/view/live-stream-settings"
import { MoreSettings } from "@/view/more-settings"
import { LiveComments } from "@/view/live-comments"
import { Navbar } from "@/components/navbar"
import { StatusBar } from "@/components/status-bar"
import { LoginScreen } from "@/screens/login-screen"
import { LoadingScreen } from "@/screens/loading-screen"
import { useConfigStore } from "@/store/config"
import { Toaster } from "@/components/ui/sonner"
import { WsDebug } from "@/screens/ws-debug"
import { UserProfile } from "@/view/user-profile"

type AuthState = "loading" | "login" | "authenticated" | "ws"

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const [authState, setAuthState] = useState<AuthState>("loading")

  const init = useConfigStore((state) => state.init);
  const isInitialized = useConfigStore((state) => state.isInitialized);
  const theme = useConfigStore((state) => state.config.theme);

  useEffect(() => {
    if (!isInitialized) {
      init()
    }
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
  }, [init, isInitialized, theme]);

  const handleValidationComplete = useCallback((isValid: boolean) => {
    if (isValid) {
      setAuthState("authenticated")
    } else {
      setAuthState("login")
    }
  }, [])

  const handleLoginSuccess = () => {
    setAuthState("loading")
  }

  const handleLogout = () => {
    const state = useConfigStore.getState();
    state.clearAuth();
    setAuthState("login")
  }

  const renderContent = () => {
    switch (authState) {
      case "ws":
        return <WsDebug />
      case "loading":
        return <LoadingScreen onValidationComplete={handleValidationComplete} />
      case "login":
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />
      case "authenticated":
        return (
          <>
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
              <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  {activeTab === "account" && <UserProfile onLogout={handleLogout} />}
                  {activeTab === "stream" && <LiveStreamSettings />}
                  {activeTab === "comments" && <LiveComments />}
                  {activeTab === "settings" && <MoreSettings />}
                </div>
              </main>
            </div>
            <StatusBar />
          </>
        )
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background rounded-lg shadow-2xl overflow-hidden border border-border">
      <Navbar />
      {
        isInitialized ? renderContent() : <div className="flex-1 flex items-center justify-center p-8">初始化中...</div>
      }
      <Toaster />
    </div>
  )
}