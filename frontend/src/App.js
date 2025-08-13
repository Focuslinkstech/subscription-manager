import React, { useState, useEffect } from "react";
import {
  Plus,
  Mail,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  CreditCard,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Lock,
  LogOut,
} from "lucide-react";

const API_BASE_URL = process.env.BACKEND_SERVER_URL || "http://localhost:5001";
let authToken = null;

const getAuthToken = () => authToken;
const setAuthToken = (token) => {
  authToken = token;
};
const clearAuthToken = () => {
  authToken = null;
};

const api = {
  // GET request with auth header
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // POST request with auth header
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // PUT request
  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // DELETE request
  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Login method
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Login failed" }));
      throw new Error(error.error || "Login failed");
    }
    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  // Logout method
  logout: () => {
    clearAuthToken();
  },

  // Check if logged in
  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// Login Component
const LoginForm = ({ onLogin, loading, error }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(credentials.email, credentials.password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-blue-100">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the subscription manager
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Demo credentials: admin@example.com / admin123 <br></br>
              Powered By: Focuslinks Digital Solutions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubscriptionApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(1600);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    clientId: "",
    planName: "",
    priceUSD: "",
    duration: "monthly",
    startDate: "",
  });

  // Check authentication on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
      // You can decode the token here to get user info if needed
      setUser({ email: "admin@yoursite.com" }); // Placeholder
      loadData();
    }
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [activeTab, isAuthenticated]);

  const handleLogin = async (email, password) => {
    setLoginLoading(true);
    setError("");

    try {
      const result = await api.login(email, password);
      setIsAuthenticated(true);
      setUser({ email: result.user?.email || email });
      showMessage("Login successful!", "success");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab("dashboard");
    // Clear all data
    setClients([]);
    setSubscriptions([]);
    setInvoices([]);
    setPayments([]);
    setDashboardStats({});
    showMessage("Logged out successfully", "success");
  };

  const loadData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError("");

    try {
      switch (activeTab) {
        case "dashboard":
          const [statsData, clientsData, subscriptionsData] = await Promise.all(
            [
              api.get("/dashboard/stats"),
              api.get("/clients"),
              api.get("/subscriptions"),
            ]
          );
          setDashboardStats(statsData);
          setClients(clientsData);
          setSubscriptions(subscriptionsData);
          break;
        case "clients":
          const clientsResult = await api.get("/clients");
          setClients(clientsResult);
          break;
        case "subscriptions":
          const [subscriptionsResult, clientsResult2] = await Promise.all([
            api.get("/subscriptions"),
            api.get("/clients"),
          ]);
          setSubscriptions(subscriptionsResult);
          setClients(clientsResult2);
          break;
        case "invoices":
          const invoicesResult = await api.get("/invoices");
          setInvoices(invoicesResult);
          break;
        case "payments":
          const paymentsResult = await api.get("/payments");
          setPayments(paymentsResult);
          break;
      }

      // Load exchange rate if not loaded
      if (exchangeRate === 1600) {
        loadExchangeRate();
      }
    } catch (error) {
      if (error.message.includes("401") || error.message.includes("403")) {
        // Handle authentication errors
        handleLogout();
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load data: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const rateData = await api.get("/exchange-rate");
      setExchangeRate(rateData.rate);
    } catch (error) {
      console.error("Failed to load exchange rate:", error);
    }
  };

  const generateInvoice = async (subscriptionId) => {
    try {
      setLoading(true);
      const result = await api.post(`/invoices/generate`, { subscriptionId });
      showMessage(`Invoice generated successfully: #${result.invoiceNumber}`);
      await loadData(); // Refresh data
    } catch (error) {
      showMessage("Failed to generate invoice: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, type = "success") => {
    if (type === "success") {
      setSuccess(message);
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    } else {
      setError(message);
      setSuccess("");
      setTimeout(() => setError(""), 5000);
    }
  };

  // Client operations
  const addClient = async () => {
    if (!clientForm.name || !clientForm.email) {
      showMessage("Name and email are required", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/clients", clientForm);
      setClientForm({ name: "", email: "", phone: "", company: "" });
      setShowModal(false);
      await loadData();
      showMessage("Client added successfully!");
    } catch (error) {
      showMessage("Failed to add client: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async () => {
    try {
      setLoading(true);
      await api.put(`/clients/${selectedItem._id}`, clientForm);
      setClientForm({ name: "", email: "", phone: "", company: "" });
      setShowModal(false);
      await loadData();
      showMessage("Client updated successfully!");
    } catch (error) {
      showMessage("Failed to update client: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (clientId) => {
    if (
      !window.confirm(
        "Are you sure? This will also delete all related subscriptions and invoices."
      )
    )
      return;

    try {
      setLoading(true);
      await api.delete(`/clients/${clientId}`);
      await loadData();
      showMessage("Client deleted successfully!");
    } catch (error) {
      showMessage("Failed to delete client: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Subscription operations
  const addSubscription = async () => {
    if (
      !subscriptionForm.clientId ||
      !subscriptionForm.planName ||
      !subscriptionForm.priceUSD
    ) {
      showMessage("Client, plan name, and price are required", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/subscriptions", {
        ...subscriptionForm,
        priceUSD: parseFloat(subscriptionForm.priceUSD),
      });
      setSubscriptionForm({
        clientId: "",
        planName: "",
        priceUSD: "",
        duration: "monthly",
        startDate: "",
      });
      setShowModal(false);
      await loadData();
      showMessage("Subscription created successfully!");
    } catch (error) {
      showMessage("Failed to create subscription: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async () => {
    try {
      setLoading(true);
      await api.put(`/subscriptions/${selectedItem._id}`, {
        ...subscriptionForm,
        priceUSD: parseFloat(subscriptionForm.priceUSD),
      });
      setSubscriptionForm({
        clientId: "",
        planName: "",
        priceUSD: "",
        duration: "monthly",
        startDate: "",
      });
      setShowModal(false);
      await loadData();
      showMessage("Subscription updated successfully!");
    } catch (error) {
      showMessage("Failed to update subscription: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (subscriptionId) => {
    if (
      !window.confirm(
        "Are you sure? This will also delete all related invoices."
      )
    )
      return;

    try {
      setLoading(true);
      await api.delete(`/subscriptions/${subscriptionId}`);
      await loadData();
      showMessage("Subscription deleted successfully!");
    } catch (error) {
      showMessage("Failed to delete subscription: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (subscriptionId) => {
    try {
      setLoading(true);
      const result = await api.post(
        `/subscriptions/${subscriptionId}/send-reminder`
      );
      showMessage(`Reminder sent successfully to ${result.sentTo}!`);
    } catch (error) {
      showMessage("Failed to send reminder: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateAllDueInvoices = async () => {
    if (!window.confirm("Generate invoices for all due subscriptions?")) return;

    try {
      setLoading(true);
      const result = await api.post("/invoices/generate-all-due");
      showMessage(result.message || `Generated ${result.count} invoice(s).`);
      await loadData();
    } catch (error) {
      showMessage("Failed to generate invoices: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const sendBulkReminders = async () => {
    try {
      setLoading(true);
      const result = await api.post("/bulk-reminders");
      showMessage(result.message);
    } catch (error) {
      showMessage("Failed to send bulk reminders: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);

    if (type === "editClient" && item) {
      setClientForm({
        name: item.name,
        email: item.email,
        phone: item.phone || "",
        company: item.company || "",
      });
    } else if (type === "editSubscription" && item) {
      setSubscriptionForm({
        clientId: item.clientId._id || item.clientId,
        planName: item.planName,
        priceUSD: item.priceUSD.toString(),
        duration: item.duration,
        startDate: item.startDate ? item.startDate.split("T")[0] : "",
      });
    }
  };

  const formatCurrency = (usd, ngn) => {
    return `$${usd} (₦${Math.round(ngn || usd * exchangeRate).toLocaleString()})`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginForm onLogin={handleLogin} loading={loginLoading} error={error} />
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats.totalClients || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Subscriptions
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats.activeSubscriptions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Monthly Revenue
              </p>
              <p className="text-3xl font-bold text-gray-900">
                ${dashboardStats.monthlyRevenue || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Due This Week</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats.dueSubscriptions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Revenue Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Revenue:</span>
              <span className="font-semibold">
                ${dashboardStats.monthlyRevenue || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yearly Revenue:</span>
              <span className="font-semibold">
                ${dashboardStats.yearlyRevenue || 0}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-semibold">
                Total Revenue:
              </span>
              <span className="font-bold text-green-600">
                ${dashboardStats.totalRevenue || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Invoice Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending:</span>
              <span className="flex items-center">
                <span className="font-semibold mr-2">
                  {dashboardStats.pendingInvoices || 0}
                </span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid:</span>
              <span className="flex items-center">
                <span className="font-semibold mr-2">
                  {dashboardStats.paidInvoices || 0}
                </span>
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overdue:</span>
              <span className="flex items-center">
                <span className="font-semibold mr-2">
                  {dashboardStats.overdueInvoices || 0}
                </span>
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Exchange Rate</h3>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              ₦{exchangeRate.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">per 1 USD</p>
            <button
              onClick={loadExchangeRate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh Rate
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Subscriptions</h3>
            <button
              onClick={sendBulkReminders}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Send All Reminders
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.slice(0, 5).map((subscription) => {
                const client = subscription.clientId;
                return (
                  <tr key={subscription._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client?.name || "Unknown Client"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subscription.planName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {subscription.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(
                        subscription.priceUSD,
                        subscription.priceUSD * exchangeRate
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(subscription.nextBillingDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => sendReminder(subscription._id)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          openModal("editSubscription", subscription)
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSubscription(subscription._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        <button
          onClick={() => openModal("addClient")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {client.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {client.company || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {client.phone || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openModal("editClient", client)}
                    className="text-green-600 hover:text-green-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteClient(client._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
        <button
          onClick={() => openModal("addSubscription")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (USD)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Billing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((sub) => {
              const client = sub.clientId;
              return (
                <tr key={sub._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sub.planName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sub.priceUSD}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {sub.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(sub.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(sub.nextBillingDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal("editSubscription", sub)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit Subscription"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSubscription(sub._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => generateInvoice(sub._id)}
                      disabled={loading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      title="Generate Invoice"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => {
              const client = invoice.clientId;
              const subscription = invoice.subscriptionId;
              return (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription?.planName || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(
                      invoice.amountUSD,
                      invoice.amountUSD * exchangeRate
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Send className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => {
              const client = payment.clientId;
              const invoice = payment.invoiceId;
              return (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{invoice?._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(
                      payment.amountUSD,
                      payment.amountUSD * exchangeRate
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {payment.paymentMethod || "N/A"}
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No payments recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const isEdit =
      modalType === "editClient" || modalType === "editSubscription";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-semibold mb-4">
            {modalType === "addClient" && "Add New Client"}
            {modalType === "editClient" && "Edit Client"}
            {modalType === "addSubscription" && "Create Subscription"}
            {modalType === "editSubscription" && "Edit Subscription"}
          </h3>

          {modalType === "addClient" || modalType === "editClient" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, phone: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={clientForm.company}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, company: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  value={subscriptionForm.clientId}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      clientId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={subscriptionForm.planName}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      planName: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={subscriptionForm.priceUSD}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      priceUSD: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <select
                  value={subscriptionForm.duration}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      duration: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={subscriptionForm.startDate}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={
                isEdit
                  ? modalType === "editClient"
                    ? updateClient
                    : updateSubscription
                  : modalType === "addClient"
                    ? addClient
                    : addSubscription
              }
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Subscription Manager
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, {user?.email}
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "clients", label: "Clients", icon: Users },
              { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
              { id: "invoices", label: "Invoices", icon: DollarSign },
              { id: "payments", label: "Payments", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div>
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "clients" && renderClients()}
            {activeTab === "subscriptions" && renderSubscriptions()}
            {activeTab === "invoices" && renderInvoices()}
            {activeTab === "payments" && renderPayments()}
          </div>
        )}

        {/* Modal */}
        {renderModal()}
      </div>
    </div>
  );
};

export default SubscriptionApp;
