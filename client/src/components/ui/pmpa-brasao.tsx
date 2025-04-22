import React from 'react';

export function PMPABrasao() {
  return (
    <div className="flex items-center justify-center h-20 w-20">
      <svg 
        viewBox="0 0 500 500" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-full"
      >
        {/* Escudo base */}
        <path 
          d="M 250,50 
             Q 250,50 400,100 
             L 400,300 
             Q 400,400 250,450 
             Q 100,400 100,300 
             L 100,100 
             Q 250,50 250,50 Z" 
          fill="white" 
          stroke="#8a2942" 
          strokeWidth="10"
        />
        
        {/* Retângulo superior vermelho e azul para PM PA */}
        <rect x="120" y="100" width="130" height="60" fill="#d52b1e" />
        <rect x="250" y="100" width="130" height="60" fill="#2c3e92" />
        
        {/* Texto PM PA */}
        <text x="155" y="145" fontFamily="Arial" fontSize="40" fontWeight="bold" fill="white">PM</text>
        <text x="285" y="145" fontFamily="Arial" fontSize="40" fontWeight="bold" fill="white">PA</text>
        
        {/* Armas cruzadas no meio */}
        <line x1="240" y1="115" x2="260" y2="145" stroke="gold" strokeWidth="6" />
        <line x1="260" y1="115" x2="240" y2="145" stroke="gold" strokeWidth="6" />
        
        {/* Escudo central */}
        <circle cx="250" cy="240" r="80" fill="white" />
        <circle cx="250" cy="240" r="70" fill="white" stroke="gold" strokeWidth="2" />
        
        {/* Elementos centrais estilizados */}
        <path 
          d="M 250,200 
             L 275,260 
             L 250,280 
             L 225,260 Z" 
          fill="#2c3e92" 
        />
        <circle cx="250" cy="240" r="25" fill="#d52b1e" />
        
        {/* Coroa estilizada */}
        <path 
          d="M 210,190 
             C 230,180 270,180 290,190" 
          fill="none" 
          stroke="#7d7d7d" 
          strokeWidth="4"
        />
        
        {/* Palmas laterais */}
        <path 
          d="M 170,240 
             C 190,220 190,270 170,260" 
          fill="none" 
          stroke="#4a8c43" 
          strokeWidth="3"
        />
        
        <path 
          d="M 330,240 
             C 310,220 310,270 330,260" 
          fill="none" 
          stroke="#4a8c43" 
          strokeWidth="3"
        />
        
        {/* Ano de fundação */}
        <text x="240" y="370" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="#2c3e92">2014</text>
      </svg>
    </div>
  );
}