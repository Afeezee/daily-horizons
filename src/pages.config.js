import Home from './pages/Home';
import Article from './pages/Article';
import PublisherDashboard from './pages/PublisherDashboard';
import DailyDigest from './pages/DailyDigest';
import Category from './pages/Category';
import Search from './pages/Search';
import MyAccount from './pages/MyAccount';
import About from './pages/About';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Article": Article,
    "PublisherDashboard": PublisherDashboard,
    "DailyDigest": DailyDigest,
    "Category": Category,
    "Search": Search,
    "MyAccount": MyAccount,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};