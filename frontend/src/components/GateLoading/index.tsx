import React from 'react';
import { Spin } from 'antd';
import styles from './GateLoadingCSS.module.css';
import "@/app/globals.css";

const GateLoading: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-white text-black flex flex-col items-center justify-start pt-20">
      <div className={styles.gateContainer}>
        <div className={styles.leftGate} />
        <div className={styles.rightGate} />
      </div>
      <Spin tip="Opening the gates..." className="mt-6" />
      <p>Loading ...</p>
    </div>
  );
};

export default GateLoading;
