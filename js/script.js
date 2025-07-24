import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import SHA256 from 'https://esm.sh/crypto-js@4.1.1/sha256'

//-----------------------------------------\\
// ---------- variáveis globais ---------- \\
//------------------------------------------\\

const bancoOfertas = []
const bancoCategorias = []
const bancoUsuarios = []
const logado = JSON.parse(localStorage.getItem('usuario')) || {}

const supabaseUrl = 'https://xfavuzpnkylbvamyhnhc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXZ1enBua3lsYnZhbXlobmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzExMDgsImV4cCI6MjA2ODkwNzEwOH0.9ZwGEngtirO4t1KcuYf8TKQrpUwCK36NYFJ6U3GR-T8'
const supabaseClient = createClient(supabaseUrl, supabaseKey);


//---------------------------------\\
// ---------- seletores ---------- \\
//---------------------------------\\

const body = document.body
const nomeUsuario = document.querySelector('#nomeUsuario')
const btnLogin = document.querySelector('#btn-login')
const areaCategorias = document.querySelector('#area-categorias .categorias')
const telaSup = document.querySelector('#tela-sup')
const telaSupAdd = telaSup.querySelector('.tela');
const cards = document.querySelector('#cards')

//-------------------------------\\
// ---------- eventos ---------- \\
//-------------------------------\\

body.addEventListener('mousedown', click => {
    const btnLogar = click.target.closest('.btn-logar')
    const cadastrarUsuario = click.target.closest('.usuarioCadastrar')
    const btnCriar = click.target.closest('.btn-criar')
    const card = click.target.closest('.card')

    if (btnLogar) {
        btnLogar.addEventListener('click', () => {
            telaLogar()
            telaSup.classList.add('show')
            document.body.classList.add('travar-scroll')
        })
    }

    if (cadastrarUsuario) {
        cadastrarUsuario.addEventListener('click', () => {
            telaCadastrarUsuario()
        })
    }

    // EVENTO DE LOGOUT
    btnLogin.addEventListener('click', e => {
        const btnSair = e.target.closest('.btn-sair')
        if (btnSair) {
            localStorage.removeItem('usuario')
            btnLogin.innerHTML = `
                <div class="btn btn-logar"><i class="bi bi-box-arrow-in-right"></i> Entrar</div>
                `
        }
    })

    if (click.target.classList.contains('cadastrarUsuarioBanco')) {
        click.preventDefault();
        cadastrarUsuarioBanco();
    }

    if (btnCriar) {
        btnCriar.addEventListener('click', () => {
            telaAddOferta()
            telaSup.classList.add('show')
            document.body.classList.add('travar-scroll')
        })
    }


    if (card) {
        const cardId = Number(card.getAttribute('idcard'))
        console.log(cardId)
        telaDescricao(cardId)
        telaSup.classList.add('show')
        document.body.classList.add('travar-scroll')
    }
})


// oculta a tela de adicionar card ao clicar fora da tela
telaSup.addEventListener('mousedown', e => {
    const btnCadastrarOferta = telaSupAdd.querySelector('.btn-cadastrar-oferta')
    if (e.target === telaSup) {
        telaSup.classList.remove('show')
        document.body.classList.remove('travar-scroll')
    }

    if (e.target === btnCadastrarOferta) {
        e.preventDefault()
        cadastrarOferta()
    }
})

// filtra por categorias
areaCategorias.addEventListener('click', e => {
    if (e.target.closest('.categoria')) {
        const idCategoria = Number(e.target.getAttribute('idcategoria'))
        carregarCards(idCategoria)
    }
})


carregarPagina()

//---------------------------------\\
// ---------- CONDIÇÕES ---------- \\
//---------------------------------\\

// Se não estiver logado logar, se estiver logado cria
if (logado.id) {
    nomeUsuario.innerHTML = `
    <div>${charMax(logado.nome, 99)}</div>`
    btnLogin.innerHTML = `
    <div class="btn btn-criar"><i class="bi bi-pencil-square"></i> Criar</div>
    <div class="btn btn-sair"><i class="bi bi-box-arrow-right"></i> Sair</div>
    `

} else {
    btnLogin.innerHTML = `
    <div class="btn btn-logar"><i class="bi bi-box-arrow-in-right"></i> Entrar</div>  `
}

//-------------------------------------\\
// ---------- Banco de dados ----------\\
//-------------------------------------\\

// CARREGA AS CATEGORIAS DO SUPABASE
async function carregarCategorias() {
    // Busca categorias na tabela 'categorias' do Supabase
    const { data: categorias, error } = await supabaseClient
        .from('categorias')
        .select('*')
        .order('id', { ascending: true })

    if (error) {
        console.error('Erro ao carregar categorias do Supabase:', error)
        return;
    }

    // Preenche o array bancoCategorias com os dados
    bancoCategorias.length = 0
    bancoCategorias.push(...categorias);
}

// CARREGA AS OFERTAS DO SUPABASE
async function carregarOfertas() {
    // Busca as ofertas na tabela 'ofertas' do Supabase
    const { data: ofertas, error } = await supabaseClient
        .from('ofertas')
        .select('*'); // busca todas as colunas

    if (error) {
        console.error('Erro ao carregar ofertas do Supabase:', error)
        return;
    }

    // Limpa o array bancoOfertas e adiciona as ofertas vindas do Supabase
    bancoOfertas.length = 0   // limpa o array existente
    bancoOfertas.push(...ofertas)

    // Atualiza a interface/visualização da página (função que você já tem)
    // carregarPagina();
}

// CARREGA OS USUARIOS DO SUPABASE

async function carregarUsuarios() {
    const { data: usuarios, error } = await supabaseClient
        .from('usuarios')
        .select('id, nome, email, senha')

    if (error) {
        console.error('Erro ao carregar ofertas do Supabase:', error)
        return;
    }

    bancoUsuarios.length = 0
    bancoUsuarios.push(...usuarios)
}



// SALVA OFERTA NO BD

async function salvarOfertaDB(novaOferta) {

    const { data, error } = await supabaseClient.from('ofertas').insert([novaOferta])

    if (error) {
        console.error('Erro ao cadastrar:', error)
    } else {
        console.log('Oferta cadastrada com sucesso:', data)
    }

    await carregarOfertas()
    carregarCards()
}

// CADASTRAR OFERTA

function cadastrarOferta() {
    const form = telaSupAdd.querySelector('form')

    const contatoInput = form.querySelector('#form-contato')
    const tipoInput = form.querySelector('#form-tipo')
    const categoriaInput = form.querySelector('#form-categoria')
    const tituloInput = form.querySelector('#form-titulo')
    const descricaoInput = form.querySelector('#form-descricao')

    let valido = true

    // Lista de campos para validar
    const campos = [contatoInput, tipoInput, categoriaInput, tituloInput, descricaoInput]

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
        criador: logado.id,
        contato: contatoInput.value.trim(),
        tipo: Number(tipoInput.value),
        categoria: Number(categoriaInput.value),
        titulo: tituloInput.value.trim(),
        descricao: descricaoInput.value.trim()
    }

    salvarOfertaDB(novaOferta)
    telaSup.classList.remove('show')
    document.body.classList.remove('travar-scroll')
}

// CADASTRAR USUARIO
async function cadastrarUsuarioBanco() {
    console.log('teste1')
    const form = telaSupAdd.querySelector('form')
    const nomeInput = form.querySelector('#form-nome')
    const emailInput = form.querySelector('#form-email')
    const senhaInput = form.querySelector('#form-senha')
    const senha2Input = form.querySelector('#form-senha2')

    const campos = [nomeInput, emailInput, senhaInput, senha2Input]
    let valido = true

    // Verifica se os campos estão preenchidos
    campos.forEach(campo => {
        if (campo.value.trim() === '') {
            campo.style.border = '2px solid red'
            valido = false
        } else {
            campo.style.border = '2px solid green'
        }
    })

    if (!valido) return

    // Verifica se as senhas coincidem
    if (senhaInput.value !== senha2Input.value) {
        senhaInput.style.border = '2px solid red'
        senha2Input.style.border = '2px solid red'
        // alert('As senhas não coincidem!')
        return
    }

    // Verifica se o e-mail é válido
    const email = emailInput.value.trim()
    if (!validarEmail(email)) {
        emailInput.style.border = '2px solid red'
        // alert('Digite um e-mail válido.')
        return
    }

    // Verifica se o e-mail já existe
    await carregarUsuarios()
    const emailJaExiste = bancoUsuarios.some(u => u.email === email)
    if (emailJaExiste) {
        emailInput.style.border = '2px solid red'
        alert('Este e-mail já está cadastrado.')
        return
    }

    // Criptografa a senha
    const senhaHash = await hashSenha(senhaInput.value)

    const novoUsuario = {
        nome: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        senha: senhaHash
    }

    // Insere no Supabase
    const { data, error } = await supabaseClient
        .from('usuarios')
        .insert([novoUsuario])
        .select('id, nome, email') // retorna os dados do usuário

    if (error) {
        console.error('Erro ao cadastrar usuário:', error)
        // alert('Erro ao cadastrar. Tente novamente.')
        return
    }

    const usuarioLogado = data[0]

    // Salva no localStorage
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado))
    logado.id = usuarioLogado.id
    logado.nome = usuarioLogado.nome
    logado.email = usuarioLogado.email

    // Atualiza botão superior
    btnLogin.innerHTML = `
    <div class="btn btn-criar"><i class="bi bi-pencil-square"></i> Criar</div>
    <div class="btn btn-sair"><i class="bi bi-box-arrow-right"></i> Sair</div>`

    // Fecha tela
    telaSup.classList.remove('show')
    document.body.classList.remove('travar-scroll')

    // alert('Cadastro realizado com sucesso!')
}




//-----------------------------------\\
// ---------- HTML E LOAD ---------- \\
//-----------------------------------\\

async function carregarPagina() {

    await carregarCategorias()
    await carregarOfertas()

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
            <div class="importar-banco">Sem dados, cadastre o primeiro card ;)</div>
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
            <div idcard="${oferta.id}" class="card">
                <div class="tags">
                    <div class="tag ${tag}">
                    ${tagTexto}
                    </div>
                    <div class="categoria" style="background: ${categoria.cor}">${categoria.nome}</div>
                </div>
                <div class="informacao">
                    <p class="titulo">${charMax(oferta.titulo, 50)}</p>
                    <p class="descricao">
                        ${charMax(oferta.descricao, 150)}
                    </p>
                </div>
                <div class="btn">Ver mais / contato</div>
            </div>
        `
    })
}

// TELA LOGAR

function telaLogar() {
    telaSupAdd.innerHTML = `
            <div class="titulo">Entrar</div>
            <form action="">
                <label for="form-email">E-Mail</label>
                <input type="text" id="form-email" name="email" placeholder="seuemail@provedor.com">
                <label for="form-senha">Senha</label>
                <input type="password" id="form-senha" name="senha">
                <div class="row">
                    <div class="row-item usuarioLogar btn-usuario-logar">Entrar</div>
                    <div class="row-item usuarioCadastrar btn-usuario-cadastrar">Cadastrar</div>
                </div>
            </form>
    `
}

// TELA CADASTRAR USUARIO

function telaCadastrarUsuario() {
    telaSupAdd.innerHTML = `
            <div class="titulo">Cadastrar</div>
            <form action="">
                <label for="form-nome">Nome</label>
                <input type="text" id="form-nome" name="nome" placeholder="Fulano Silva">
                <label for="form-email">E-Mail</label>
                <input type="text" id="form-email" name="email" placeholder="seuemail@provedor.com">
                <label for="form-senha">Senha</label>
                <input type="password" id="form-senha" name="senha">
                <label for="form-senha2">Repetir a senha</label>
                <input type="password" id="form-senha2" name="senha2">
                <div class="row">
                    <div class="row-item cadastrarUsuarioBanco btn-usuario-cadastrar">Cadastrar</div>
                </div>
            </form>
    `
}

function telaAddOferta() {
    telaSupAdd.innerHTML = `
        <div class="titulo">Adicionar oferta</div>
        <form action="">
            <label for="form-nome">Nome</label>
            <input type="text" id="form-nome" name="criador" value="${logado.nome}" readonly>
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

function telaDescricao(card) {
    card = bancoOfertas.find(oferta => oferta.id === card)
    telaSupAdd.innerHTML = `
        <div class="titulo">Detalhes</div>
        <form action="">
            <label for="form-nome"><i class="bi bi-person-fill"></i> Nome</label>
            <input type="text" id="form-nome" name="criador" value="${card.criador}" readonly>
            <label for="form-contato"><i class="bi bi-telephone-fill"></i> Contato</label>
            <input type="text" id="form-contato" name="contato" value="${card.contato}" readonly>
            <label for="form-titulo">Título da oferta</label>
            <input type="titulo" id="form-titulo" value="${card.titulo}" readonly>
            <label for="form-descricao">Descrição da oferta</label>
            <textarea class="textarea2" name="descricao" id="form-descricao">${card.descricao}</textarea>
        </form>
`
}

//-----------------------------------\\
// ---------- Ferramentas ---------- \\
//-----------------------------------\\

async function hashSenha(senha) {
    return SHA256(senha).toString()
}

function gerarID() {
    return bancoOfertas.length + 1 || 1
}

function retornaCategoria(id) {
    return bancoCategorias.find(categoria => categoria.id === id)

}

function retornaUsuario(id) {
    return bancoUsuarios.find(usuario => usuario.id === id)

}

function charMax(string, max) {
    if (string.length > max) {
        return `${string.slice(0, max)}...`;
    }
    return string;
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}
