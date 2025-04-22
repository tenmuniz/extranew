import React from 'react';

// Componente React que renderiza o brasão da PMPA como um SVG inline
// Baseado na imagem fornecida do brasão oficial da PMPA
export function PMBrasao() {
  return (
    <div className="flex items-center justify-center h-16 w-16 relative">
      {/* Container circular para o brasão */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-blue-50 to-white shadow-lg border-2 border-blue-100"></div>
      
      <svg 
        viewBox="0 0 300 340" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-full drop-shadow-sm relative z-10 p-1"
      >
        {/* Escudo principal - forma externa */}
        <path 
          d="M150,10 L30,60 L30,200 Q30,280 150,330 Q270,280 270,200 L270,60 Z" 
          fill="white" 
          stroke="#8c194c" 
          strokeWidth="6" 
        />
          
        {/* Área vermelha com PM */}
        <path 
          d="M50,40 H150 V80 H50 Z" 
          fill="#d81e27" 
          stroke="#8c194c" 
          strokeWidth="2" 
        />
        <text x="70" y="67" fontFamily="Arial" fontSize="28" fontWeight="bold" fill="white">PM</text>
          
        {/* Área azul com PA */}
        <path 
          d="M150,40 H250 V80 H150 Z" 
          fill="#223991" 
          stroke="#8c194c" 
          strokeWidth="2" 
        />
        <text x="180" y="67" fontFamily="Arial" fontSize="28" fontWeight="bold" fill="white">PA</text>
          
        {/* Armas cruzadas douradas */}
        <path 
          d="M137,60 L163,60 M150,48 L150,72" 
          stroke="#ffd700" 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        <path 
          d="M138,50 L162,70 M138,70 L162,50" 
          stroke="#ffd700" 
          strokeWidth="5" 
          strokeLinecap="round" 
        />
          
        {/* Coroa no topo */}
        <path 
          d="M110,95 H190 M120,90 L125,100 M135,90 L140,100 M150,90 L155,100 M165,90 L170,100 M180,90 L185,100" 
          stroke="#7d7d7d" 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none" 
        />
          
        {/* Círculo dourado com roda */}
        <circle cx="150" cy="170" r="60" stroke="#ffd700" strokeWidth="5" fill="none" />
        <circle cx="150" cy="170" r="50" stroke="#ffd700" strokeWidth="2" fill="none" />
        
        {/* Raios da roda */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line 
            key={i}
            x1="150" 
            y1="170" 
            x2={150 + 50 * Math.cos(i * Math.PI / 6)} 
            y2={170 + 50 * Math.sin(i * Math.PI / 6)} 
            stroke="#ffd700" 
            strokeWidth="2" 
          />
        ))}
          
        {/* Flor de lis */}
        <path 
          d="M150,150 L162,172 L150,195 L138,172 Z" 
          fill="#223991" 
          strokeWidth="1" 
          stroke="#223991" 
        />
        <circle cx="150" cy="170" r="12" fill="#d81e27" />
          
        {/* Palmeiras laterais */}
        <path 
          d="M75,170 C85,160 95,175 100,145 M75,170 C90,155 85,180 105,155"
          stroke="#4a8c43" 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none" 
        />
        <path 
          d="M225,170 C215,160 205,175 200,145 M225,170 C210,155 215,180 195,155"
          stroke="#4a8c43" 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none" 
        />
          
        {/* Animais (representação simplificada) */}
        <path 
          d="M110,170 C100,180 90,185 80,200 C90,190 110,190 110,210"
          stroke="#555" 
          strokeWidth="4" 
          fill="none" 
        />
        <path 
          d="M190,170 C200,180 210,185 220,200 C210,190 190,190 190,210"
          stroke="#555" 
          strokeWidth="4" 
          fill="none" 
        />
          
        {/* Faixa dourada inferior com lema */}
        <path 
          d="M90,240 C120,230 180,230 210,240" 
          stroke="#ffd700" 
          strokeWidth="4" 
          fill="none" 
        />
          
        {/* Data de fundação */}
        <text x="142" y="290" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#223991">2014</text>
      </svg>
    </div>
  );
}

// Versão maior do brasão para uso em cabeçalhos/destaques
export function PMBrasaoLarge() {
  return (
    <div className="relative">
      {/* Círculo decorativo ao redor do brasão */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-blue-100 to-white shadow-lg border-2 border-blue-200"></div>
      
      <div className="relative z-10 p-1">
        <PMBrasao />
      </div>
    </div>
  );
}