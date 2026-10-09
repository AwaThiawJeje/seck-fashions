import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { FavorisProvider, useFavoris } from "./context/FavorisContext";
import { PanierProvider, usePanier } from "./context/PanierContext";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import ProductGrid from "./components/ProductGrid";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import FavorisPage from "./pages/FavorisPage";
import PanierPage from "./pages/PanierPage";
import AdminLoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";
import DashboardPage from "./pages/admin/DashboardPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import CommandesPage from "./pages/admin/CommandesPage";
import ProduitsPage from "./pages/admin/ProduitsPage";
import AvisPage from "./pages/admin/AvisPage";
import ConnexionPage from "./pages/ConnexionPage";
import InscriptionPage from "./pages/InscriptionPage";
import ComptePage from "./pages/ComptePage";
import MesCommandesPage from "./pages/MesCommandesPage";
import RequireUser from "./components/RequireUser";

function BoutiqueLayout() {
    const { favoris } = useFavoris();
    const { nombreArticles } = usePanier();
    const location = useLocation();

    const active: "accueil" | "categories" | "favoris" | "panier" | "compte" | undefined = (() => {
        const chemin = location.pathname;
        if (chemin === "/") return "accueil";
        if (chemin.startsWith("/categories")) return "categories";
        if (chemin.startsWith("/favoris")) return "favoris";
        if (chemin.startsWith("/panier")) return "panier";
        if (["/compte", "/mes-commandes", "/connexion", "/inscription"].includes(chemin)) return "compte";
        return undefined;
    })();

    return (
        <>
            <Header favoritesCount={favoris.length} cartCount={nombreArticles} />
            <main className="pb-20 md:pb-8">
                <Outlet />
            </main>
            <BottomNav active={active} favoritesCount={favoris.length} cartCount={nombreArticles} />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <CategoriesProvider>
                <FavorisProvider>
                    <PanierProvider>
                        <Routes>
                            <Route element={<BoutiqueLayout />}>
                                <Route path="/" element={<ProductGrid />} />
                                <Route path="/categories/:slug" element={<CategoryPage />} />
                                <Route path="/produit/:slug" element={<ProductPage />} />
                                <Route path="/recherche" element={<SearchPage />} />
                                <Route path="/favoris" element={<FavorisPage />} />
                                <Route path="/panier" element={<PanierPage />} />
                                <Route path="/connexion" element={<ConnexionPage />} />
                                <Route path="/inscription" element={<InscriptionPage />} />
                                <Route element={<RequireUser />}>
                                    <Route path="/compte" element={<ComptePage />} />
                                    <Route path="/mes-commandes" element={<MesCommandesPage />} />
                                </Route>
                            </Route>

                            <Route path="/admin/connexion" element={<AdminLoginPage />} />

                            <Route path="/admin" element={<RequireAdmin />}>
                                <Route element={<AdminLayout />}>
                                    <Route index element={<DashboardPage />} />
                                    <Route path="categories" element={<CategoriesPage />} />
                                    <Route path="commandes" element={<CommandesPage />} />
                                    <Route path="produits" element={<ProduitsPage />} />
                                    <Route path="avis" element={<AvisPage />} />
                                </Route>
                            </Route>
                        </Routes>
                    </PanierProvider>
                </FavorisProvider>
            </CategoriesProvider>
        </AuthProvider>
    );
}