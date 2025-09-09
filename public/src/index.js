document.addEventListener('DOMContentLoaded', async () => {
  const coposProntosSelect = document.getElementById('coposProntosSelect');
  const pesoInput = document.getElementById('pesoInput');
  const quantidadeSelect = document.getElementById('quantidadeSelect');
  const massaSelectsContainer = document.getElementById('massaSelectsContainer');
  const cremesMeioSelect = document.getElementById('cremesMeioSelect');
  const frutasSelect = document.getElementById('frutasSelect');
  const cremesTopoSelect = document.getElementById('cremesTopoSelect');
  const confetesSelect = document.getElementById('confetesSelect');
  const organizarBtn = document.getElementById('organizarBtn');
  const resultadoDiv = document.getElementById('resultado');
  const personalizadoContainer = document.getElementById('personalizadoContainer');
  const tamanhoCopoSelect = document.getElementById('tamanhoCopoSelect');

  let massasDisponiveis = [];

  async function fetchCardapio() {
    try {
      const response = await fetch('/api/cardapio');
      if (!response.ok) {
        throw new Error('Erro ao carregar o cardápio.');
      }
      const data = await response.json();
      massasDisponiveis = data.massas;
      
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return null;
    }
  }

  async function fetchTamanhosCopo() {
    try {
      const response = await fetch('/api/tamanhos-copo');
      if (!response.ok) {
        throw new Error('Erro ao carregar os tamanhos de copo.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return null;
    }
  }

  function createMassaSelects() {
    const quantidade = parseInt(quantidadeSelect.value, 10);
    massaSelectsContainer.innerHTML = ''; 

    for (let i = 0; i < quantidade; i++) {
      const div = document.createElement('div');
      div.className = 'form-group';
      const label = document.createElement('label');
      label.textContent = `Sabor da Massa ${i + 1}:`;
      const select = document.createElement('select');
      select.className = 'massa-select';
      
      massasDisponiveis.forEach(massa => {
        const option = document.createElement('option');
        option.value = massa;
        option.textContent = massa;
        select.appendChild(option);
      });
      
      div.appendChild(label);
      div.appendChild(select);
      massaSelectsContainer.appendChild(div);
    }
  }

  async function preencherMenus() {
    const cardapio = await fetchCardapio();
    if (!cardapio) return;

    coposProntosSelect.innerHTML = '<option value="">Selecione um copo pronto</option>';
    cardapio.coposProntos.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      coposProntosSelect.appendChild(option);
    });
    
    const tamanhos = await fetchTamanhosCopo();
    if (tamanhos) {
      tamanhoCopoSelect.innerHTML = '<option value="">Selecione o tamanho</option>';
      tamanhos.forEach(tamanho => {
        const option = document.createElement('option');
        option.value = tamanho.tamanho;
        option.textContent = `${tamanho.tamanho} - R$ ${parseFloat(tamanho.preco).toFixed(2)}`;
        tamanhoCopoSelect.appendChild(option);
      });
    }

    cremesMeioSelect.innerHTML = '';
    cardapio.cremeDoMeio.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      cremesMeioSelect.appendChild(option);
    });

    frutasSelect.innerHTML = '';
    cardapio.frutasDoMeio.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      frutasSelect.appendChild(option);
    });

    cremesTopoSelect.innerHTML = '';
    cardapio.cremeDoTopo.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      cremesTopoSelect.appendChild(option);
    });

    confetesSelect.innerHTML = '';
    cardapio.confetesDoTopo.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      confetesSelect.appendChild(option);
    });

    createMassaSelects();
  }

  quantidadeSelect.addEventListener('change', createMassaSelects);

  coposProntosSelect.addEventListener('change', () => {
    const isCopoPronto = coposProntosSelect.value !== '';
    personalizadoContainer.style.display = isCopoPronto ? 'none' : 'block';
  });

  organizarBtn.addEventListener('click', async () => {
    let itens = [];
    
    if (coposProntosSelect.value !== '') {
      itens.push(coposProntosSelect.value);
    } else {
      const massaSelects = document.querySelectorAll('.massa-select');
      const massasSelecionadas = Array.from(massaSelects).map(select => select.value);
      itens = itens.concat(massasSelecionadas);
      
      const cremesMeioSelecionados = Array.from(cremesMeioSelect.selectedOptions).map(option => option.value);
      itens = itens.concat(cremesMeioSelecionados);

      const frutasSelecionadas = Array.from(frutasSelect.selectedOptions).map(option => option.value);
      itens = itens.concat(frutasSelecionadas);

      const cremesTopoSelecionados = Array.from(cremesTopoSelect.selectedOptions).map(option => option.value);
      itens = itens.concat(cremesTopoSelecionados);

      const confetesSelecionados = Array.from(confetesSelect.selectedOptions).map(option => option.value);
      itens = itens.concat(confetesSelecionados);
    }
    
    if (itens.length === 0) {
      resultadoDiv.innerHTML = `<p class="error">Por favor, selecione os itens do pedido.</p>`;
      return;
    }

    try {
      const response = await fetch('/api/organizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itens })
      });

      const data = await response.json();
      
      if (response.ok) {
        let html = '';
        if (data.tipo === 'copo_pronto') {
          html = `<h3>Pedido de Copo Pronto: ${data.nomeCopo.toUpperCase()}</h3><ul>`;

          if (data.massas.length > 0) {
              html += `<li>🍨 **Massas:** ${data.massas.join(', ')}</li>`;
          }
          if (data.cremeDoMeio.length > 0) {
              html += `<li>🍦 **Cremes do Meio:** ${data.cremeDoMeio.join(', ')}</li>`;
          }
          if (data.frutasDoMeio.length > 0) {
              html += `<li>🍓 **Frutas do Meio:** ${data.frutasDoMeio.join(', ')}</li>`;
          }
          if (data.cremeDoTopo.length > 0) {
              html += `<li>🍦 **Cremes do Topo:** ${data.cremeDoTopo.join(', ')}</li>`;
          }
          if (data.confetesDoTopo.length > 0) {
              html += `<li>🎉 **Confetes do Topo:** ${data.confetesDoTopo.join(', ')}</li>`;
          }
          html += `</ul>`;

        } else {
          html = `<h3>Pedido Personalizado:</h3><ul>`;

          const massaSelects = document.querySelectorAll('.massa-select');
          const cremesMeioSelecionados = Array.from(cremesMeioSelect.selectedOptions).map(option => option.value);
          const frutasSelecionadas = Array.from(frutasSelect.selectedOptions).map(option => option.value);
          const cremesTopoSelecionados = Array.from(cremesTopoSelect.selectedOptions).map(option => option.value);
          const confetesSelecionados = Array.from(confetesSelect.selectedOptions).map(option => option.value);

          const camadas = [];

          if (massaSelects[0] && massaSelects[0].value) {
            camadas.push(`<li class="tipo-massa">🍨 **Massa 1:** ${massaSelects[0].value}</li>`);
          }
          
          if (cremesMeioSelecionados[0]) {
            camadas.push(`<li class="tipo-creme">🍦 **Creme do Meio:** ${cremesMeioSelecionados[0]}</li>`);
          }

          if (frutasSelecionadas.length > 0) {
            camadas.push(`<li class="tipo-fruta">🍓 **Frutas do Meio:** ${frutasSelecionadas.join(', ')}</li>`);
          }

          if (massaSelects[1] && massaSelects[1].value) {
            camadas.push(`<li class="tipo-massa">🍨 **Massa 2:** ${massaSelects[1].value}</li>`);
          }

          if (cremesMeioSelecionados[1]) {
            camadas.push(`<li class="tipo-creme">🍦 **Creme do Meio:** ${cremesMeioSelecionados[1]}</li>`);
          }

          if (massaSelects[2] && massaSelects[2].value) {
            camadas.push(`<li class="tipo-massa">🍨 **Massa 3:** ${massaSelects[2].value}</li>`);
          }

          const cremesDoTopoCompleto = cremesMeioSelecionados.slice(2).concat(cremesTopoSelecionados);
          if (cremesDoTopoCompleto.length > 0) {
              camadas.push(`<li class="tipo-creme">🍦 **Cremes do Topo:** ${cremesDoTopoCompleto.join(', ')}</li>`);
          }

          if (confetesSelecionados.length > 0) {
              camadas.push(`<li class="tipo-confete">🎉 **Confetes do Topo:** ${confetesSelecionados.join(', ')}</li>`);
          }

          html = `<h3>Pedido Personalizado:</h3><ul>` + camadas.join('') + `</ul>`;
        }
        
        resultadoDiv.innerHTML = html;

      } else {
        resultadoDiv.innerHTML = `<p class="error">Erro: ${data.error}</p>`;
      }
    } catch (error) {
      resultadoDiv.innerHTML = `<p class="error">Erro ao conectar com o servidor.</p>`;
      console.error('Erro:', error);
    }
  });

  preencherMenus();
});