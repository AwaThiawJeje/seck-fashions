import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import ProductGrid from "./components/ProductGrid";
import CategoryPage from "./pages/CategoryPage";

export default function App() {
    return (
        <>
            <Header onSearch={(q) => console.log(q)} />
            <main className="pb-20 md:pb-8">
                <Routes>
                    <Route path="/" element={<ProductGrid />} />
                    <Route path="/categories/:slug" element={<CategoryPage />} />
                </Routes>
            </main>
            <BottomNav active="accueil" favoritesCount={2} cartCount={3} />
        </>
    );
}