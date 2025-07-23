// ---------- variáveis globais ---------- \\
const bancoOfertas = JSON.parse(localStorage.getItem('ofertas')) || []
const bancoCategorias = JSON.parse(localStorage.getItem('categorias')) || []

// ---------- seletores ---------- \\
const btnCriar = document.querySelectorAll('.btn-criar')
const areaCategorias = document.querySelector('#area-categorias .categorias')
const telaAdicionar = document.querySelector('#tela-adicionar')
const cards = document.querySelector('#cards')
const btnLimpar = document.querySelector('.btn-limpar')

// ---------- eventos ---------- \\

// exibe tela de adicionar card ao clicar no botão
btnCriar.forEach(btn => {
    btn.addEventListener('click', () => {
        telaAdicionar.classList.add('show')
    })
})

// oculta a tela de adicionar card ao clicar fora da tela
telaAdicionar.addEventListener('click', e => {
    e.target === telaAdicionar && telaAdicionar.classList.remove('show')
})

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

    const ofertasTemp = categoria ? bancoOfertas.filter(oferta => oferta.categoria === categoria) : bancoOfertas
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
                    <p class="titulo">${oferta.titulo}</p>
                    <p class="descricao">
                        ${oferta.descricao}
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

function salvarBanco() {
    const banco = JSON.stringify(bancoOfertas)
    localStorage.setItem('ofertas', banco)
}

function gerarID() {
    return Date.now();
}

function retornaCategoria(id) {
    return bancoCategorias.find(categoria => categoria.id === id)

}