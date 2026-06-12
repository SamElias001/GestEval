import React from "react";
import { Employee, Evaluation, Manager } from "../types";
import { getDaysRemaining } from "../utils";
import { Users, FileText, Clock, AlertTriangle, CheckCircle, Award, Shield } from "lucide-react";

interface DashboardProps {
  employees: Employee[];
  evaluations: Evaluation[];
  managers: Manager[];
  onSelectTab: (tab: string) => void;
  onSelectEmployee: (empId: string) => void;
}

export default function Dashboard({ employees, evaluations, managers, onSelectTab, onSelectEmployee }: DashboardProps) {
  // Calculations
  const activeEmployees = employees.filter(e => e.status === "Ativo");
  const totalActive = activeEmployees.length;

  const pending45 = evaluations.filter(ev => {
    const emp = employees.find(e => e.id === ev.employeeId);
    return ev.type === "45_days" && ev.status === "PENDING" && emp?.status === "Ativo";
  }).length;

  const pending90 = evaluations.filter(ev => {
    const emp = employees.find(e => e.id === ev.employeeId);
    return ev.type === "90_days" && ev.status === "PENDING" && emp?.status === "Ativo";
  }).length;

  // Due in next 7 days (or already negative and not completed)
  const dueSoon7Days = evaluations.filter(ev => {
    const emp = employees.find(e => e.id === ev.employeeId);
    if (ev.status === "COMPLETED" || emp?.status !== "Ativo") return false;
    const rem = getDaysRemaining(ev.dueDate);
    return rem >= 0 && rem <= 7;
  }).length;

  // Overdue and not completed
  const overdue = evaluations.filter(ev => {
    const emp = employees.find(e => e.id === ev.employeeId);
    if (ev.status === "COMPLETED" || emp?.status !== "Ativo") return false;
    const rem = getDaysRemaining(ev.dueDate);
    return rem < 0;
  }).length;

  // Completed in June 2026 (or just total completed)
  const completedCount = evaluations.filter(ev => {
    const emp = employees.find(e => e.id === ev.employeeId);
    return ev.status === "COMPLETED" && emp?.status === "Ativo";
  }).length;

  // Percentage Calculations
  const totalEvaluations = evaluations.filter(ev => {
    const emp = employees.find(e => e.id === ev.employeeId);
    return emp?.status === "Ativo";
  });
  const totalEvalCount = totalEvaluations.length;
  const completedEvalCount = totalEvaluations.filter(ev => ev.status === "COMPLETED").length;
  const pendingEvalCount = totalEvalCount - completedEvalCount;
  const percentageCompleted = totalEvalCount > 0 ? Math.round((completedEvalCount / totalEvalCount) * 100) : 0;

  // Charts data aggregation
  // 1. Evaluations by Sector/Department
  const depts = Array.from(new Set(employees.map(e => e.department)));
  const evalByDept = depts.map(dept => {
    const deptEmps = employees.filter(e => e.department === dept && e.status === "Ativo");
    const deptEmpIds = deptEmps.map(e => e.id);
    const completed = evaluations.filter(ev => deptEmpIds.includes(ev.employeeId) && ev.status === "COMPLETED").length;
    const pending = evaluations.filter(ev => deptEmpIds.includes(ev.employeeId) && ev.status === "PENDING").length;
    return { name: dept, completed, pending, total: completed + pending };
  }).filter(d => d.total > 0);

  // 2. Completed reviews by month (seeding some mock monthly stats)
  const reviewsByMonth = [
    { month: "Março", count: 2 },
    { month: "Abril", count: 3 },
    { month: "Maio", count: 4 },
    { month: "Junho (Atual)", count: completedCount }
  ];

  // 3. Ranking of managers with most pending evaluations
  const managerRanking = managers.map(m => {
    const mEmps = employees.filter(e => e.managerId === m.id && e.status === "Ativo");
    const mEmpIds = mEmps.map(e => e.id);
    const pending = evaluations.filter(ev => mEmpIds.includes(ev.employeeId) && ev.status === "PENDING").length;
    return { id: m.id, name: m.name, pendingDept: m.department, pendingCount: pending };
  }).sort((a, b) => b.pendingCount - a.pendingCount).filter(m => m.pendingCount > 0);

  // Recent pending items list
  const recentPendings = evaluations
    .filter(ev => {
      const emp = employees.find(e => e.id === ev.employeeId);
      return ev.status === "PENDING" && emp?.status === "Ativo";
    })
    .map(ev => {
      const emp = employees.find(e => e.id === ev.employeeId)!;
      const mgr = managers.find(m => m.id === emp.managerId);
      const rem = getDaysRemaining(ev.dueDate);
      return { ev, emp, mgr, rem };
    })
    .sort((a, b) => a.rem - b.rem)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl text-white shadow-md">
        <h2 className="text-2xl font-bold font-display">Painel Executivo de Desempenho</h2>
        <p className="mt-1 text-blue-100 max-w-2xl font-light">
          Acompanhamento dinâmico das avaliações do período de experiência de 45 e 90 dias. Mantenha os prazos sob controle para garantir a retenção de talentos no onboarding.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-blue-50 bg-black/15 p-2 rounded-lg w-fit">
          <span>Data Base do Sistema: <strong>11/06/2026</strong></span>
          <span className="opacity-60">|</span>
          <span>Sincronização: <strong>Automática</strong></span>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Ativos</p>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-display">{totalActive}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Colaboradores ativos</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pendente 45d</p>
            <span className="p-1.5 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-display">{pending45}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Primeiro ciclo pendente</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pendente 90d</p>
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-display">{pending90}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Segundo ciclo pendente</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Vence em 7 dias</p>
            <span className="p-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-display">{dueSoon7Days}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Prazo curto crítico</p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider font-bold">Atrasadas</p>
            <span className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 border-l-2 border-red-500 pl-2">
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 font-display">{overdue}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Gerando notificações</p>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow bg-linear-to-b from-blue-50/50 to-white dark:from-blue-950/10 dark:to-zinc-900">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Concluídas</p>
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">{completedEvalCount}</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Tx: <strong>{percentageCompleted}%</strong> geral</p>
          </div>
        </div>
      </div>

      {/* Visual Charts & Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sector Bar Chart (Custom High-Quality SVG) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-xl shadow-xs lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-white font-display">Avaliações por Setor</h3>
              <p className="text-xs text-zinc-400">Total de pendentes vs concluídas administradas por departamento</p>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded">Gráfico Ativo</span>
          </div>
          <hr className="border-zinc-100 dark:border-zinc-800" />
          
          <div className="pt-2">
            {evalByDept.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                Nenhum dado cadastrado para gerar o gráfico.
              </div>
            ) : (
              <div className="space-y-5">
                {evalByDept.map((dept, index) => {
                  const maxTotal = Math.max(...evalByDept.map(d => d.total));
                  const complPct = dept.total > 0 ? (dept.completed / maxTotal) * 100 : 0;
                  const pendPct = dept.total > 0 ? (dept.pending / maxTotal) * 100 : 0;

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-700 dark:text-zinc-300 font-display font-semibold">{dept.name}</span>
                        <span className="text-zinc-500 font-mono">
                          <span className="text-emerald-600 font-bold">{dept.completed}</span> concluídas / <span className="text-yellow-600 font-bold">{dept.pending}</span> pendentes
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-6 rounded-md overflow-hidden flex shadow-inner">
                        {dept.completed > 0 && (
                          <div 
                            style={{ width: `${(dept.completed / dept.total) * 100}%` }}
                            className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white font-mono transition-all duration-500"
                            title={`${dept.completed} Concluídas`}
                          >
                            {dept.completed}
                          </div>
                        )}
                        {dept.pending > 0 && (
                          <div 
                            style={{ width: `${(dept.pending / dept.total) * 100}%` }}
                            className="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-zinc-800 font-mono transition-all duration-500"
                            title={`${dept.pending} Pendentes`}
                          >
                            {dept.pending}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-end gap-4 text-[10px] font-medium text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>Concluídas</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded-xs"></span>Pendentes</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completion Progress Gauge / Doughnut */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-xl shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-white font-display">Meta de Conclusão</h3>
            <p className="text-xs text-zinc-400">Percentual de eficácia do período de experiência</p>
          </div>
          
          <div className="my-6 flex flex-col items-center justify-center relative">
            <svg className="w-36 h-36" viewBox="0 0 36 36">
              <path
                className="text-zinc-100 dark:text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500 transition-all duration-500 stroke-current"
                strokeDasharray={`${percentageCompleted}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-zinc-800 dark:text-white font-display">{percentageCompleted}%</span>
              <p className="text-[10px] text-zinc-400 font-medium">Finalizadas</p>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex justify-between">
              <span className="text-zinc-500">Avaliações Ativas:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalEvalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Fichas Finalizadas:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{completedEvalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pendências de Gestão:</span>
              <span className="font-semibold text-amber-500 font-mono">{pendingEvalCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Manager Ranking */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-xl shadow-xs lg:col-span-4 space-y-4">
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-white font-display">Ranking de Pendências por Gestor</h3>
            <p className="text-xs text-zinc-400">Gestores com avaliações ativas pendentes</p>
          </div>
          <hr className="border-zinc-100 dark:border-zinc-800" />
          
          {managerRanking.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              🎉 Todas as chefias estão em dia com as avaliações!
            </div>
          ) : (
            <div className="space-y-3">
              {managerRanking.map((mgr, index) => (
                <div key={index} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{mgr.name}</h4>
                    <p className="text-[10px] text-zinc-400">{mgr.pendingDept}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-mono font-medium">pendentes:</span>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-900/30">
                      {mgr.pendingCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas Iminentes / List of Due Soon & Overdue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-xl shadow-xs lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-white font-display">Vencimentos Iminentes & Atrasos</h3>
              <p className="text-xs text-zinc-400">Próximos prazos de ação organizados por proximidade</p>
            </div>
            <button 
              onClick={() => onSelectTab("acompanhamento")}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer"
            >
              Ver tabela completa &rarr;
            </button>
          </div>
          <hr className="border-zinc-100 dark:border-zinc-800" />

          {recentPendings.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-sm">
              Sem avaliações pendentes cadastradas no momento.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentPendings.map(({ ev, emp, mgr, rem }, idx) => {
                const isOverdue = rem < 0;
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{emp.name}</span>
                        <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {emp.registration}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          ev.type === "45_days"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30"
                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30"
                        }`}>
                          {ev.type === "45_days" ? "45 dias" : "90 dias"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Líder Responsável: <strong>{mgr?.name || "Sem Responsável"}</strong> • Setor: {emp.department}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-mono text-zinc-500">
                          Limite: <strong className="text-zinc-700 dark:text-zinc-300">{ev.dueDate.split("-").reverse().join("/")}</strong>
                        </p>
                        {isOverdue ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded animate-pulse">
                            Atrasada há {Math.abs(rem)} dias
                          </span>
                        ) : rem === 0 ? (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded">
                            Vence HOJE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-500">
                            Faltam {rem} dias
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => onSelectEmployee(emp.id)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors cursor-pointer"
                      >
                        Avaliar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
