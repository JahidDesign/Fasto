import React, { useContext } from "react";
import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/// Css
import "./index.css";
import "./chart.css";
import "./step.css";

/// Layout
import Nav from "./layouts/nav";
import Setting from "./layouts/Setting";
import Footer from "./layouts/Footer";

/// Dashboard
import Index from "./components/Dashboard/Index";
import Index2 from "./components/Dashboard/Index2";
import Project from "./components/Dashboard/Project";
import Contacts from "./components/Dashboard/Contacts";
import Kanban from "./components/Dashboard/Kanban";
import DashboardCalendar from "./components/Dashboard/DashboardCalendar";
import Messages from "./components/Dashboard/Messages";
import ChatBox from "./components/Dashboard/ChatBox";
import Task from "./components/Dashboard/Task";

/// App
import AppProfile from "./components/AppsMenu/AppProfile/AppProfile";
import PostDetails from "./components/AppsMenu/AppProfile/PostDetails";
import Compose from "./components/AppsMenu/Email/Compose/Compose";
import Inbox from "./components/AppsMenu/Email/Inbox/Inbox";
import Read from "./components/AppsMenu/Email/Read/Read";
import Calendar from "./components/AppsMenu/Calendar/Calendar";

/// Product List
import ProductGrid from "./components/AppsMenu/Shop/ProductGrid/ProductGrid";
import ProductList from "./components/AppsMenu/Shop/ProductList/ProductList";
import ProductDetail from "./components/AppsMenu/Shop/ProductGrid/ProductDetail";
import Checkout from "./components/AppsMenu/Shop/Checkout/Checkout";
import Invoice from "./components/AppsMenu/Shop/Invoice/Invoice";
import ProductOrder from "./components/AppsMenu/Shop/ProductOrder";
import EcomCustomers from "./components/AppsMenu/Shop/Customers/Customers";

/// Charts
import RechartJs from "./components/charts/rechart";
import ChartJs from "./components/charts/Chartjs";
import SparklineChart from "./components/charts/Sparkline";
import ApexChart from "./components/charts/apexcharts";

/// Bootstrap
import UiAlert from "./components/bootstrap/Alert";
import UiAccordion from "./components/bootstrap/Accordion";
import UiBadge from "./components/bootstrap/Badge";
import UiButton from "./components/bootstrap/Button";
import UiModal from "./components/bootstrap/Modal";
import UiButtonGroup from "./components/bootstrap/ButtonGroup";
import UiListGroup from "./components/bootstrap/ListGroup";
import MediaObject from "./components/bootstrap/MediaObject";
import UiCards from "./components/bootstrap/Cards";
import UiCarousel from "./components/bootstrap/Carousel";
import UiDropDown from "./components/bootstrap/DropDown";
import UiPopOver from "./components/bootstrap/PopOver";
import UiProgressBar from "./components/bootstrap/ProgressBar";
import UiTab from "./components/bootstrap/Tab";
import UiPagination from "./components/bootstrap/Pagination";
import UiGrid from "./components/bootstrap/Grid";
import UiTypography from "./components/bootstrap/Typography";

/// Plugins
import Select2 from "./components/PluginsMenu/Select2/Select2";
import MainSweetAlert from "./components/PluginsMenu/SweetAlert/SweetAlert";
import Toastr from "./components/PluginsMenu/Toastr/Toastr";
import JqvMap from "./components/PluginsMenu/JqvMap/JqvMap";
import Lightgallery from "./components/PluginsMenu/Lightgallery/Lightgallery";

/// Widget
import Widget from "./pages/Widget";

/// Table
import BootstrapTable from "./components/table/BootstrapTable";
import SortingTable from "./components/table/SortingTable/SortingTable";
import FilteringTable from "./components/table/FilteringTable/FilteringTable";

/// Form
import Element from "./components/Forms/Element/Element";
import Wizard from "./components/Forms/Wizard/Wizard";
import CkEditor from "./components/Forms/CkEditor/CkEditor";
import Pickers from "./components/Forms/Pickers/Pickers";
import FormValidation from "./components/Forms/FormValidation/FormValidation";

/// Pages
import LockScreen from "./pages/LockScreen";
import Error400 from "./pages/Error400";
import Error403 from "./pages/Error403";
import Error404 from "./pages/Error404";
import Error500 from "./pages/Error500";
import Error503 from "./pages/Error503";
import Todo from "./pages/Todo";
import Posts from "./pages/Posts/Posts";

// Scroll To Top
import ScrollToTop from "./layouts/ScrollToTop";
import { ThemeContext } from "../context/ThemeContext";

// 🔒 Auth helper
import { isLogin } from "../services/AuthService"; // adjust path if needed

// -------- ProtectedRoute (no access without login) --------
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const loggedIn = isLogin(); // checks localStorage

  if (!loggedIn) {
    // redirect to login, keep where user tried to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const Markup = () => {
  const allroutes = [
    /// Dashboard
    { url: "", component: <Index /> },
    { url: "dashboard", component: <Index /> },
    { url: "dashboard-dark", component: <Index2 /> },
    { url: "projects", component: <Project /> },
    { url: "contacts", component: <Contacts /> },
    { url: "task-list", component: <Kanban /> },
    { url: "calendar", component: <DashboardCalendar /> },
    { url: "messages", component: <Messages /> },
    { url: "chatbox", component: <ChatBox /> },
    { url: "task", component: <Task /> },

    /// Apps
    { url: "app-profile", component: <AppProfile /> },
    { url: "post-details", component: <PostDetails /> },
    { url: "email-compose", component: <Compose /> },
    { url: "email-inbox", component: <Inbox /> },
    { url: "email-read", component: <Read /> },
    { url: "app-calender", component: <Calendar /> },

    /// Chart
    { url: "chart-sparkline", component: <SparklineChart /> },
    { url: "chart-chartjs", component: <ChartJs /> },
    { url: "chart-apexchart", component: <ApexChart /> },
    { url: "chart-rechart", component: <RechartJs /> },

    /// Bootstrap
    { url: "ui-alert", component: <UiAlert /> },
    { url: "ui-badge", component: <UiBadge /> },
    { url: "ui-button", component: <UiButton /> },
    { url: "ui-modal", component: <UiModal /> },
    { url: "ui-button-group", component: <UiButtonGroup /> },
    { url: "ui-accordion", component: <UiAccordion /> },
    { url: "ui-list-group", component: <UiListGroup /> },
    { url: "ui-media-object", component: <MediaObject /> },
    { url: "ui-card", component: <UiCards /> },
    { url: "ui-carousel", component: <UiCarousel /> },
    { url: "ui-dropdown", component: <UiDropDown /> },
    { url: "ui-popover", component: <UiPopOver /> },
    { url: "ui-progressbar", component: <UiProgressBar /> },
    { url: "ui-tab", component: <UiTab /> },
    { url: "ui-pagination", component: <UiPagination /> },
    { url: "ui-typography", component: <UiTypography /> },
    { url: "ui-grid", component: <UiGrid /> },

    /// Plugin
    { url: "uc-select2", component: <Select2 /> },
    { url: "uc-sweetalert", component: <MainSweetAlert /> },
    { url: "uc-toastr", component: <Toastr /> },
    { url: "map-jqvmap", component: <JqvMap /> },
    { url: "uc-lightgallery", component: <Lightgallery /> },

    /// Widget
    { url: "widget-basic", component: <Widget /> },

    /// Shop
    { url: "ecom-product-grid", component: <ProductGrid /> },
    { url: "ecom-product-list", component: <ProductList /> },
    { url: "ecom-product-detail", component: <ProductDetail /> },
    { url: "ecom-product-order", component: <ProductOrder /> },
    { url: "ecom-checkout", component: <Checkout /> },
    { url: "ecom-invoice", component: <Invoice /> },
    { url: "ecom-product-detail", component: <ProductDetail /> },
    { url: "ecom-customers", component: <EcomCustomers /> },

    /// Form
    { url: "form-element", component: <Element /> },
    { url: "form-wizard", component: <Wizard /> },
    { url: "form-editor", component: <CkEditor /> },
    { url: "form-pickers", component: <Pickers /> },
    { url: "form-validation", component: <FormValidation /> },

    /// table
    { url: "table-bootstrap-basic", component: <BootstrapTable /> },
    { url: "table-filtering", component: <FilteringTable /> },
    { url: "table-sorting", component: <SortingTable /> },

    /// pages
    { url: "page-lock-screen", component: <LockScreen /> },
    { url: "page-error-400", component: <Error400 /> },
    { url: "page-error-403", component: <Error403 /> },
    { url: "page-error-404", component: <Error404 /> },
    { url: "page-error-500", component: <Error500 /> },
    { url: "page-error-503", component: <Error503 /> },
    { url: "todo", component: <Todo /> },
    { url: "posts", component: <Posts /> },
  ];

  return (
    <>
      <Routes>
        {/* Public pages (no login required) */}
        <Route path="page-lock-screen" element={<LockScreen />} />
        <Route path="page-error-400" element={<Error400 />} />
        <Route path="page-error-403" element={<Error403 />} />
        <Route path="page-error-404" element={<Error404 />} />
        <Route path="page-error-500" element={<Error500 />} />
        <Route path="page-error-503" element={<Error503 />} />

        {/* Protected area */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {allroutes.map((data, i) => (
            <Route
              key={i}
              path={data.url}
              element={data.component}
            />
          ))}
        </Route>
      </Routes>
      <ScrollToTop />
      <Setting />
    </>
  );
};

function MainLayout() {
  const sideMenu = useSelector((state) => state.sideMenu);
  const { sidebariconHover } = useContext(ThemeContext);

  return (
    <div
      className={`show ${
        sideMenu ? "menu-toggle" : ""
      } ${sidebariconHover ? "iconhover-toggle" : ""}`}
      id="main-wrapper"
    >
      <Nav />
      <div
        className="content-body"
        style={{ minHeight: window.screen.height - 45 }}
      >
        <div className="container-fluid">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Markup;
