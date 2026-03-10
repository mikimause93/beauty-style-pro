import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RadioProvider } from "@/contexts/RadioContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SplashScreen from "@/components/SplashScreen";
import PageTracker from "@/components/PageTracker";
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
import TransformationChallengePage from "./pages/TransformationChallengePage";
import LiveBattlePage from "./pages/LiveBattlePage";
import SearchPage from "./pages/SearchPage";
import ExplorePage from "./pages/ExplorePage";
import ManageProductsPage from "./pages/ManageProductsPage";
import WalletPage from "./pages/WalletPage";
import AdminPage from "./pages/AdminPage";
import CreatorApplicationPage from "./pages/CreatorApplicationPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import BoostProfilePage from "./pages/BoostProfilePage";
import MarketplacePage from "./pages/MarketplacePage";
import CreateServiceRequestPage from "./pages/CreateServiceRequestPage";
import CreateCastingPage from "./pages/CreateCastingPage";
import CheckoutPage from "./pages/CheckoutPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import VerifyAccountPage from "./pages/VerifyAccountPage";
import RemindersPage from "./pages/RemindersPage";
import SpaTermePage from "./pages/SpaTermePage";
import NotFound from "./pages/NotFound";
import DebugPanelPage from "./pages/DebugPanelPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { initGlobalErrorHandler } from "@/lib/errorLogger";

initGlobalErrorHandler();

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem("style_splash_shown");
  });
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      {showSplash && <SplashScreen onComplete={() => { localStorage.setItem("style_splash_shown", "1"); setShowSplash(false); }} />}
      <BrowserRouter>
        <AuthProvider>
        <RadioProvider>
          <PageTracker />
          <Routes>
            {/* Public routes - accessible without login */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/stylists" element={<StylistsPage />} />
            <Route path="/stylist/:id" element={<StylistDetailPage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/business/:id" element={<BusinessProfilePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/live" element={<LiveStreamPage />} />
            <Route path="/radio" element={<RadioPage />} />
            <Route path="/shorts" element={<ShortsPage />} />
            <Route path="/map-search" element={<MapSearchPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Protected routes - require login */}
            <Route path="/profile" element={<P><ProfilePage /></P>} />
            <Route path="/profile/:id" element={<P><ProfilePage /></P>} />
            <Route path="/profile/edit" element={<P><EditProfilePage /></P>} />
            <Route path="/booking" element={<P><BookingPage /></P>} />
            <Route path="/booking/:id" element={<P><BookingPage /></P>} />
            <Route path="/my-bookings" element={<P><MyBookingsPage /></P>} />
            <Route path="/my-bookings/:id" element={<P><BookingDetailPage /></P>} />
            <Route path="/my-bookings/:id/review" element={<P><ReviewPage /></P>} />
            <Route path="/events" element={<P><EventsPage /></P>} />
            <Route path="/create-post" element={<P><CreatePostPage /></P>} />
            <Route path="/chat" element={<P><ChatPage /></P>} />
            <Route path="/chat/:id" element={<P><ChatPage /></P>} />
            <Route path="/notifications" element={<P><NotificationsPage /></P>} />
            <Route path="/before-after" element={<P><BeforeAfterPage /></P>} />
            <Route path="/home-service/:id" element={<P><HomeServicePage /></P>} />
            <Route path="/settings" element={<P><SettingsPage /></P>} />
            <Route path="/referral" element={<P><ReferralPage /></P>} />
            <Route path="/analytics" element={<P><AnalyticsDashboardPage /></P>} />
            <Route path="/installments" element={<P><InstallmentsPage /></P>} />
            <Route path="/purchases" element={<P><PurchaseHistoryPage /></P>} />
            <Route path="/qr-coins" element={<P><QRCoinsPage /></P>} />
            <Route path="/challenges" element={<P><ChallengesPage /></P>} />
            <Route path="/spin" element={<P><SpinWheelPage /></P>} />
            <Route path="/leaderboard" element={<P><LeaderboardPage /></P>} />
            <Route path="/missions" element={<P><MissionsPage /></P>} />
            <Route path="/reminders" element={<P><RemindersPage /></P>} />
            <Route path="/ai-assistant" element={<P><AIAssistantPage /></P>} />
            <Route path="/go-live" element={<P><GoLivePage /></P>} />
            <Route path="/transformation-challenge" element={<P><TransformationChallengePage /></P>} />
            <Route path="/live-battle" element={<P><LiveBattlePage /></P>} />
            <Route path="/manage-products" element={<P><ManageProductsPage /></P>} />
            <Route path="/wallet" element={<P><WalletPage /></P>} />
            <Route path="/admin" element={<P><AdminPage /></P>} />
            <Route path="/subscriptions" element={<P><SubscriptionPage /></P>} />
            <Route path="/boost" element={<P><BoostProfilePage /></P>} />
            <Route path="/become-creator" element={<P><CreatorApplicationPage /></P>} />
            <Route path="/marketplace" element={<P><MarketplacePage /></P>} />
            <Route path="/marketplace/create-request" element={<P><CreateServiceRequestPage /></P>} />
            <Route path="/marketplace/create-casting" element={<P><CreateCastingPage /></P>} />
            <Route path="/checkout" element={<P><CheckoutPage /></P>} />
            <Route path="/receipts" element={<P><ReceiptsPage /></P>} />
            <Route path="/verify-account" element={<P><VerifyAccountPage /></P>} />
            {/* Business & HR */}
            <Route path="/business" element={<P><BusinessDashboardPage /></P>} />
            <Route path="/business/team" element={<P><BusinessDashboardPage /></P>} />
            <Route path="/business/team/invite" element={<P><BusinessDashboardPage /></P>} />
            <Route path="/hr" element={<P><HRPage /></P>} />
            <Route path="/hr/create-job" element={<P><CreateJobPostPage /></P>} />
            <Route path="/hr/job/:id" element={<P><JobDetailPage /></P>} />
            <Route path="/hr/job/:id/manage" element={<P><JobDetailPage /></P>} />
            <Route path="/hr/application/:id" element={<P><HRPage /></P>} />
            <Route path="/debug" element={<P><DebugPanelPage /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RadioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
