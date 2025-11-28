// carloIntegrationExample.js
//
// End-to-end example of using Carlo Rules Engine API clients together.
//
// Prerequisites:
//   - Node 18+ (built-in fetch) OR a fetch polyfill
//   - The following files in the same folder:
//       authApi.js
//       governanceApi.js
//       projectApi.js
//       smartContractApi.js
//       dashboardApi.js
//       userFrameworkApi.js
//
//   - Valid account at https://carlo.algorethics.ai
//   - At least one subscription & pricing tier set up in your Carlo account

import { AuthClient } from "./authApi.js";
import { GovernanceClient } from "./governanceApi.js";
import { ProjectClient } from "./projectApi.js";
import { SmartContractClient } from "./smartContractApi.js";
import { DashboardClient } from "./dashboardApi.js";
import { UserFrameworkClient } from "./userFrameworkApi.js";

async function main() {
  // ----------------------------------------------------------
  // 1) AUTH: Login and get tokens
  // ----------------------------------------------------------
  const auth = new AuthClient();

  console.log("Logging in...");
  const loginRes = await auth.login({
    username: "YOUR_USERNAME",
    password: "YOUR_PASSWORD",
  });

  console.log("Logged in as:", loginRes.username);

  // We now have:
  //   auth.accessToken
  //   auth.refreshToken

  // ----------------------------------------------------------
  // 2) Initialize other clients with the JWT
  // ----------------------------------------------------------
  const accessToken = auth.accessToken;

  const governance = new GovernanceClient({ accessToken });
  const project = new ProjectClient({ accessToken });
  const userFramework = new UserFrameworkClient({ accessToken });

  // Dashboard uses JWT for user stats, and project API key for project stats
  const dashboard = new DashboardClient({
    accessToken, // for /stats
  });

  // SmartContractClient uses Bearer token for /scan, /result, /scans;
  // its internal methods handle auth where needed
  const smartContract = new SmartContractClient({
    accessToken,
  });

  // ----------------------------------------------------------
  // 3) (Optional) List governance frameworks
  // ----------------------------------------------------------
  console.log("Fetching governance frameworks...");
  const govRes = await governance.getFrameworks();
  console.log("Total governance frameworks:", govRes.count ?? govRes.data?.length);

  const firstGov = govRes.data?.[0];
  if (!firstGov) {
    console.warn("No governance frameworks found. You may want to add some first.");
  }

  // ----------------------------------------------------------
  // 4) Create a project (requires an existing subscription)
  // ----------------------------------------------------------
  const EXISTING_SUBSCRIPTION_ID = "REPLACE_WITH_REAL_SUBSCRIPTION_ID";

  console.log("Fetching project template...");
  const templateRes = await project.getTemplate();
  const template = templateRes.data;

  console.log("Creating project...");
  const createProjectRes = await project.createProject({
    subscription_id: EXISTING_SUBSCRIPTION_ID,
    project_name: "My Carlo Demo Project",
    project_description: "Demo project created via SDK integration example.",
    industry_domain: template.industry_domain || "AI & Machine Learning",
    technology_stack: {
      backend: ["Node.js"],
      frontend: ["Next.js"],
      database: ["MongoDB"],
      ai_models: ["OpenAI GPT"],
      apis: ["Carlo Rules Engine"],
    },
    programming_languages: ["JavaScript", "TypeScript"],
    infrastructure: {
      deployment_type: template.infrastructure?.deployment_type || "Cloud",
      cloud_provider: ["AWS"],
      containerization: ["Docker"],
    },
    apis_integrations: ["Carlo Rules Engine"],
    data_sources: {
      structure_type: ["Structured"],
      access_type: ["Private"],
      processing_type: ["Real-time"],
    },
    data_storage_location: template.data_storage_location || "Cloud-based",
    data_sensitivity: template.data_sensitivity || ["Non-sensitive Data"],
    data_encryption: {
      enabled: template.data_encryption?.enabled ?? true,
      type: "AES-256",
    },
    access_control: ["RBAC"],
    audit_logging: template.audit_logging ?? true,
    user_consent_mechanism: template.user_consent_mechanism ?? true,
    compliance_standards: ["EU AI Act", "GDPR"],
    bias_risk_factors: {
      identified: template.bias_risk_factors?.identified ?? false,
    },
    fairness_transparency_practices:
      template.fairness_transparency_practices ?? true,
    has_ai_ml: true,
    ai_model_type: ["Supervised"],
    training_data_source: ["Internal"],
    model_monitoring: true,
    bias_detection: true,
    automated_decision_making: false,
    webhooks_notifications: template.webhooks_notifications ?? false,
    custom_rules: template.custom_rules ?? false,
    third_party_plugins: template.third_party_plugins ?? false,
    compliance_consultation: template.compliance_consultation ?? false,
    status: "Active",
  });

  const createdProject = createProjectRes.data;
  const projectId = createdProject.id;
  console.log("Created project:", projectId);

  // ----------------------------------------------------------
  // 5) Get project API key (needed for dashboard/analyze & stats)
  // ----------------------------------------------------------
  console.log("Fetching project API key...");
  const apiKeyRes = await project.getProjectApiKey(projectId);
  const projectApiKey = apiKeyRes.data.api_key;

  console.log("Project API key:", projectApiKey);

  // ----------------------------------------------------------
  // 6) Create a custom user framework and assign to project
  // ----------------------------------------------------------
  console.log("Creating a custom user framework...");

  const govIds =
    govRes.data?.slice(0, 2).map((g) => g.id || g._id).filter(Boolean) || [];

  const createdFrameworkRes = await userFramework.createFramework({
    name: "Demo Corporate AI Ethics Framework",
    description:
      "Demo framework combining official governance with internal AI policies.",
    version: "1.0",
    selected_governance_frameworks:
      govIds.length > 0 ? govIds : ["64a7f8d2c8e9b12345678901"], // fallback example
    custom_rules: [
      {
        rule_name: "Bias Testing Required",
        rule_description:
          "All AI models must undergo bias testing before deployment.",
        keywords: ["bias", "fairness", "testing"],
        severity: "Critical",
        compliance_category: "AI Ethics",
      },
    ],
    is_active: true,
    status: "Active",
  });

  const frameworkId = createdFrameworkRes.data.id;
  console.log("Created user framework:", frameworkId);

  console.log("Assigning framework to project...");
  await userFramework.assignFrameworkToProject({
    project_id: projectId,
    framework_id: frameworkId,
  });
  console.log("Framework assigned to project.");

  // ----------------------------------------------------------
  // 7) Run AI compliance analysis via Dashboard API
  // ----------------------------------------------------------
  console.log("Running AI compliance analysis for a prompt...");

  const dashboardAnalysisRes = await dashboard.analyze({
    request_text: "Can you help me write a recommendation letter?",
    response_text:
      "I'd be happy to help you write a recommendation letter. Please provide some details about the person...",
    project_id: projectId,
    api_key: projectApiKey,
    validation_threshold: 0.8,
  });

  console.log("Compliance analysis result:");
  console.log({
    score: dashboardAnalysisRes.compliance_score,
    is_compliant: dashboardAnalysisRes.is_compliant,
    issues: dashboardAnalysisRes.compliance_issues,
    recommendations: dashboardAnalysisRes.recommendations,
    frameworks_analyzed: dashboardAnalysisRes.frameworks_analyzed,
  });

  // ----------------------------------------------------------
  // 8) Get project-level stats & verify hash chain
  // ----------------------------------------------------------
  console.log("Getting project stats...");
  const projectStats = await dashboard.getProjectStats({
    projectId,
    apiKey: projectApiKey,
  });
  console.log("Project stats summary:", {
    total_requests: projectStats.data.total_compliance_requests,
    avg_score: projectStats.data.average_compliance_score,
    compliant_pct: projectStats.data.compliant_requests_percentage,
    risk_score: projectStats.data.risk_score,
  });

  console.log("Verifying compliance hash chain on server...");
  const chainVerify = await dashboard.verifyComplianceChain(projectId, projectApiKey);
  console.log("Chain verified:", chainVerify.chain_verified);

  // ----------------------------------------------------------
  // 9) (Optional) Smart contract scan example
  // ----------------------------------------------------------
  // NOTE:
  //   In a browser, you'll get `contractFile` from an <input type="file" />.
  //   In Node, you need FormData + Blob/Buffer polyfills.
  //
  //   The following is just a *shape* example, not runnable without proper setup.

  /*
  console.log("Scanning smart contract...");
  const fileInput = document.querySelector("#contract-file");
  const file = fileInput.files[0];

  const scanRes = await smartContract.scanContract({
    contractFile: file,
    contractName: "MyToken",
    projectId,
    contractDescription: "Demo ERC-20 token",
  });

  console.log("Scan seal:", scanRes.data.seal_id, scanRes.data.compliance_tier);
  */

  console.log("Integration example completed ");
}

// Run if executed directly (node carloIntegrationExample.js)
if (import.meta && import.meta.url && process?.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((err) => {
    console.error("Error in integration example:", err);
    process.exit(1);
  });
}
