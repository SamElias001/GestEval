import React, { useState, useEffect } from "react";
import { Employee, Evaluation, EvaluationScale } from "../types";
import { X, Save, CheckSquare, Award, Clock } from "lucide-react";

interface EvaluationFormProps {
  employee: Employee;
  evaluation: Evaluation;
  onSave: (evaluationId: string, updatedData: Partial<Evaluation>) => void;
  onClose: () => void;
  currentUserRole: string; // e.g. "Administrador (RH)" or manager name
}

const CRITERIA_LIST = [
  { key: "attendance", label: "Assiduidade", desc: "Frequência e presença regular às atividades de trabalho." },
  { key: "punctuality", label: "Pontualidade", desc: "Cumprimento dos horários de entrada, saídas e compromissos." },
  { key: "teamwork", label: "Trabalho em equipe", desc: "Colaboração, apoio mútuo e integração com os colegas do time." },
  { key: "communication", label: "Comunicação", desc: "Clareza ao expressar ideias, escuta ativa e compartilhamento de dados." },
  { key: "organization", label: "Organização", desc: "Ordem nas rotinas de tarefas, controle de arquivos e gestão de prazos." },
  { key: "quality", label: "Qualidade do trabalho", desc: "Nível de precisão, capricho e acabamento das entregas programadas." },
  { key: "technical", label: "Conhecimento técnico", desc: "Domínio das linguagens, ferramentas e conceitos práticos do cargo." },
  { key: "interpersonal", label: "Relacionamento interpessoal", desc: "Empatia, polidez, educação e habilidade de lidar com pessoas." },
  { key: "initiative", label: "Iniciativa", desc: "Resolução autônoma de entraves e proposição de ideias de melhoria." },
  { key: "rules", label: "Cumprimento de normas", desc: "Segurança corporativa, LGPD e respeito às políticas internas da empresa." }
];

const SCALES: { value: EvaluationScale; label: string; color: string; hoverColor: string }[] = [
  { value: "Excelente", label: "Excelente", color: "bg-emerald-500 text-white dark:bg-emerald-600", hoverColor: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800" },
  { value: "Bom", label: "Bom", color: "bg-blue-500 text-white dark:bg-blue-600", hoverColor: "bg-blue-100 dark:bg-blue-950/40 text-blue-800" },
  { value: "Regular", label: "Regular", color: "bg-amber-500 text-white dark:bg-amber-600", hoverColor: "bg-amber-100 dark:bg-amber-950/40 text-amber-800" },
  { value: "Insatisfatório", label: "Insatisfatório", color: "bg-red-500 text-white dark:bg-red-600", hoverColor: "bg-red-100 dark:bg-red-950/40 text-red-800" }
];

export default function EvaluationForm({ employee, evaluation, onSave, onClose, currentUserRole }: EvaluationFormProps) {
  // Local state initialized with evaluation values
  const [form, setForm] = useState<Partial<Evaluation>>({
    attendance: "",
    punctuality: "",
    teamwork: "",
    communication: "",
    organization: "",
    quality: "",
    technical: "",
    interpersonal: "",
    initiative: "",
    rules: "",
    notes: "",
    pdi: "",
    finalVerdict: "",
    managerApproval: false
  });

  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (evaluation) {
      setForm({
        attendance: evaluation.attendance || "",
        punctuality: evaluation.punctuality || "",
        teamwork: evaluation.teamwork || "",
        communication: evaluation.communication || "",
        organization: evaluation.organization || "",
        quality: evaluation.quality || "",
        technical: evaluation.technical || "",
        interpersonal: evaluation.interpersonal || "",
        initiative: evaluation.initiative || "",
        rules: evaluation.rules || "",
        notes: evaluation.notes || "",
        pdi: evaluation.pdi || "",
        finalVerdict: evaluation.finalVerdict || "",
        managerApproval: evaluation.managerApproval || false
      });
    }
    setValidationError("");
  }, [evaluation]);

  const handleScoreChange = (key: string, value: EvaluationScale) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleTextChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, managerApproval: e.target.checked }));
  };

  const saveDraft = () => {
    onSave(evaluation.id, {
      ...form,
      status: "PENDING",
      completedDate: null
    });
  };

  const completeEvaluation = () => {
    setValidationError("");

    // Validate that all grading factors are filled
    const missingCriteria = CRITERIA_LIST.filter(c => !form[c.key as keyof Evaluation]);
    if (missingCriteria.length > 0) {
      setValidationError(`Por favor, atribua notas para todos os critérios de desempenho antes de concluir a avaliação. Faltando: ${missingCriteria.map(m => m.label).join(", ")}.`);
      return;
    }

    if (!form.finalVerdict?.trim()) {
      setValidationError("O parecer final da chefia é obrigatório para concluir a avaliação.");
      return;
    }

    if (!form.managerApproval) {
      setValidationError("É necessário marcar o termo de ciência de aprovação do gestor.");
      return;
    }

    // Complete review
    onSave(evaluation.id, {
      ...form,
      status: "COMPLETED",
      completedDate: new Date().toISOString().split("T")[0]
    });
  };

  const scoreStats = () => {
    const vals = CRITERIA_LIST.map(c => form[c.key as keyof Evaluation]).filter(Boolean);
    const count = vals.length;
    if (count === 0) return { exc: 0, bom: 0, reg: 0, ins: 0, total: 0 };
    return {
      exc: vals.filter(v => v === "Excelente").length,
      bom: vals.filter(v => v === "Bom").length,
      reg: vals.filter(v => v === "Regular").length,
      ins: vals.filter(v => v === "Insatisfatório").length,
      total: count
    };
  };

  const stats = scoreStats();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white font-display">
                Ficha de Avaliação de Desempenho
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                evaluation.type === "45_days"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30"
                  : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30"
              }`}>
                {evaluation.type === "45_days" ? "Ciclo de 45 Dias" : "Ciclo de 90 Dias"}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Colaborador: <strong>{employee.name} ({employee.role})</strong> • Admissão: <strong>{employee.admissionDate?.split("-").reverse().join("/")}</strong>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoring Status Indicators */}
        <div className="bg-zinc-100/50 dark:bg-zinc-900/40 px-6 py-2.5 flex flex-wrap justify-between items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex gap-4">
            <span className="text-zinc-500">Resumo das Notas:</span>
            <span className="text-emerald-600 font-bold">Excelente: {stats.exc}</span>
            <span className="text-blue-600 font-bold">Bom: {stats.bom}</span>
            <span className="text-amber-600 font-bold">Regular: {stats.reg}</span>
            <span className="text-red-500 font-bold">Insatisfatório: {stats.ins}</span>
          </div>
          <p className="text-zinc-400 font-mono">
            {stats.total} de 10 critérios preenchidos
          </p>
        </div>

        {/* Content Panel */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
              ⚠️ {validationError}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-400">1. Critérios de Desempenho</h4>
            
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/20">
              {CRITERIA_LIST.map((criterion) => {
                const currentVal = form[criterion.key as keyof Evaluation] as EvaluationScale;
                return (
                  <div key={criterion.key} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white dark:hover:bg-zinc-900/40 transition-colors">
                    <div className="max-w-md">
                      <h5 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{criterion.label}</h5>
                      <p className="text-xs text-zinc-400 mt-0.5">{criterion.desc}</p>
                    </div>

                    {/* Scale Selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {SCALES.map((scaleOption) => {
                        const isSelected = currentVal === scaleOption.value;
                        return (
                          <button
                            key={scaleOption.value}
                            type="button"
                            onClick={() => handleScoreChange(criterion.key, scaleOption.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                              isSelected 
                                ? scaleOption.color 
                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            {scaleOption.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Core Textareas area */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-400">2. Análise Qualitativa e Plano de Carreira</h4>
            
            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Observações Gerais</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleTextChange("notes", e.target.value)}
                placeholder="Explicite as principais ocorrências no período, pontos fortes do comportamento e desempenho técnico observados."
                rows={3}
                className="w-full text-sm p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* PDI */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">PDI - Plano de Desenvolvimento Individual</label>
              <textarea
                value={form.pdi}
                onChange={(e) => handleTextChange("pdi", e.target.value)}
                placeholder="Estabeleça novos cursos, metodologias ou mentorias para apoiar o crescimento e correções de desvios técnicos ou comportamentais."
                rows={3}
                className="w-full text-sm p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Parecer Final */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Parecer Final da Chefia (Obrigatório)</label>
              <textarea
                value={form.finalVerdict}
                onChange={(e) => handleTextChange("finalVerdict", e.target.value)}
                placeholder="Descreva a conclusão final sobre a permanência, renovação ou rescisão de contrato do colaborador após esse ciclo de experiência."
                rows={3}
                className="w-full text-sm p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            
            {/* Approval with badge */}
            <div className="bg-yellow-50/50 dark:bg-yellow-950/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex items-start gap-3">
              <input 
                id="manager-agree"
                type="checkbox" 
                checked={form.managerApproval}
                onChange={handleCheckboxChange}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <label htmlFor="manager-agree" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 select-none cursor-pointer">
                  Aprovação formal da Chefia Responsável
                </label>
                <p className="text-xs text-zinc-500 mt-1">
                  Ao selecionar esta caixa, o avaliador (<strong>{currentUserRole}</strong>) certifica formalmente que realizou a entrevista de feedback do colaborador e aprova este documento.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 font-mono">
            Última alteração por: <strong>{currentUserRole}</strong>
          </p>

          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Voltar
            </button>
            
            <button 
              type="button" 
              onClick={saveDraft}
              className="px-4.5 py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Salvar Rascunho
            </button>

            <button 
              type="button" 
              onClick={completeEvaluation}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" /> Concluir Avaliação
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
