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

export function NewReportModal({
  personnel,
  assignments,
  currentMonth,
  currentYear,
  onClose
}: ReportModalProps) {
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
  const [personnelWithExtras, setPersonnelWithExtras] = useState<PersonnelWithExtras[]>([]);

  // Processar dados para o relatório
  useEffect(() => {
    if (!personnel.length) return;
    
    // Filtrar operações do mês atual se especificado
    const currentMonthFilter = (assignment: Assignment) => {
      if (currentMonth === undefined || currentYear === undefined) return true;
      
      const date = new Date(assignment.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
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
        const dateObj = new Date(assignment.date);
        
        // Formatar a data para o padrão brasileiro (DD/MM/YYYY)
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
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
    
    // Seleciona o primeiro militar por padrão, se existir
    if (personnelWithOperations.length > 0 && !selectedPerson) {
      setSelectedPerson(personnelWithOperations[0]);
    }
  }, [personnel, assignments, currentMonth, currentYear, selectedPerson]);
  
  // Gerar PDF do relatório
  const handleGeneratePDF = () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;
    
    const opt = {
      margin: 10,
      filename: `relatorio-operacoes-${currentMonth !== undefined && currentYear !== undefined ? 
        `${currentMonth + 1}-${currentYear}` : 'completo'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(reportElement).save();
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
      <div id="report-content" className="bg-[#F8FAFC] rounded-xl shadow-2xl w-[90%] max-w-5xl max-h-[90vh] overflow-auto">
        <div className="relative p-6">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent mb-2">
                Relatório de Operações
              </h1>
              
              <p className="text-gray-600 text-lg">
                {currentMonth !== undefined && currentYear !== undefined
                  ? `${getMonthName(currentMonth)} / ${currentYear}`
                  : "Todos os Períodos"}
                {' '}- 20ª CIPM
              </p>
            </div>
            
            <Button 
              onClick={handleGeneratePDF}
              className="bg-[#1A3A5F] hover:bg-[#12283F] px-4 py-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar PDF
            </Button>
          </div>
          
          {/* Cards com estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-[#1A3A5F] to-[#3066BE] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Total de Operações</h3>
              <div className="text-5xl font-bold mb-1">{stats.totalOperations}</div>
              <p className="text-sm opacity-70">No período</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#4A6741] to-[#6BA368] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Militares Envolvidos</h3>
              <div className="text-5xl font-bold mb-1">{stats.personnelInvolved}</div>
              <p className="text-sm opacity-70">Em operações</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#6441A5] to-[#8843E8] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Média por Militar</h3>
              <div className="text-5xl font-bold mb-1">{stats.avgOperationsPerPerson}</div>
              <p className="text-sm opacity-70">Operações/Policial</p>
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
                Militares com Operações
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
                <>
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
                    Detalhes das Operações
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
                </>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Estatísticas por Operação</h2>
            
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
                    <span className="text-blue-600 text-sm">Operações</span>
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
                    <span className="text-green-600 text-sm">Operações</span>
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
      </div>
    </div>
  );
}