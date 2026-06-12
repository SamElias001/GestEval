import React, { useState } from "react";
import { Notification } from "../types";
import { AlertCircle, Bell, RefreshCw, Mail, Calendar, User, UserCheck, ShieldAlert, Clock } from "lucide-react";

interface NotificationsPanelProps {
  notifications: Notification[];
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationsPanel({ notifications, onRefresh, onMarkAsRead }: NotificationsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    // Simulate short network delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getMailtoUrl = (notif: Notification) => {
    const email = notif.managerId === "mgr-1" ? "maria.souza@empresa.com" : "carlos.santos@empresa.com";
    const subject = encodeURIComponent(`Alerta de Vencimento de Avaliação - ${notif.employeeName}`);
    const cycleText = notif.type === "45_days" ? "45" : "90";
    const bodyText = `Olá, você possui uma avaliação pendente de experiência de ${cycleText} dias do colaborador ${notif.employeeName} que vence em breve. Por favor, acesse o sistema para preencher o formulário.`;
    const body = encodeURIComponent(bodyText);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
      
      {/* Title block */}
      <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg relative">
            <Bell className="w-5 h-5 animate-swing" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white font-display text-sm sm:text-base">Alertas Inteligentes & Notificações</h3>
            <p className="text-xs text-zinc-400">Notificações automáticas sincronizadas aos prazos legais do D.P.</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Verificar Alertas</span>
        </button>
      </div>

      {/* Grid lists */}
      <div className="p-6">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <UserCheck className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm">Nenhum alerta ativo encontrado.</p>
            <p className="text-xs text-zinc-400 mt-1">Todas as avaliações de experiência estão nos prazos regulamentados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Explanatory notice */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/10 text-[11px] text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>O sistema gera avisos prévios automáticos aos gestores com **15**, **7**, **3** e **0** dias do vencimento.</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
              {notifications.map((notif) => {
                const isOverdue = notif.daysRemaining < 0;
                return (
                  <div 
                    key={notif.id} 
                    className={`py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 ${
                      notif.read ? "opacity-60" : "bg-blue-500/[0.01]"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 max-w-2xl">
                      {/* Action Icon indicator */}
                      <span className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                        isOverdue 
                          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" 
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}>
                        <AlertCircle className="w-4.5 h-4.5" />
                      </span>
                      
                      <div className="space-y-1">
                        <p className={`text-sm text-zinc-800 dark:text-zinc-200 ${notif.read ? "font-normal" : "font-medium"}`}>
                          {notif.message}
                        </p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            Gestor: {notif.managerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            Vencimento: {notif.dueDate.split("-").reverse().join("/")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {isOverdue 
                              ? `Atrasado há ${Math.abs(notif.daysRemaining)} dias` 
                              : `Faltam ${notif.daysRemaining} dias`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <a 
                        href={getMailtoUrl(notif)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Enviar lembrete por E-mail"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Notificar E-mail</span>
                      </a>

                      {!notif.read ? (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-md text-xs font-bold cursor-pointer"
                        >
                          Arquivar
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Arquivado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
