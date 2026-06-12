import React, { useState, useEffect } from "react";
import { Employee, Manager } from "../types";
import { X } from "lucide-react";

interface EmployeeFormProps {
  employee: Employee | null; // null if adding new
  managers: Manager[];
  onSave: (employeeData: Partial<Employee>) => void;
  onClose: () => void;
}

export default function EmployeeForm({ employee, managers, onSave, onClose }: EmployeeFormProps) {
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [contractType, setContractType] = useState("CLT");
  const [managerId, setManagerId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [error, setError] = useState("");

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setRegistration(employee.registration);
      setRole(employee.role);
      setDepartment(employee.department);
      setAdmissionDate(employee.admissionDate);
      setContractType(employee.contractType);
      setManagerId(employee.managerId);
      setEmail(employee.email);
      setStatus(employee.status);
    } else {
      // Clear fields for new
      setName("");
      setRegistration("");
      setRole("");
      setDepartment("");
      setAdmissionDate(new Date().toISOString().split("T")[0]); // Set today default
      setContractType("CLT");
      setManagerId(managers.length > 0 ? managers[0].id : "");
      setEmail("");
      setStatus("Ativo");
    }
    setError("");
  }, [employee, managers]);

  // Handle department auto-fill based on manager selected
  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mId = e.target.value;
    setManagerId(mId);
    const selectedMgr = managers.find(m => m.id === mId);
    if (selectedMgr && !department) {
      setDepartment(selectedMgr.department);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("O nome completo é obrigatório.");
    if (!registration.trim()) return setError("A matrícula do funcionário é obrigatória.");
    if (!role.trim()) return setError("O cargo do funcionário é obrigatório.");
    if (!department.trim()) return setError("O setor/departamento é obrigatório.");
    if (!admissionDate) return setError("A data de admissão é obrigatória.");
    if (!managerId) return setError("A chefia responsável é obrigatória.");
    if (!email.trim() || !email.includes("@")) return setError("Informe um e-mail válido para o funcionário.");

    onSave({
      name,
      registration,
      role,
      department,
      admissionDate,
      contractType,
      managerId,
      email,
      status
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white font-display">
              {employee ? "Editar Colaborador" : "Cadastrar Colaborador"}
            </h3>
            <p className="text-xs text-zinc-400">
              {employee ? "Modifique as especificações contratuais" : "Gere os ciclos automáticos de avaliação de 45 e 90 dias"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nome Completo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva Santos"
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Matrícula */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Matrícula</label>
              <input 
                type="text" 
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="Ex: MAT-202611"
                disabled={!!employee} // Matrícula can be locked
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              />
            </div>

            {/* Tipo de Contrato */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Tipo de Contrato</label>
              <select 
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
              >
                <option value="CLT">CLT (Estágio de Experiência)</option>
                <option value="PJ">PJ (Contrato Prestação)</option>
                <option value="Temporário">Temporário</option>
                <option value="Estagiário">Estagiário</option>
              </select>
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Cargo</label>
              <input 
                type="text" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor Front-end"
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Data de Admissão */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Data de Admissão</label>
              <input 
                type="date" 
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Gera prazos automáticos de 45 dias e 90 dias.</p>
            </div>

            {/* Chefia Responsável */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Chefia Responsável</label>
              <select 
                value={managerId}
                onChange={handleManagerChange}
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Selecione uma chefia...</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Setor / Departamento */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Setor / Departamento</label>
              <input 
                type="text" 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Tecnologia da Informação"
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Email do Funcionário */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">E-mail do Funcionário</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                className="w-full text-sm p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
              />
            </div>

            {/* Status (Ativo / Inativo) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status</label>
              <div className="flex gap-4 p-2">
                <label className="inline-flex items-center text-sm">
                  <input 
                    type="radio" 
                    name="status" 
                    checked={status === "Ativo"}
                    onChange={() => setStatus("Ativo")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-1.5 text-zinc-700 dark:text-zinc-300">Ativo</span>
                </label>
                <label className="inline-flex items-center text-sm">
                  <input 
                    type="radio" 
                    name="status" 
                    checked={status === "Inativo"}
                    onChange={() => setStatus("Inativo")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-1.5 text-zinc-700 dark:text-zinc-300">Inativo</span>
                </label>
              </div>
            </div>

          </div>

          {/* Footer controls */}
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-xs hover:shadow-md cursor-pointer"
            >
              {employee ? "Salvar Alterações" : "Gerar Contrato"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
