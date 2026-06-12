import React, { useState } from "react";
import { Employee, Evaluation, Manager } from "../types";
import { getDaysRemaining, exportToCSV } from "../utils";
import { FileDown, Printer, FileText, BarChart3, ChevronRight, User } from "lucide-react";

interface ReportExportProps {
  employees: Employee[];
  evaluations: Evaluation[];
  managers: Manager[];
}

export default function ReportExport({ employees, evaluations, managers }: ReportExportProps) {
  const [selectedReport, setSelectedReport] = useState<"pendentes" | "vencidas" | "setor" | "individual">("pendentes");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || "");
  const [selectedDepartment, setSelectedDepartment] = useState<string>(employees[0]?.department || "");

  // All departments list
  const departments = Array.from(new Set(employees.map(e => e.department)));

  // Generate data based on active report
  const getReportData = () => {
    const activeEmps = employees.filter(e => e.status === "Ativo");

    if (selectedReport === "pendentes") {
      return evaluations
        .filter(ev => {
          const emp = employees.find(e => e.id === ev.employeeId);
          return ev.status === "PENDING" && emp?.status === "Ativo";
        })
        .map(ev => {
          const emp = employees.find(e => e.id === ev.employeeId)!;
          const mgr = managers.find(m => m.id === emp.managerId);
          const rem = getDaysRemaining(ev.dueDate);
          return {
            name: emp.name,
            registration: emp.registration,
            role: emp.role,
            department: emp.department,
            type: ev.type === "45_days" ? "45 dias" : "90 dias",
            dueDate: ev.dueDate,
            days: rem,
            manager: mgr?.name || "N/A",
            situation: rem < 0 ? "⚠️ ATRASADA" : rem <= 7 ? "🟡 Próxima" : "🟢 Em dia"
          };
        });
    }

    if (selectedReport === "vencidas") {
      return evaluations
        .filter(ev => {
          const emp = employees.find(e => e.id === ev.employeeId);
          return ev.status === "PENDING" && emp?.status === "Ativo" && getDaysRemaining(ev.dueDate) < 0;
        })
        .map(ev => {
          const emp = employees.find(e => e.id === ev.employeeId)!;
          const mgr = managers.find(m => m.id === emp.managerId);
          const rem = getDaysRemaining(ev.dueDate);
          return {
            name: emp.name,
            registration: emp.registration,
            role: emp.role,
            department: emp.department,
            type: ev.type === "45_days" ? "45 dias" : "90 dias",
            dueDate: ev.dueDate,
            daysOverdue: Math.abs(rem),
            manager: mgr?.name || "N/A"
          };
        });
    }

    if (selectedReport === "setor") {
      return activeEmps
        .filter(e => !selectedDepartment || e.department === selectedDepartment)
        .map(emp => {
          const ev45 = evaluations.find(ev => ev.employeeId === emp.id && ev.type === "45_days");
          const ev90 = evaluations.find(ev => ev.employeeId === emp.id && ev.type === "90_days");
          const mgr = managers.find(m => m.id === emp.managerId);
          return {
            name: emp.name,
            registration: emp.registration,
            role: emp.role,
            department: emp.department,
            manager: mgr?.name || "N/A",
            status45: ev45 ? (ev45.status === "COMPLETED" ? "Concluída" : `Pendente (${getDaysRemaining(ev45.dueDate)}d)`) : "N/A",
            status90: ev90 ? (ev90.status === "COMPLETED" ? "Concluída" : `Pendente (${getDaysRemaining(ev90.dueDate)}d)`) : "N/A"
          };
        });
    }

    if (selectedReport === "individual") {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (!emp) return [];
      const evs = evaluations.filter(ev => ev.employeeId === emp.id);
      const mgr = managers.find(m => m.id === emp.managerId);

      return evs.map(ev => ({
        name: emp.name,
        registration: emp.registration,
        type: ev.type === "45_days" ? "Avaliação de 45 Dias" : "Avaliação de 90 Dias",
        dueDate: ev.dueDate,
        status: ev.status === "COMPLETED" ? "Concluída" : "Pendente",
        completedDate: ev.completedDate || "N/A",
        verdict: ev.finalVerdict || "Não preenchido",
        manager: mgr?.name || "N/A",
        scoreExc: Object.values(ev).filter(v => v === "Excelente").length,
        scoreBom: Object.values(ev).filter(v => v === "Bom").length,
        scoreReg: Object.values(ev).filter(v => v === "Regular").length,
        scoreIns: Object.values(ev).filter(v => v === "Insatisfatório").length
      }));
    }

    return [];
  };

  const handleExcelExport = () => {
    const data = getReportData();
    if (data.length === 0) return alert("Não há registros no relatório selecionado para exportar.");

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `relatorio-${selectedReport}`;

    if (selectedReport === "pendentes") {
      headers = ["Funcionário", "Matrícula", "Cargo", "Setor", "Tipo Avaliação", "Vencimento", "Dias Faltantes", "Chefia Responsável", "Situação"];
      rows = (data as any[]).map(r => [r.name, r.registration, r.role, r.department, r.type, r.dueDate, r.days.toString(), r.manager, r.situation]);
    } else if (selectedReport === "vencidas") {
      headers = ["Funcionário", "Matrícula", "Cargo", "Setor", "Tipo Avaliação", "Vencimento", "Dias em Atraso", "Chefia Responsável"];
      rows = (data as any[]).map(r => [r.name, r.registration, r.role, r.department, r.type, r.dueDate, r.daysOverdue.toString(), r.manager]);
    } else if (selectedReport === "setor") {
      headers = ["Funcionário", "Matrícula", "Cargo", "Setor", "Chefia", "Avaliação 45 Dias", "Avaliação 90 Dias"];
      rows = (data as any[]).map(r => [r.name, r.registration, r.role, r.department, r.manager, r.status45, r.status90]);
      if (selectedDepartment) filename += `-${selectedDepartment.toLowerCase().replace(/\s+/g, "-")}`;
    } else if (selectedReport === "individual") {
      headers = ["Colaborador", "Matrícula", "Ciclo", "Vencimento", "Status", "Preenchida Em", "Parecer Final", "Excelentes", "Bons", "Regulares", "Insatisfatórios"];
      rows = (data as any[]).map(r => [r.name, r.registration, r.type, r.dueDate, r.status, r.completedDate, r.verdict, r.scoreExc.toString(), r.scoreBom.toString(), r.scoreReg.toString(), r.scoreIns.toString()]);
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) filename += `-${emp.registration}`;
    }

    exportToCSV(filename, headers, rows);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const reportData = getReportData();

  return (
    <div className="space-y-6">
      
      {/* Configuration Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs p-6 space-y-6 no-print">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white font-display">Gerador de Relatórios e Exportação</h3>
          <p className="text-xs text-zinc-400">Emita arquivos homologáveis e dossiês de desenvolvimento para suporte a auditorias e comitês de talentos</p>
        </div>
        <hr className="border-zinc-100 dark:border-zinc-800" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Report Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo do Relatório</label>
            <select
              value={selectedReport}
              onChange={(e: any) => setSelectedReport(e.target.value)}
              className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="pendentes">Avaliações Pendentes</option>
              <option value="vencidas">Avaliações Vencidas (Em Atraso)</option>
              <option value="setor">Visão Consolidada por Setor</option>
              <option value="individual">Histórico Individual do Colaborador</option>
            </select>
          </div>

          {/* Conditional filter 1: Individual Selection */}
          {selectedReport === "individual" && (
            <div className="space-y-1.5 flex-1">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Selecione o Colaborador</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.registration})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional filter 2: Department Selection */}
          {selectedReport === "setor" && (
            <div className="space-y-1.5 flex-1">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filtrar por Departamento</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Todos os setores</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Button exports */}
          <div className="flex items-end gap-2.5 sm:col-span-1">
            <button
              onClick={handleExcelExport}
              className="flex-1 text-sm font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
            >
              <FileDown className="w-4 h-4" /> Exportar Planilha (XLSX)
            </button>
            
            <button
              onClick={handlePrintPDF}
              className="px-4 text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
              title="Gerar impressão em formato PDF"
            >
              <Printer className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Visual Report Box (The printed layout relies here) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden p-8 space-y-6 print:border-none print:shadow-none print:-m-4">
        
        {/* Print Brand Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-6">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded">
              Dossiê Corporativo Oficial
            </span>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-display mt-1">
              {selectedReport === "pendentes" && "Dossiê: Avaliações em Aberto (Prazos Ativos)"}
              {selectedReport === "vencidas" && "Alerta: Avaliações em Atraso Crítico"}
              {selectedReport === "setor" && `Relatório Consolidado de Setor: ${selectedDepartment || "Geral"}`}
              {selectedReport === "individual" && "Historial de Desenvolvimento Individual (Evolutivo)"}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Sistemas de Gestão de Onboarding • Recursos Humanos</p>
          </div>
          
          <div className="text-left sm:text-right font-mono text-[11px] text-zinc-400 space-y-0.5">
            <p>Data de emissão: <strong>11/06/2026</strong></p>
            <p>Código: <strong className="text-zinc-600 dark:text-zinc-400">RPT-{selectedReport.toUpperCase()}</strong></p>
          </div>
        </div>

        {/* Selected View Grid */}
        {reportData.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            Nenhum registro encontrado que corresponda aos filtros de relatório selecionados.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* View List / Table depending of type */}
            {selectedReport === "pendentes" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-200 text-zinc-400 text-xs font-bold uppercase py-2">
                      <th className="py-2.5 px-3">Funcionário</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Cargo/Setor</th>
                      <th className="py-2.5 px-3">Ciclo</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3">Dias Restantes</th>
                      <th className="py-2.5 px-3">Chefia Responsável</th>
                      <th className="py-2.5 px-3 text-right">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(reportData as any[]).map((r, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{r.name}</td>
                        <td className="py-3 px-3 font-mono text-zinc-400">{r.registration}</td>
                        <td className="py-3 px-3 text-zinc-500 text-xs">{r.role} ({r.department})</td>
                        <td className="py-3 px-3 font-medium text-zinc-700">{r.type}</td>
                        <td className="py-3 px-3 font-mono text-zinc-600">{r.dueDate.split("-").reverse().join("/")}</td>
                        <td className="py-3 px-3 font-mono text-center font-bold text-zinc-700">{r.days}d</td>
                        <td className="py-3 px-3 text-zinc-600">{r.manager}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.situation.includes("ATRASADA") ? "bg-red-100 text-red-800" : r.situation.includes("Próxima") ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                          }`}>{r.situation}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === "vencidas" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-red-200 text-red-800 bg-red-50/30 text-xs font-semibold uppercase py-2">
                      <th className="py-2.5 px-3">Funcionário</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Cargo/Setor</th>
                      <th className="py-2.5 px-3">Ciclo</th>
                      <th className="py-2.5 px-3">Vencimento Legal</th>
                      <th className="py-2.5 px-3">Atraso Medido</th>
                      <th className="py-2.5 px-3">Chefia Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(reportData as any[]).map((r, idx) => (
                      <tr key={idx} className="hover:bg-red-500/[0.01]">
                        <td className="py-3 px-3 font-bold text-zinc-800">{r.name}</td>
                        <td className="py-3 px-3 font-mono text-zinc-400">{r.registration}</td>
                        <td className="py-3 px-3 text-zinc-500 text-xs">{r.role} ({r.department})</td>
                        <td className="py-3 px-3 font-medium text-red-600">{r.type}</td>
                        <td className="py-3 px-3 font-mono text-zinc-600">{r.dueDate.split("-").reverse().join("/")}</td>
                        <td className="py-3 px-3 font-bold text-red-600 font-mono">{r.daysOverdue} dias em falta</td>
                        <td className="py-3 px-3 text-zinc-600">{r.manager}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === "setor" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-200 text-zinc-400 text-xs font-semibold uppercase py-2">
                      <th className="py-2.5 px-3">Funcionário</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Cargo</th>
                      <th className="py-2.5 px-3">Chefia Responsável</th>
                      <th className="py-2.5 px-3">Avaliação 45 Dias</th>
                      <th className="py-2.5 px-3">Avaliação 90 Dias</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(reportData as any[]).map((r, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{r.name}</td>
                        <td className="py-3 px-3 font-mono text-zinc-400">{r.registration}</td>
                        <td className="py-3 px-3 text-zinc-500 text-xs">{r.role}</td>
                        <td className="py-3 px-3 text-zinc-600">{r.manager}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.status45 === "Concluída" ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-700"
                          }`}>{r.status45}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.status90 === "Concluída" ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-700"
                          }`}>{r.status90}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === "individual" && (
              <div className="space-y-6">
                {(reportData as any[]).map((r, idx) => (
                  <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
                      <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm sm:text-base">{r.type}</h4>
                        <p className="text-xs text-zinc-400">Vencimento oficial: <strong>{r.dueDate.split("-").reverse().join("/")}</strong> • Responsável: <strong>{r.manager}</strong></p>
                      </div>
                      
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg leading-none ${
                        r.status === "Concluída" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>{r.status}</span>
                    </div>

                    {r.status === "Concluída" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-xs bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                          <p className="font-medium text-zinc-500 mb-1">Scores Medidos:</p>
                          <ul className="space-y-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                            <li>Excelente: <strong className="text-emerald-600 font-bold">{r.scoreExc}</strong> critérios</li>
                            <li>Bom: <strong className="text-blue-600 font-bold">{r.scoreBom}</strong> critérios</li>
                            <li>Regular: <strong className="text-amber-600 font-bold">{r.scoreReg}</strong> critérios</li>
                            <li>Insatisfatório: <strong className="text-red-600 font-bold">{r.scoreIns}</strong> critérios</li>
                          </ul>
                        </div>

                        <div className="text-xs space-y-2">
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300">Parecer Final:</p>
                          <blockquote className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border-l-2 border-blue-500 rounded text-zinc-600 dark:text-zinc-400 italic">
                            "{r.verdict}"
                          </blockquote>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">
                        Avaliação pendente de preenchimento de critérios pelo gestor autorizado.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Corporate signs footer for physical signatures (essential on printed reports!) */}
            <div className="border-t border-zinc-200 pt-16 grid grid-cols-2 gap-8 text-center text-xs text-zinc-500 mt-12">
              <div className="space-y-1">
                <hr className="w-1/2 mx-auto border-zinc-300" />
                <p className="font-semibold">Líder / Chefia Responsável</p>
                <p className="text-[10px] text-zinc-400 font-mono">Assinatura Digital / CRM-ID</p>
              </div>
              <div className="space-y-1">
                <hr className="w-1/2 mx-auto border-zinc-300" />
                <p className="font-semibold">Recursos Humanos (RH)</p>
                <p className="text-[10px] text-zinc-400 font-mono">Homologação de Contratos de Experiência</p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
