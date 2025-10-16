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
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path={createPageUrl("Explore")} element={<Explore />} />
                
                <Route path={createPageUrl("Calendar")} element={<Calendar />} />
                
                <Route path={createPageUrl("Favorites")} element={<Favorites />} />
                
                <Route path={createPageUrl("VenueSchedule")} element={<VenueSchedule />} />
                
                <Route path={createPageUrl("ReservationDetails")} element={<ReservationDetails />} />
                
                <Route path={createPageUrl("Packages")} element={<Packages />} />
                
                <Route path={createPageUrl("PersonalInfo")} element={<PersonalInfo />} />
                
                <Route path={createPageUrl("Wallet")} element={<Wallet />} />
                
                <Route path={createPageUrl("CategoryResults")} element={<CategoryResults />} />
                
                <Route path={createPageUrl("CategorySchedule")} element={<CategorySchedule />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
