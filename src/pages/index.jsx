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
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Explore" element={<Explore />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Favorites" element={<Favorites />} />
                
                <Route path="/VenueSchedule" element={<VenueSchedule />} />
                
                <Route path="/ReservationDetails" element={<ReservationDetails />} />
                
                <Route path="/Packages" element={<Packages />} />
                
                <Route path="/PersonalInfo" element={<PersonalInfo />} />
                
                <Route path="/Wallet" element={<Wallet />} />
                
                <Route path="/CategoryResults" element={<CategoryResults />} />
                
                <Route path="/CategorySchedule" element={<CategorySchedule />} />
                
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