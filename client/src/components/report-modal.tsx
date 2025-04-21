import { useState, useEffect, useRef } from "react";
import { Personnel, Assignment, OperationType } from "@shared/schema";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getActiveGuarnitionForDay } from "@/lib/utils";
import html2pdf from 'html2pdf.js';

interface ReportModalProps {
  personnel: Personnel[];
  assignments: Assignment[];
  currentMonth?: number;
  currentYear?: number;
}

type ReportTab = "geral" | "pmf" | "escola" | "conflitos";

// Define um tipo para os militares com conflitos
type PersonnelWithConflicts = Personnel & {
  extras: number;
  pmfConflicts: number;
  escolaConflicts: number;
  conflictDetails: {date: string, operation: OperationType, guarnition: string}[];
};

interface StatsData {
  totalExtras: number;
  mediaExtras: number;
  maxExtras: Personnel | PersonnelWithConflicts | null;
  minExtras: Personnel | PersonnelWithConflicts | null;
  personnelWithExtras: (Personnel | PersonnelWithConflicts)[];
  personnelWithoutExtras: Personnel[];
}

export function ReportModal({ personnel, assignments, currentMonth, currentYear }: ReportModalProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("geral");
  const [isOpen, setIsOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const customReportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState<Record<ReportTab, StatsData>>({
    geral: {
      totalExtras: 0,
      mediaExtras: 0,
      maxExtras: null,
      minExtras: null,
      personnelWithExtras: [],
      personnelWithoutExtras: [],
    },
    pmf: {
      totalExtras: 0,
      mediaExtras: 0,
      maxExtras: null,
      minExtras: null,
      personnelWithExtras: [],
      personnelWithoutExtras: [],
    },
    escola: {
      totalExtras: 0,
      mediaExtras: 0,
      maxExtras: null,
      minExtras: null,
      personnelWithExtras: [],
      personnelWithoutExtras: [],
    },
    conflitos: {
      totalExtras: 0,
      mediaExtras: 0,
      maxExtras: null,
      minExtras: null,
      personnelWithExtras: [],
      personnelWithoutExtras: [],
    },
  });

  // Processar os dados de operações para gerar estatísticas
  useEffect(() => {
    if (!personnel.length) return;
    
    // Se temos mês atual definido, filtrar operações apenas do mês atual
    const currentMonthFilter = (assignment: Assignment) => {
      if (currentMonth === undefined || currentYear === undefined) return true;
      
      const date = new Date(assignment.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    };

    // Contagem de operações por militar para cada tipo
    const pmfOperations = assignments.filter(a => a.operationType === "PMF" && currentMonthFilter(a));
    const escolaOperations = assignments.filter(a => a.operationType === "ESCOLA" && currentMonthFilter(a));

    // Contagem total direta a partir dos assignments (não das pessoas)
    const pmfTotalExtras = pmfOperations.length;
    const escolaTotalExtras = escolaOperations.length;
    const totalExtras = pmfTotalExtras + escolaTotalExtras;

    // Criar mapa de contagem para PMF
    const pmfCountMap: Record<number, number> = {};
    pmfOperations.forEach(op => {
      pmfCountMap[op.personnelId] = (pmfCountMap[op.personnelId] || 0) + 1;
    });

    // Criar mapa de contagem para ESCOLA
    const escolaCountMap: Record<number, number> = {};
    escolaOperations.forEach(op => {
      escolaCountMap[op.personnelId] = (escolaCountMap[op.personnelId] || 0) + 1;
    });

    // Criar mapa de contagem total por pessoa (soma das duas operações)
    const totalCountMap: Record<number, number> = {};
    personnel.forEach(p => {
      if (p.id) {
        totalCountMap[p.id] = (pmfCountMap[p.id] || 0) + (escolaCountMap[p.id] || 0);
      }
    });

    // Dados para PMF
    const pmfPersonnelWithExtras = personnel
      .filter(p => pmfCountMap[p.id!] > 0)
      .map(p => ({
        ...p,
        extras: pmfCountMap[p.id!] || 0
      }))
      .sort((a, b) => (b.extras || 0) - (a.extras || 0));

    const pmfPersonnelWithoutExtras = personnel
      .filter(p => !pmfCountMap[p.id!] || pmfCountMap[p.id!] === 0);

    const pmfMediaExtras = pmfTotalExtras / (pmfPersonnelWithExtras.length || 1);
    const pmfMaxExtras = pmfPersonnelWithExtras.length > 0 ? pmfPersonnelWithExtras[0] : null;
    const pmfMinExtras = pmfPersonnelWithExtras.length > 0 ? pmfPersonnelWithExtras[pmfPersonnelWithExtras.length - 1] : null;

    // Dados para ESCOLA
    const escolaPersonnelWithExtras = personnel
      .filter(p => escolaCountMap[p.id!] > 0)
      .map(p => ({
        ...p,
        extras: escolaCountMap[p.id!] || 0
      }))
      .sort((a, b) => (b.extras || 0) - (a.extras || 0));

    const escolaPersonnelWithoutExtras = personnel
      .filter(p => !escolaCountMap[p.id!] || escolaCountMap[p.id!] === 0);

    const escolaMediaExtras = escolaTotalExtras / (escolaPersonnelWithExtras.length || 1);
    const escolaMaxExtras = escolaPersonnelWithExtras.length > 0 ? escolaPersonnelWithExtras[0] : null;
    const escolaMinExtras = escolaPersonnelWithExtras.length > 0 ? escolaPersonnelWithExtras[escolaPersonnelWithExtras.length - 1] : null;

    // Dados gerais - baseados no mapa combinado
    const allPersonnelWithExtras = personnel
      .filter(p => p.id && totalCountMap[p.id] > 0)
      .map(p => ({
        ...p,
        extras: totalCountMap[p.id!] || 0
      }))
      .sort((a, b) => (b.extras || 0) - (a.extras || 0));

    const allPersonnelWithoutExtras = personnel
      .filter(p => !p.id || totalCountMap[p.id] === 0);
      
    const allMediaExtras = totalExtras / (allPersonnelWithExtras.length || 1);
    const allMaxExtras = allPersonnelWithExtras.length > 0 ? allPersonnelWithExtras[0] : null;
    const allMinExtras = allPersonnelWithExtras.length > 0 ? allPersonnelWithExtras[allPersonnelWithExtras.length - 1] : null;

    // Array para armazenar as atribuições que representam conflitos
    // Um conflito é quando um militar está em serviço regular e também está escalado para uma operação
    const conflictsAssignments: Assignment[] = [];
    
    // Para cada atribuição, verificar se o militar está em serviço no dia
    // Filtrar apenas atribuições do mês atual
    assignments.filter(currentMonthFilter).forEach(assignment => {
      const person = personnel.find(p => p.id === assignment.personnelId);
      if (!person || !person.id) return;
      
      const assignmentDate = new Date(assignment.date);
      
      // Verificar qual guarnição está de serviço no dia da operação
      const activeGuarnition = getActiveGuarnitionForDay(assignmentDate);
      
      // Verificar se o militar pertence à guarnição que está de serviço na data
      // IMPORTANTE: Um militar está em conflito quando seu pelotão está ativo naquele dia
      // Por isso comparamos o pelotão do militar com o pelotão ativo no dia
      const isInService = person.platoon && 
                         person.platoon !== "EXPEDIENTE" && 
                         activeGuarnition === person.platoon;
      
      if (isInService) {
        // Adicionar mensagem de log para debug
        console.log(`Conflito detectado: ${person.name} pertence à guarnição ${person.platoon} ` + 
                   `que está de serviço no dia ${assignmentDate.toLocaleDateString('pt-BR')}, ` +
                   `mas foi escalado para operação ${assignment.operationType}`);
                   
        // Se estiver em serviço, essa atribuição representa um conflito
        conflictsAssignments.push(assignment);
      }
    });
    
    // Agrupar por militar para contar conflitos e guardar detalhes
    type ConflictDetail = {
      count: number;
      pmfConflicts: number;
      escolaConflicts: number;
      details: {date: string, operation: OperationType, guarnition: string}[];
    };
    
    const conflictDetailsMap: Record<number, ConflictDetail> = {};
    
    conflictsAssignments.forEach(op => {
      // Inicializar o objeto de detalhes de conflito se ainda não existir
      if (!conflictDetailsMap[op.personnelId]) {
        conflictDetailsMap[op.personnelId] = {
          count: 0,
          pmfConflicts: 0,
          escolaConflicts: 0,
          details: []
        };
      }
      
      // Incrementar o contador geral
      conflictDetailsMap[op.personnelId].count += 1;
      
      // Incrementar o contador específico da operação
      if (op.operationType === "PMF") {
        conflictDetailsMap[op.personnelId].pmfConflicts += 1;
      } else if (op.operationType === "ESCOLA") {
        conflictDetailsMap[op.personnelId].escolaConflicts += 1;
      }
      
      // Buscar o militar associado ao conflito
      const personWithConflict = personnel.find(p => p.id === op.personnelId);
      
      // Adicionar detalhes do conflito incluindo a guarnição em serviço
      conflictDetailsMap[op.personnelId].details.push({
        date: new Date(op.date).toLocaleDateString('pt-BR'),
        operation: op.operationType,
        guarnition: personWithConflict?.platoon || "Desconhecida"
      });
    });
    
    // Usando o tipo PersonnelWithConflicts definido anteriormente
    
    // Criar lista de militares com conflitos
    const conflictsPersonnel = personnel
      .filter(p => p.id && conflictDetailsMap[p.id])
      .map(p => ({
        ...p,
        extras: conflictDetailsMap[p.id!].count || 0,
        pmfConflicts: conflictDetailsMap[p.id!].pmfConflicts || 0,
        escolaConflicts: conflictDetailsMap[p.id!].escolaConflicts || 0,
        conflictDetails: conflictDetailsMap[p.id!].details || []
      })) as PersonnelWithConflicts[];
    
    // Ordenar por número de extras (conflitos)
    conflictsPersonnel.sort((a, b) => (b.extras || 0) - (a.extras || 0));
    
    const totalConflicts = conflictsPersonnel.reduce((acc, p: any) => acc + (p.extras || 0), 0);
    const conflictsMediaExtras = totalConflicts / (conflictsPersonnel.length || 1);
    const conflictsMaxExtras = conflictsPersonnel.length > 0 ? conflictsPersonnel[0] : null;
    const conflictsMinExtras = conflictsPersonnel.length > 0 ? conflictsPersonnel[conflictsPersonnel.length - 1] : null;
    
    setStats({
      pmf: {
        totalExtras: pmfTotalExtras,
        mediaExtras: pmfMediaExtras,
        maxExtras: pmfMaxExtras,
        minExtras: pmfMinExtras,
        personnelWithExtras: pmfPersonnelWithExtras,
        personnelWithoutExtras: pmfPersonnelWithoutExtras,
      },
      escola: {
        totalExtras: escolaTotalExtras,
        mediaExtras: escolaMediaExtras,
        maxExtras: escolaMaxExtras,
        minExtras: escolaMinExtras,
        personnelWithExtras: escolaPersonnelWithExtras,
        personnelWithoutExtras: escolaPersonnelWithoutExtras,
      },
      geral: {
        totalExtras: totalExtras,
        mediaExtras: allMediaExtras,
        maxExtras: allMaxExtras,
        minExtras: allMinExtras,
        personnelWithExtras: allPersonnelWithExtras,
        personnelWithoutExtras: allPersonnelWithoutExtras,
      },
      conflitos: {
        totalExtras: conflictsPersonnel.reduce((acc, p: any) => acc + (p.extras || 0), 0),
        mediaExtras: conflictsMediaExtras,
        maxExtras: conflictsMaxExtras,
        minExtras: conflictsMinExtras,
        personnelWithExtras: conflictsPersonnel,
        personnelWithoutExtras: personnel.filter(p => !p.id || !conflictDetailsMap[p.id]),
      }
    });
  }, [personnel, assignments, currentMonth, currentYear]);

  // Função para obter o nome do mês
  const getMonthName = (month: number): string => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month];
  };

  // Função para criar um relatório customizado para PDF
  const createCustomReport = () => {
    const currentStats = stats[activeTab];
    const date = new Date().toLocaleDateString('pt-BR');
    
    // Obter o nome do mês atual
    const monthName = currentMonth !== undefined ? getMonthName(currentMonth) : getMonthName(new Date().getMonth());
    const yearValue = currentYear !== undefined ? currentYear : new Date().getFullYear();
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 100%; padding: 30px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1A3A5F; margin-bottom: 5px; font-size: 24px;">Relatório de Operações - ${activeTab === 'geral' ? 'Geral' : activeTab === 'pmf' ? 'Polícia Mais Forte' : 'Escola Segura'}</h1>
          <h2 style="color: #4A6741; margin-bottom: 5px; font-size: 18px;">${monthName} / ${yearValue}</h2>
          <p style="color: #777; font-size: 14px;">20ª CIPM - Gerado em: ${date}</p>
        </div>
        
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 25px; background-color: #f9f9f9;">
          <h2 style="color: #1A3A5F; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1A3A5F; padding-bottom: 8px;">Resumo Estatístico</h2>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
              <h3 style="font-size: 28px; color: #1A3A5F; margin: 0;">${currentStats.totalExtras}</h3>
              <p style="margin: 5px 0 0; font-size: 12px; color: #777;">Total de Extras</p>
            </div>
            
            <div style="flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
              <h3 style="font-size: 28px; color: #1A3A5F; margin: 0;">${currentStats.mediaExtras.toFixed(1)}</h3>
              <p style="margin: 5px 0 0; font-size: 12px; color: #777;">Média por Militar</p>
            </div>
            
            ${activeTab === 'geral' ? `
            <div style="flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
              <h3 style="font-size: 28px; color: #4A6741; margin: 0;">${stats.pmf.totalExtras}</h3>
              <p style="margin: 5px 0 0; font-size: 12px; color: #777;">PMF</p>
            </div>
            
            <div style="flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
              <h3 style="font-size: 28px; color: #4A6741; margin: 0;">${stats.escola.totalExtras}</h3>
              <p style="margin: 5px 0 0; font-size: 12px; color: #777;">Escola Segura</p>
            </div>
            ` : `
            <div style="flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
              <h3 style="font-size: 28px; color: #4A6741; margin: 0;">${currentStats.personnelWithExtras.length}</h3>
              <p style="margin: 5px 0 0; font-size: 12px; color: #777;">Militares Participaram</p>
            </div>
            `}
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 200px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="font-size: 12px; color: #777; margin: 0 0 8px;">Mais Extras</p>
              ${currentStats.maxExtras ? `
                <div style="display: flex; align-items: center;">
                  <div style="background: #1A3A5F; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                    <span style="font-size: 11px; font-weight: bold;">${currentStats.maxExtras.rank}</span>
                  </div>
                  <div>
                    <p style="font-size: 14px; font-weight: 500; margin: 0;">${currentStats.maxExtras.name}</p>
                    <p style="font-size: 12px; color: #3b82f6; margin: 0;">${currentStats.maxExtras.extras} extras</p>
                  </div>
                </div>
              ` : `<p style="font-size: 14px; color: #777;">-</p>`}
            </div>
            
            <div style="flex: 1; min-width: 200px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="font-size: 12px; color: #777; margin: 0 0 8px;">Menos Extras</p>
              ${currentStats.minExtras ? `
                <div style="display: flex; align-items: center;">
                  <div style="background: #1A3A5F; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                    <span style="font-size: 11px; font-weight: bold;">${currentStats.minExtras.rank}</span>
                  </div>
                  <div>
                    <p style="font-size: 14px; font-weight: 500; margin: 0;">${currentStats.minExtras.name}</p>
                    <p style="font-size: 12px; color: #3b82f6; margin: 0;">${currentStats.minExtras.extras} extras</p>
                  </div>
                </div>
              ` : `<p style="font-size: 14px; color: #777;">-</p>`}
            </div>
          </div>
        </div>
        
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 25px; background-color: #f9f9f9;">
          <h2 style="color: #1A3A5F; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1A3A5F; padding-bottom: 8px;">
            <span style="display: inline-block; margin-right: 8px;">•</span>
            Ranking de Participação
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e0e0e0; color: #1A3A5F; font-size: 14px;">Posição</th>
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e0e0e0; color: #1A3A5F; font-size: 14px;">Militar</th>
                <th style="text-align: center; padding: 10px; border-bottom: 2px solid #e0e0e0; color: #1A3A5F; font-size: 14px;">Extras</th>
              </tr>
            </thead>
            <tbody>
              ${currentStats.personnelWithExtras.length > 0 ? 
                currentStats.personnelWithExtras.map((person, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? 'white' : '#f5f8ff'};">
                    <td style="padding: 10px; font-size: 14px; text-align: center; width: 50px;">${index + 1}</td>
                    <td style="padding: 10px; font-size: 14px;">
                      <div style="font-weight: 500;">${person.rank} ${person.name}</div>
                      <div style="font-size: 12px; color: #777;">${person.rank === "CAP" ? "Capitão" : person.rank === "TEN" ? "Tenente" : person.rank}</div>
                    </td>
                    <td style="padding: 10px; font-size: 14px; text-align: center; font-weight: 600; color: #3b82f6;">
                      ${person.extras} ${person.extras === 1 ? 'extra' : 'extras'}
                    </td>
                  </tr>
                `).join('') : 
                `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #777;">Nenhum militar participou desta operação</td></tr>`
              }
            </tbody>
          </table>
          
          <h3 style="color: #4A6741; font-size: 16px; margin: 20px 0 10px;">
            <span style="display: inline-block; margin-right: 8px;">•</span>
            Militares sem Participação
          </h3>
          
          ${currentStats.personnelWithoutExtras.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${currentStats.personnelWithoutExtras.map(person => `
                <div style="background-color: white; padding: 8px; border-radius: 4px; display: flex; align-items: center;">
                  <span style="display: inline-block; color: #777; margin-right: 5px;">×</span>
                  <span style="font-size: 13px;">${person.rank} ${person.name}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="background-color: #f0fff4; border-radius: 6px; padding: 15px; text-align: center; color: #22c55e;">
              <span style="font-weight: 500;">✓ Todos os militares participaram</span>
            </div>
          `}
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #777; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
          Documento gerado automaticamente pelo Sistema de Gestão de Escalas - 20ª CIPM
        </div>
      </div>
    `;
  };

  // Função para gerar e baixar PDF do relatório
  const generatePDF = () => {
    // Usar o mês e ano atuais do calendário, ou o atual se não definido
    const reportMonth = currentMonth !== undefined ? currentMonth : new Date().getMonth();
    const reportYear = currentYear !== undefined ? currentYear : new Date().getFullYear();
    const monthName = getMonthName(reportMonth);
    
    const fileName = `relatorio_extras_${activeTab}_${monthName}_${reportYear}.pdf`;
    
    // Criar conteúdo personalizado para o PDF
    const customHtml = createCustomReport();
    
    // Criar um elemento temporário para renderizar o HTML personalizado
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = customHtml;
    document.body.appendChild(tempDiv);
    
    // Configurações para o PDF
    const options = {
      margin: [15, 15],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    toast({
      title: "Gerando PDF...",
      description: "O relatório está sendo preparado para download.",
    });

    // Gerar o PDF a partir do conteúdo personalizado
    html2pdf().from(tempDiv).set(options).save()
      .then(() => {
        // Remover o elemento temporário após gerar o PDF
        document.body.removeChild(tempDiv);
        
        toast({
          title: "PDF Gerado com Sucesso!",
          description: `O arquivo ${fileName} foi baixado.`,
          variant: "default",
        });
      })
      .catch((error: unknown) => {
        // Remover o elemento temporário em caso de erro
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        
        toast({
          title: "Erro ao gerar PDF",
          description: "Houve um problema ao criar o PDF. Tente novamente.",
          variant: "destructive",
        });
        console.error("Erro ao gerar PDF:", error);
      });
  };

  // Função para renderizar o ranking de militares para o relatório atual
  const renderPersonnelRanking = () => {
    const currentStats = stats[activeTab];
    
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1A3A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-medium text-lg text-[#1A3A5F]">Ranking de Participação</h4>
          </div>
          
          <div className="p-4 bg-[#f8fafc] rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3 px-3 text-sm font-bold text-[#1A3A5F]">
              <span>Militar</span>
              <span>Extras</span>
            </div>
            
            <ScrollArea className="h-[250px]">
              {currentStats.personnelWithExtras.length > 0 ? (
                <div className="space-y-2">
                  {currentStats.personnelWithExtras.map((person, index) => (
                    <div key={person.id} className="flex justify-between items-center py-2 px-3 border-b last:border-b-0 hover:bg-blue-50 transition-colors rounded">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center justify-center bg-[#1A3A5F] text-white h-7 w-7 rounded-full mr-3">
                          <span className="text-xs font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">{person.rank} {person.name}</span>
                          <div className="flex items-center mt-0.5">
                            <span className="text-xs text-gray-500">{person.rank === "CAP" ? "Capitão" : person.rank === "TEN" ? "Tenente" : person.rank}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-blue-600 font-semibold rounded-full bg-blue-50 px-3 py-1 text-sm">
                          {person.extras} {person.extras === 1 ? 'extra' : 'extras'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-40 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-md">Nenhum militar realizou extras</span>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4A6741]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-medium text-lg text-[#4A6741]">Militares sem Participação</h4>
          </div>
          
          <div className="p-4 bg-[#f8fafc] rounded-lg border border-gray-200">
            <ScrollArea className="h-[150px]">
              {currentStats.personnelWithoutExtras.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {currentStats.personnelWithoutExtras.map((person) => (
                    <div key={person.id} className="flex items-center p-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <div className="mr-2 w-6 h-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm text-gray-700">{person.rank} {person.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-20 text-green-600 bg-green-50 rounded-lg p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Todos os militares participaram</span>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-[#1A3A5F] text-white hover:bg-[#1A3A5F]/90 hover:text-white"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Relatório de Extras
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-start">
          <div>
            <DialogTitle className="text-2xl font-heading bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent">
              Relatório de Extras
              <div className="text-sm font-medium text-[#4A6741] mt-1">
                {currentMonth !== undefined && currentYear !== undefined 
                  ? `${getMonthName(currentMonth)} / ${currentYear}` 
                  : `${getMonthName(new Date().getMonth())} / ${new Date().getFullYear()}`}
              </div>
            </DialogTitle>
            <DialogDescription>
              Resumo das participações em extras e ranking dos militares.
            </DialogDescription>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={generatePDF}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Salvar como PDF
          </Button>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as ReportTab)} 
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="geral" className="text-base py-3">Geral</TabsTrigger>
            <TabsTrigger value="pmf" className="text-base py-3">Polícia Mais Forte</TabsTrigger>
            <TabsTrigger value="escola" className="text-base py-3">Escola Segura</TabsTrigger>
            <TabsTrigger value="conflitos" className="text-base py-3">Conflitos</TabsTrigger>
          </TabsList>
          
          <div ref={reportRef} className="px-2 pt-2 pb-4 bg-white">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-center text-[#1A3A5F] mb-2">
                Relatório de Extras - {
                  activeTab === 'geral' ? 'Geral' : 
                  activeTab === 'pmf' ? 'Polícia Mais Forte' : 
                  activeTab === 'escola' ? 'Escola Segura' : 
                  'Conflitos'
                }
              </h2>
              <p className="text-center text-[#4A6741] font-medium text-sm mb-1">
                {currentMonth !== undefined && currentYear !== undefined 
                  ? `${getMonthName(currentMonth)} / ${currentYear}` 
                  : `${getMonthName(new Date().getMonth())} / ${new Date().getFullYear()}`}
              </p>
              <p className="text-center text-gray-500 text-sm">
                {`20ª CIPM - Gerado em: ${new Date().toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <TabsContent value="geral" className="mt-0 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">{stats.geral.totalExtras}</h3>
                      <p className="text-xs text-gray-500">Total de Extras</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">
                        {stats.geral.mediaExtras.toFixed(1)}
                      </h3>
                      <p className="text-xs text-gray-500">Média por Militar</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#4A6741]">{stats.pmf.totalExtras}</h3>
                      <p className="text-xs text-gray-500">PMF</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#4A6741]">{stats.escola.totalExtras}</h3>
                      <p className="text-xs text-gray-500">Escola Segura</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Mais Extras</p>
                      {stats.geral.maxExtras ? (
                        <div className="flex items-center">
                          <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                            <span className="font-bold text-xs">{stats.geral.maxExtras.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stats.geral.maxExtras.name}</p>
                            <p className="text-xs text-blue-600">{stats.geral.maxExtras.extras} extras</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Menos Extras</p>
                      {stats.geral.minExtras ? (
                        <div className="flex items-center">
                          <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                            <span className="font-bold text-xs">{stats.geral.minExtras.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stats.geral.minExtras.name}</p>
                            <p className="text-xs text-blue-600">{stats.geral.minExtras.extras} extras</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                  </div>

                  {renderPersonnelRanking()}
                </div>
              </TabsContent>
              
              <TabsContent value="pmf" className="mt-0 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">{stats.pmf.totalExtras}</h3>
                      <p className="text-xs text-gray-500">Total de Extras</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">
                        {stats.pmf.mediaExtras.toFixed(1)}
                      </h3>
                      <p className="text-xs text-gray-500">Média por Militar</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">
                        {stats.pmf.personnelWithExtras.length}
                      </h3>
                      <p className="text-xs text-gray-500">Militares Participaram</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Mais Extras PMF</p>
                      {stats.pmf.maxExtras ? (
                        <div className="flex items-center">
                          <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                            <span className="font-bold text-xs">{stats.pmf.maxExtras.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stats.pmf.maxExtras.name}</p>
                            <p className="text-xs text-blue-600">
                              {stats.pmf.maxExtras.extras} extras
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Menos Extras PMF</p>
                      {stats.pmf.minExtras ? (
                        <div className="flex items-center">
                          <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                            <span className="font-bold text-xs">{stats.pmf.minExtras.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stats.pmf.minExtras.name}</p>
                            <p className="text-xs text-blue-600">
                              {stats.pmf.minExtras.extras} extras
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                  </div>

                  {renderPersonnelRanking()}
                </div>
              </TabsContent>
              
              <TabsContent value="escola" className="mt-0 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">{stats.escola.totalExtras}</h3>
                      <p className="text-xs text-gray-500">Total de Extras</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">
                        {stats.escola.mediaExtras.toFixed(1)}
                      </h3>
                      <p className="text-xs text-gray-500">Média por Militar</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#1A3A5F]">
                        {stats.escola.personnelWithExtras.length}
                      </h3>
                      <p className="text-xs text-gray-500">Militares Participaram</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Mais Extras Escola</p>
                      {stats.escola.maxExtras ? (
                        <div className="flex items-center">
                          <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                            <span className="font-bold text-xs">{stats.escola.maxExtras.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stats.escola.maxExtras.name}</p>
                            <p className="text-xs text-blue-600">
                              {stats.escola.maxExtras.extras} extras
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Menos Extras Escola</p>
                      {stats.escola.minExtras ? (
                        <div className="flex items-center">
                          <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                            <span className="font-bold text-xs">{stats.escola.minExtras.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stats.escola.minExtras.name}</p>
                            <p className="text-xs text-blue-600">
                              {stats.escola.minExtras.extras} extras
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                  </div>

                  {renderPersonnelRanking()}
                </div>
              </TabsContent>
              
              <TabsContent value="conflitos" className="mt-0 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#8B0000]">
                        {stats.conflitos.totalExtras}
                      </h3>
                      <p className="text-xs text-gray-500">Total de Conflitos</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-[#8B0000]">
                        {stats.conflitos.personnelWithExtras.length}
                      </h3>
                      <p className="text-xs text-gray-500">Militares Afetados</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-blue-600">
                        {(stats.conflitos.personnelWithExtras as PersonnelWithConflicts[]).reduce((acc, p) => acc + p.pmfConflicts, 0)}
                      </h3>
                      <p className="text-xs text-gray-500">PMF</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                      <h3 className="text-2xl font-bold text-green-600">
                        {(stats.conflitos.personnelWithExtras as PersonnelWithConflicts[]).reduce((acc, p) => acc + p.escolaConflicts, 0)}
                      </h3>
                      <p className="text-xs text-gray-500">Escola Segura</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#fff9f9] rounded-lg border border-[#ffcccc] mb-4">
                    <div className="flex items-start mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8B0000] mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="text-md font-medium text-[#8B0000]">Conflitos de Escala</h3>
                        <p className="text-sm text-gray-600">
                          Militares escalados para extras em dias que sua guarnição está de serviço normal. 
                          Um conflito ocorre quando um militar de guarnição (ALFA, BRAVO ou CHARLIE) é escalado para 
                          uma operação em um dia em que sua própria guarnição está de serviço regular.
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-600 mr-2"></div>
                        <span className="text-xs text-gray-700">PMF: Polícia Mais Forte</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-600 mr-2"></div>
                        <span className="text-xs text-gray-700">Escola: Escola Segura</span>
                      </div>
                    </div>
                  </div>

                  {stats.conflitos.personnelWithExtras.length > 0 ? (
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <h3 className="font-medium text-sm mb-3 text-[#8B0000]">Militares com Conflitos</h3>
                      <ScrollArea className="h-[350px]">
                        <div className="space-y-3 p-1">
                          {(stats.conflitos.personnelWithExtras as PersonnelWithConflicts[]).map(person => (
                            <div key={person.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center">
                                <div className="bg-[#8B0000] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                                  <span className="font-bold text-xs">{person.rank}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{person.name}</p>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500">{person.platoon || "Sem Guarnição"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[#8B0000] font-semibold rounded-full bg-[#fff9f9] px-3 py-1 text-sm mb-1">
                                  {person.extras} {person.extras === 1 ? 'conflito' : 'conflitos'}
                                </span>
                                <div className="flex flex-col text-xs">
                                  {/* Exibir os conflitos por operação */}
                                  {(person as PersonnelWithConflicts).pmfConflicts > 0 && (
                                    <span className="text-blue-600">PMF: {(person as PersonnelWithConflicts).pmfConflicts}</span>
                                  )}
                                  {(person as PersonnelWithConflicts).escolaConflicts > 0 && (
                                    <span className="text-green-600">Escola: {(person as PersonnelWithConflicts).escolaConflicts}</span>
                                  )}
                                </div>
                                {/* Botão e popup para exibir os detalhes dos conflitos */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      className="text-xs mt-2 h-6 px-2 text-[#8B0000] border-[#ffcccc]"
                                    >
                                      Ver detalhes
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle className="text-lg font-bold text-[#8B0000]">
                                        Detalhes dos Conflitos
                                      </DialogTitle>
                                      <DialogDescription>
                                        {person.name} tem {person.extras} {person.extras === 1 ? 'conflito' : 'conflitos'} de escala.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
                                      {(person as PersonnelWithConflicts).conflictDetails.map((conflict, index) => (
                                        <div key={index} className="bg-[#fff9f9] rounded-lg border border-[#ffcccc] p-3">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <div className="h-3 w-3 rounded-full" 
                                                 style={{ 
                                                   backgroundColor: conflict.operation === 'PMF' 
                                                    ? '#1e40af' // Azul para PMF 
                                                    : '#15803d' // Verde para Escola
                                                 }}></div>
                                            <span className="font-medium">
                                              {conflict.operation === 'PMF' ? 'Polícia Mais Forte' : 'Escola Segura'}
                                            </span>
                                          </div>
                                          <div className="ml-5 space-y-1 text-sm">
                                            <div className="flex items-start">
                                              <span className="font-semibold text-gray-700 mr-2">Data:</span>
                                              <span>{conflict.date}</span>
                                            </div>
                                            <div className="flex items-start">
                                              <span className="font-semibold text-gray-700 mr-2">Guarnição em serviço:</span>
                                              <span>{conflict.guarnition}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Fechar</Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-40 text-gray-500 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-md">Nenhum conflito de escala detectado</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
