import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CarManagement from './pages/CarManagement';
import IndustryView from './pages/IndustryView';
import RouteManagement from './pages/RouteManagement';
import DataImport from './pages/DataImport';
import SessionManagement from './pages/SessionManagement';
import TrainOperations from './pages/TrainOperations';
import CarOrderManagement from './pages/CarOrderManagement';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions" element={<SessionManagement />} />
              <Route path="/trains" element={<TrainOperations />} />
              <Route path="/orders" element={<CarOrderManagement />} />
              <Route path="/cars" element={<CarManagement />} />
              <Route path="/industries" element={<IndustryView />} />
              <Route path="/routes" element={<RouteManagement />} />
              <Route path="/import" element={<DataImport />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
