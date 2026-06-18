import { Routes, Route, Navigate } from 'react-router-dom';
import ShopLayout from './components/layout/ShopLayout.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import GuestOrderTrackPage from './pages/GuestOrderTrackPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import AccountPage from './pages/account/AccountPage.jsx';
import OrdersPage from './pages/account/OrdersPage.jsx';
import AddressesPage from './pages/account/AddressesPage.jsx';
import WishlistPage from './pages/account/WishlistPage.jsx';
import AdminShippingPage from './pages/admin/AdminShippingPage.jsx';
import AdminSlipsPage from './pages/admin/AdminSlipsPage.jsx';
import AdminPromosPage from './pages/admin/AdminPromosPage.jsx';
import AdminPromoEditorPage from './pages/admin/AdminPromoEditorPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminBanksPage from './pages/admin/AdminBanksPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminAnnouncementPage from './pages/admin/AdminAnnouncementPage.jsx';
import AdminHomepagePage from './pages/admin/AdminHomepagePage.jsx';
import PromosPage from './pages/account/PromosPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ErrorBoundary, { ProductPageErrorFallback } from './components/ErrorBoundary.jsx';

function ProductPageRoute() {
  return (
    <ErrorBoundary fallback={<ProductPageErrorFallback />}>
      <ProductPage />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<ShopLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="product/p/:productId" element={<ProductPageRoute />} />
        <Route path="product/:skuId" element={<ProductPageRoute />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order/:orderId" element={<OrderSuccessPage />} />
        <Route path="order/track" element={<GuestOrderTrackPage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="account/orders" element={<OrdersPage />} />
          <Route path="account/addresses" element={<AddressesPage />} />
          <Route path="account/promos" element={<PromosPage />} />
          <Route path="account/wishlist" element={<WishlistPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="admin/promos" element={<AdminPromosPage />} />
          <Route path="admin/promos/new" element={<AdminPromoEditorPage />} />
          <Route path="admin/promos/:id/edit" element={<AdminPromoEditorPage />} />
          <Route path="admin/shipping" element={<AdminShippingPage />} />
          <Route path="admin/announcement" element={<AdminAnnouncementPage />} />
          <Route path="admin/homepage" element={<AdminHomepagePage />} />
          <Route path="admin/slips" element={<AdminSlipsPage />} />
          <Route path="admin/banks" element={<AdminBanksPage />} />
          <Route path="admin/products" element={<AdminProductsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
