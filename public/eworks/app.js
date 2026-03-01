const outputEl = document.getElementById("output");
const authStateEl = document.getElementById("auth-state");

const loginForm = document.getElementById("login-form");
const complaintForm = document.getElementById("complaint-form");
const complaintStatusForm = document.getElementById("complaint-status-form");
const workOrderForm = document.getElementById("work-order-form");
const workOrderStatusForm = document.getElementById("work-order-status-form");

const btnListComplaints = document.getElementById("btn-list-complaints");
const btnDashboard = document.getElementById("btn-dashboard");

const STORAGE_KEY = "eworks.portal.auth";

const state = {
  tenantId: "uitm",
  token: "",
  user: null,
};

function writeOutput(title, data) {
  const payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  outputEl.textContent = `${title}\n${"-".repeat(32)}\n${payload}`;
}

function saveAuthState() {
  const payload = {
    tenantId: state.tenantId,
    token: state.token,
    user: state.user,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadAuthState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.tenantId = String(parsed.tenantId ?? "uitm");
      state.token = String(parsed.token ?? "");
      state.user = parsed.user ?? null;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderAuthState() {
  if (!state.token || !state.user) {
    authStateEl.textContent = "Belum login.";
    return;
  }
  authStateEl.textContent = `Login berjaya: ${state.user.username} (${state.user.role}) · tenant: ${state.tenantId}`;
}

async function apiRequest(path, options = {}) {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers ?? {});
  headers.set("x-tenant-id", state.tenantId);
  if (state.token) {
    headers.set("authorization", `Bearer ${state.token}`);
  }
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function toObject(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = toObject(loginForm);
  state.tenantId = String(payload.tenantId || "uitm");

  try {
    const data = await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: {
        tenantId: state.tenantId,
        username: String(payload.username || ""),
        password: String(payload.password || ""),
      },
    });
    state.token = data.accessToken;
    state.user = data.user;
    saveAuthState();
    renderAuthState();
    writeOutput("Login Response", data);
  } catch (error) {
    writeOutput("Login Error", String(error instanceof Error ? error.message : error));
  }
});

complaintForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = toObject(complaintForm);

  const payload = {
    requestorType: String(form.requestorType),
    reporter: {
      identifier: String(form.identifier),
      fullName: String(form.fullName || ""),
      email: String(form.email || ""),
      phone: String(form.phone || ""),
    },
    location: {
      state: "Selangor",
      campus: String(form.campus),
      building: String(form.building),
      floor: String(form.floor || ""),
      room: String(form.room || ""),
      locationDescription: String(form.locationDescription),
    },
    issue: {
      section: String(form.section),
      element: String(form.element),
      problemType: String(form.problemType),
    },
    description: String(form.description),
    priority: String(form.priority),
    channel: String(form.channel),
  };

  try {
    const data = await apiRequest("/api/v1/complaints", {
      method: "POST",
      body: payload,
    });
    if (data && data.id) {
      complaintStatusForm.elements.complaintId.value = data.id;
      workOrderForm.elements.complaintId.value = data.id;
    }
    writeOutput("Complaint Created", data);
  } catch (error) {
    writeOutput("Complaint Error", String(error instanceof Error ? error.message : error));
  }
});

btnListComplaints.addEventListener("click", async () => {
  try {
    const data = await apiRequest("/api/v1/complaints?limit=20");
    writeOutput("Complaint List", data);
  } catch (error) {
    writeOutput("Complaint List Error", String(error instanceof Error ? error.message : error));
  }
});

btnDashboard.addEventListener("click", async () => {
  try {
    const data = await apiRequest("/api/v1/dashboard/summary");
    writeOutput("Dashboard Summary", data);
  } catch (error) {
    writeOutput("Dashboard Error", String(error instanceof Error ? error.message : error));
  }
});

complaintStatusForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = toObject(complaintStatusForm);
  const complaintId = encodeURIComponent(String(form.complaintId || ""));
  try {
    const data = await apiRequest(`/api/v1/complaints/${complaintId}/status`, {
      method: "PATCH",
      body: {
        status: String(form.status || ""),
        note: String(form.note || ""),
      },
    });
    writeOutput("Complaint Status Updated", data);
  } catch (error) {
    writeOutput("Complaint Status Error", String(error instanceof Error ? error.message : error));
  }
});

workOrderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = toObject(workOrderForm);
  const payload = {
    complaintId: String(form.complaintId || ""),
    title: String(form.title || ""),
    team: String(form.team || ""),
    assigneeId: String(form.assigneeId || ""),
    scheduledAt: String(form.scheduledAt || ""),
  };
  try {
    const data = await apiRequest("/api/v1/work-orders", {
      method: "POST",
      body: payload,
    });
    if (data && data.id) {
      workOrderStatusForm.elements.workOrderId.value = data.id;
    }
    writeOutput("Work Order Created", data);
  } catch (error) {
    writeOutput("Work Order Error", String(error instanceof Error ? error.message : error));
  }
});

workOrderStatusForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = toObject(workOrderStatusForm);
  const workOrderId = encodeURIComponent(String(form.workOrderId || ""));
  try {
    const data = await apiRequest(`/api/v1/work-orders/${workOrderId}/status`, {
      method: "PATCH",
      body: {
        status: String(form.status || ""),
        note: String(form.note || ""),
      },
    });
    writeOutput("Work Order Status Updated", data);
  } catch (error) {
    writeOutput("Work Order Status Error", String(error instanceof Error ? error.message : error));
  }
});

loadAuthState();
renderAuthState();
writeOutput(
  "Portal Ready",
  "Login dahulu. Kemudian guna borang untuk create complaint, work order, dan dashboard.",
);
