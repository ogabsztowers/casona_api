import express from 'express';
import pedidosRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.use('/api', pedidosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse a interface em: http://localhost:${PORT}`);
});