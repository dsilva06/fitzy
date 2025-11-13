import Layout from "./Layout.jsx";
import Home from "./Home";
import Explore from "./Explore";
import Calendar from "./Calendar";
import Favorites from "./Favorites";
import VenueSchedule from "./VenueSchedule";
import ReservationDetails from "./ReservationDetails";
import Packages from "./Packages";
import PersonalInfo from "./PersonalInfo";
import Wallet from "./Wallet";
import CategoryResults from "./CategoryResults";
import CategorySchedule from "./CategorySchedule";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import AuthProvider from '@/contexts/AuthProvider';
import RequireAuth from '@/components/RequireAuth';
import { createPageUrl, getPageNameFromPath } from "@/utils";

const PAGES = {
    Home: Home,
    Explore: Explore,
    Calendar: Calendar,
    Favorites: Favorites,
    VenueSchedule: VenueSchedule,
    ReservationDetails: ReservationDetails,
    Packages: Packages,
    PersonalInfo: PersonalInfo,
    Wallet: Wallet,
    CategoryResults: CategoryResults,
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

                <Route path={createPageUrl("Calendar")} element={<Layout currentPageName={currentPage}><Calendar /></Layout>} />

                <Route path={createPageUrl("Favorites")} element={<Layout currentPageName={currentPage}><Favorites /></Layout>} />

                <Route path={createPageUrl("VenueSchedule")} element={<Layout currentPageName={currentPage}><VenueSchedule /></Layout>} />

                <Route path={createPageUrl("ReservationDetails")} element={<RequireAuth><Layout currentPageName={currentPage}><ReservationDetails /></Layout></RequireAuth>} />

                <Route path={createPageUrl("Packages")} element={<Layout currentPageName={currentPage}><Packages /></Layout>} />

                <Route path={createPageUrl("PersonalInfo")} element={<RequireAuth><Layout currentPageName={currentPage}><PersonalInfo /></Layout></RequireAuth>} />

                <Route path={createPageUrl("Wallet")} element={<RequireAuth><Layout currentPageName={currentPage}><Wallet /></Layout></RequireAuth>} />

                <Route path={createPageUrl("CategoryResults")} element={<Layout currentPageName={currentPage}><CategoryResults /></Layout>} />

                <Route path={createPageUrl("CategorySchedule")} element={<Layout currentPageName={currentPage}><CategorySchedule /></Layout>} />

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
