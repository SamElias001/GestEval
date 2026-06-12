import { Employee, Evaluation } from "./types";

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function getDaysRemaining(dueDateStr: string): number {
  const today = new Date("2026-06-11T00:00:00"); // Standard fixed system date mock
  const due = new Date(dueDateStr + "T00:00:00");
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export interface StatusStyle {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

export function getEvaluationStatus(ev: Evaluation | null): StatusStyle {
  if (!ev) {
    return {
      label: "Sem Avaliação",
      dotColor: "bg-gray-400",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      icon: "⚪"
    };
  }

  if (ev.status === "COMPLETED") {
    return {
      label: "Concluída",
      dotColor: "bg-blue-500",
      bgColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      textColor: "text-blue-700 dark:text-blue-300",
      icon: "🔵"
    };
  }

  const daysResult = getDaysRemaining(ev.dueDate);

  if (daysResult < 0) {
    return {
      label: `Atrasada (${Math.abs(daysResult)}d)`,
      dotColor: "bg-red-500",
      bgColor: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      textColor: "text-red-700 dark:text-red-300",
      icon: "🔴"
    };
  } else if (daysResult === 0) {
    return {
      label: "Vence HOJE",
      dotColor: "bg-orange-600",
      bgColor: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      textColor: "text-orange-700 dark:text-orange-300",
      icon: "🟠"
    };
  } else if (daysResult <= 3) {
    return {
      label: "Vence em até 3d",
      dotColor: "bg-orange-500",
      bgColor: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
      textColor: "text-orange-600 dark:text-orange-300",
      icon: "🟠"
    };
  } else if (daysResult <= 7) {
    return {
      label: `Vence em ${daysResult} dias`,
      dotColor: "bg-amber-500",
      bgColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      textColor: "text-amber-700 dark:text-amber-300",
      icon: "🟠"
    };
  } else if (daysResult <= 15) {
    return {
      label: `Vence em ${daysResult} dias`,
      dotColor: "bg-yellow-500",
      bgColor: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
      textColor: "text-yellow-700 dark:text-yellow-300",
      icon: "🟡"
    };
  } else {
    return {
      label: "Em dia",
      dotColor: "bg-green-500",
      bgColor: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
      textColor: "text-green-700 dark:text-green-300",
      icon: "🟢"
    };
  }
}

// Function to export to CSV file that has standard UTF-8 BOM so MS Excel opens Portuguese accents correctly
export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(";"))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
