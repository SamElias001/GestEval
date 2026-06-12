import React from "react";
import { AuditLog } from "../types";
import { History, Eye, User, FileClock, Shield } from "lucide-react";

interface AuditLogsProps {
  logs: AuditLog[];
}

export default function AuditLogs({ logs }: AuditLogsProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
      
      {/* Title */}
      <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5">
        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white font-display text-sm sm:text-base">Histórico Completo de Auditoria</h3>
          <p className="text-xs text-zinc-400">Rastreabilidade completa de ações realizadas no sistema pelos gestores e RH</p>
        </div>
      </div>

      {/* Table List of changes */}
      <div className="p-6">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-sm">
            Nenhum evento registrado na trilha de auditoria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Usuário / Ator</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4 text-left">Resumo Realizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {logs.map((log) => {
                  // Format ISO timestamp
                  const d = new Date(log.timestamp);
                  const formattedTime = d.toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  });

                  // Stylize action color
                  let badgeColors = "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";
                  if (log.action.includes("Excluiu")) {
                    badgeColors = "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200/40";
                  } else if (log.action.includes("Cadastrou") || log.action.includes("Concluiu")) {
                    badgeColors = "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/40";
                  } else if (log.action.includes("Atualizou") || log.action.includes("Editou") || log.action.includes("Salvou")) {
                    badgeColors = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200 border border-indigo-200/40";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all font-sans">
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                        {formattedTime}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 opacity-60 text-zinc-400" />
                          <span className="truncate max-w-[150px]">{log.user}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeColors}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs select-text">
                        {log.details}
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
