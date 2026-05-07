import React from 'react';
import MainLayout from '../layouts/MainLayout';
import TransaccionesHistory from '../components/Transacciones/TransaccionesHistory';

function Transacciones() {
  return (
    <MainLayout>
      <TransaccionesHistory />
    </MainLayout>
  );
}

export default Transacciones;
