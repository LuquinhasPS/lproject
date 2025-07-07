import { Outlet } from 'react-router-dom';
import Navbar from './components/NavBar';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <Navbar />
      <main>
        {/* O conteúdo da rota atual (HomePage ou ClientsPage) será renderizado aqui */}
        <Outlet /> 
      </main>
    </div>
  )
}

export default App