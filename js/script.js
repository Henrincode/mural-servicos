// ---------- variáveis globais ---------- \\
const bancoOfertas = JSON.parse(localStorage.getItem('ofertas')) || []
const bancoCategorias = JSON.parse(localStorage.getItem('categorias')) || []

// ---------- seletores ---------- \\
const btnCriar = document.querySelectorAll('.btn-criar')
const areaCategorias = document.querySelector('#area-categorias .categorias')
const telaSup = document.querySelector('#tela-sup')
const telaSupAdd = telaSup.querySelector('.tela');
const cards = document.querySelector('#cards')
const btnLimpar = document.querySelector('.btn-limpar')

// ---------- eventos ---------- \\

// exibe tela de adicionar card ao clicar no botão
btnCriar.forEach(btn => {
    btn.addEventListener('click', () => {
        telaAddOferta()
        telaSup.classList.add('show')
    })
})

// oculta a tela de adicionar card ao clicar fora da tela
telaSup.addEventListener('mousedown', e => {
    const btnCadastrarOferta = telaSupAdd.querySelector('.btn-cadastrar-oferta')
    e.target === telaSup && telaSup.classList.remove('show')

    if (e.target === btnCadastrarOferta) {
        e.preventDefault()
        cadastrarOferta()
    }
})

function cadastrarOferta() {
    const form = telaSupAdd.querySelector('form')

    const nomeInput = form.querySelector('#form-nome')
    const contatoInput = form.querySelector('#form-contato')
    const tipoInput = form.querySelector('#form-tipo')
    const categoriaInput = form.querySelector('#form-categoria')
    const tituloInput = form.querySelector('#form-titulo')
    const descricaoInput = form.querySelector('#form-descricao')

    let valido = true

    // Lista de campos para validar
    const campos = [nomeInput, contatoInput, tipoInput, categoriaInput, tituloInput, descricaoInput]

    campos.forEach(campo => {
        if (campo.value.trim() === '') {
            campo.style.border = '2px solid red'
            valido = false;
        } else {
            campo.style.border = '2px solid green'
        }
    });

    if (!valido) return; // Se algum campo estiver vazio, não salva

    // Se todos os campos estiverem preenchidos
    const novaOferta = {
        id: gerarID(),
        nome: nomeInput.value.trim(),
        contato: contatoInput.value.trim(),
        tipo: Number(tipoInput.value),
        categoria: Number(categoriaInput.value),
        titulo: tituloInput.value.trim(),
        descricao: descricaoInput.value.trim()
    };

    bancoOfertas.push(novaOferta);
    salvarBanco();
    telaSup.classList.remove('show');
    carregarCards();
}


// filtra por categorias

areaCategorias.addEventListener('click', e => {
    if (e.target.closest('.categoria')) {
        const idCategoria = Number(e.target.getAttribute('idcategoria'))
        carregarCards(idCategoria)
    }
})

// se estiver sem dados pode clicar no botão para importar exemplos
cards.addEventListener('click', e => {

    e.target.closest('.importar-banco') && carregarExemplos()
})

// botão para limpar banco de dados
btnLimpar.addEventListener('click', () => {
    bancoOfertas.length = 0
    bancoCategorias.length = 0
    localStorage.clear()
    carregarPagina()
})


carregarPagina()

// ---------- funções ---------- \\
async function carregarPagina() {

    if (!bancoCategorias.length) {
        const responseCategorias = await fetch('./data/categorias.json')
        const temp = await responseCategorias.json()
        bancoCategorias.push(...temp)
        localStorage.setItem('categorias', JSON.stringify(bancoCategorias))
    }

    // carrega área de categorias
    areaCategorias.innerHTML = ''
    bancoCategorias.forEach(categoria => {
        areaCategorias.innerHTML += `
        <div idcategoria="${categoria.id}" class="categoria"
        style="background: ${categoria.cor}">${categoria.nome}</div>
        `
    })

    // carrega cards
    carregarCards()

}

function carregarCards(categoria = 0) {

    if (!bancoOfertas.length) {
        cards.innerHTML = `
            <div class="importar-banco"> Importar exemplo </div>
            `
        return
    }

    let ofertasTemp = categoria ? bancoOfertas.filter(oferta => oferta.categoria === categoria) : bancoOfertas
    ofertasTemp = ofertasTemp.sort((a, b) => b.id - a.id)

    cards.innerHTML = ''
    ofertasTemp.forEach(oferta => {

        const tag = oferta.tipo ? 'procurando' : 'oferecendo'
        const tagTexto = oferta.tipo ? '🔍 Procurando' : '🛠️ Oferecendo'
        const categoria = retornaCategoria(oferta.categoria)
        // const classCategoria =
        cards.innerHTML += `
            <div class="card">
                <div class="tags">
                    <div class="tag ${tag}">
                    ${tagTexto}
                    </div>
                    <div class="categoria" style="background: ${categoria.cor}">${categoria.nome}</div>
                </div>
                <div class="informacao">
                    <p class="titulo">${charMax(oferta.titulo, 50)}</p>
                    <p class="descricao">
                        ${charMax(oferta.descricao, 180)}
                    </p>
                </div>
                <div class="btn">Ver mais / contato</div>
            </div>
        `
    })
}

async function carregarExemplos() {
    const responseOfertas = await fetch('./data/ofertas.json')
    const temp = await responseOfertas.json()
    bancoOfertas.push(...temp)
    salvarBanco()
    carregarPagina()
}

function telaAddOferta() {
    telaSupAdd.innerHTML = `
        <div class="titulo">Adicionar oferta</div>
        <form action="">
            <label for="form-nome">Nome</label>
            <input type="text" id="form-nome" name="criador" placeholder="Fulano da Silva">
            <label for="form-contato">Contato</label>
            <input type="text" id="form-contato" name="contato" placeholder="@instagram / 19 988884444">
            <div class="row">
                <div class="row-item">
                    <label for="form-form-tipo">Tipo da oferta</label>
                    <select name="tipo" id="form-tipo">
                        <option value="0">Oferecendo</option>
                        <option value="1">Procurando</option>
                    </select>
                </div>
                <div class="row-item">
                    <label for="form-categoria">Categoria</label>
                    <select name="categoria" id="form-categoria">
                        ${bancoCategorias
            .filter(c => c.id !== 0)
            .map(c => `<option value="${c.id}">${c.nome}</option>`)
            .join('')}
                    </select>
                </div>
            </div>
            <label for="form-titulo">Título da oferta</label>
            <input type="titulo" id="form-titulo" placeholder="Vendo / Procuro alguma coisa">
            <label for="form-descricao">Descrição da oferta</label>
            <textarea name="descricao" id="form-descricao"></textarea>
            <div class="btn-cadastrar-oferta">Cadastrar oferta</div>
        </form>
`
}

function salvarBanco() {
    const banco = JSON.stringify(bancoOfertas)
    localStorage.setItem('ofertas', banco)
}

function gerarID() {
    return bancoOfertas.length + 1 || 1
}

function retornaCategoria(id) {
    return bancoCategorias.find(categoria => categoria.id === id)

}

function charMax(string, max) {
    if (string.length > max) {
        return `${string.slice(0, max)}...`;
    }
    return string;
}