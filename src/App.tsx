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
import OnboardingPage from "./pages/OnboardingPage";
import BookingPage from "./pages/BookingPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import EventsPage from "./pages/EventsPage";
import CreatePostPage from "./pages/CreatePostPage";
import StylistsPage from "./pages/StylistsPage";
import StylistDetailPage from "./pages/StylistDetailPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";
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
import JobDetailPage from "./pages/JobDetailPage";
import MapSearchPage from "./pages/MapSearchPage";
import HomeServicePage from "./pages/HomeServicePage";
import SettingsPage from "./pages/SettingsPage";
import ReviewPage from "./pages/ReviewPage";
import ReferralPage from "./pages/ReferralPage";
import AnalyticsDashboardPage from "./pages/AnalyticsDashboardPage";
import InstallmentsPage from "./pages/InstallmentsPage";
import PurchaseHistoryPage from "./pages/PurchaseHistoryPage";
import MissionsPage from "./pages/MissionsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import ShortsPage from "./pages/ShortsPage";
import GoLivePage from "./pages/GoLivePage";
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
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/live" element={<LiveStreamPage />} />
            <Route path="/radio" element={<RadioPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/my-bookings/:id" element={<BookingDetailPage />} />
            <Route path="/my-bookings/:id/review" element={<ReviewPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/stylists" element={<StylistsPage />} />
            <Route path="/stylist/:id" element={<StylistDetailPage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/business/:id" element={<BusinessProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/before-after" element={<BeforeAfterPage />} />
            <Route path="/map-search" element={<MapSearchPage />} />
            <Route path="/home-service/:id" element={<HomeServicePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/analytics" element={<AnalyticsDashboardPage />} />
            <Route path="/installments" element={<InstallmentsPage />} />
            <Route path="/purchases" element={<PurchaseHistoryPage />} />
            <Route path="/qr-coins" element={<QRCoinsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/spin" element={<SpinWheelPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/shorts" element={<ShortsPage />} />
            {/* Business & HR */}
            <Route path="/business" element={<BusinessDashboardPage />} />
            <Route path="/business/team" element={<BusinessDashboardPage />} />
            <Route path="/business/team/invite" element={<BusinessDashboardPage />} />
            <Route path="/hr" element={<HRPage />} />
            <Route path="/hr/create-job" element={<CreateJobPostPage />} />
            <Route path="/hr/job/:id" element={<JobDetailPage />} />
            <Route path="/hr/job/:id/manage" element={<JobDetailPage />} />
            <Route path="/hr/application/:id" element={<HRPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
