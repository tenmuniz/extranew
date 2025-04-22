import { useState, useEffect } from "react";
import { Personnel, Assignment, OperationType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getActiveGuarnitionForDay } from "@/lib/utils";

interface ConflictDashboardProps {
  personnel: Personnel[];
  assignments: Assignment[];
  currentMonth?: number;
  currentYear?: number;
  onClose: () => void;
}

// Define um tipo para os militares com conflitos
type PersonnelWithConflicts = Personnel & {
  extras: number;
  pmfConflicts: number;
  escolaConflicts: number;
  conflictDetails: {date: string, operation: OperationType, guarnition: string}[];
};

export function ConflictsDashboard({ 
  personnel, 
  assignments, 
  currentMonth, 
  currentYear,
  onClose
}: ConflictDashboardProps) {
  const [conflictsData, setConflictsData] = useState<{
    totalConflicts: number;
    pmfConflicts: number;
    escolaConflicts: number;
    affectedPersonnel: number;
    personnelWithConflicts: PersonnelWithConflicts[];
  }>({
    totalConflicts: 0,
    pmfConflicts: 0,
    escolaConflicts: 0,
    affectedPersonnel: 0,
    personnelWithConflicts: [],
  });

  const [selectedPerson, setSelectedPerson] = useState<PersonnelWithConflicts | null>(null);

  // Processar os dados de conflitos
  useEffect(() => {
    if (!personnel.length) return;
    
    // Filtrar operações do mês atual
    const currentMonthFilter = (assignment: Assignment) => {
      if (currentMonth === undefined || currentYear === undefined) return true;
      
      const date = new Date(assignment.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    };

    // Array para armazenar as atribuições que representam conflitos
    const conflictsAssignments: Assignment[] = [];
    
    // Para cada atribuição, verificar se o militar está em serviço no dia
    assignments.filter(currentMonthFilter).forEach(assignment => {
      const person = personnel.find(p => p.id === assignment.personnelId);
      if (!person || !person.id) return;
      
      const assignmentDate = new Date(assignment.date);
      
      // Verificar qual guarnição está de serviço no dia da operação
      const activeGuarnition = getActiveGuarnitionForDay(assignmentDate);
      
      // Verificar se o militar pertence à guarnição que está de serviço na data
      const isInService = person.platoon && 
                         person.platoon !== "EXPEDIENTE" && 
                         activeGuarnition === person.platoon;
      
      if (isInService) {
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
    
    const totalConflicts = conflictsPersonnel.reduce((acc, p) => acc + p.extras, 0);
    const pmfConflicts = conflictsPersonnel.reduce((acc, p) => acc + p.pmfConflicts, 0);
    const escolaConflicts = conflictsPersonnel.reduce((acc, p) => acc + p.escolaConflicts, 0);
    
    setConflictsData({
      totalConflicts,
      pmfConflicts,
      escolaConflicts,
      affectedPersonnel: conflictsPersonnel.length,
      personnelWithConflicts: conflictsPersonnel,
    });
    
    // Selecionar o primeiro militar por padrão se houver conflitos
    if (conflictsPersonnel.length > 0 && !selectedPerson) {
      setSelectedPerson(conflictsPersonnel[0]);
    }
  }, [personnel, assignments, currentMonth, currentYear, selectedPerson]);

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

  if (conflictsData.personnelWithConflicts.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#1A3A5F] to-[#4A6741] flex items-center justify-center p-8 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Nenhum Conflito Detectado</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Não há conflitos de escala no período selecionado. Todos os militares estão escalados em dias que não coincidem com seu período de serviço regular.
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
    <div className="fixed inset-0 bg-gradient-to-br from-[#1A3A5F] to-[#4A6741] flex items-center justify-center z-50 overflow-auto p-6">
      <div className="bg-[#F8FAFC] rounded-xl shadow-2xl w-full max-w-7xl min-h-[80vh] overflow-hidden">
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent mb-2">
            Dashboard de Conflitos
          </h1>
          
          <p className="text-gray-600 text-lg mb-8">
            {currentMonth !== undefined && currentYear !== undefined
              ? `${getMonthName(currentMonth)} / ${currentYear}`
              : "Todos os Períodos"}
            {' '}- 20ª CIPM
          </p>
          
          {/* Cards com estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Total de Conflitos</h3>
              <div className="text-5xl font-bold mb-1">{conflictsData.totalConflicts}</div>
              <p className="text-sm opacity-70">Detectados no período</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#1A3A5F] to-[#3066BE] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Conflitos PMF</h3>
              <div className="text-5xl font-bold mb-1">{conflictsData.pmfConflicts}</div>
              <p className="text-sm opacity-70">Polícia Mais Forte</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#4A6741] to-[#6BA368] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Conflitos Escola</h3>
              <div className="text-5xl font-bold mb-1">{conflictsData.escolaConflicts}</div>
              <p className="text-sm opacity-70">Escola Segura</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#6441A5] to-[#8843E8] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-medium opacity-80 mb-2">Militares Afetados</h3>
              <div className="text-5xl font-bold mb-1">{conflictsData.affectedPersonnel}</div>
              <p className="text-sm opacity-70">Com conflitos de escala</p>
            </div>
          </div>
          
          {/* Container principal de duas colunas */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Coluna da esquerda: Lista de militares com conflitos */}
            <div className="w-full md:w-2/5 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                Militares com Conflitos
              </h2>
              
              <div className="space-y-4">
                {conflictsData.personnelWithConflicts.map(person => (
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
                      <span className="bg-red-600 text-white text-lg font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-md">
                        {person.extras}
                      </span>
                    </div>
                  </div>
                ))}
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
                    
                    <div className="text-center bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 px-5 rounded-xl shadow-lg">
                      <span className="text-lg font-medium block">Total</span>
                      <span className="text-3xl font-bold">{selectedPerson.extras}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-6">
                    <div className="bg-blue-100 rounded-lg p-4 text-center w-[48%]">
                      <span className="text-blue-800 font-bold text-3xl block">{selectedPerson.pmfConflicts}</span>
                      <span className="text-blue-600 text-sm">PMF</span>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 text-center w-[48%]">
                      <span className="text-green-800 font-bold text-3xl block">{selectedPerson.escolaConflicts}</span>
                      <span className="text-green-600 text-sm">Escola Segura</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                    Detalhes dos Conflitos
                  </h3>
                  
                  <div className="space-y-4">
                    {selectedPerson.conflictDetails.map((conflict, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className={`py-3 px-4 text-white font-medium ${
                          conflict.operation === 'PMF' 
                            ? 'bg-blue-600' 
                            : 'bg-green-600'
                        }`}>
                          {conflict.operation === 'PMF' ? 'Polícia Mais Forte' : 'Escola Segura'}
                        </div>
                        <div className="bg-white p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-lg font-semibold text-gray-800">{conflict.date}</span>
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-gray-700">
                                  Guarnição <strong>{conflict.guarnition}</strong> em serviço
                                </span>
                              </div>
                            </div>
                            <Badge 
                              className={`${
                                conflict.operation === 'PMF' 
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-100'
                              } text-sm font-medium py-1 px-3`}
                            >
                              CONFLITO
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Importante</p>
                        <p className="text-sm mt-1">Este militar pertence à guarnição <strong>{selectedPerson.platoon}</strong> e foi escalado em dias que coincide com sua escala de serviço regular (7x14).</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Selecione um militar para ver os detalhes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}