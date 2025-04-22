import React from 'react';

const PMBrasao = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center rounded-full bg-gradient-to-b from-blue-50 to-white">
      {/* Escudo */}
      <div className="w-10 h-12 relative flex items-center justify-center">
        {/* Fundo do escudo */}
        <div className="absolute inset-0 bg-[#1A3A5F] rounded-b-full rounded-t-lg"></div>
        
        {/* Bordas do escudo */}
        <div className="absolute inset-0 border-2 border-yellow-500 rounded-b-full rounded-t-lg"></div>
        
        {/* Divisão verde e vermelha */}
        <div className="absolute top-2 left-1 right-1 h-3 flex">
          <div className="w-1/2 bg-green-700"></div>
          <div className="w-1/2 bg-red-700"></div>
        </div>
        
        {/* Texto PM PA */}
        <div className="absolute top-5 inset-x-0 text-center">
          <div className="text-[8px] font-bold text-white tracking-wide">PM-PA</div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-8 inset-x-0 flex justify-center">
          <div className="w-5 h-3 border border-yellow-400 rounded-sm flex items-center justify-center">
            <div className="text-[6px] text-white font-semibold">20</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMBrasao;
