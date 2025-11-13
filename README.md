# 📚 Quiz de Funções de Linguagem - PIBID

Sistema de avaliação interativo e gamificado para ensino de Funções de Linguagem baseado na teoria de Roman Jakobson.

## ✨ Características

### Para os Estudantes:
- ✅ **Interface moderna e animada** com transições suaves
- ✅ **Múltiplos tipos de questões**:
  - Múltipla escolha
  - Verdadeiro ou Falso
  - Arrastar e soltar (drag & drop)
- ✅ **Sem feedback imediato** - O aluno não sabe se acertou ou errou
- ✅ **Timer automático** - Registra o tempo de cada questão
- ✅ **Proteção contra cópia** - Bloqueia tentativas de cola
- ✅ **Uma tentativa por aluno** - Sistema de bloqueio por e-mail
- ✅ **Questões baseadas em ENEM e vestibulares**

### Para o Professor:
- ✅ **Painel administrativo completo**
- ✅ **Cálculo automático de pontuação** (0 a 3,0 pontos)
- ✅ **Estatísticas em tempo real**:
  - Total de alunos
  - Média geral da turma
  - Maior e menor nota
- ✅ **Ranking automático** por desempenho
- ✅ **Exportação para CSV**
- ✅ **Impressão de relatórios**
- ✅ **Visualização detalhada** por aluno:
  - Nome completo
  - E-mail institucional
  - Pontuação final
  - Percentual de acerto
  - Número de questões corretas
  - Tempo total gasto
  - Data/hora da submissão

## 🚀 Como Usar

### 1. Iniciar o Backend (Servidor)

```bash
cd quiz-funcoes-linguagem
python3 app.py
```

O servidor iniciará na porta **5000**. Você verá:
```
=== Quiz Backend Avaliativo Iniciado ===
Token do professor: professor123
* Running on http://127.0.0.1:5000
```

### 2. Iniciar o Frontend (Interface)

Em outro terminal:

```bash
cd quiz-funcoes-linguagem
python3 -m http.server 8080
```

### 3. Acessar o Quiz

**Para Estudantes:**
- Abra o navegador em: `http://localhost:8080/index.html`
- Digite nome completo e e-mail institucional
- Siga o tutorial interativo
- Responda as 15 questões

**Para o Professor:**
- Abra o navegador em: `http://localhost:8080/professor.html`
- Digite o token: `professor123`
- Clique em "Ver Resultados"

## 📊 Sistema de Pontuação

- **Total de questões:** 15
- **Pontuação máxima:** 3,0 pontos
- **Valor por questão:** 0,2 pontos (3,0 ÷ 15)
- **Cálculo automático:** O sistema soma apenas as questões corretas
- **Arredondamento:** 2 casas decimais

### Exemplo:
- Aluno acertou 12 de 15 questões
- Pontuação: 12 × 0,2 = **2,40 pontos**
- Percentual: (2,40 ÷ 3,0) × 100 = **80%**

## 🔐 Segurança

### Proteção do Quiz:
- ✅ Bloqueio de cópia (Ctrl+C desabilitado)
- ✅ Bloqueio de menu contextual (botão direito)
- ✅ Uma tentativa por e-mail (localStorage + backend)
- ✅ Validação de e-mail obrigatória
- ✅ Impossível refazer após conclusão

### Proteção do Painel do Professor:
- ✅ Token de acesso obrigatório
- ✅ Validação no backend
- ✅ Token padrão: `professor123`

**⚠️ IMPORTANTE:** Altere o token padrão no arquivo `app.py`:

```python
TOKEN = os.environ.get('ADMIN_TOKEN', 'SEU_TOKEN_SEGURO')
```

Ou defina a variável de ambiente:

```bash
export ADMIN_TOKEN="meu_token_super_secreto"
```

## 📁 Estrutura de Arquivos

```
quiz-funcoes-linguagem/
├── index.html              # Interface do quiz (estudantes)
├── professor.html          # Painel do professor
├── app.js                  # Lógica do quiz (frontend)
├── styles.css              # Estilos e animações
├── questions.json          # Banco de questões
├── app.py                  # Backend Flask (API)
├── requirements.txt        # Dependências Python
├── config.json             # Configurações gerais
├── results.csv             # Resultados salvos (gerado automaticamente)
├── students.json           # Alunos que completaram (gerado automaticamente)
└── README.md               # Este arquivo
```

## 🎯 Questões Incluídas

O quiz contém **15 questões** baseadas no documento PIBID:

1. **Unifesp 2002** - Função emotiva e conativa (Gonçalves Dias e Castro Alves)
2. **ENEM 2014** - Função fática (diálogo telefônico)
3. **Insper 2012** - Função metalinguística (Tristan Tzara) - **ARRASTAR**
4. **ENEM 2010** - Função referencial (biosfera)
5. Função conativa (texto publicitário) - **ARRASTAR**
6. **ENEM 2020** - Função conativa (campanha eleitoral)
7. Função emotiva (Cora Coralina)
8. Função fática (Drummond - diálogo telefônico)
9. Função referencial (Perder a tramontana)
10. Função emotiva (verbete de aniversário) - **ARRASTAR**
11-15. **Verdadeiro ou Falso** sobre todas as funções

## 🛠️ Tecnologias Utilizadas

### Frontend:
- HTML5
- CSS3 (animações e transições)
- JavaScript (ES6+)
- Drag & Drop API

### Backend:
- Python 3.11
- Flask 2.3.3
- Flask-CORS 4.0.0
- CSV (armazenamento)

## 📈 Funcionalidades do Painel do Professor

### Cards de Estatísticas:
- **Total de Alunos:** Quantos fizeram o quiz
- **Média Geral:** Média aritmética das notas
- **Maior Nota:** Melhor desempenho
- **Menor Nota:** Pior desempenho

### Tabela de Resultados:
- Ranking automático (do maior para o menor)
- Cores indicativas:
  - 🟢 Verde: ≥ 70% (nota alta)
  - 🟡 Amarelo: 50-69% (nota média)
  - 🔴 Vermelho: < 50% (nota baixa)

### Botões de Ação:
- **📥 Exportar CSV:** Baixa planilha com todos os dados
- **🖨️ Imprimir Relatório:** Abre diálogo de impressão
- **🗑️ Limpar Tela:** Reseta a visualização

## 🔧 Solução de Problemas

### Backend não inicia:
```bash
# Reinstale as dependências
pip3 install --upgrade -r requirements.txt

# Ou use sudo
sudo pip3 install -r requirements.txt
```

### Erro de CORS:
- Verifique se o Flask-CORS está instalado
- Confirme que o backend está rodando na porta 5000

### Questões não carregam:
- Verifique se o arquivo `questions.json` existe
- Confirme que o formato JSON está correto

### Resultados não aparecem no painel:
- Verifique se o token está correto
- Confirme que o backend está rodando
- Verifique se há dados em `results.csv`

## 📝 Personalização

### Alterar número de questões:
1. Edite `questions.json`
2. Ajuste `total_score` no mesmo arquivo
3. Atualize `TOTAL_QUESTOES` em `professor.html` (linha 244)

### Alterar pontuação máxima:
1. Edite `total_score` em `questions.json`
2. Atualize `TOTAL_SCORE` em `app.py` (linha 20)
3. Atualize `PONTUACAO_MAXIMA` em `professor.html` (linha 245)

### Adicionar novas questões:
Edite `questions.json` seguindo o formato:

```json
{
  "id": "q_nova",
  "type": "multiple_choice",
  "question": "Texto da questão",
  "context": "Contexto adicional (opcional)",
  "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "correct_answer": "Opção A"
}
```

**Tipos disponíveis:**
- `multiple_choice` - Múltipla escolha
- `true_false` - Verdadeiro ou Falso
- `drag_drop` - Arrastar e soltar

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o arquivo `backend.log`
2. Verifique o console do navegador (F12)
3. Consulte a documentação do Flask

## 📄 Licença

Desenvolvido para o PIBID - Programa Institucional de Bolsas de Iniciação à Docência.

---

**Versão:** 3.0  
**Última atualização:** Novembro 2025  
**Desenvolvido por:** Equipe PIBID - Funções de Linguagem
