import React from 'react';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import '../styles/MainLayout.css';

function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="layout-content">
        <main className="page-content">
          {children}
        </main>
        <aside className="chat-sidebar">
          <Chat />
        </aside>
      </div>
    </div>
  );
}

export default MainLayout;
