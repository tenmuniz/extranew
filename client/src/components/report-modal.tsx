import { useState, useEffect } from "react";
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

interface ReportModalProps {
  personnel: Personnel[];
  assignments: Assignment[];
}

type ReportTab = "geral" | "pmf" | "escola";

interface StatsData {
  totalExtras: number;
  mediaExtras: number;
  maxExtras: Personnel | null;
  minExtras: Personnel | null;
  personnelWithExtras: Personnel[];
  personnelWithoutExtras: Personnel[];
}

export function ReportModal({ personnel, assignments }: ReportModalProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("geral");
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
  });

  // Processar os dados de operações para gerar estatísticas
  useEffect(() => {
    if (!personnel.length || !assignments.length) return;

    // Contagem de operações por militar para cada tipo
    const pmfOperations = assignments.filter(a => a.operationType === "PMF");
    const escolaOperations = assignments.filter(a => a.operationType === "ESCOLA");

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

    // Dados para PMF
    const pmfPersonnelWithExtras = personnel
      .filter(p => pmfCountMap[p.id!] > 0)
      .sort((a, b) => (pmfCountMap[b.id!] || 0) - (pmfCountMap[a.id!] || 0));

    const pmfPersonnelWithoutExtras = personnel
      .filter(p => !pmfCountMap[p.id!] || pmfCountMap[p.id!] === 0);

    const pmfTotalExtras = pmfOperations.length;
    const pmfMediaExtras = pmfTotalExtras / (pmfPersonnelWithExtras.length || 1);
    const pmfMaxExtras = pmfPersonnelWithExtras.length > 0 ? pmfPersonnelWithExtras[0] : null;
    const pmfMinExtras = pmfPersonnelWithExtras.length > 0 ? pmfPersonnelWithExtras[pmfPersonnelWithExtras.length - 1] : null;

    // Dados para ESCOLA
    const escolaPersonnelWithExtras = personnel
      .filter(p => escolaCountMap[p.id!] > 0)
      .sort((a, b) => (escolaCountMap[b.id!] || 0) - (escolaCountMap[a.id!] || 0));

    const escolaPersonnelWithoutExtras = personnel
      .filter(p => !escolaCountMap[p.id!] || escolaCountMap[p.id!] === 0);

    const escolaTotalExtras = escolaOperations.length;
    const escolaMediaExtras = escolaTotalExtras / (escolaPersonnelWithExtras.length || 1);
    const escolaMaxExtras = escolaPersonnelWithExtras.length > 0 ? escolaPersonnelWithExtras[0] : null;
    const escolaMinExtras = escolaPersonnelWithExtras.length > 0 ? escolaPersonnelWithExtras[escolaPersonnelWithExtras.length - 1] : null;

    // Dados gerais - combinados
    const allPersonnelWithExtras = personnel
      .filter(p => p.extras > 0)
      .sort((a, b) => (b.extras || 0) - (a.extras || 0));

    const allPersonnelWithoutExtras = personnel
      .filter(p => !p.extras || p.extras === 0);

    const totalExtras = personnel.reduce((sum, p) => sum + (p.extras || 0), 0);
    const mediaExtras = totalExtras / (allPersonnelWithExtras.length || 1);
    const maxExtras = allPersonnelWithExtras.length > 0 ? allPersonnelWithExtras[0] : null;
    const minExtras = allPersonnelWithExtras.length > 0 ? allPersonnelWithExtras[allPersonnelWithExtras.length - 1] : null;

    setStats({
      pmf: {
        totalExtras: pmfTotalExtras,
        mediaExtras: pmfMediaExtras,
        maxExtras: pmfMaxExtras,
        minExtras: pmfMinExtras,
        personnelWithExtras: pmfPersonnelWithExtras.map(p => ({
          ...p,
          extras: pmfCountMap[p.id!] || 0
        })),
        personnelWithoutExtras: pmfPersonnelWithoutExtras,
      },
      escola: {
        totalExtras: escolaTotalExtras,
        mediaExtras: escolaMediaExtras,
        maxExtras: escolaMaxExtras,
        minExtras: escolaMinExtras,
        personnelWithExtras: escolaPersonnelWithExtras.map(p => ({
          ...p,
          extras: escolaCountMap[p.id!] || 0
        })),
        personnelWithoutExtras: escolaPersonnelWithoutExtras,
      },
      geral: {
        totalExtras,
        mediaExtras,
        maxExtras,
        minExtras,
        personnelWithExtras: allPersonnelWithExtras,
        personnelWithoutExtras: allPersonnelWithoutExtras,
      },
    });
  }, [personnel, assignments]);

  // Função para renderizar o ranking de militares para o relatório atual
  const renderPersonnelRanking = () => {
    const currentStats = stats[activeTab];
    
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-sm">Ranking de Participação:</h4>
          <ScrollArea className="h-[200px] mt-2 rounded border p-2">
            {currentStats.personnelWithExtras.length > 0 ? (
              <div className="space-y-2">
                {currentStats.personnelWithExtras.map((person, index) => (
                  <div key={person.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-800 h-6 w-6 rounded-full mr-2">
                        <span className="text-xs font-semibold">{index + 1}</span>
                      </div>
                      <span className="font-medium text-sm">{person.rank} {person.name}</span>
                    </div>
                    <span className="text-blue-600 font-semibold rounded-full bg-blue-50 px-2 py-0.5 text-xs">
                      {person.extras} extras
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Nenhum militar participou desta operação
              </div>
            )}
          </ScrollArea>
        </div>

        <div>
          <h4 className="font-medium text-sm">Militares sem participação:</h4>
          <ScrollArea className="h-[100px] mt-2 rounded border p-2">
            {currentStats.personnelWithoutExtras.length > 0 ? (
              <div className="space-y-1">
                {currentStats.personnelWithoutExtras.map((person) => (
                  <div key={person.id} className="text-sm text-gray-600 py-0.5">
                    {person.rank} {person.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Todos os militares participaram
              </div>
            )}
          </ScrollArea>
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
          Relatório de Operações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent">
            Relatório de Operações
          </DialogTitle>
          <DialogDescription>
            Resumo das participações em operações e ranking dos militares.
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as ReportTab)} 
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="pmf">Polícia Mais Forte</TabsTrigger>
            <TabsTrigger value="escola">Escola Segura</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <TabsContent value="geral" className="mt-0 pb-6">
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="text-2xl font-bold text-[#1A3A5F]">{stats.geral.totalExtras}</h3>
                    <p className="text-xs text-gray-500">Total de Operações</p>
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
                    <p className="text-xs text-gray-500 mb-1">Mais Operações</p>
                    {stats.geral.maxExtras ? (
                      <div className="flex items-center">
                        <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">{stats.geral.maxExtras.rank}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stats.geral.maxExtras.name}</p>
                          <p className="text-xs text-blue-600">{stats.geral.maxExtras.extras} operações</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">-</p>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Menos Operações</p>
                    {stats.geral.minExtras ? (
                      <div className="flex items-center">
                        <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">{stats.geral.minExtras.rank}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stats.geral.minExtras.name}</p>
                          <p className="text-xs text-blue-600">{stats.geral.minExtras.extras} operações</p>
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
                    <p className="text-xs text-gray-500">Total de Operações</p>
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
                    <p className="text-xs text-gray-500 mb-1">Mais Operações PMF</p>
                    {stats.pmf.maxExtras ? (
                      <div className="flex items-center">
                        <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">{stats.pmf.maxExtras.rank}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stats.pmf.maxExtras.name}</p>
                          <p className="text-xs text-blue-600">
                            {stats.pmf.personnelWithExtras.find(p => p.id === stats.pmf.maxExtras?.id)?.extras || 0} operações
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">-</p>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Menos Operações PMF</p>
                    {stats.pmf.minExtras ? (
                      <div className="flex items-center">
                        <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">{stats.pmf.minExtras.rank}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stats.pmf.minExtras.name}</p>
                          <p className="text-xs text-blue-600">
                            {stats.pmf.personnelWithExtras.find(p => p.id === stats.pmf.minExtras?.id)?.extras || 0} operações
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
                    <p className="text-xs text-gray-500">Total de Operações</p>
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
                    <p className="text-xs text-gray-500 mb-1">Mais Operações Escola</p>
                    {stats.escola.maxExtras ? (
                      <div className="flex items-center">
                        <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">{stats.escola.maxExtras.rank}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stats.escola.maxExtras.name}</p>
                          <p className="text-xs text-blue-600">
                            {stats.escola.personnelWithExtras.find(p => p.id === stats.escola.maxExtras?.id)?.extras || 0} operações
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">-</p>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Menos Operações Escola</p>
                    {stats.escola.minExtras ? (
                      <div className="flex items-center">
                        <div className="bg-[#1A3A5F] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">{stats.escola.minExtras.rank}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stats.escola.minExtras.name}</p>
                          <p className="text-xs text-blue-600">
                            {stats.escola.personnelWithExtras.find(p => p.id === stats.escola.minExtras?.id)?.extras || 0} operações
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
          </ScrollArea>
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