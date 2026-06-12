import React, { useState } from "react";
import { Employee, Evaluation, Manager } from "../types";
import { getDaysRemaining, getEvaluationStatus } from "../utils";
import { Search, Filter, Edit2, Trash2, Milestone, UserPlus, UserMinus, Plus } from "lucide-react";

interface EmployeeTableProps {
  employees: Employee[];
  evaluations: Evaluation[];
  managers: Manager[];
  currentUserRole: string; // "Administrador (RH)" or "managerId"
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSelectReview: (employee: Employee, evaluation: Evaluation) => void;
}

export default function EmployeeTable({
  employees,
  evaluations,
  managers,
  currentUserRole,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onSelectReview
}: EmployeeTableProps) {
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSetor, setFilterSetor] = useState("");
  const [filterManager, setFilterManager] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterContract, setFilterContract] = useState("");
  const [filterContractCycle, setFilterContractCycle] = useState(""); // "45_days_pending", "90_days_pending", "completed"

  const isAdmin = currentUserRole === "Administrador (RH)";

  // Filter departments for list
  const departments = Array.from(new Set(employees.map(e => e.department)));

  // Filtered employees listing
  const filteredEmployees = employees.filter(emp => {
    // If NOT admin, they can ONLY see their own subordinates!
    // Chefia/Gestor: "Visualizar apenas os funcionários sob sua responsabilidade."
    if (!isAdmin) {
      // Find the manager object by code
      const currentMgr = managers.find(m => m.name === currentUserRole);
      if (currentMgr && emp.managerId !== currentMgr.id) {
        return false;
      }
    }

    // Name or Matrícula search match
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());

    // Category / Dropdown filters matching
    const matchesSetor = !filterSetor || emp.department === filterSetor;
    const matchesManager = !filterManager || emp.managerId === filterManager;
    const matchesStatus = !filterStatus || emp.status === filterStatus;
    const matchesContract = !filterContract || emp.contractType === filterContract;

    // Filter by evaluations status
    let matchesCycle = true;
    if (filterContractCycle) {
      const ev45 = evaluations.find(ev => ev.employeeId === emp.id && ev.type === "45_days");
      const ev90 = evaluations.find(ev => ev.employeeId === emp.id && ev.type === "90_days");

      if (filterContractCycle === "45_days_pending") {
        matchesCycle = ev45 ? ev45.status === "PENDING" : false;
      } else if (filterContractCycle === "90_days_pending") {
        matchesCycle = ev90 ? ev90.status === "PENDING" : false;
      } else if (filterContractCycle === "45_days_completed") {
        matchesCycle = ev45 ? ev45.status === "COMPLETED" : false;
      } else if (filterContractCycle === "90_days_completed") {
        matchesCycle = ev90 ? ev90.status === "COMPLETED" : false;
      } else if (filterContractCycle === "overdue") {
        const d45 = ev45 && ev45.status === "PENDING" ? getDaysRemaining(ev45.dueDate) < 0 : false;
        const d90 = ev90 && ev90.status === "PENDING" ? getDaysRemaining(ev90.dueDate) < 0 : false;
        matchesCycle = d45 || d90;
      }
    }

    return matchesSearch && matchesSetor && matchesManager && matchesStatus && matchesContract && matchesCycle;
  });

  return (
    <div className="space-y-4">
      
      {/* Search Header toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-4 no-print">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white font-display text-sm sm:text-base">Módulo de Acompanhamento das Fichas</h3>
            <p className="text-xs text-zinc-400">Pesquise, filtre e dê feedback nos ciclos de experiência</p>
          </div>
          
          {isAdmin && (
            <button
              onClick={onAddEmployee}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:shadow-md"
            >
              <Plus className="w-4 h-4" /> Cadastrar Colaborador
            </button>
          )}
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800" />

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs font-medium">
          
          {/* Main search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar Nome, Matrícula ou Cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Department dropdown */}
          <div>
            <select
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="">Todos os Setores</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Manager / Leader dropdown (Active for Admin RH only) */}
          {isAdmin ? (
            <div>
              <select
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
                className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                <option value="">Líder / Chefia (Todas)</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-2 py-1.5 bg-zinc-50 dark:bg-zinc-800/40 text-center rounded-lg border border-zinc-100 dark:border-zinc-800/60 font-medium italic text-zinc-400">
              Visualização restrita à sua equipe
            </div>
          )}

          {/* Cycle / Status filter */}
          <div>
            <select
              value={filterContractCycle}
              onChange={(e) => setFilterContractCycle(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="">Ciclo / Status de Ficha</option>
              <option value="45_days_pending">45 dias - Pendentes</option>
              <option value="45_days_completed">45 dias - Concluídas</option>
              <option value="90_days_pending">90 dias - Pendentes</option>
              <option value="90_days_completed">90 dias - Concluídas</option>
              <option value="overdue">🚨 Avaliações em Atraso</option>
            </select>
          </div>

          {/* Status (Ativo/Inativo) filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="">Status do Vínculo</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Data Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <UserMinus className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-medium">Nenhum colaborador corresponde aos filtros.</p>
            <p className="text-xs text-zinc-400 mt-0.5">Redefina o termo de busca ou filtros de setores e chefias.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider font-semibold bg-zinc-50/50 dark:bg-zinc-900/40">
                  <th className="py-3 px-4">Colaborador / Info</th>
                  <th className="py-3 px-4">Cargo / Setor</th>
                  <th className="py-3 px-4 text-center">Contrato / Admissão</th>
                  <th className="py-3 px-4 text-center">Chefia Responsável</th>
                  <th className="py-3 px-4 text-center">Avaliação 45 Dias</th>
                  <th className="py-3 px-4 text-center">Avaliação 90 Dias</th>
                  <th className="py-3 px-4 text-right no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {filteredEmployees.map((emp) => {
                  const ev45 = evaluations.find(ev => ev.employeeId === emp.id && ev.type === "45_days") || null;
                  const ev90 = evaluations.find(ev => ev.employeeId === emp.id && ev.type === "90_days") || null;
                  const mgr = managers.find(m => m.id === emp.managerId);

                  const s45 = getEvaluationStatus(ev45);
                  const s90 = getEvaluationStatus(ev90);

                  // Calculate next pending days remaining for actions column
                  let daysLabel = "Completo";
                  let daysColor = "text-zinc-400";
                  const rem45 = ev45 && ev45.status === "PENDING" ? getDaysRemaining(ev45.dueDate) : null;
                  const rem90 = ev90 && ev90.status === "PENDING" ? getDaysRemaining(ev90.dueDate) : null;

                  if (rem45 !== null) {
                    daysLabel = rem45 < 0 ? `Atraso 45d (${Math.abs(rem45)}d)` : `Faltam ${rem45}d (45d)`;
                    daysColor = rem45 < 0 ? "text-red-600 dark:text-red-400 font-bold" : rem45 <= 7 ? "text-orange-500 font-bold" : "text-zinc-500";
                  } else if (rem90 !== null) {
                    daysLabel = rem90 < 0 ? `Atraso 90d (${Math.abs(rem90)}d)` : `Faltam ${rem90}d (90d)`;
                    daysColor = rem90 < 0 ? "text-red-600 dark:text-red-400 font-bold" : rem90 <= 7 ? "text-orange-500 font-bold" : "text-zinc-500";
                  }

                  return (
                    <tr key={emp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      {/* Name registration info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">{emp.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                              emp.status === "Ativo"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/40"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>
                              {emp.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                            <span>{emp.registration}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{emp.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo / Sector */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-800 dark:text-zinc-200 font-medium">{emp.role}</div>
                        <div className="text-xs text-zinc-400 font-semibold">{emp.department}</div>
                      </td>

                      {/* Contract Type / Admission */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded font-semibold">{emp.contractType}</span>
                        <div className="text-xs text-zinc-400 mt-1">{emp.admissionDate.split("-").reverse().join("/")}</div>
                      </td>

                      {/* Responsible Manager */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{mgr?.name || "N/A"}</div>
                        <div className="text-[10px] text-zinc-400 font-medium font-mono">{mgr?.email || "N/A"}</div>
                      </td>

                      {/* 45 Days evaluation */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold ${s45.bgColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s45.dotColor}`} />
                            {s45.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono mt-1">Vence: {ev45?.dueDate.split("-").reverse().join("/")}</span>
                          {ev45 && ev45.status === "PENDING" && (
                            <button
                              onClick={() => onSelectReview(emp, ev45)}
                              className="text-[10px] mt-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                            >
                              Preencher &rarr;
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 90 Days evaluation */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold ${s90.bgColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s90.dotColor}`} />
                            {s90.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono mt-1">Vence: {ev90?.dueDate.split("-").reverse().join("/")}</span>
                          {ev90 && ev90.status === "PENDING" && (
                            <button
                              onClick={() => onSelectReview(emp, ev90)}
                              className="text-[10px] mt-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                            >
                              Preencher &rarr;
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions toolbar */}
                      <td className="py-3.5 px-4 text-right no-print">
                        <div className="flex justify-end items-center gap-1.5">
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onEditEmployee(emp)}
                                className="p-1 px-1.5 text-xs font-semibold text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                                title="Editar Colaborador"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => onDeleteEmployee(emp.id)}
                                className="p-1 px-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                                title="Excluir Colaborador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {!isAdmin && (
                            <span className="text-[10px] text-zinc-400 italic">Restrito Chefias</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
