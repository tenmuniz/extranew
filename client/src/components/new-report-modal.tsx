import { useState, useEffect } from "react";
import { Personnel, Assignment, OperationType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";
import { formatMonthYear } from "@/lib/utils";

interface ReportModalProps {
  personnel: Personnel[];
  assignments: Assignment[];
  currentMonth?: number;
  currentYear?: number;
  onClose: () => void;
}

type PersonnelWithExtras = Personnel & {
  operationsCount: number;
  pmfCount: number;
  escolaCount: number;
  details: {date: string, dateObj: Date, operation: OperationType}[];
}

// Interface para estatísticas
interface StatsData {
  totalOperations: number;
  pmfOperations: number;
  escolaOperations: number;
  personnelCount: number;
  avgOperationsPerPerson: number;
  maxOperations: { person: PersonnelWithExtras | null, count: number };
}

// Interface para estatísticas de guarnição
interface GuarnitionStats {
  alfa: StatsData;
  bravo: StatsData;
  charlie: StatsData;
  expediente: StatsData;
}

export function NewReportModal({
  personnel,
  assignments,
  currentMonth,
  currentYear,
  onClose
}: ReportModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'alfa' | 'bravo' | 'charlie' | 'expediente'>('geral');
  const [selectedPerson, setSelectedPerson] = useState<PersonnelWithExtras | null>(null);
  const [stats, setStats] = useState({
    totalOperations: 0,
    pmfOperations: 0,
    escolaOperations: 0,
    personnelInvolved: 0,
    avgOperationsPerPerson: 0,
    maxOperations: { person: null as PersonnelWithExtras | null, count: 0 },
    minOperations: { person: null as PersonnelWithExtras | null, count: 0 }
  });
  
  // Estatísticas por guarnição
  const [guStats, setGuStats] = useState<GuarnitionStats>({
    alfa: {
      totalOperations: 0,
      pmfOperations: 0,
      escolaOperations: 0,
      personnelCount: 0,
      avgOperationsPerPerson: 0,
      maxOperations: { person: null as PersonnelWithExtras | null, count: 0 }
    },
    bravo: {
      totalOperations: 0,
      pmfOperations: 0,
      escolaOperations: 0,
      personnelCount: 0,
      avgOperationsPerPerson: 0,
      maxOperations: { person: null as PersonnelWithExtras | null, count: 0 }
    },
    charlie: {
      totalOperations: 0,
      pmfOperations: 0,
      escolaOperations: 0,
      personnelCount: 0,
      avgOperationsPerPerson: 0,
      maxOperations: { person: null as PersonnelWithExtras | null, count: 0 }
    },
    expediente: {
      totalOperations: 0,
      pmfOperations: 0,
      escolaOperations: 0,
      personnelCount: 0,
      avgOperationsPerPerson: 0,
      maxOperations: { person: null as PersonnelWithExtras | null, count: 0 }
    }
  });
  
  const [personnelWithExtras, setPersonnelWithExtras] = useState<PersonnelWithExtras[]>([]);
  const [alfaPersonnel, setAlfaPersonnel] = useState<PersonnelWithExtras[]>([]);
  const [bravoPersonnel, setBravoPersonnel] = useState<PersonnelWithExtras[]>([]);
  const [charliePersonnel, setCharliePersonnel] = useState<PersonnelWithExtras[]>([]);
  const [expedientePersonnel, setExpedientePersonnel] = useState<PersonnelWithExtras[]>([]);

  // Processar dados para o relatório
  useEffect(() => {
    if (!personnel.length) return;
    
    // Filtrar operações do mês atual se especificado
    const currentMonthFilter = (assignment: Assignment) => {
      if (currentMonth === undefined || currentYear === undefined) return true;
      
      // Extrair e processar a data corretamente para evitar problemas de fuso horário
      const dateStr = assignment.date.split('T')[0]; // Extrai apenas a parte da data (YYYY-MM-DD)
      const [yearStr, monthStr] = dateStr.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // Mês em JavaScript é 0-indexado
      
      return month === currentMonth && year === currentYear;
    };
    
    const filteredAssignments = assignments.filter(currentMonthFilter);
    
    // Calcular estatísticas por pessoa
    const extrasMap = new Map<number, {
      operationsCount: number,
      pmfCount: number,
      escolaCount: number,
      details: {date: string, dateObj: Date, operation: OperationType}[]
    }>();
    
    // Inicializar contador para cada pessoa
    personnel.forEach(person => {
      if (person.id) {
        extrasMap.set(person.id, {
          operationsCount: 0,
          pmfCount: 0,
          escolaCount: 0,
          details: []
        });
      }
    });
    
    // Contar operações por pessoa
    filteredAssignments.forEach(assignment => {
      const personId = assignment.personnelId;
      const personData = extrasMap.get(personId);
      
      if (personData) {
        personData.operationsCount += 1;
        
        if (assignment.operationType === "PMF") {
          personData.pmfCount += 1;
        } else if (assignment.operationType === "ESCOLA") {
          personData.escolaCount += 1;
        }
        
        // Converter a data para objeto Date para ordenação posterior
        // Ajuste para garantir que use a data correta sem problemas de fuso horário
        const dateStr = assignment.date.split('T')[0]; // Extrai apenas a parte da data (YYYY-MM-DD)
        const [yearStr, monthStr, dayStr] = dateStr.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // Mês em JavaScript é 0-indexado
        const day = parseInt(dayStr);
        
        // Criar a data com os componentes individuais para evitar problemas de fuso horário
        const dateObj = new Date(year, month, day);
        
        // Formatar a data para o padrão brasileiro (DD/MM/YYYY)
        const formattedDay = day.toString().padStart(2, '0');
        const formattedMonth = (month + 1).toString().padStart(2, '0');
        const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
        
        // Adicionar detalhes da operação
        personData.details.push({
          date: formattedDate,
          dateObj,
          operation: assignment.operationType
        });
        
        // Atualizar no mapa
        extrasMap.set(personId, personData);
      }
    });
    
    // Criar lista de pessoal com extras
    const personnelWithOperations = personnel
      .filter(p => p.id && extrasMap.has(p.id))
      .map(p => {
        const extrasData = extrasMap.get(p.id!) || {
          operationsCount: 0,
          pmfCount: 0,
          escolaCount: 0,
          details: []
        };
        
        return {
          ...p,
          operationsCount: extrasData.operationsCount,
          pmfCount: extrasData.pmfCount,
          escolaCount: extrasData.escolaCount,
          details: extrasData.details
        };
      })
      .filter(p => p.operationsCount > 0) as PersonnelWithExtras[];
    
    // Ordenar por número de operações (maior para menor)
    personnelWithOperations.sort((a, b) => b.operationsCount - a.operationsCount);
    
    setPersonnelWithExtras(personnelWithOperations);
    
    // Agrupar por guarnição
    const alfa = personnelWithOperations.filter(p => p.platoon === 'ALFA');
    const bravo = personnelWithOperations.filter(p => p.platoon === 'BRAVO');
    const charlie = personnelWithOperations.filter(p => p.platoon === 'CHARLIE');
    const expediente = personnelWithOperations.filter(p => p.platoon === 'EXPEDIENTE');
    
    setAlfaPersonnel(alfa);
    setBravoPersonnel(bravo);
    setCharliePersonnel(charlie);
    setExpedientePersonnel(expediente);
    
    // Encontrar militar com mais e menos operações
    let maxPerson: PersonnelWithExtras | null = null;
    let minPerson: PersonnelWithExtras | null = null;
    let maxCount = 0;
    let minCount = Infinity;
    
    personnelWithOperations.forEach(person => {
      if (person.operationsCount > maxCount) {
        maxCount = person.operationsCount;
        maxPerson = person;
      }
      
      if (person.operationsCount < minCount) {
        minCount = person.operationsCount;
        minPerson = person;
      }
    });
    
    // Calcular estatísticas gerais
    const totalOperations = filteredAssignments.length;
    const pmfOperations = filteredAssignments.filter(a => a.operationType === "PMF").length;
    const escolaOperations = filteredAssignments.filter(a => a.operationType === "ESCOLA").length;
    const personnelInvolved = personnelWithOperations.length;
    const avgOperationsPerPerson = personnelInvolved 
      ? Number((totalOperations / personnelInvolved).toFixed(1))
      : 0;
    
    setStats({
      totalOperations,
      pmfOperations,
      escolaOperations,
      personnelInvolved,
      avgOperationsPerPerson,
      maxOperations: { person: maxPerson, count: maxCount },
      minOperations: { person: minPerson, count: minCount > 0 && minCount !== Infinity ? minCount : 0 }
    });
    
    // Calcular estatísticas por guarnição
    const guStatsData = {
      alfa: {
        totalOperations: alfa.reduce((total, p) => total + p.operationsCount, 0),
        pmfOperations: alfa.reduce((total, p) => total + p.pmfCount, 0),
        escolaOperations: alfa.reduce((total, p) => total + p.escolaCount, 0),
        personnelCount: alfa.length,
        avgOperationsPerPerson: alfa.length 
          ? Number((alfa.reduce((total, p) => total + p.operationsCount, 0) / alfa.length).toFixed(1))
          : 0,
        maxOperations: { 
          person: alfa.length ? alfa.reduce((max, p) => p.operationsCount > (max?.operationsCount || 0) ? p : max, null as PersonnelWithExtras | null) : null,
          count: alfa.length ? Math.max(...alfa.map(p => p.operationsCount)) : 0
        }
      },
      bravo: {
        totalOperations: bravo.reduce((total, p) => total + p.operationsCount, 0),
        pmfOperations: bravo.reduce((total, p) => total + p.pmfCount, 0),
        escolaOperations: bravo.reduce((total, p) => total + p.escolaCount, 0),
        personnelCount: bravo.length,
        avgOperationsPerPerson: bravo.length 
          ? Number((bravo.reduce((total, p) => total + p.operationsCount, 0) / bravo.length).toFixed(1))
          : 0,
        maxOperations: { 
          person: bravo.length ? bravo.reduce((max, p) => p.operationsCount > (max?.operationsCount || 0) ? p : max, null as PersonnelWithExtras | null) : null,
          count: bravo.length ? Math.max(...bravo.map(p => p.operationsCount)) : 0
        }
      },
      charlie: {
        totalOperations: charlie.reduce((total, p) => total + p.operationsCount, 0),
        pmfOperations: charlie.reduce((total, p) => total + p.pmfCount, 0),
        escolaOperations: charlie.reduce((total, p) => total + p.escolaCount, 0),
        personnelCount: charlie.length,
        avgOperationsPerPerson: charlie.length 
          ? Number((charlie.reduce((total, p) => total + p.operationsCount, 0) / charlie.length).toFixed(1))
          : 0,
        maxOperations: { 
          person: charlie.length ? charlie.reduce((max, p) => p.operationsCount > (max?.operationsCount || 0) ? p : max, null as PersonnelWithExtras | null) : null, 
          count: charlie.length ? Math.max(...charlie.map(p => p.operationsCount)) : 0
        }
      },
      expediente: {
        totalOperations: expediente.reduce((total, p) => total + p.operationsCount, 0),
        pmfOperations: expediente.reduce((total, p) => total + p.pmfCount, 0),
        escolaOperations: expediente.reduce((total, p) => total + p.escolaCount, 0),
        personnelCount: expediente.length,
        avgOperationsPerPerson: expediente.length 
          ? Number((expediente.reduce((total, p) => total + p.operationsCount, 0) / expediente.length).toFixed(1))
          : 0,
        maxOperations: { 
          person: expediente.length ? expediente.reduce((max, p) => p.operationsCount > (max?.operationsCount || 0) ? p : max, null as PersonnelWithExtras | null) : null,
          count: expediente.length ? Math.max(...expediente.map(p => p.operationsCount)) : 0
        }
      }
    };
    
    setGuStats(guStatsData);
    
    // Seleciona o primeiro militar por padrão, se existir
    if (personnelWithOperations.length > 0 && !selectedPerson) {
      setSelectedPerson(personnelWithOperations[0]);
    }
  }, [personnel, assignments, currentMonth, currentYear, selectedPerson]);
  
  // Gerar PDF do relatório
  const handleGeneratePDF = (guarnition?: 'alfa' | 'bravo' | 'charlie' | 'expediente') => {
    // Selecionar os dados corretos com base na guarnição
    let personnelList: PersonnelWithExtras[] = [];
    let selectedStats: StatsData = {
      totalOperations: 0,
      pmfOperations: 0,
      escolaOperations: 0,
      personnelCount: 0,
      avgOperationsPerPerson: 0,
      maxOperations: { person: null as PersonnelWithExtras | null, count: 0 }
    };
    
    let reportTitle = "RELATÓRIO DE EXTRAS - 20ª CIPM";
    let reportSubtitle = "";
    let colorPrimary = "#1A3A5F";
    let colorSecondary = "#4A6741";
    
    // Configurar dados e cores com base na guarnição selecionada
    if (guarnition === 'alfa') {
      personnelList = alfaPersonnel;
      selectedStats = { ...guStats.alfa };
      reportTitle = "RELATÓRIO DE EXTRAS - GUARNIÇÃO ALFA";
      colorPrimary = "#1E429F"; // Azul para ALFA
      colorSecondary = "#1A3A5F";
    } else if (guarnition === 'bravo') {
      personnelList = bravoPersonnel;
      selectedStats = { ...guStats.bravo };
      reportTitle = "RELATÓRIO DE EXTRAS - GUARNIÇÃO BRAVO";
      colorPrimary = "#065F46"; // Verde para BRAVO
      colorSecondary = "#1A3A5F";
    } else if (guarnition === 'charlie') {
      personnelList = charliePersonnel;
      selectedStats = { ...guStats.charlie };
      reportTitle = "RELATÓRIO DE EXTRAS - GUARNIÇÃO CHARLIE";
      colorPrimary = "#991B1B"; // Vermelho para CHARLIE
      colorSecondary = "#1A3A5F";
    } else if (guarnition === 'expediente') {
      personnelList = expedientePersonnel;
      selectedStats = { ...guStats.expediente };
      reportTitle = "RELATÓRIO DE EXTRAS - EXPEDIENTE";
      colorPrimary = "#5B21B6"; // Roxo para EXPEDIENTE
      colorSecondary = "#1A3A5F";
    } else {
      personnelList = personnelWithExtras;
      selectedStats = {
        totalOperations: stats.totalOperations,
        pmfOperations: stats.pmfOperations,
        escolaOperations: stats.escolaOperations,
        personnelCount: stats.personnelInvolved,
        avgOperationsPerPerson: stats.avgOperationsPerPerson,
        maxOperations: stats.maxOperations
      };
      reportTitle = "RELATÓRIO GERAL DE EXTRAS - 20ª CIPM";
    }
    
    // Construir um HTML estruturado para o PDF
    const pdfContainer = document.createElement('div');
    pdfContainer.style.padding = '20px';
    pdfContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Cabeçalho
    const header = document.createElement('div');
    reportSubtitle = currentMonth !== undefined && currentYear !== undefined 
        ? `${getMonthName(currentMonth)} / ${currentYear}`
        : "Todos os Períodos";
        
    header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: ${colorPrimary}; margin-bottom: 5px; font-size: 24px;">${reportTitle}</h1>
        <h2 style="color: ${colorSecondary}; margin-top: 0; font-size: 18px;">${reportSubtitle}</h2>
        <div style="border-bottom: 2px solid ${colorPrimary}; margin: 10px 0;"></div>
      </div>
    `;
    pdfContainer.appendChild(header);
    
    // Resumo estatístico
    const statsSection = document.createElement('div');
    
    statsSection.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h2 style="color: ${colorPrimary}; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 18px;">RESUMO ESTATÍSTICO</h2>
        <div style="display: flex; justify-content: space-between; margin-top: 15px;">
          <div style="text-align: center; background-color: #f0f7ff; padding: 10px; border-radius: 8px; width: 23%;">
            <span style="display: block; font-size: 24px; font-weight: bold; color: ${colorPrimary};">${selectedStats.totalOperations}</span>
            <span style="color: #666; font-size: 14px;">Total de Extras</span>
          </div>
          <div style="text-align: center; background-color: #f0faf0; padding: 10px; border-radius: 8px; width: 23%;">
            <span style="display: block; font-size: 24px; font-weight: bold; color: #4A6741;">${selectedStats.pmfOperations}</span>
            <span style="color: #666; font-size: 14px;">PMF</span>
          </div>
          <div style="text-align: center; background-color: #f5f0ff; padding: 10px; border-radius: 8px; width: 23%;">
            <span style="display: block; font-size: 24px; font-weight: bold; color: #6441A5;">${selectedStats.escolaOperations}</span>
            <span style="color: #666; font-size: 14px;">Escola Segura</span>
          </div>
          <div style="text-align: center; background-color: #fff0f3; padding: 10px; border-radius: 8px; width: 23%;">
            <span style="display: block; font-size: 24px; font-weight: bold; color: #FF416C;">${selectedStats.personnelCount}</span>
            <span style="color: #666; font-size: 14px;">Militares Envolvidos</span>
          </div>
        </div>
      </div>
    `;
    pdfContainer.appendChild(statsSection);
    
    // Destaque
    const highlightSection = document.createElement('div');
    
    highlightSection.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h2 style="color: ${colorPrimary}; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 18px;">DESTAQUES</h2>
        <div style="display: flex; margin-top: 15px;">
          <div style="background-color: #fff0f3; padding: 15px; border-radius: 8px; width: 100%;">
            <h3 style="margin-top: 0; color: #FF416C; font-size: 16px;">Maior Participação em Extras</h3>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Militar:</strong> ${selectedStats.maxOperations.person?.name || "Nenhum"}</p>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Quantidade:</strong> ${selectedStats.maxOperations.count} extras</p>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Média por Militar:</strong> ${selectedStats.avgOperationsPerPerson} extras</p>
          </div>
        </div>
      </div>
    `;
    pdfContainer.appendChild(highlightSection);
    
    // Lista de militares com extras
    const personnelSection = document.createElement('div');
    personnelSection.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h2 style="color: ${colorPrimary}; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 18px;">MILITARES COM EXTRAS</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: ${colorPrimary}; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Militar</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Posto/Grad</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">PMF</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Escola</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${personnelList.map((person, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                <td style="padding: 8px; border: 1px solid #ddd;">${person.name}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${person.rank}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${person.pmfCount}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${person.escolaCount}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${person.operationsCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    pdfContainer.appendChild(personnelSection);
    
    // Datas e detalhes das operações
    if (personnelList.length > 0) {
      const datesSection = document.createElement('div');
      datesSection.innerHTML = `
        <div style="margin-bottom: 25px;">
          <h2 style="color: ${colorPrimary}; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 18px;">DETALHAMENTO POR DATA</h2>
          
          <div style="margin-top: 15px;">
            ${personnelList.map((person) => `
              <div style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${colorPrimary}; color: white; padding: 8px 12px;">
                  <h3 style="margin: 0; font-size: 16px;">${person.name} - ${person.rank}</h3>
                </div>
                <div style="padding: 12px;">
                  <p style="margin: 0 0 10px 0;"><strong>Total de extras:</strong> ${person.operationsCount}</p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                      <tr style="background-color: #f0f0f0;">
                        <th style="padding: 6px; text-align: center; border: 1px solid #ddd;">Data</th>
                        <th style="padding: 6px; text-align: center; border: 1px solid #ddd;">Operação</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${person.details
                        .sort((a, b) => (a.dateObj instanceof Date && b.dateObj instanceof Date) 
                          ? a.dateObj.getTime() - b.dateObj.getTime() 
                          : 0)
                        .map((detail) => `
                        <tr>
                          <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${detail.date}</td>
                          <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">
                            ${detail.operation === 'PMF' ? 'Polícia Mais Forte' : 'Escola Segura'}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      pdfContainer.appendChild(datesSection);
    }
    
    // Rodapé
    const footer = document.createElement('div');
    footer.innerHTML = `
      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>Sistema de Escalas - 20ª CIPM</p>
      </div>
    `;
    pdfContainer.appendChild(footer);
    
    // Gerar o PDF
    const options = {
      margin: 10,
      filename: `relatorio-extras-${guarnition ? guarnition+'-' : ''}${
        currentMonth !== undefined && currentYear !== undefined 
        ? `${getMonthName(currentMonth)}-${currentYear}`
        : 'completo'
      }.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(pdfContainer).set(options).save();
  };
  
  // Função para obter o nome do mês
  const getMonthName = (month: number): string => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month];
  };
  
  // Obter a cor de fundo baseada na guarnição
  const getGuarnitionColor = (platoon?: string): string => {
    switch (platoon) {
      case "ALFA":
        return "bg-blue-700";
      case "BRAVO":
        return "bg-green-700";
      case "CHARLIE":
        return "bg-red-700";
      case "EXPEDIENTE":
        return "bg-purple-700";
      default:
        return "bg-gray-700";
    }
  };

  // Se não há dados para exibir
  if (personnelWithExtras.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#1A3A5F] to-[#4A6741] flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-lg overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Sem Dados para Relatório</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Não existem operações atribuídas no período selecionado. Adicione atribuições de operações no calendário para gerar um relatório.
            </p>
            <Button 
              onClick={onClose}
              className="bg-[#1A3A5F] hover:bg-[#12283F] text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              Voltar ao Calendário
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1A3A5F] to-[#4A6741] flex items-center justify-center z-50 overflow-auto">
      <div id="report-content" className="bg-[#F8FAFC] rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-[#1A3A5F] text-white py-4 px-6 flex justify-between items-center shadow-md">
          <h2 className="text-xl md:text-2xl font-bold">Relatório de Operações</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleGeneratePDF(activeTab !== 'geral' ? activeTab : undefined)}
              className="bg-gradient-to-r from-[#4A6741] to-[#6BA368] hover:shadow-xl text-white rounded-lg px-3 py-2 shadow-md transition-all duration-300 flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-medium">Exportar PDF</span>
            </button>
            
            <button 
              onClick={onClose}
              className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] hover:shadow-lg text-white rounded-lg px-4 py-2 shadow-md transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">Voltar ao Calendário</span>
            </button>
          </div>
        </div>
        
        <div className="relative p-6 overflow-auto flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent mb-2">
                Relatório de Extras
              </h1>
              
              <p className="text-gray-600 text-lg">
                {currentMonth !== undefined && currentYear !== undefined
                  ? `${getMonthName(currentMonth)} / ${currentYear}`
                  : "Todos os Períodos"}
                {' '}- 20ª CIPM
              </p>
            </div>
          </div>
          
          {/* Abas para diferentes visualizações */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveTab('geral')} 
              className={`rounded-lg px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'geral' 
                  ? 'bg-[#1A3A5F] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Visão Geral
            </button>
            
            {alfaPersonnel.length > 0 && (
              <button 
                onClick={() => setActiveTab('alfa')} 
                className={`rounded-lg px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'alfa' 
                    ? 'bg-blue-700 text-white shadow-md' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <span className="w-3 h-3 bg-blue-700 rounded-full mr-2 border border-white"></span>
                Guarnição ALFA
              </button>
            )}
            
            {bravoPersonnel.length > 0 && (
              <button 
                onClick={() => setActiveTab('bravo')} 
                className={`rounded-lg px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'bravo' 
                    ? 'bg-green-700 text-white shadow-md' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                <span className="w-3 h-3 bg-green-700 rounded-full mr-2 border border-white"></span>
                Guarnição BRAVO
              </button>
            )}
            
            {charliePersonnel.length > 0 && (
              <button 
                onClick={() => setActiveTab('charlie')} 
                className={`rounded-lg px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'charlie' 
                    ? 'bg-red-700 text-white shadow-md' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <span className="w-3 h-3 bg-red-700 rounded-full mr-2 border border-white"></span>
                Guarnição CHARLIE
              </button>
            )}
            
            {expedientePersonnel.length > 0 && (
              <button 
                onClick={() => setActiveTab('expediente')} 
                className={`rounded-lg px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'expediente' 
                    ? 'bg-purple-700 text-white shadow-md' 
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                <span className="w-3 h-3 bg-purple-700 rounded-full mr-2 border border-white"></span>
                EXPEDIENTE
              </button>
            )}
          </div>
          
          {/* Conteúdo baseado na aba selecionada */}
          {activeTab === 'geral' && (
            <div>
              {/* Cards com estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-gradient-to-br from-[#1A3A5F] to-[#3066BE] rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-medium opacity-80 mb-2">Total de Extras</h3>
                  <div className="text-5xl font-bold mb-1">{stats.totalOperations}</div>
                  <p className="text-sm opacity-70">No período</p>
                </div>
                
                <div className="bg-gradient-to-br from-[#4A6741] to-[#6BA368] rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-medium opacity-80 mb-2">Militares Envolvidos</h3>
                  <div className="text-5xl font-bold mb-1">{stats.personnelInvolved}</div>
                  <p className="text-sm opacity-70">Em extras</p>
                </div>
                
                <div className="bg-gradient-to-br from-[#6441A5] to-[#8843E8] rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-medium opacity-80 mb-2">Média por Militar</h3>
                  <div className="text-5xl font-bold mb-1">{stats.avgOperationsPerPerson}</div>
                  <p className="text-sm opacity-70">Extras/Policial</p>
                </div>
                
                <div className="bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-medium opacity-80 mb-2">Maior Participação</h3>
                  <div className="text-5xl font-bold mb-1">{stats.maxOperations.count}</div>
                  <p className="text-sm opacity-70 truncate">{stats.maxOperations.person?.name || "Nenhum"}</p>
                </div>
              </div>
              
              {/* Container principal de duas colunas */}
              <div className="flex flex-col md:flex-row gap-8">
                {/* Coluna da esquerda: Lista de militares com operações */}
                <div className="w-full md:w-2/5 bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    Militares com Extras
                  </h2>
                  
                  <div className="max-h-[360px] overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {personnelWithExtras.map(person => (
                        <div
                          key={person.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedPerson?.id === person.id
                              ? "border-[#1A3A5F] bg-[#F0F7FF] shadow-md"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedPerson(person)}
                        >
                          <div className="flex items-center">
                            <div className={`${getGuarnitionColor(person.platoon)} text-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-md`}>
                              <span className="font-bold text-xs">{person.rank}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{person.name}</p>
                              <span className="text-sm text-gray-500">{person.platoon || "Sem Guarnição"}</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <span className="bg-blue-600 text-white text-lg font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-md">
                              {person.operationsCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Coluna da direita: Detalhes do militar selecionado */}
                <div className="w-full md:w-3/5 bg-white rounded-xl shadow-lg p-6">
                  {selectedPerson ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className={`${getGuarnitionColor(selectedPerson.platoon)} text-white w-16 h-16 rounded-full flex items-center justify-center mr-4 shadow-md`}>
                            <span className="font-bold text-sm">{selectedPerson.rank}</span>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedPerson.name}</h2>
                            <div className="flex items-center mt-1">
                              <span className={`inline-block w-3 h-3 rounded-full ${getGuarnitionColor(selectedPerson.platoon)} mr-2`}></span>
                              <span className="text-gray-600 font-medium">{selectedPerson.platoon || "Sem Guarnição"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-5 rounded-xl shadow-lg">
                          <span className="text-lg font-medium block">Total</span>
                          <span className="text-3xl font-bold">{selectedPerson.operationsCount}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mb-6">
                        <div className="bg-blue-100 rounded-lg p-4 text-center w-[48%]">
                          <span className="text-blue-800 font-bold text-3xl block">{selectedPerson.pmfCount}</span>
                          <span className="text-blue-600 text-sm">PMF</span>
                        </div>
                        <div className="bg-green-100 rounded-lg p-4 text-center w-[48%]">
                          <span className="text-green-800 font-bold text-3xl block">{selectedPerson.escolaCount}</span>
                          <span className="text-green-600 text-sm">Escola Segura</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                        Detalhes dos Extras
                      </h3>
                      
                      <div className="max-h-[240px] overflow-y-auto pr-2">
                        <div className="space-y-4">
                          {[...selectedPerson.details]
                            .sort((a, b) => (a.dateObj instanceof Date && b.dateObj instanceof Date) 
                              ? a.dateObj.getTime() - b.dateObj.getTime() 
                              : 0)
                            .map((detail, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                              <div className={`py-3 px-4 text-white font-medium ${
                                detail.operation === 'PMF' 
                                  ? 'bg-blue-600' 
                                  : 'bg-green-600'
                              }`}>
                                {detail.operation === 'PMF' ? 'Polícia Mais Forte' : 'Escola Segura'}
                              </div>
                              <div className="bg-white p-4">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-lg font-semibold text-gray-800">{detail.date}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">Selecione um militar para ver os detalhes</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Seção de estatísticas por operação */}
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Estatísticas por Extra</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Polícia Mais Forte</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <span className="block text-2xl font-bold text-blue-700">{stats.pmfOperations}</span>
                        <span className="text-blue-600 text-sm">Extras</span>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <span className="block text-2xl font-bold text-blue-700">
                          {stats.totalOperations > 0 ? Math.round((stats.pmfOperations / stats.totalOperations) * 100) : 0}%
                        </span>
                        <span className="text-blue-600 text-sm">Do total</span>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <span className="block text-2xl font-bold text-blue-700">3</span>
                        <span className="text-blue-600 text-sm">Por dia</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Escola Segura</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <span className="block text-2xl font-bold text-green-700">{stats.escolaOperations}</span>
                        <span className="text-green-600 text-sm">Extras</span>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <span className="block text-2xl font-bold text-green-700">
                          {stats.totalOperations > 0 ? Math.round((stats.escolaOperations / stats.totalOperations) * 100) : 0}%
                        </span>
                        <span className="text-green-600 text-sm">Do total</span>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <span className="block text-2xl font-bold text-green-700">2</span>
                        <span className="text-green-600 text-sm">Por dia</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Visualização por guarnição */}
          {activeTab === 'alfa' && (
            <div>
              <div className="bg-blue-100 rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-blue-800 mb-2">Guarnição ALFA</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-blue-700">{guStats.alfa.totalOperations}</div>
                    <div className="text-blue-600">Total de Extras</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-blue-700">{guStats.alfa.personnelCount}</div>
                    <div className="text-blue-600">Militares Envolvidos</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-blue-700">{guStats.alfa.avgOperationsPerPerson}</div>
                    <div className="text-blue-600">Média por Militar</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-blue-700">{guStats.alfa.maxOperations.count}</div>
                    <div className="text-blue-600">Maior Participação</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGeneratePDF('alfa')}
                  className="mt-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 shadow-md transition-all duration-300 flex items-center w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">Exportar Relatório ALFA</span>
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Militares da Guarnição ALFA
                </h3>
                <div className="space-y-4">
                  {alfaPersonnel.map(person => (
                    <div key={person.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-md">
                            <span className="font-bold text-xs">{person.rank}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{person.name}</p>
                            <div className="flex items-center mt-1">
                              <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-1">
                                {person.operationsCount}
                              </span>
                              <span className="text-gray-500">extras no período</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="text-center bg-blue-100 rounded-lg px-3 py-1">
                            <span className="block text-blue-800 font-bold">{person.pmfCount}</span>
                            <span className="text-blue-600 text-xs">PMF</span>
                          </div>
                          <div className="text-center bg-green-100 rounded-lg px-3 py-1">
                            <span className="block text-green-800 font-bold">{person.escolaCount}</span>
                            <span className="text-green-600 text-xs">Escola</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes dos Extras:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {person.details
                            .sort((a, b) => (a.dateObj instanceof Date && b.dateObj instanceof Date) 
                              ? a.dateObj.getTime() - b.dateObj.getTime() 
                              : 0)
                            .map((detail, index) => (
                              <div 
                                key={index} 
                                className={`text-sm rounded px-2 py-1 flex items-center ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-50 text-blue-800' 
                                    : 'bg-green-50 text-green-800'
                                }`}
                              >
                                <span className="mr-1">{detail.date}</span>
                                <span className={`text-xs rounded-full px-1.5 ml-auto ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-green-200 text-green-800'
                                }`}>
                                  {detail.operation}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Visualização para BRAVO */}
          {activeTab === 'bravo' && (
            <div>
              <div className="bg-green-100 rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-green-800 mb-2">Guarnição BRAVO</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-green-700">{guStats.bravo.totalOperations}</div>
                    <div className="text-green-600">Total de Extras</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-green-700">{guStats.bravo.personnelCount}</div>
                    <div className="text-green-600">Militares Envolvidos</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-green-700">{guStats.bravo.avgOperationsPerPerson}</div>
                    <div className="text-green-600">Média por Militar</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-green-700">{guStats.bravo.maxOperations.count}</div>
                    <div className="text-green-600">Maior Participação</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGeneratePDF('bravo')}
                  className="mt-4 bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2 shadow-md transition-all duration-300 flex items-center w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">Exportar Relatório BRAVO</span>
                </button>
              </div>
              
              {/* Lista de militares BRAVO */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Militares da Guarnição BRAVO
                </h3>
                <div className="space-y-4">
                  {bravoPersonnel.map(person => (
                    <div key={person.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="bg-green-700 text-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-md">
                            <span className="font-bold text-xs">{person.rank}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{person.name}</p>
                            <div className="flex items-center mt-1">
                              <span className="bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-1">
                                {person.operationsCount}
                              </span>
                              <span className="text-gray-500">extras no período</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="text-center bg-blue-100 rounded-lg px-3 py-1">
                            <span className="block text-blue-800 font-bold">{person.pmfCount}</span>
                            <span className="text-blue-600 text-xs">PMF</span>
                          </div>
                          <div className="text-center bg-green-100 rounded-lg px-3 py-1">
                            <span className="block text-green-800 font-bold">{person.escolaCount}</span>
                            <span className="text-green-600 text-xs">Escola</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes dos Extras:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {person.details
                            .sort((a, b) => (a.dateObj instanceof Date && b.dateObj instanceof Date) 
                              ? a.dateObj.getTime() - b.dateObj.getTime() 
                              : 0)
                            .map((detail, index) => (
                              <div 
                                key={index} 
                                className={`text-sm rounded px-2 py-1 flex items-center ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-50 text-blue-800' 
                                    : 'bg-green-50 text-green-800'
                                }`}
                              >
                                <span className="mr-1">{detail.date}</span>
                                <span className={`text-xs rounded-full px-1.5 ml-auto ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-green-200 text-green-800'
                                }`}>
                                  {detail.operation}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Visualização para CHARLIE */}
          {activeTab === 'charlie' && (
            <div>
              <div className="bg-red-100 rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-red-800 mb-2">Guarnição CHARLIE</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-red-700">{guStats.charlie.totalOperations}</div>
                    <div className="text-red-600">Total de Extras</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-red-700">{guStats.charlie.personnelCount}</div>
                    <div className="text-red-600">Militares Envolvidos</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-red-700">{guStats.charlie.avgOperationsPerPerson}</div>
                    <div className="text-red-600">Média por Militar</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-red-700">{guStats.charlie.maxOperations.count}</div>
                    <div className="text-red-600">Maior Participação</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGeneratePDF('charlie')}
                  className="mt-4 bg-red-700 hover:bg-red-800 text-white rounded-lg px-4 py-2 shadow-md transition-all duration-300 flex items-center w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">Exportar Relatório CHARLIE</span>
                </button>
              </div>
              
              {/* Lista de militares CHARLIE */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Militares da Guarnição CHARLIE
                </h3>
                <div className="space-y-4">
                  {charliePersonnel.map(person => (
                    <div key={person.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="bg-red-700 text-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-md">
                            <span className="font-bold text-xs">{person.rank}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{person.name}</p>
                            <div className="flex items-center mt-1">
                              <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-1">
                                {person.operationsCount}
                              </span>
                              <span className="text-gray-500">extras no período</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="text-center bg-blue-100 rounded-lg px-3 py-1">
                            <span className="block text-blue-800 font-bold">{person.pmfCount}</span>
                            <span className="text-blue-600 text-xs">PMF</span>
                          </div>
                          <div className="text-center bg-green-100 rounded-lg px-3 py-1">
                            <span className="block text-green-800 font-bold">{person.escolaCount}</span>
                            <span className="text-green-600 text-xs">Escola</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes dos Extras:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {person.details
                            .sort((a, b) => (a.dateObj instanceof Date && b.dateObj instanceof Date) 
                              ? a.dateObj.getTime() - b.dateObj.getTime() 
                              : 0)
                            .map((detail, index) => (
                              <div 
                                key={index} 
                                className={`text-sm rounded px-2 py-1 flex items-center ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-50 text-blue-800' 
                                    : 'bg-green-50 text-green-800'
                                }`}
                              >
                                <span className="mr-1">{detail.date}</span>
                                <span className={`text-xs rounded-full px-1.5 ml-auto ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-green-200 text-green-800'
                                }`}>
                                  {detail.operation}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Visualização para EXPEDIENTE */}
          {activeTab === 'expediente' && (
            <div>
              <div className="bg-purple-100 rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">EXPEDIENTE</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-purple-700">{guStats.expediente.totalOperations}</div>
                    <div className="text-purple-600">Total de Extras</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-purple-700">{guStats.expediente.personnelCount}</div>
                    <div className="text-purple-600">Militares Envolvidos</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-purple-700">{guStats.expediente.avgOperationsPerPerson}</div>
                    <div className="text-purple-600">Média por Militar</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-bold text-3xl text-purple-700">{guStats.expediente.maxOperations.count}</div>
                    <div className="text-purple-600">Maior Participação</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGeneratePDF('expediente')}
                  className="mt-4 bg-purple-700 hover:bg-purple-800 text-white rounded-lg px-4 py-2 shadow-md transition-all duration-300 flex items-center w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">Exportar Relatório EXPEDIENTE</span>
                </button>
              </div>
              
              {/* Lista de militares EXPEDIENTE */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Militares de EXPEDIENTE
                </h3>
                <div className="space-y-4">
                  {expedientePersonnel.map(person => (
                    <div key={person.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="bg-purple-700 text-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-md">
                            <span className="font-bold text-xs">{person.rank}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{person.name}</p>
                            <div className="flex items-center mt-1">
                              <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-1">
                                {person.operationsCount}
                              </span>
                              <span className="text-gray-500">extras no período</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="text-center bg-blue-100 rounded-lg px-3 py-1">
                            <span className="block text-blue-800 font-bold">{person.pmfCount}</span>
                            <span className="text-blue-600 text-xs">PMF</span>
                          </div>
                          <div className="text-center bg-green-100 rounded-lg px-3 py-1">
                            <span className="block text-green-800 font-bold">{person.escolaCount}</span>
                            <span className="text-green-600 text-xs">Escola</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes dos Extras:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {person.details
                            .sort((a, b) => (a.dateObj instanceof Date && b.dateObj instanceof Date) 
                              ? a.dateObj.getTime() - b.dateObj.getTime() 
                              : 0)
                            .map((detail, index) => (
                              <div 
                                key={index} 
                                className={`text-sm rounded px-2 py-1 flex items-center ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-50 text-blue-800' 
                                    : 'bg-green-50 text-green-800'
                                }`}
                              >
                                <span className="mr-1">{detail.date}</span>
                                <span className={`text-xs rounded-full px-1.5 ml-auto ${
                                  detail.operation === 'PMF' 
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-green-200 text-green-800'
                                }`}>
                                  {detail.operation}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}