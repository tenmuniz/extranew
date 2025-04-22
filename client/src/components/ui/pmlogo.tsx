import React from 'react';

// Componente que renderiza o logo da PM diretamente usando SVG para garantir compatibilidade
export const PMLogoSVG = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fundo do brasão - formato de escudo */}
    <path d="M100 0C150 0 195 50 200 100C200 180 150 220 100 220C50 220 0 180 0 100C5 50 50 0 100 0Z" fill="white" />
    
    {/* Borda roxa do brasão */}
    <path d="M100 5C147 5 190 52 195 100C195 175 147 215 100 215C53 215 5 175 5 100C10 52 53 5 100 5Z" stroke="#801959" strokeWidth="4" fill="none" />
    
    {/* Barra superior com divisão de cores */}
    <rect x="28" y="18" width="144" height="40" fill="#F0F0F0" />
    <rect x="28" y="18" width="72" height="40" fill="#CC0000" />
    <rect x="100" y="18" width="72" height="40" fill="#0000AA" />
    
    {/* Textos "PM" e "PA" */}
    <text x="52" y="47" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white">PM</text>
    <text x="124" y="47" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white">PA</text>
    
    {/* Armas cruzadas douradas (simplificadas) */}
    <path d="M100 30 L88 22 L88 38 Z" fill="#FFD700" />
    <path d="M100 30 L112 22 L112 38 Z" fill="#FFD700" />

    {/* Elementos internos do brasão (simplificados) */}
    <circle cx="100" cy="90" r="5" fill="#F0F0F0" />
    <circle cx="100" cy="120" r="30" fill="#F0F0F0" strokeWidth="1" stroke="#FFD700" />
    <path d="M80 120 L100 95 L120 120" stroke="#CC0000" strokeWidth="4" fill="none" />
    
    {/* Ano na parte inferior */}
    <text x="100" y="190" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#0000AA" textAnchor="middle">2014</text>
  </svg>
);
