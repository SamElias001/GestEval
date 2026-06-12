import React, { useState, useEffect } from "react";
import { Employee, Evaluation, Manager, Notification, AuditLog } from "./types";
import Dashboard from "./components/Dashboard";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeForm from "./components/EmployeeForm";
import EvaluationForm from "./components/EvaluationForm";
import NotificationsPanel from "./components/NotificationsPanel";
import ReportExport from "./components/ReportExport";
import AuditLogs from "./components/AuditLogs";
import { 
  Users, 
  Settings, 
  Layers, 
  Bell, 
  History, 
  BarChart3, 
  Moon, 
  Sun, 
  FolderLock, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  FileCheck2,
  Mail,
  UserCheck
} from "lucide-react";

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Navigation and Session
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUserRole, setCurrentUserRole] = useState("Administrador (RH)"); // Roles: Admin or specific chefia name
  const [darkMode, setDarkMode] = useState(false);

  // Modals / Overlays
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [selectedEmployeeForForm, setSelectedEmployeeForForm] = useState<Employee | null>(null);
  const [evaluationFormOpen, setEvaluationFormOpen] = useState(false);
  const [selectedEvaluationForForm, setSelectedEvaluationForForm] = useState<Evaluation | null>(null);
  const [selectedEmployeeForEvaluation, setSelectedEmployeeForEvaluation] = useState<Employee | null>(null);

  // Manager Chefia management
  const [managersModalOpen, setManagersModalOpen] = useState(false);
  const [mgrName, setMgrName] = useState("");
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrDept, setMgrDept] = useState("");
  const [editingMgrId, setEditingMgrId] = useState<string | null>(null);
  const [mgrError, setMgrError] = useState("");

  // Load backend data from Express
  const fetchAllData = async () => {
    try {
      const [empRes, evalRes, mgrRes, notifRes, logRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/evaluations"),
        fetch("/api/managers"),
        fetch("/api/notifications"),
        fetch("/api/audit")
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (evalRes.ok) setEvaluations(await evalRes.json());
      if (mgrRes.ok) setManagers(await mgrRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (logRes.ok) setAuditLogs(await logRes.json());
    } catch (err) {
      console.error("Erro ao sincronizar dados com o servidor:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentUserRole]);

  // Apply Dark Mode class to root element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Employee creation/updates
  const handleSaveEmployee = async (formData: Partial<Employee>) => {
    try {
      const url = selectedEmployeeForForm 
        ? `/api/employees/${selectedEmployeeForForm.id}`
        : "/api/employees";
      
      const method = selectedEmployeeForForm ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!r.ok) {
        const errorData = await r.json();
        alert(errorData.error || "Ocorreu um erro ao salvar o registro.");
        return;
      }

      setEmployeeFormOpen(false);
      setSelectedEmployeeForForm(null);
      await fetchAllData();
    } catch (err) {
      console.error("Erro ao salvar funcionário:", err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Atenção: Excluir este colaborador irá apagar permanentemente todo o histórico de avaliações dele. Deseja continuar?")) return;
    try {
      const r = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (r.ok) {
        await fetchAllData();
      } else {
        const err = await r.json();
        alert(err.error || "Erro ao deletar");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Evaluation submissions
  const handleSaveEvaluation = async (evaluationId: string, updatedData: Partial<Evaluation>) => {
    try {
      const r = await fetch(`/api/evaluations/${evaluationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          user: currentUserRole // log which user completed/saved it
        })
      });

      if (r.ok) {
        setEvaluationFormOpen(false);
        setSelectedEvaluationForForm(null);
        setSelectedEmployeeForEvaluation(null);
        await fetchAllData();
      } else {
        const err = await r.json();
        alert(err.error || "Erro ao salvar avaliação");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Notification management
  const handleRefreshNotifications = async () => {
    try {
      const r = await fetch("/api/notifications/refresh", { method: "POST" });
      if (r.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const r = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (r.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chefias/Managers management
  const handleAddOrEditManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setMgrError("");

    if (!mgrName.trim() || !mgrEmail.trim() || !mgrDept.trim()) {
      setMgrError("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const url = editingMgrId ? `/api/managers/${editingMgrId}` : "/api/managers";
      const method = editingMgrId ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mgrName, email: mgrEmail, department: mgrDept })
      });

      if (r.ok) {
        setMgrName("");
        setMgrEmail("");
        setMgrDept("");
        setEditingMgrId(null);
        await fetchAllData();
      } else {
        const err = await r.json();
        setMgrError(err.error || "Erro ao salvar chefia");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteManager = async (id: string) => {
    if (!window.confirm("Deseja realmente remover esta chefia? Essa ação não pode ser desfeita.")) return;
    try {
      const r = await fetch(`/api/managers/${id}`, { method: "DELETE" });
      if (r.ok) {
        await fetchAllData();
      } else {
        const err = await r.json();
        alert(err.error || "Não foi possível excluir a chefia.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditManager = (mgr: Manager) => {
    setEditingMgrId(mgr.id);
    setMgrName(mgr.name);
    setMgrEmail(mgr.email);
    setMgrDept(mgr.department);
  };

  const cancelEditManager = () => {
    setEditingMgrId(null);
    setMgrName("");
    setMgrEmail("");
    setMgrDept("");
  };

  // Filters notifications relative to current user role selection
  const getFilteredNotificationsForUser = () => {
    if (currentUserRole === "Administrador (RH)") return notifications;
    // Otherwise filter for specifically matching responsible manager name
    const currentMgr = managers.find(m => m.name === currentUserRole);
    if (!currentMgr) return [];
    return notifications.filter(n => n.managerId === currentMgr.id);
  };

  const filteredNotifs = getFilteredNotificationsForUser();
  const unreadNotifsCount = filteredNotifs.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen font-sans antialiased text-zinc-800 dark:text-zinc-200 bg-linear-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 transition-colors duration-200 pb-16`}>
      
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/80 z-40 transition-colors duration-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white font-display tracking-tight leading-none">
                GestEval <span className="text-blue-600 text-xs font-semibold">3.0</span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium">Controle de Experiência (45/90 dias)</p>
            </div>
          </div>

          {/* User profile toggle switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] text-zinc-400 font-mono">Modo de Acesso:</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{currentUserRole}</span>
            </div>

            {/* Profile Dropdown to switch roles instantly */}
            <select
              value={currentUserRole}
              onChange={(e) => {
                setCurrentUserRole(e.target.value);
                setActiveTab("dashboard"); // Go back to dashboard on user change to prevent state leaking
              }}
              title="Alternar Perfil de Usuário"
              className="text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-1.5 px-3.5 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sans cursor-pointer focus:border-none"
            >
              <option value="Administrador (RH)">🔑 Administrador (RH)</option>
              {managers.map(m => (
                <option key={m.id} value={m.name}>👤 Gestor: {m.name}</option>
              ))}
            </select>

            {/* Light/Dark Toggle clicker */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-805 rounded-xl cursor-pointer transition-colors"
              title="Alternar Modo Escuro / Claro"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Primary Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Visual Side Menu bar */}
          <div className="lg:col-span-3 space-y-3 no-print">
            <div className="bg-white dark:bg-slate-900 border border-zinc-200/80 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs dark:shadow-lg space-y-1 text-zinc-700 dark:text-slate-300 animate-fade-in">
              <h2 className="text-[10px] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2 font-display animate-none">Navegação Principal</h2>
              
              {/* Menu items */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow-md font-bold"
                    : "text-zinc-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard Principal</span>
              </button>

              <button
                onClick={() => setActiveTab("acompanhamento")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "acompanhamento"
                    ? "bg-blue-600 text-white shadow-md font-bold"
                    : "text-zinc-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Acompanhamento Fichas</span>
              </button>

              <button
                onClick={() => setActiveTab("notificacoes")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "notificacoes"
                    ? "bg-blue-600 text-white shadow-md font-bold"
                    : "text-zinc-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Alertas Inteligentes</span>
                </div>
                {unreadNotifsCount > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    activeTab === "notificacoes" 
                      ? "bg-white text-blue-600" 
                      : "bg-red-500 text-white animate-pulse"
                  }`}>
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("relatorios")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "relatorios"
                    ? "bg-blue-600 text-white shadow-md font-bold"
                    : "text-zinc-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Relatórios e Dossiê PDF</span>
              </button>

              <button
                onClick={() => setActiveTab("auditoria")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "auditoria"
                    ? "bg-blue-600 text-white shadow-md font-bold"
                    : "text-zinc-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Trilha de Auditoria</span>
              </button>
            </div>

            {/* Chefias Admin module block */}
            {currentUserRole === "Administrador (RH)" && (
              <div className="bg-white dark:bg-slate-900 border border-zinc-200/80 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs dark:shadow-lg space-y-3 prose text-zinc-800 dark:text-white">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest font-display">Gestão de Equipes</span>
                  <span className="p-1 px-1.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded font-mono uppercase">Admin RH</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-relaxed">
                  Cadastre chefias para que os líderes tenham login individualizado e recebam lembretes por e-mail de seus colaboradores diretos.
                </p>
                <button
                  onClick={() => setManagersModalOpen(true)}
                  className="w-full text-xs font-bold text-zinc-700 dark:text-zinc-100 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 hover:bg-zinc-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-zinc-200 dark:border-slate-700 py-2 rounded-xl text-center cursor-pointer transition-all"
                >
                  Cadastrar &amp; Editar Líderes
                </button>
              </div>
            )}
          </div>

          {/* Active Panel visual workspace */}
          <div className="lg:col-span-9 animate-fade-in print:lg:col-span-12">
            
            {activeTab === "dashboard" && (
              <Dashboard 
                employees={employees} 
                evaluations={evaluations} 
                managers={managers} 
                onSelectTab={(tab) => setActiveTab(tab)}
                onSelectEmployee={(empId) => {
                  // Direct shortcut to evaluate pending ciclos
                  const emp = employees.find(e => e.id === empId);
                  const evalPending = evaluations.find(ev => ev.employeeId === empId && ev.status === "PENDING");
                  if (emp && evalPending) {
                    setSelectedEmployeeForEvaluation(emp);
                    setSelectedEvaluationForForm(evalPending);
                    setEvaluationFormOpen(true);
                  } else {
                    setActiveTab("acompanhamento");
                  }
                }}
              />
            )}

            {activeTab === "acompanhamento" && (
              <EmployeeTable
                employees={employees}
                evaluations={evaluations}
                managers={managers}
                currentUserRole={currentUserRole}
                onAddEmployee={() => {
                  setSelectedEmployeeForForm(null);
                  setEmployeeFormOpen(true);
                }}
                onEditEmployee={(emp) => {
                  setSelectedEmployeeForForm(emp);
                  setEmployeeFormOpen(true);
                }}
                onDeleteEmployee={handleDeleteEmployee}
                onSelectReview={(emp, ev) => {
                  setSelectedEmployeeForEvaluation(emp);
                  setSelectedEvaluationForForm(ev);
                  setEvaluationFormOpen(true);
                }}
              />
            )}

            {activeTab === "notificacoes" && (
              <NotificationsPanel
                notifications={filteredNotifs}
                onRefresh={handleRefreshNotifications}
                onMarkAsRead={handleMarkAsRead}
              />
            )}

            {activeTab === "relatorios" && (
              <ReportExport
                employees={employees}
                evaluations={evaluations}
                managers={managers}
              />
            )}

            {activeTab === "auditoria" && (
              <AuditLogs logs={auditLogs} />
            )}

          </div>

        </div>
      </main>

      {/* Overlay - Employee Add/Edit Form Modal */}
      {employeeFormOpen && (
        <EmployeeForm
          employee={selectedEmployeeForForm}
          managers={managers}
          onSave={handleSaveEmployee}
          onClose={() => {
            setEmployeeFormOpen(false);
            setSelectedEmployeeForForm(null);
          }}
        />
      )}

      {/* Overlay - Performance Evaluation assessment sheet form */}
      {evaluationFormOpen && selectedEmployeeForEvaluation && selectedEvaluationForForm && (
        <EvaluationForm
          employee={selectedEmployeeForEvaluation}
          evaluation={selectedEvaluationForForm}
          onSave={handleSaveEvaluation}
          onClose={() => {
            setEvaluationFormOpen(false);
            setSelectedEvaluationForForm(null);
            setSelectedEmployeeForEvaluation(null);
          }}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Overlay Modal - Managers / Chefias admin database console */}
      {managersModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white font-display">Cadastrar e Editar Chefias</h3>
                <p className="text-xs text-zinc-400">Líderes que realizam avaliações e respondem pelos colaboradores de seus respectivos departamentos</p>
              </div>
              <button 
                onClick={() => {
                  setManagersModalOpen(false);
                  cancelEditManager();
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal content body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Form to Add / Edit Chefias */}
              <form onSubmit={handleAddOrEditManager} className="grid grid-cols-1 md:grid-cols-3 gap-4.5 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="md:col-span-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {editingMgrId ? "📝 Editar Informações da Chefia" : "✨ Nova Chefia Responsável"}
                </div>
                
                {mgrError && (
                  <div className="md:col-span-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                    ⚠️ {mgrError}
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    value={mgrName}
                    onChange={(e) => setMgrName(e.target.value)}
                    placeholder="Ex: Maria da Silva"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={mgrEmail}
                    onChange={(e) => setMgrEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase">Setor / Departamento</label>
                  <input
                    type="text"
                    value={mgrDept}
                    onChange={(e) => setMgrDept(e.target.value)}
                    placeholder="Ex: Tecnologia"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                  {editingMgrId && (
                    <button
                      type="button"
                      onClick={cancelEditManager}
                      className="px-3.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg cursor-pointer transition-colors"
                  >
                    {editingMgrId ? "Atualizar Chefia" : "Adicionar à Equipe"}
                  </button>
                </div>
              </form>

              {/* Listing of Existing managers */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Lista de Chefias Ativas ({managers.length})</div>
                
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  {managers.map(m => (
                    <div key={m.id} className="p-3.5 flex justify-between items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{m.name}</h4>
                        <p className="text-xs text-zinc-400 font-medium">Departamento: <strong className="text-zinc-600 dark:text-zinc-300">{m.department}</strong> • E-mail: <span className="font-mono">{m.email}</span></p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditManager(m)}
                          className="p-1 px-2 text-xs font-semibold text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteManager(m.id)}
                          className="p-1 px-2 text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setManagersModalOpen(false)}
                className="px-5 py-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
