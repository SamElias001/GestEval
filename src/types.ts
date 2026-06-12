export interface Manager {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface Employee {
  id: string;
  name: string;
  registration: string; // Matrícula
  role: string; // Cargo
  department: string; // Departamento/Setor
  admissionDate: string; // YYYY-MM-DD
  contractType: string; // Tipo de contrato
  managerId: string; // Chefia responsável
  email: string; // E-mail do funcionário
  status: "Ativo" | "Inativo";
}

export type EvaluationScale = "Excelente" | "Bom" | "Regular" | "Insatisfatório" | "";

export interface Evaluation {
  id: string;
  employeeId: string;
  type: "45_days" | "90_days";
  dueDate: string;
  completedDate: string | null;
  status: "PENDING" | "COMPLETED";
  // Criteria scores
  attendance: EvaluationScale;
  punctuality: EvaluationScale;
  teamwork: EvaluationScale;
  communication: EvaluationScale;
  organization: EvaluationScale;
  quality: EvaluationScale;
  technical: EvaluationScale;
  interpersonal: EvaluationScale;
  initiative: EvaluationScale;
  rules: EvaluationScale;
  // Free text
  notes: string;
  pdi: string; // Plano de Desenvolvimento Individual
  finalVerdict: string; // Parecer final
  managerApproval: boolean;
}

export interface Notification {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  type: "45_days" | "90_days";
  dueDate: string;
  daysRemaining: number;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  activeEmployees: number;
  pending45: number;
  pending90: number;
  dueSoon7Days: number;
  overdue: number;
  completedThisMonth: number;
}
