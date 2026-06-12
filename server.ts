import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Employee, Manager, Evaluation, Notification, AuditLog } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Helper to persist database
interface DBStructure {
  managers: Manager[];
  employees: Employee[];
  evaluations: Evaluation[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

function getInitialDB(): DBStructure {
  // We're simulating relative times based on current date: 2026-06-11
  const todayStr = "2026-06-11";
  
  const managers: Manager[] = [
    { id: "mgr-1", name: "Maria Souza", email: "maria.souza@empresa.com", department: "Tecnologia" },
    { id: "mgr-2", name: "Carlos Santos", email: "carlos.santos@empresa.com", department: "Recursos Humanos" },
    { id: "mgr-3", name: "Juliana Lima", email: "juliana.lima@empresa.com", department: "Comercial" }
  ];

  // Let's seed employees with calculated dates based on "2026-06-11"
  // 1. João Silva: admitted 40 days ago (2026-05-02). 45-day evaluation due on 2026-06-16 (in 5 days!)
  // 2. Bruna Costa: admitted 48 days ago (2026-04-24). 45-day evaluation due on 2026-06-08 (3 days overdue!). 90-day due 2026-07-23.
  // 3. Lucas Pereira: admitted 85 days ago (2026-03-18). 45-day completed. 90-day due on 2026-06-16 (in 5 days!)
  // 4. Fernanda Oliveira: admitted 10 days ago (2026-06-01). 45-day due on 2026-07-16, 90-day due on 2026-08-30.
  // 5. Roberto Mendes: admitted 100 days ago (2026-03-03). Both 45-day and 90-day completed!
  const employees: Employee[] = [
    {
      id: "emp-1",
      name: "João Silva",
      registration: "MAT-202601",
      role: "Desenvolvedor Backend",
      department: "Tecnologia",
      admissionDate: "2026-05-02",
      contractType: "CLT",
      managerId: "mgr-1",
      email: "joao.silva@empresa.com",
      status: "Ativo"
    },
    {
      id: "emp-2",
      name: "Bruna Costa",
      registration: "MAT-202602",
      role: "Designer UX/UI",
      department: "Tecnologia",
      admissionDate: "2026-04-24",
      contractType: "CLT",
      managerId: "mgr-1",
      email: "bruna.costa@empresa.com",
      status: "Ativo"
    },
    {
      id: "emp-3",
      name: "Lucas Pereira",
      registration: "MAT-202603",
      role: "Analista de Suporte",
      department: "Tecnologia",
      admissionDate: "2026-03-18",
      contractType: "CLT",
      managerId: "mgr-1",
      email: "lucas.pereira@empresa.com",
      status: "Ativo"
    },
    {
      id: "emp-4",
      name: "Fernanda Oliveira",
      registration: "MAT-202604",
      role: "Analista de DP",
      department: "Recursos Humanos",
      admissionDate: "2026-06-01",
      contractType: "CLT",
      managerId: "mgr-2",
      email: "fernanda.oliveira@empresa.com",
      status: "Ativo"
    },
    {
      id: "emp-5",
      name: "Roberto Mendes",
      registration: "MAT-202605",
      role: "Executivo de Contas",
      department: "Comercial",
      admissionDate: "2026-03-03",
      contractType: "CLT",
      managerId: "mgr-3",
      email: "roberto.mendes@empresa.com",
      status: "Ativo"
    }
  ];

  // We write helper for adding days
  const addDaysHelper = (dateStr: string, days: number): string => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // Pre-configured evaluations matching status description
  const evaluations: Evaluation[] = [
    // João Silva (emp-1): 45-day pending, 90-day pending
    {
      id: "eval-1-45",
      employeeId: "emp-1",
      type: "45_days",
      dueDate: addDaysHelper("2026-05-02", 45),
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    {
      id: "eval-1-90",
      employeeId: "emp-1",
      type: "90_days",
      dueDate: addDaysHelper("2026-05-02", 90),
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    // Bruna Costa (emp-2): 45-day pending (late), 90-day pending
    {
      id: "eval-2-45",
      employeeId: "emp-2",
      type: "45_days",
      dueDate: addDaysHelper("2026-04-24", 45), // 2026-06-08 (overdue by 3 days)
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    {
      id: "eval-2-90",
      employeeId: "emp-2",
      type: "90_days",
      dueDate: addDaysHelper("2026-04-24", 90),
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    // Lucas Pereira (emp-3): 45-day completed, 90-day pending
    {
      id: "eval-3-45",
      employeeId: "emp-3",
      type: "45_days",
      dueDate: addDaysHelper("2026-03-18", 45), // 2026-05-02
      completedDate: "2026-04-30",
      status: "COMPLETED",
      attendance: "Excelente", punctuality: "Bom", teamwork: "Excelente", communication: "Bom", organization: "Bom",
      quality: "Excelente", technical: "Excelente", interpersonal: "Excelente", initiative: "Excelente", rules: "Excelente",
      notes: "Lucas tem demonstrado grande empenho e engajamento com as rotinas de TI durante os primeiros 45 dias.",
      pdi: "Melhorar fluência nos atendimentos de segundo nível.",
      finalVerdict: "Aprovado no primeiro ciclo com excelente desempenho.",
      managerApproval: true
    },
    {
      id: "eval-3-90",
      employeeId: "emp-3",
      type: "90_days",
      dueDate: addDaysHelper("2026-03-18", 90), // 2026-06-16 (due in 5 days)
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    // Fernanda Oliveira (emp-4): 45-day pending (due soon), 90-day pending
    {
      id: "eval-4-45",
      employeeId: "emp-4",
      type: "45_days",
      dueDate: addDaysHelper("2026-06-01", 45),
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    {
      id: "eval-4-90",
      employeeId: "emp-4",
      type: "90_days",
      dueDate: addDaysHelper("2026-06-01", 90),
      completedDate: null,
      status: "PENDING",
      attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
      quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
      notes: "", pdi: "", finalVerdict: "", managerApproval: false
    },
    // Roberto Mendes (emp-5): both completed
    {
      id: "eval-5-45",
      employeeId: "emp-5",
      type: "45_days",
      dueDate: addDaysHelper("2026-03-03", 45),
      completedDate: "2026-04-15",
      status: "COMPLETED",
      attendance: "Bom", punctuality: "Regular", teamwork: "Bom", communication: "Excelente", organization: "Bom",
      quality: "Bom", technical: "Bom", interpersonal: "Excelente", initiative: "Bom", rules: "Bom",
      notes: "Boa adaptação ao perfil de vendas. Pontualidade precisa de um pouco mais de cuidado.",
      pdi: "Desenvolver cronograma de visitas comerciais rígido.",
      finalVerdict: "Aptidão confirmada na primeira fase.",
      managerApproval: true
    },
    {
      id: "eval-5-90",
      employeeId: "emp-5",
      type: "90_days",
      dueDate: addDaysHelper("2026-03-03", 90),
      completedDate: "2026-05-28",
      status: "COMPLETED",
      attendance: "Excelente", punctuality: "Bom", teamwork: "Excelente", communication: "Excelente", organization: "Excelente",
      quality: "Excelente", technical: "Excelente", interpersonal: "Excelente", initiative: "Excelente", rules: "Excelente",
      notes: "Resultados comerciais acima da média no período de experiência. Muito proativo.",
      pdi: "Cursos de negociação avançada no próximo trimestre.",
      finalVerdict: "Contratação efetiva homologada com total recomendação.",
      managerApproval: true
    }
  ];

  // Notifications seeded
  const notifications: Notification[] = [
    {
      id: "notif-1",
      employeeId: "emp-1",
      employeeName: "João Silva",
      managerId: "mgr-1",
      managerName: "Maria Souza",
      type: "45_days",
      dueDate: "2026-06-16",
      daysRemaining: 5,
      message: "João Silva possui avaliação de 45 dias com vencimento em 5 dias. Responsável: Maria Souza.",
      createdAt: todayStr,
      read: false
    },
    {
      id: "notif-2",
      employeeId: "emp-2",
      employeeName: "Bruna Costa",
      managerId: "mgr-1",
      managerName: "Maria Souza",
      type: "45_days",
      dueDate: "2026-06-08",
      daysRemaining: -3,
      message: "ATENÇÃO: Bruna Costa possui avaliação de 45 dias ATRASADA há 3 dias. Responsável: Maria Souza.",
      createdAt: todayStr,
      read: false
    },
    {
      id: "notif-3",
      employeeId: "emp-3",
      employeeName: "Lucas Pereira",
      managerId: "mgr-1",
      managerName: "Maria Souza",
      type: "90_days",
      dueDate: "2026-06-16",
      daysRemaining: 5,
      message: "Lucas Pereira possui avaliação de 90 dias com vencimento em 5 dias. Responsável: Maria Souza.",
      createdAt: todayStr,
      read: false
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "log-1",
      timestamp: "2026-06-11T10:00:00Z",
      user: "Administrador (RH)",
      action: "Criação de Banco de Dados",
      details: "Sistema inicializado com dados padrão de testes."
    },
    {
      id: "log-2",
      timestamp: "2026-06-11T10:15:00Z",
      user: "Maria Souza",
      action: "Preenchimento de Avaliação",
      details: "Concluiu a avaliação de 45 dias de Lucas Pereira."
    },
    {
      id: "log-3",
      timestamp: "2026-06-11T11:30:00Z",
      user: "Juliana Lima",
      action: "Preenchimento de Avaliação",
      details: "Concluiu a avaliação de 90 dias de Roberto Mendes."
    }
  ];

  return { managers, employees, evaluations, notifications, auditLogs };
}

function loadDB(): DBStructure {
  if (!fs.existsSync(DB_FILE)) {
    const data = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return data;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, resetting:", err);
    const data = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return data;
  }
}

function saveDB(data: DBStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Ensure database file loaded / created
loadDB();

// API ENDPOINTS

// 1. Managers CRUD
app.get("/api/managers", (req, res) => {
  const db = loadDB();
  res.json(db.managers);
});

app.post("/api/managers", (req, res) => {
  const db = loadDB();
  const newMgr: Manager = {
    id: "mgr-" + Date.now(),
    name: req.body.name,
    email: req.body.email,
    department: req.body.department
  };
  db.managers.push(newMgr);
  
  // Log event
  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Administrador (RH)",
    action: "Cadastrou Chefia",
    details: `Chefia ${newMgr.name} (${newMgr.email}) adicionada.`
  });
  
  saveDB(db);
  res.status(201).json(newMgr);
});

app.put("/api/managers/:id", (req, res) => {
  const db = loadDB();
  const index = db.managers.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Manager not found" });
  
  const oldName = db.managers[index].name;
  db.managers[index] = {
    ...db.managers[index],
    name: req.body.name || db.managers[index].name,
    email: req.body.email || db.managers[index].email,
    department: req.body.department || db.managers[index].department
  };

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Administrador (RH)",
    action: "Editou Chefia",
    details: `Chefia ${oldName} editada para ${db.managers[index].name}.`
  });

  saveDB(db);
  res.json(db.managers[index]);
});

app.delete("/api/managers/:id", (req, res) => {
  const db = loadDB();
  const index = db.managers.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Manager not found" });

  const manager = db.managers[index];
  // Check if has active employees
  const hasEmployees = db.employees.some(e => e.managerId === manager.id && e.status === "Ativo");
  if (hasEmployees) {
    return res.status(400).json({ error: "Esta chefia possui funcionários ativos vinculados e não pode ser excluída." });
  }

  db.managers.splice(index, 1);

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Administrador (RH)",
    action: "Excluiu Chefia",
    details: `Chefia ${manager.name} removida.`
  });

  saveDB(db);
  res.json({ message: "Manager deleted successfully" });
});


// 2. Employees CRUD
app.get("/api/employees", (req, res) => {
  const db = loadDB();
  res.json(db.employees);
});

// Helper to add days to a date string
const addDaysHelper = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

app.post("/api/employees", (req, res) => {
  const db = loadDB();
  const { name, registration, role, department, admissionDate, contractType, managerId, email, status } = req.body;
  
  if (!name || !registration || !role || !department || !admissionDate || !contractType || !managerId || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check unique registration
  if (db.employees.some(e => e.registration === registration)) {
    return res.status(400).json({ error: `Já existe um funcionário cadastrado com a matrícula ${registration}` });
  }

  const newEmp: Employee = {
    id: "emp-" + Date.now(),
    name,
    registration,
    role,
    department,
    admissionDate,
    contractType,
    managerId,
    email,
    status: status || "Ativo"
  };

  db.employees.push(newEmp);

  // Automatically calculate evaluation dates and create pending evaluations
  const target45 = addDaysHelper(admissionDate, 45);
  const target90 = addDaysHelper(admissionDate, 90);

  const eval45: Evaluation = {
    id: `eval-${newEmp.id}-45`,
    employeeId: newEmp.id,
    type: "45_days",
    dueDate: target45,
    completedDate: null,
    status: "PENDING",
    attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
    quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
    notes: "", pdi: "", finalVerdict: "", managerApproval: false
  };

  const eval90: Evaluation = {
    id: `eval-${newEmp.id}-90`,
    employeeId: newEmp.id,
    type: "90_days",
    dueDate: target90,
    completedDate: null,
    status: "PENDING",
    attendance: "", punctuality: "", teamwork: "", communication: "", organization: "",
    quality: "", technical: "", interpersonal: "", initiative: "", rules: "",
    notes: "", pdi: "", finalVerdict: "", managerApproval: false
  };

  db.evaluations.push(eval45);
  db.evaluations.push(eval90);

  // Auto notification triggers
  generateAlertsForEmployee(db, newEmp, eval45, eval90);

  // Log
  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Administrador (RH)",
    action: "Cadastrou Colaborador",
    details: `${newEmp.name} (${newEmp.role}) cadastrado. Avaliações geradas para ${target45} (45 dias) e ${target90} (90 dias).`
  });

  saveDB(db);
  res.status(201).json(newEmp);
});

app.put("/api/employees/:id", (req, res) => {
  const db = loadDB();
  const index = db.employees.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Employee not found" });

  const oldEmp = db.employees[index];
  const { name, registration, role, department, admissionDate, contractType, managerId, email, status } = req.body;

  const admissionDateChanged = admissionDate && admissionDate !== oldEmp.admissionDate;

  db.employees[index] = {
    ...oldEmp,
    name: name || oldEmp.name,
    registration: registration || oldEmp.registration,
    role: role || oldEmp.role,
    department: department || oldEmp.department,
    admissionDate: admissionDate || oldEmp.admissionDate,
    contractType: contractType || oldEmp.contractType,
    managerId: managerId || oldEmp.managerId,
    email: email || oldEmp.email,
    status: status || oldEmp.status
  };

  const updatedEmp = db.employees[index];

  // If admission date is edited, recalculate dueDates for PENDING evaluations
  if (admissionDateChanged) {
    const target45 = addDaysHelper(updatedEmp.admissionDate, 45);
    const target90 = addDaysHelper(updatedEmp.admissionDate, 90);

    const ev45 = db.evaluations.find(ev => ev.employeeId === updatedEmp.id && ev.type === "45_days");
    const ev90 = db.evaluations.find(ev => ev.employeeId === updatedEmp.id && ev.type === "90_days");

    if (ev45 && ev45.status === "PENDING") {
      ev45.dueDate = target45;
    }
    if (ev90 && ev90.status === "PENDING") {
      ev90.dueDate = target90;
    }

    // Regenerate notifications
    db.notifications = db.notifications.filter(n => n.employeeId !== updatedEmp.id);
    generateAlertsForEmployee(db, updatedEmp, ev45 || null, ev90 || null);
  } else {
    // If manager or email changed, update existing descriptions in notifications or similar
    db.notifications.forEach(n => {
      if (n.employeeId === updatedEmp.id) {
        const mgr = db.managers.find(m => m.id === updatedEmp.managerId);
        n.employeeName = updatedEmp.name;
        n.managerId = updatedEmp.managerId;
        n.managerName = mgr ? mgr.name : "N/A";
        // update message
        const days = n.daysRemaining;
        const statusText = days < 0 ? `ATRASADA há ${Math.abs(days)} dias` : `com vencimento em ${days} dias`;
        n.message = `${updatedEmp.name} possui avaliação de ${n.type === "45_days" ? "45 dias" : "90 dias"} ${statusText}. Responsável: ${n.managerName}.`;
      }
    });
  }

  // Audit Log
  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Administrador (RH)",
    action: "Atualizou Colaborador",
    details: `${updatedEmp.name} (${updatedEmp.registration}) atualizado.`
  });

  saveDB(db);
  res.json(updatedEmp);
});

app.delete("/api/employees/:id", (req, res) => {
  const db = loadDB();
  const index = db.employees.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Employee not found" });

  const emp = db.employees[index];

  // Remove evaluations, notifications, etc
  db.employees.splice(index, 1);
  db.evaluations = db.evaluations.filter(ev => ev.employeeId !== emp.id);
  db.notifications = db.notifications.filter(n => n.employeeId !== emp.id);

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Administrador (RH)",
    action: "Excluiu Colaborador",
    details: `Colaborador ${emp.name} (${emp.registration}) removido e histórico excluído.`
  });

  saveDB(db);
  res.json({ message: "Employee deleted" });
});


// 3. Evaluations
app.get("/api/evaluations", (req, res) => {
  const db = loadDB();
  res.json(db.evaluations);
});

app.put("/api/evaluations/:id", (req, res) => {
  const db = loadDB();
  const evaluationIndex = db.evaluations.findIndex(ev => ev.id === req.params.id);
  if (evaluationIndex === -1) return res.status(404).json({ error: "Evaluation not found" });

  const oldEval = db.evaluations[evaluationIndex];
  const {
    attendance, punctuality, teamwork, communication, organization,
    quality, technical, interpersonal, initiative, rules,
    notes, pdi, finalVerdict, managerApproval, completedDate, status, user
  } = req.body;

  db.evaluations[evaluationIndex] = {
    ...oldEval,
    attendance: attendance !== undefined ? attendance : oldEval.attendance,
    punctuality: punctuality !== undefined ? punctuality : oldEval.punctuality,
    teamwork: teamwork !== undefined ? teamwork : oldEval.teamwork,
    communication: communication !== undefined ? communication : oldEval.communication,
    organization: organization !== undefined ? organization : oldEval.organization,
    quality: quality !== undefined ? quality : oldEval.quality,
    technical: technical !== undefined ? technical : oldEval.technical,
    interpersonal: interpersonal !== undefined ? interpersonal : oldEval.interpersonal,
    initiative: initiative !== undefined ? initiative : oldEval.initiative,
    rules: rules !== undefined ? rules : oldEval.rules,
    notes: notes !== undefined ? notes : oldEval.notes,
    pdi: pdi !== undefined ? pdi : oldEval.pdi,
    finalVerdict: finalVerdict !== undefined ? finalVerdict : oldEval.finalVerdict,
    managerApproval: managerApproval !== undefined ? managerApproval : oldEval.managerApproval,
    completedDate: completedDate !== undefined ? completedDate : oldEval.completedDate,
    status: status !== undefined ? status : oldEval.status
  };

  const updatedEval = db.evaluations[evaluationIndex];
  const emp = db.employees.find(e => e.id === updatedEval.employeeId);
  const employeeName = emp ? emp.name : "Funcionário";

  // If completed, remove relevant notifications of this type for this employee
  if (updatedEval.status === "COMPLETED") {
    db.notifications = db.notifications.filter(n => !(n.employeeId === updatedEval.employeeId && n.type === updatedEval.type));
  }

  // Audit logger user
  const actor = user || "Chefia Responsável";

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: actor,
    action: updatedEval.status === "COMPLETED" ? "Concluiu Avaliação" : "Salvou Rascunho de Avaliação",
    details: `${updatedEval.status === "COMPLETED" ? "Concluiu" : "Salvou rascunho de"} avaliação de ${updatedEval.type === "45_days" ? "45 dias" : "90 dias"} de ${employeeName}.`
  });

  saveDB(db);
  res.json(updatedEval);
});


// 4. Notifications
app.get("/api/notifications", (req, res) => {
  const db = loadDB();
  res.json(db.notifications);
});

app.put("/api/notifications/:id/read", (req, res) => {
  const db = loadDB();
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveDB(db);
  }
  res.json(notif || { error: "Notification not found" });
});

// Refresh triggers manually
app.post("/api/notifications/refresh", (req, res) => {
  const db = loadDB();
  
  // Clear non-read or all pending notifications first to avoid double entries, 
  // or recompute wisely based on current system date.
  db.notifications = [];

  db.employees.forEach(emp => {
    if (emp.status === "Ativo") {
      const ev45 = db.evaluations.find(e => e.employeeId === emp.id && e.type === "45_days");
      const ev90 = db.evaluations.find(e => e.employeeId === emp.id && e.type === "90_days");
      generateAlertsForEmployee(db, emp, ev45 || null, ev90 || null);
    }
  });

  saveDB(db);
  res.json({ message: "Notificações atualizadas com sucesso", count: db.notifications.length });
});


// 5. Audit AuditLogs
app.get("/api/audit", (req, res) => {
  const db = loadDB();
  res.json(db.auditLogs);
});


// Helper to generate notification items
function generateAlertsForEmployee(db: DBStructure, emp: Employee, ev45: Evaluation | null, ev90: Evaluation | null) {
  const todayStr = "2026-06-11"; // Mock system baseline date
  const today = new Date(todayStr + "T00:00:00");

  const checkAndCreate = (ev: Evaluation | null) => {
    if (!ev || ev.status === "COMPLETED") return;

    const due = new Date(ev.dueDate + "T00:00:00");
    const diffTime = due.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const mgr = db.managers.find(m => m.id === emp.managerId);
    const mgrName = mgr ? mgr.name : "N/A";
    const typeLabel = ev.type === "45_days" ? "45 dias" : "90 dias";

    // Alertas de vencimento:
    // - 15 dias antes do vencimento.
    // - 7 dias antes do vencimento.
    // - 3 dias antes do vencimento.
    // - No dia do vencimento.
    // - Após o vencimento.

    let shouldAlert = false;
    let message = "";

    if (daysRemaining < 0) {
      shouldAlert = true;
      message = `ATENÇÃO: ${emp.name} possui avaliação de ${typeLabel} ATRASADA há ${Math.abs(daysRemaining)} dias. Responsável: ${mgrName}.`;
    } else if (daysRemaining === 0) {
      shouldAlert = true;
      message = `Urgente: ${emp.name} possui avaliação de ${typeLabel} vencendo HOJE. Responsável: ${mgrName}.`;
    } else if (daysRemaining === 3 || daysRemaining === 7 || daysRemaining === 15) {
      shouldAlert = true;
      message = `${emp.name} possui avaliação de ${typeLabel} com vencimento em ${daysRemaining} dias. Responsável: ${mgrName}.`;
    } else {
      // Just check if near deadline or general alert
      shouldAlert = daysRemaining <= 15;
      message = `${emp.name} possui avaliação de ${typeLabel} com vencimento em ${daysRemaining} dias. Responsável: ${mgrName}.`;
    }

    if (shouldAlert) {
      db.notifications.push({
        id: `notif-${ev.id}-${daysRemaining}`,
        employeeId: emp.id,
        employeeName: emp.name,
        managerId: emp.managerId,
        managerName: mgrName,
        type: ev.type,
        dueDate: ev.dueDate,
        daysRemaining,
        message,
        createdAt: todayStr,
        read: false
      });
    }
  };

  checkAndCreate(ev45);
  checkAndCreate(ev90);
}


// VITE MIDDLEWARE / STATIC ASSETS
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
