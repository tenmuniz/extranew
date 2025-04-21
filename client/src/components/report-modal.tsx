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
import html2pdf from 'html2pdf.js';

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
  const [isOpen, setIsOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
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

  // Função para gerar e baixar PDF do relatório
  const generatePDF = () => {
    const content = reportRef.current;
    if (!content) return;

    const now = new Date();
    const fileName = `relatorio_operacoes_${activeTab}_${now.getFullYear()}-${now.getMonth() + 1}.pdf`;
    
    // Configurações para o PDF
    const options = {
      margin: [10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    toast({
      title: "Gerando PDF...",
      description: "O relatório está sendo preparado para download.",
    });

    // Gerar o PDF
    html2pdf().from(content).set(options).save().then(() => {
      toast({
        title: "PDF Gerado com Sucesso!",
        description: `O arquivo ${fileName} foi baixado.`,
        variant: "default",
      });
    }).catch((error: unknown) => {
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
              <span>Operações</span>
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
                          {person.extras} {person.extras === 1 ? 'operação' : 'operações'}
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
                  <span className="text-md">Nenhum militar participou desta operação</span>
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
          Relatório de Operações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-start">
          <div>
            <DialogTitle className="text-2xl font-heading bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent">
              Relatório de Operações
            </DialogTitle>
            <DialogDescription>
              Resumo das participações em operações e ranking dos militares.
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
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="geral" className="text-base py-3">Geral</TabsTrigger>
            <TabsTrigger value="pmf" className="text-base py-3">Polícia Mais Forte</TabsTrigger>
            <TabsTrigger value="escola" className="text-base py-3">Escola Segura</TabsTrigger>
          </TabsList>
          
          <div ref={reportRef} className="px-2 pt-2 pb-4 bg-white">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-center text-[#1A3A5F] mb-2">
                Relatório de Operações - {activeTab === 'geral' ? 'Geral' : activeTab === 'pmf' ? 'Polícia Mais Forte' : 'Escola Segura'}
              </h2>
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
