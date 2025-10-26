import Home from './pages/Home';
import Article from './pages/Article';
import PublisherDashboard from './pages/PublisherDashboard';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Article": Article,
    "PublisherDashboard": PublisherDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};