// components/GateLoadingCSS.tsx
import React from 'react';
import { Spin } from 'antd';
import "@/app/global.css"

const GateLoadingCSS: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="relative w-40 h-40">
        <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
          <div className="animate-gate-left bg-blue-600 w-full h-full origin-right"></div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden">
          <div className="animate-gate-right bg-blue-600 w-full h-full origin-left"></div>
        </div>
      </div>
      <Spin tip="Opening the gates..." className="mt-6" />
      <p>Loading ...</p>
    </div>
  );
};

export default GateLoadingCSS;