const http = require("http");
const path = require("path");
const { PrismaClient } = require(path.join(process.cwd(), "node_modules", "@prisma", "client"));

const prisma = new PrismaClient();
const API_BASE = "http://localhost:3000";

async function getAdminSessionCookie() {
  const session = await prisma.user_sessions.findFirst({
    where: {
      expires_at: { gt: new Date() },
      users: {
        is_active: true,
        user_roles: {
          some: {
            roles: {
              name: { in: ["admin", "hr_manager"] },
            },
          },
        },
      },
    },
  });

  if (session) {
    return `pp360_session=${session.session_token}`;
  }

  const adminUser = await prisma.users.findFirst({
    where: { email: "hr@odoo.com" },
  });

  if (!adminUser) throw new Error("No admin user found");

  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user_sessions.create({
    data: {
      user_id: adminUser.id,
      session_token: token,
      ip_address: "127.0.0.1",
      expires_at: new Date(Date.now() + 86400000),
    },
  });

  return `pp360_session=${token}`;
}

function makeRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== RUNNING TIME OFF BACKEND INTEGRATION TESTS ===");
  const cookie = await getAdminSessionCookie();
  const authHeaders = { Cookie: cookie };

  // 1. GET /api/time-off/requests (Unauthorized check)
  const unauthRes = await makeRequest("GET", "/api/time-off/requests");
  console.log(`[TEST 1] Unauthorized GET /api/time-off/requests -> Status: ${unauthRes.status} (Expected: 401)`);
  if (unauthRes.status !== 401) throw new Error("Expected 401 for unauthorized GET");

  // 2. GET /api/time-off/types (Authorized)
  const typesRes = await makeRequest("GET", "/api/time-off/types", authHeaders);
  console.log(`[TEST 2] Authorized GET /api/time-off/types -> Status: ${typesRes.status}, Count: ${typesRes.body?.data?.length}`);
  if (typesRes.status !== 200 || !Array.isArray(typesRes.body.data)) throw new Error("GET types failed");

  // 3. POST /api/time-off/types (Create Leave Type)
  const testTypeCode = `TEST_PTO_${Date.now().toString().slice(-4)}`;
  const createTypeRes = await makeRequest("POST", "/api/time-off/types", authHeaders, {
    name: `Test PTO ${testTypeCode}`,
    code: testTypeCode,
    color: "#22C55E",
    leave_unit: "days",
    requires_approval: true,
    requires_document: false,
    is_paid: true,
    affects_payroll: true,
    is_active: true,
  });
  console.log(`[TEST 3] Create Leave Type -> Status: ${createTypeRes.status}, ID: ${createTypeRes.body?.data?.id}, Code: ${createTypeRes.body?.data?.code}`);
  if (createTypeRes.status !== 201 || !createTypeRes.body?.data?.id) throw new Error("Create leave type failed");
  const createdTypeId = createTypeRes.body.data.id;

  // 4. GET /api/time-off/types/[id]
  const getTypeRes = await makeRequest("GET", `/api/time-off/types/${createdTypeId}`, authHeaders);
  console.log(`[TEST 4] GET Leave Type Detail -> Status: ${getTypeRes.status}, Name: ${getTypeRes.body?.data?.name}`);
  if (getTypeRes.status !== 200 || getTypeRes.body?.data?.id !== createdTypeId) throw new Error("GET leave type detail failed");

  // 5. Fetch employee for allocation testing
  const firstEmployee = await prisma.employees.findFirst({ where: { is_active: true } });
  if (!firstEmployee) throw new Error("No active employee found in database.");

  // 6. POST /api/time-off/allocations (Create Leave Allocation of 15 Days)
  const createAllocRes = await makeRequest("POST", "/api/time-off/allocations", authHeaders, {
    employee_id: firstEmployee.id,
    time_off_type_id: createdTypeId,
    allocation_type: "annual",
    allocated_days: 15,
    validity_start: "2026-01-01",
    validity_end: "2026-12-31",
    notes: "Annual test allocation 15 days",
    state: "approved",
  });
  console.log(`[TEST 6] Create Leave Allocation -> Status: ${createAllocRes.status}, Body:`, JSON.stringify(createAllocRes.body));
  if (createAllocRes.status !== 201 || !createAllocRes.body?.data?.id) throw new Error(`Create allocation failed: ${createAllocRes.body?.error || "Unknown"}`);
  const createdAllocId = createAllocRes.body.data.id;

  // 7. GET /api/time-off/allocations
  const getAllocListRes = await makeRequest("GET", `/api/time-off/allocations?employeeId=${firstEmployee.id}`, authHeaders);
  console.log(`[TEST 7] GET Allocations List -> Status: ${getAllocListRes.status}, Count: ${getAllocListRes.body?.data?.length}`);
  if (getAllocListRes.status !== 200) throw new Error("GET allocations list failed");

  // 8. POST /api/time-off/requests (Create Time Off Request for 3 days)
  const createReqRes = await makeRequest("POST", "/api/time-off/requests", authHeaders, {
    employee_id: firstEmployee.id,
    time_off_type_id: createdTypeId,
    date_from: "2026-09-12",
    date_to: "2026-09-14",
    number_of_days: 3,
    reason: "Vacation leave test",
    state: "submitted",
  });
  console.log(`[TEST 8] Create Time Off Request (3 days) -> Status: ${createReqRes.status}, ID: ${createReqRes.body?.data?.id}, Days: ${createReqRes.body?.data?.number_of_days}`);
  if (createReqRes.status !== 201 || !createReqRes.body?.data?.id) throw new Error("Create request failed");
  const createdReqId = createReqRes.body.data.id;

  // 9. GET /api/time-off/requests/[id]
  const getReqDetailRes = await makeRequest("GET", `/api/time-off/requests/${createdReqId}`, authHeaders);
  console.log(`[TEST 9] GET Request Detail -> Status: ${getReqDetailRes.status}, DurationDisplay: ${getReqDetailRes.body?.data?.duration_display}`);
  if (getReqDetailRes.status !== 200) throw new Error("GET request detail failed");

  // 10. POST /api/time-off/requests/[id]/approve (Approve Request)
  const approveReqRes = await makeRequest("POST", `/api/time-off/requests/${createdReqId}/approve`, authHeaders);
  console.log(`[TEST 10] Approve Request -> Status: ${approveReqRes.status}, State: ${approveReqRes.body?.data?.state}`);
  if (approveReqRes.status !== 200 || approveReqRes.body?.data?.state !== "approved") throw new Error("Approve request failed");

  // 11. Verify Allocation Deducted Balance (Expect: 15 - 3 = 12 remaining)
  const checkAllocRes = await makeRequest("GET", `/api/time-off/allocations/${createdAllocId}`, authHeaders);
  console.log(`[TEST 11] Allocation Balance After Approval -> Allocated: ${checkAllocRes.body?.data?.allocated_days}, Taken: ${checkAllocRes.body?.data?.taken_days}, Remaining: ${checkAllocRes.body?.data?.remaining_days}`);
  if (checkAllocRes.body?.data?.remaining_days !== 12) throw new Error("Allocation deduction mismatch! Expected 12 remaining");

  // 12. Test Double Approval Prevention (Expect: 409)
  const dupApproveRes = await makeRequest("POST", `/api/time-off/requests/${createdReqId}/approve`, authHeaders);
  console.log(`[TEST 12] Double Approval Attempt -> Status: ${dupApproveRes.status} (Expected: 409), Error: ${dupApproveRes.body?.error}`);
  if (dupApproveRes.status !== 409) throw new Error("Expected 409 for duplicate approval");

  // 13. POST /api/time-off/requests/[id]/refuse (Refuse Request & Restores Balance)
  const refuseReqRes = await makeRequest("POST", `/api/time-off/requests/${createdReqId}/refuse`, authHeaders, {
    refusal_reason: "Team availability constraint",
  });
  console.log(`[TEST 13] Refuse Request -> Status: ${refuseReqRes.status}, State: ${refuseReqRes.body?.data?.state}`);
  if (refuseReqRes.status !== 200 || refuseReqRes.body?.data?.state !== "refused") throw new Error("Refuse request failed");

  // 14. Verify Restored Allocation Balance (Expect: 15 remaining)
  const checkAllocRestoredRes = await makeRequest("GET", `/api/time-off/allocations/${createdAllocId}`, authHeaders);
  console.log(`[TEST 14] Allocation Balance After Refusal -> Taken: ${checkAllocRestoredRes.body?.data?.taken_days}, Remaining: ${checkAllocRestoredRes.body?.data?.remaining_days}`);
  if (checkAllocRestoredRes.body?.data?.remaining_days !== 15) throw new Error("Allocation balance restoration failed");

  // 15. Cleanup test records
  console.log("\n[CLEANUP] Cleaning up test records...");
  await makeRequest("DELETE", `/api/time-off/requests/${createdReqId}`, authHeaders);
  await makeRequest("DELETE", `/api/time-off/allocations/${createdAllocId}`, authHeaders);
  await makeRequest("DELETE", `/api/time-off/types/${createdTypeId}`, authHeaders);
  console.log("Cleanup finished successfully.");

  console.log("\n=== ALL TIME OFF BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((err) => {
    console.error("Time Off test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
