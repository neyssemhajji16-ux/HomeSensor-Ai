import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { IoTProvider } from './lib/IoTContext';

export default function App() {
  return (
    <IoTProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </IoTProvider>
  );
}
