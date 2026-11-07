export type Status = "On Track" | "At Risk" | "Delayed" | "Completed" | "Planning";

export interface Project {
  id: string;
  name: string;
  type: "Road" | "Bridge" | "Water Supply" | "Public Building" | "Drainage";
  location: string;
  district: string;
  contractor: string;
  manager: string;
  budget: number; // in ₹ crore
  spent: number;
  progress: number;
  status: Status;
  start: string;
  end: string;
  contractNo: string;
  description: string;
}

export const projects: Project[] = [
  { id: "NS-RD-0142", name: "NH-48 Four-Lane Widening, Km 112–148", type: "Road", location: "Vadodara–Bharuch", district: "Vadodara", contractor: "Larsen Infra Pvt Ltd", manager: "Er. Ankit Mehta", budget: 486, spent: 312, progress: 68, status: "On Track", start: "2024-04-12", end: "2026-12-31", contractNo: "PWD/GJ/2024/RD-142", description: "Widening of a 36 km stretch of NH-48 to four lanes with paved shoulders, 4 vehicular underpasses and service roads." },
  { id: "NS-BR-0087", name: "Ganga Riverfront Cable-Stayed Bridge", type: "Bridge", location: "Patna East", district: "Patna", contractor: "Afcons Bridgeworks", manager: "Er. Priya Sinha", budget: 1240, spent: 905, progress: 74, status: "At Risk", start: "2023-01-20", end: "2026-09-30", contractNo: "BSRDC/2023/BR-087", description: "A 1.9 km six-lane cable-stayed bridge with 210 m main span connecting Patna East to Hajipur." },
  { id: "NS-WS-0219", name: "Smart Water Supply Network — Phase II", type: "Water Supply", location: "Indore Zones 4–9", district: "Indore", contractor: "VA Tech Hydro India", manager: "Er. Rahul Joshi", budget: 318, spent: 141, progress: 42, status: "On Track", start: "2025-02-01", end: "2027-06-30", contractNo: "IMC/AMRUT/2025/WS-219", description: "Laying 410 km of HDPE distribution pipeline with SCADA-enabled pumping stations and 62,000 smart meters." },
  { id: "NS-PB-0033", name: "District Civil Hospital — 500 Bed Block", type: "Public Building", location: "Civil Lines", district: "Lucknow", contractor: "Shapoorji Pallonji", manager: "Ar. Neha Verma", budget: 274, spent: 266, progress: 91, status: "Delayed", start: "2022-08-15", end: "2026-03-31", contractNo: "UPPWD/2022/PB-033", description: "G+9 hospital block with 12 modular OTs, ICU wing, helipad and LEED Gold certification target." },
  { id: "NS-RD-0198", name: "Rural Connectivity Package 17 (PMGSY)", type: "Road", location: "Bastar Block Cluster", district: "Bastar", contractor: "Dilip Buildcon", manager: "Er. Suresh Kumar", budget: 96, spent: 96, progress: 100, status: "Completed", start: "2023-10-01", end: "2025-09-30", contractNo: "CGRRDA/2023/RD-198", description: "128 km of all-weather rural roads connecting 44 habitations, including 9 minor bridges." },
  { id: "NS-DR-0054", name: "Storm Water Drainage Upgrade — Ward 12–20", type: "Drainage", location: "Andheri East", district: "Mumbai Suburban", contractor: "J Kumar Infraprojects", manager: "Er. Kavita Rao", budget: 182, spent: 58, progress: 27, status: "Delayed", start: "2025-01-10", end: "2026-11-30", contractNo: "MCGM/SWD/2025/054", description: "Rebuilding 46 km of box drains and micro-tunnelling under arterial roads to mitigate monsoon flooding." },
  { id: "NS-BR-0102", name: "Railway Over Bridge at LC-214", type: "Bridge", location: "Ludhiana Bypass", district: "Ludhiana", contractor: "GR Infraprojects", manager: "Er. Harpreet Gill", budget: 72, spent: 9, progress: 8, status: "Planning", start: "2026-06-01", end: "2027-12-31", contractNo: "PBPWD/2026/BR-102", description: "Two-lane ROB replacing level crossing LC-214 with composite steel girders over the rail corridor." },
  { id: "NS-PB-0071", name: "Integrated District Administrative Complex", type: "Public Building", location: "Sector 9", district: "Bhubaneswar", contractor: "NCC Limited", manager: "Ar. Debashish Das", budget: 158, spent: 89, progress: 55, status: "On Track", start: "2024-07-01", end: "2026-10-31", contractNo: "OWD/2024/PB-071", description: "Consolidated office complex for 28 district departments with solar rooftop and rainwater harvesting." },
];

export const getProject = (id: string) => projects.find((p) => p.id === id);

export const milestones = [
  { id: "M1", project: "NS-BR-0087", title: "Pylon foundation & well sinking", due: "2024-03-30", done: "2024-04-14", status: "Completed", weight: 15 },
  { id: "M2", project: "NS-BR-0087", title: "Main pylon to 120 m", due: "2025-02-28", done: "2025-03-20", status: "Completed", weight: 20 },
  { id: "M3", project: "NS-BR-0087", title: "Deck segment launching — 60%", due: "2025-11-30", done: "2025-12-18", status: "Completed", weight: 25 },
  { id: "M4", project: "NS-BR-0087", title: "Stay cable installation & stressing", due: "2026-05-31", done: null, status: "At Risk", weight: 20 },
  { id: "M5", project: "NS-BR-0087", title: "Wearing course, load test & handover", due: "2026-09-30", done: null, status: "Planning", weight: 20 },
  { id: "M6", project: "NS-RD-0142", title: "Land acquisition & utility shifting", due: "2024-09-30", done: "2024-09-21", status: "Completed", weight: 15 },
  { id: "M7", project: "NS-RD-0142", title: "Earthwork & sub-grade, Km 112–130", due: "2025-06-30", done: "2025-06-10", status: "Completed", weight: 25 },
  { id: "M8", project: "NS-RD-0142", title: "Bituminous layers, Km 112–130", due: "2026-02-28", done: null, status: "On Track", weight: 25 },
  { id: "M9", project: "NS-RD-0142", title: "Underpasses VUP-3 & VUP-4", due: "2026-08-31", done: null, status: "On Track", weight: 20 },
  { id: "M10", project: "NS-PB-0033", title: "MEP & medical gas pipeline", due: "2025-12-31", done: null, status: "Delayed", weight: 20 },
] as const;

export const inspections = [
  { id: "INS-2611", project: "NS-BR-0087", type: "Structural — Cable anchorage", inspector: "Dr. R. Narayan (IIT-P)", date: "2026-10-28", result: "Observations", score: 78 },
  { id: "INS-2608", project: "NS-RD-0142", type: "Quality — DBM core test", inspector: "Er. Meera Pillai", date: "2026-10-26", result: "Passed", score: 94 },
  { id: "INS-2604", project: "NS-PB-0033", type: "Fire safety NOC pre-check", inspector: "Fire Officer A. Khan", date: "2026-10-24", result: "Failed", score: 52 },
  { id: "INS-2599", project: "NS-WS-0219", type: "Hydrostatic pressure test", inspector: "Er. Vikram Patil", date: "2026-10-21", result: "Passed", score: 91 },
  { id: "INS-2593", project: "NS-DR-0054", type: "Safety — Excavation shoring", inspector: "Er. Sana Sheikh", date: "2026-10-18", result: "Observations", score: 71 },
  { id: "INS-2617", project: "NS-PB-0071", type: "Concrete cube strength (M40)", inspector: "Er. Rohit Bose", date: "2026-11-04", result: "Scheduled", score: null },
  { id: "INS-2620", project: "NS-RD-0142", type: "Third-party quality audit", inspector: "QCI Team 4", date: "2026-11-09", result: "Scheduled", score: null },
] as const;

export const payments = [
  { id: "RA-087-14", project: "NS-BR-0087", bill: "Running Account Bill #14", amount: 42.6, date: "2026-10-22", status: "Pending Approval" },
  { id: "RA-142-09", project: "NS-RD-0142", bill: "Running Account Bill #9", amount: 28.4, date: "2026-10-19", status: "Released" },
  { id: "RA-219-05", project: "NS-WS-0219", bill: "Running Account Bill #5", amount: 18.9, date: "2026-10-15", status: "Under Verification" },
  { id: "MOB-102-01", project: "NS-BR-0102", bill: "Mobilisation Advance", amount: 7.2, date: "2026-10-10", status: "Released" },
  { id: "RA-033-22", project: "NS-PB-0033", bill: "Running Account Bill #22", amount: 11.3, date: "2026-10-04", status: "On Hold" },
  { id: "RA-071-11", project: "NS-PB-0071", bill: "Running Account Bill #11", amount: 9.8, date: "2026-09-29", status: "Released" },
] as const;

export const documents = [
  { name: "Contract Agreement — BR-087.pdf", project: "NS-BR-0087", category: "Contract", size: "8.4 MB", by: "Legal Cell", date: "2023-01-18" },
  { name: "Revised GAD Drawings Rev-C.dwg", project: "NS-BR-0087", category: "Drawings", size: "42.1 MB", by: "Afcons Design", date: "2026-09-02" },
  { name: "DBM Core Test Report Oct-26.pdf", project: "NS-RD-0142", category: "Inspection", size: "2.3 MB", by: "Er. Meera Pillai", date: "2026-10-26" },
  { name: "Environmental Clearance.pdf", project: "NS-RD-0142", category: "Clearance", size: "1.1 MB", by: "MoEFCC", date: "2024-02-11" },
  { name: "SCADA Integration Spec v2.docx", project: "NS-WS-0219", category: "Technical", size: "3.7 MB", by: "VA Tech Hydro", date: "2026-08-14" },
  { name: "RA Bill 22 Measurement Book.xlsx", project: "NS-PB-0033", category: "Finance", size: "640 KB", by: "Accounts", date: "2026-10-04" },
  { name: "Site Progress Photos — Week 43.zip", project: "NS-DR-0054", category: "Site Media", size: "118 MB", by: "J Kumar Site Team", date: "2026-10-25" },
  { name: "Fire NOC Observations.pdf", project: "NS-PB-0033", category: "Inspection", size: "920 KB", by: "Fire Dept.", date: "2026-10-24" },
] as const;

export const auditLog = [
  { time: "2026-10-30 14:52", user: "Er. Priya Sinha", role: "Project Manager", action: "Updated milestone", target: "M4 · Stay cable installation → At Risk", ip: "10.24.8.17" },
  { time: "2026-10-30 13:10", user: "K. Raghavan", role: "Auditor", action: "Flagged payment", target: "RA-033-22 · variance 6.2% over BOQ", ip: "10.24.2.91" },
  { time: "2026-10-30 11:41", user: "Afcons Bridgeworks", role: "Contractor", action: "Submitted bill", target: "RA-087-14 · ₹42.6 Cr", ip: "103.21.44.6" },
  { time: "2026-10-29 17:28", user: "Admin · S. Iyer", role: "Administrator", action: "Granted access", target: "Er. Sana Sheikh → Inspector (Mumbai)", ip: "10.24.0.4" },
  { time: "2026-10-29 16:03", user: "Er. Meera Pillai", role: "Inspector", action: "Uploaded report", target: "DBM Core Test Report Oct-26.pdf", ip: "10.31.6.52" },
  { time: "2026-10-29 10:15", user: "Er. Kavita Rao", role: "Project Manager", action: "Issued notice", target: "Show-cause to J Kumar Infraprojects", ip: "10.40.1.33" },
  { time: "2026-10-28 18:44", user: "Dr. R. Narayan", role: "Inspector", action: "Logged inspection", target: "INS-2611 · 3 observations", ip: "10.24.9.12" },
  { time: "2026-10-28 09:02", user: "Finance · M. Gupta", role: "Administrator", action: "Released payment", target: "RA-142-09 · ₹28.4 Cr", ip: "10.24.0.18" },
] as const;

export const monthlySpend = [
  { m: "May", planned: 92, actual: 84 }, { m: "Jun", planned: 98, actual: 91 }, { m: "Jul", planned: 104, actual: 88 },
  { m: "Aug", planned: 110, actual: 102 }, { m: "Sep", planned: 118, actual: 109 }, { m: "Oct", planned: 124, actual: 117 },
];

export const inr = (cr: number) => `₹${cr.toLocaleString("en-IN")} Cr`;
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
