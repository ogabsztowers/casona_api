import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/config.js';

const router = Router();

// Função para buscar e organizar os itens do cardápio do BD
async function getItensCardapio() {
    const [rows] = await pool.query('SELECT nome, categoria FROM itens_cardapio');
    const itens = {
        massas: [],
        cremeDoMeio: [],
        frutasDoMeio: [],
        cremeDoTopo: [],
        confetesDoTopo: [],
        coposProntos: []
    };

    rows.forEach(row => {
        if (row.categoria === 'massa') itens.massas.push(row.nome);
        else if (row.categoria === 'creme_meio') itens.cremeDoMeio.push(row.nome);
        else if (row.categoria === 'fruta_meio') itens.frutasDoMeio.push(row.nome);
        else if (row.categoria === 'creme_topo') itens.cremeDoTopo.push(row.nome);
        else if (row.categoria === 'confete_topo') itens.confetesDoTopo.push(row.nome);
        else if (row.categoria === 'copo_pronto') itens.coposProntos.push(row.nome);
    });
    return itens;
}

// Rota GET para obter todos os itens do cardápio.
router.get('/cardapio', async (req, res) => {
  try {
    const cardapio = await getItensCardapio();
    res.status(200).json(cardapio);
  } catch (err) {
    console.error('Erro ao buscar cardápio:', err);
    res.status(500).json({ error: 'Erro ao buscar os itens do cardápio.' });
  }
});

// Rota GET para buscar os tamanhos dos copos
router.get('/tamanhos-copo', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT tamanho, preco FROM tamanhos_copo ORDER BY id');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao buscar tamanhos de copo:', err);
        res.status(500).json({ error: 'Erro ao buscar os tamanhos dos copos.' });
    }
});

/**
 * Rota POST para organizar um pedido.
 */
router.post('/organizar', async (req, res) => {
    const { itens } = req.body;
    
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'O pedido deve ser um array de itens.' });
    }

    const itemPrincipal = itens[0].toLowerCase().trim();
    const isCopoPronto = ['gravida de taubate', 'br raiz', 'br raiz 2', 'vira lata caramelo', 'maromba'].includes(itemPrincipal);

    const cardapio = await getItensCardapio();
    let pedidoId = uuidv4();
    let tipo = isCopoPronto ? 'copo_pronto' : 'personalizado';
    let nomeCopo = isCopoPronto ? itemPrincipal : null;
    let itensParaSalvar = [];

    if (isCopoPronto) {
        const [rows] = await pool.query('SELECT item_nome FROM copo_pronto_itens WHERE copo_nome = ?', [nomeCopo]);
        
        for (const row of rows) {
            const itemNome = row.item_nome;
            const categoria = cardapio.massas.includes(itemNome) ? 'massa' :
                              cardapio.cremeDoMeio.includes(itemNome) ? 'creme_meio' :
                              cardapio.frutasDoMeio.includes(itemNome) ? 'fruta_meio' :
                              cardapio.cremeDoTopo.includes(itemNome) ? 'creme_topo' :
                              cardapio.confetesDoTopo.includes(itemNome) ? 'confete_topo' : 'nao_classificado';
            itensParaSalvar.push({ item_nome: itemNome, categoria });
        }
    } else {
        itens.forEach(item => {
            const itemNormalizado = item.toLowerCase().trim();
            let categoria = 'nao_classificado';
            let nomeItem = itemNormalizado;
            
            if (cardapio.massas.includes(itemNormalizado)) {
                categoria = 'massa';
            } else if (cardapio.cremeDoMeio.includes(itemNormalizado)) {
                categoria = 'creme_meio';
            } else if (cardapio.frutasDoMeio.includes(itemNormalizado)) {
                categoria = 'fruta_meio';
            } else if (cardapio.cremeDoTopo.includes(itemNormalizado)) {
                categoria = 'creme_topo';
            } else if (cardapio.confetesDoTopo.includes(itemNormalizado)) {
                categoria = 'confete_topo';
            }
            itensParaSalvar.push({ item_nome: nomeItem, categoria });
        });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
        // CORREÇÃO: Removido peso e tamanhoCopo para corresponder à sua tabela `pedidos`
        await conn.query('INSERT INTO pedidos (id, tipo, nomeCopo) VALUES (?, ?, ?)', [pedidoId, tipo, nomeCopo]);
        
        for (const item of itensParaSalvar) {
            await conn.query('INSERT INTO pedido_itens (pedido_id, item_nome, categoria) VALUES (?, ?, ?)', [pedidoId, item.item_nome, item.categoria]);
        }
        
        await conn.commit();
        conn.release();

        const [pedidoCompleto] = await pool.query(`
            SELECT p.id, p.tipo, p.nomeCopo, pi.item_nome, pi.categoria
            FROM pedidos p
            JOIN pedido_itens pi ON p.id = pi.pedido_id
            WHERE p.id = ?`, [pedidoId]);

        const organizado = {
            id: pedidoId,
            tipo: pedidoCompleto[0].tipo,
            nomeCopo: pedidoCompleto[0].nomeCopo,
            massas: pedidoCompleto.filter(item => item.categoria === 'massa').map(item => item.item_nome),
            cremeDoMeio: pedidoCompleto.filter(item => item.categoria === 'creme_meio').map(item => item.item_nome),
            frutasDoMeio: pedidoCompleto.filter(item => item.categoria === 'fruta_meio').map(item => item.item_nome),
            cremeDoTopo: pedidoCompleto.filter(item => item.categoria === 'creme_topo').map(item => item.item_nome),
            confetesDoTopo: pedidoCompleto.filter(item => item.categoria === 'confete_topo').map(item => item.item_nome),
            itensNaoClassificados: pedidoCompleto.filter(item => item.categoria === 'nao_classificado').map(item => item.item_nome)
        };

        return res.status(200).json(organizado);
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error('Erro na transação do pedido:', err);
        return res.status(500).json({ error: 'Erro ao salvar o pedido.' });
    }
});

/**
 * Rota GET para listar todos os pedidos salvos no banco de dados.
 */
router.get('/pedidos', async (req, res) => {
    try {
        const [pedidos] = await pool.query(`
            SELECT p.id, p.tipo, p.nomeCopo, pi.item_nome, pi.categoria
            FROM pedidos p
            JOIN pedido_itens pi ON p.id = pi.pedido_id
            ORDER BY p.dataCriacao DESC`);

        const pedidosOrganizados = {};
        pedidos.forEach(item => {
            if (!pedidosOrganizados[item.id]) {
                pedidosOrganizados[item.id] = {
                    id: item.id,
                    tipo: item.tipo,
                    nomeCopo: item.nomeCopo,
                    massas: [],
                    cremeDoMeio: [],
                    frutasDoMeio: [],
                    cremeDoTopo: [],
                    confetesDoTopo: [],
                    itensNaoClassificados: []
                };
            }
            if (item.categoria === 'massa') pedidosOrganizados[item.id].massas.push(item.item_nome);
            if (item.categoria === 'creme_meio') pedidosOrganizados[item.id].cremeDoMeio.push(item.item_nome);
            if (item.categoria === 'fruta_meio') pedidosOrganizados[item.id].frutasDoMeio.push(item.item_nome);
            if (item.categoria === 'creme_topo') pedidosOrganizados[item.id].cremeDoTopo.push(item.item_nome);
            if (item.categoria === 'confete_topo') pedidosOrganizados[item.id].confetesDoTopo.push(item.item_nome);
            if (item.categoria === 'nao_classificado') pedidosOrganizados[item.id].itensNaoClassificados.push(item.item_nome);
        });

        res.status(200).json(Object.values(pedidosOrganizados));
    } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
        res.status(500).json({ error: 'Erro ao buscar pedidos no banco de dados.' });
    }
});

export default router;