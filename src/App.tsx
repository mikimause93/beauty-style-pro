import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import HomePage from "./pages/HomePage";
import LiveStreamPage from "./pages/LiveStreamPage";
import RadioPage from "./pages/RadioPage";
import ShopPage from "./pages/ShopPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import BookingPage from "./pages/BookingPage";
import EventsPage from "./pages/EventsPage";
import CreatePostPage from "./pages/CreatePostPage";
import StylistsPage from "./pages/StylistsPage";
import StylistDetailPage from "./pages/StylistDetailPage";
import ChatPage from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import EditProfilePage from "./pages/EditProfilePage";
import BeforeAfterPage from "./pages/BeforeAfterPage";
import QRCoinsPage from "./pages/QRCoinsPage";
import ChallengesPage from "./pages/ChallengesPage";
import SpinWheelPage from "./pages/SpinWheelPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import BusinessDashboardPage from "./pages/BusinessDashboardPage";
import HRPage from "./pages/HRPage";
import CreateJobPostPage from "./pages/CreateJobPostPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/live" element={<LiveStreamPage />} />
            <Route path="/radio" element={<RadioPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/stylists" element={<StylistsPage />} />
            <Route path="/stylist/:id" element={<StylistDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/before-after" element={<BeforeAfterPage />} />
            <Route path="/qr-coins" element={<QRCoinsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/spin" element={<SpinWheelPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* Business & HR */}
            <Route path="/business" element={<BusinessDashboardPage />} />
            <Route path="/hr" element={<HRPage />} />
            <Route path="/hr/create-job" element={<CreateJobPostPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

