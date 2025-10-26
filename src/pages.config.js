import Home from './pages/Home';
import Article from './pages/Article';
import PublisherDashboard from './pages/PublisherDashboard';
import DailyDigest from './pages/DailyDigest';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Article": Article,
    "PublisherDashboard": PublisherDashboard,
    "DailyDigest": DailyDigest,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};