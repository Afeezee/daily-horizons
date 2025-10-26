import Home from './pages/Home';
import Article from './pages/Article';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Article": Article,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};