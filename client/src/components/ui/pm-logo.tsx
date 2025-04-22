import React from 'react';

// Componente React que renderiza o brasão da PM como um SVG inline
export function PMBrasao() {
  return (
    <div className="flex items-center justify-center h-16 w-16">
      <svg 
        viewBox="0 0 150 175" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-full drop-shadow-md"
      >
        {/* Borda do escudo */}
        <path d="M75,5 L10,30 L10,100 C10,140 75,170 75,170 C75,170 140,140 140,100 L140,30 Z" 
              fill="white" stroke="#8a2942" strokeWidth="3" />
        
        {/* Topo vermelho e azul */}
        <rect x="20" y="20" width="50" height="25" fill="#d52b1e" />
        <rect x="80" y="20" width="50" height="25" fill="#2c3e92" />
        
        {/* Letras PM PA */}
        <text x="30" y="40" fontSize="20" fontWeight="bold" fill="white">PM</text>
        <text x="95" y="40" fontSize="20" fontWeight="bold" fill="white">PA</text>
        
        {/* Armas cruzadas */}
        <path d="M70,30 L80,20 M70,20 L80,30" 
              stroke="#ffd700" strokeWidth="3" strokeLinecap="round" />
        <path d="M71,25 L79,25 M75,21 L75,29" 
              stroke="#ffd700" strokeWidth="1.5" />
        
        {/* Flor de lis central */}
        <path d="M75,75 L85,95 L75,105 L65,95 Z" fill="#2c3e92" />
        <circle cx="75" cy="85" r="10" fill="#d52b1e" />
        
        {/* Elementos decorativos */}
        <circle cx="75" cy="85" r="30" stroke="#ffd700" strokeWidth="2" fill="none" />
        
        {/* Coroa */}
        <path d="M55,60 L95,60 
                M60,55 L65,65 M70,55 L75,65 M80,55 L85,65 M90,55 L95,65" 
              stroke="#7d7d7d" strokeWidth="2" fill="none" />
        
        {/* Palmeiras */}
        <path d="M35,95 C45,80 50,95 50,75" stroke="#4a8c43" strokeWidth="1.5" fill="none" />
        <path d="M115,95 C105,80 100,95 100,75" stroke="#4a8c43" strokeWidth="1.5" fill="none" />
        
        {/* Faixa com data */}
        <path d="M40,130 C60,120 90,120 110,130" stroke="#ffd700" strokeWidth="2" fill="none" />
        <text x="71" y="145" fontSize="10" fontWeight="bold" fill="#2c3e92">2014</text>
      </svg>
    </div>
  );
}