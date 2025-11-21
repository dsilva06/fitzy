import Layout from "./Layout.jsx";
import Home from "./Home";
import Explore from "./Explore";
import Calendar from "./Calendar";
import Favorites from "./Favorites";
import VenueSchedule from "./VenueSchedule";
import VenueDetails from "./VenueDetails";
import CourtDetails from "./CourtDetails";
import ReservationDetails from "./ReservationDetails";
import Packages from "./Packages";
import PersonalInfo from "./PersonalInfo";
import Wallet from "./Wallet";
import CategoryResults from "./CategoryResults";
import CategorySchedule from "./CategorySchedule";
import CourtSchedule from "./CourtSchedule";
import ClassDetails from "./ClassDetails";
import CourtCategoryResults from "./CourtCategoryResults";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import AuthProvider from '@/contexts/AuthProvider';
import RequireAuth from '@/components/RequireAuth';
import { createPageUrl, getPageNameFromPath } from "@/utils";

const PAGES = {
    Home: Home,
    Explore: Explore,
    ExploreClasses: Explore,
    ExploreCourts: Explore,
    Calendar: Calendar,
    Favorites: Favorites,
    VenueSchedule: VenueSchedule,
    VenueDetails: VenueDetails,
    CourtDetails: CourtDetails,
    CourtSchedule: CourtSchedule,
    ClassDetails: ClassDetails,
    ReservationDetails: ReservationDetails,
    Packages: Packages,
    PersonalInfo: PersonalInfo,
    Wallet: Wallet,
    CategoryResults: CategoryResults,
    CourtCategoryResults: CourtCategoryResults,
    CategorySchedule: CategorySchedule,
};

function _getCurrentPage(url) {
    return getPageNameFromPath(url) || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />

                <Route path="/" element={<Layout currentPageName={currentPage}><Home /></Layout>} />

                <Route path={createPageUrl("Explore")} element={<Layout currentPageName={currentPage}><Explore /></Layout>} />

                <Route path={createPageUrl("ExploreClasses")} element={<Layout currentPageName={currentPage}><Explore /></Layout>} />

                <Route path={createPageUrl("ExploreCourts")} element={<Layout currentPageName={currentPage}><Explore /></Layout>} />

                <Route path={createPageUrl("Calendar")} element={<Layout currentPageName={currentPage}><Calendar /></Layout>} />

                <Route path={createPageUrl("Favorites")} element={<Layout currentPageName={currentPage}><Favorites /></Layout>} />

                <Route path="/venues/:venueId" element={<Layout currentPageName={currentPage}><VenueDetails /></Layout>} />

                <Route path="/venues/:venueId/schedule" element={<Layout currentPageName={currentPage}><VenueSchedule /></Layout>} />

                <Route path="/complexes/:complexId" element={<Layout currentPageName={currentPage}><CourtDetails /></Layout>} />

                <Route path="/courts/:courtId" element={<Layout currentPageName={currentPage}><CourtSchedule /></Layout>} />

                <Route path="/classes/:sessionId" element={<Layout currentPageName={currentPage}><ClassDetails /></Layout>} />

                <Route
                    path={`${createPageUrl("ReservationDetails")}/:bookingId?`}
                    element={
                        <RequireAuth>
                            <Layout currentPageName={currentPage}>
                                <ReservationDetails />
                            </Layout>
                        </RequireAuth>
                    }
                />

                <Route path={createPageUrl("Packages")} element={<Layout currentPageName={currentPage}><Packages /></Layout>} />

                <Route path={createPageUrl("PersonalInfo")} element={<RequireAuth><Layout currentPageName={currentPage}><PersonalInfo /></Layout></RequireAuth>} />

                <Route path={createPageUrl("Wallet")} element={<RequireAuth><Layout currentPageName={currentPage}><Wallet /></Layout></RequireAuth>} />

                <Route path="/explore/classes/:categorySlug" element={<Layout currentPageName={currentPage}><CategoryResults /></Layout>} />

                <Route path="/explore/courts/:sportSlug" element={<Layout currentPageName={currentPage}><CourtCategoryResults /></Layout>} />

                <Route path="/explore/classes/:categorySlug/schedule" element={<Layout currentPageName={currentPage}><CategorySchedule /></Layout>} />

            </Routes>
        </>
    );
}

export default function Pages() {
    return (
        <Router>
            <AuthProvider>
                <PagesContent />
            </AuthProvider>
        </Router>
    );
}
