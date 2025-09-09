--
-- Script SQL para a estrutura e dados da Casona do Açaí.
-- Versão final para o projeto.
--
-- Certifique-se de que o banco de dados 'casona_acai_db' já exista.
-- USE casona_acai_db;
--

-- 1. Remoção das tabelas existentes para garantir um estado limpo
DROP TABLE IF EXISTS pedido_itens;
DROP TABLE IF EXISTS copo_pronto_itens;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS tamanhos_copo;
DROP TABLE IF EXISTS itens_cardapio;


-- 2. Estrutura das Tabelas

-- Tabela para armazenar todos os itens do cardápio e suas categorias
CREATE TABLE itens_cardapio (
    nome VARCHAR(255) PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL
);

-- Tabela para armazenar os pedidos (copos prontos ou personalizados)
CREATE TABLE pedidos (
    id VARCHAR(255) PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nomeCopo VARCHAR(255) DEFAULT NULL,
    dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de associação para os itens de cada copo pronto
CREATE TABLE copo_pronto_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    copo_nome VARCHAR(255) NOT NULL,
    item_nome VARCHAR(255) NOT NULL,
    FOREIGN KEY (copo_nome) REFERENCES itens_cardapio(nome) ON DELETE CASCADE,
    FOREIGN KEY (item_nome) REFERENCES itens_cardapio(nome) ON DELETE CASCADE
);

-- Tabela de junção para os itens de cada pedido
CREATE TABLE pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id VARCHAR(255) NOT NULL,
    item_nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- Tabela para armazenar os tamanhos dos copos e seus preços
CREATE TABLE tamanhos_copo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tamanho VARCHAR(50) NOT NULL UNIQUE,
    preco DECIMAL(10, 2) NOT NULL
);


-- 3. População dos Dados

-- Insere todos os itens do cardápio, incluindo as massas, com suas categorias
INSERT INTO itens_cardapio (nome, categoria) VALUES
('açaí tradicional', 'massa'),
('açaí com banana', 'massa'),
('açaí com morango', 'massa'),
('creme de pitaya', 'massa'),
('açaí com ninho', 'massa'),
('açaí trufado', 'massa'),
('açaí com avelã', 'massa'),
('creme de ninho', 'creme_meio'),
('creme de nutella', 'creme_meio'),
('creme de brigadeiro', 'creme_meio'),
('creme de paçoca', 'creme_meio'),
('creme de bis branco', 'creme_meio'),
('creme de ferrero', 'creme_meio'),
('creme de kinder', 'creme_meio'),
('banana', 'fruta_meio'),
('morango', 'fruta_meio'),
('uva verde', 'fruta_meio'),
('leite condensado', 'creme_topo'),
('leite em po', 'confete_topo'),
('granola', 'confete_topo'),
('amendoim torrado', 'confete_topo'),
('gotas de chocolate', 'confete_topo'),
('chocoball', 'confete_topo'),
('chocolate granulado', 'confete_topo'),
('aveia', 'confete_topo'),
('pedaços de bolacha triturada', 'confete_topo'),
('twix', 'confete_topo'),
('paçoca', 'confete_topo'),
('gravida de taubate', 'copo_pronto'),
('br raiz', 'copo_pronto'),
('br raiz 2', 'copo_pronto'),
('vira lata caramelo', 'copo_pronto');


-- Insere os ingredientes dos copos prontos
INSERT INTO copo_pronto_itens (copo_nome, item_nome) VALUES
('gravida de taubate', 'açaí com morango'),
('gravida de taubate', 'creme de bis branco'),
('gravida de taubate', 'gotas de chocolate'),
('gravida de taubate', 'pedaços de bolacha triturada'),
('br raiz', 'açaí tradicional'),
('br raiz', 'morango'),
('br raiz', 'granola'),
('br raiz 2', 'açaí tradicional'),
('br raiz 2', 'banana'),
('br raiz 2', 'leite condensado'),
('vira lata caramelo', 'açaí com banana'),
('vira lata caramelo', 'creme de paçoca'),
('vira lata caramelo', 'amendoim torrado'),
('vira lata caramelo', 'twix');


-- Popula a tabela com os tamanhos e preços corretos
INSERT INTO tamanhos_copo (tamanho, preco) VALUES
('Pequeno 330ml', 19.90),
('Médio 440ml', 24.90),
('Grande 770ml', 38.90);