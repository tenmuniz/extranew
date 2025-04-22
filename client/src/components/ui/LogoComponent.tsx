import React from 'react';

const PMBrasao = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center rounded-full bg-gradient-to-br from-blue-50 via-white to-gray-100">
      {/* Escudo */}
      <div className="w-11 h-12 relative flex items-center justify-center">
        {/* Borda externa */}
        <div className="absolute inset-0 bg-yellow-600 rounded-b-full rounded-t-lg 
                       shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]"></div>
        
        {/* Fundo do escudo */}
        <div className="absolute inset-[2px] bg-[#1A3A5F] rounded-b-full rounded-t-lg
                       shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]"></div>
                       
        {/* Ornamento superior */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-7 h-1.5">
          <div className="w-full h-full bg-yellow-600 rounded-t-md"></div>
        </div>
        
        {/* Bandeira com cores PA */}
        <div className="absolute top-[4px] inset-x-[3px] h-4 flex overflow-hidden rounded-sm
                        shadow-[inset_0_0_2px_rgba(0,0,0,0.3)]">
          <div className="w-1/2 bg-red-700 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">PM</span>
          </div>
          <div className="w-1/2 bg-blue-700 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">PA</span>
          </div>
        </div>
        
        {/* Divisória */}
        <div className="absolute top-[26px] inset-x-[4px] h-[1px] bg-yellow-500"></div>
        
        {/* Texto CIPM */}
        <div className="absolute top-[30px] inset-x-0 flex justify-center">
          <div className="text-[7px] font-bold text-white tracking-wide py-[1px] px-2
                          bg-yellow-600 rounded-sm">20ª CIPM</div>
        </div>
        
        {/* Elementos decorativos laterais */}
        <div className="absolute top-2 right-[3px] w-[1px] h-6 bg-yellow-600"></div>
        <div className="absolute top-2 left-[3px] w-[1px] h-6 bg-yellow-600"></div>
      </div>
    </div>
  );
};

export default PMBrasao;
