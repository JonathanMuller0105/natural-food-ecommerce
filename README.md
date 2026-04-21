🍃 Natural FOOD - Plataforma de E-commerce & Gestão Logística
Uma plataforma E-commerce End-to-End desenvolvida para produtos saudáveis e naturais. O projeto contempla desde a experiência fluida do cliente (Vitrine, Carrinho e Checkout) até a gestão completa do negócio (Painel Administrativo, Esteira Logística de Produção, Gestão de Estoque e NPS).

💻 Sobre o Projeto
O Natural FOOD foi construído com foco em Alta Conversão (UX/UI) e Regras de Negócio Sólidas. A plataforma separa as responsabilidades entre Front-end e Back-end, simulando um ambiente corporativo real. O grande diferencial é a visão administrativa, que não apenas cadastra produtos, mas gerencia todo o ciclo de vida do pedido.

✨ Principais Funcionalidades
Experiência do Cliente (B2C):

🛒 Carrinho Inteligente: Controle de estado global para adição e remoção de itens.
💳 Checkout Otimizado: Autocompletar de endereços via API externa (ViaCEP).
👤 Área Logada: Painel para acompanhamento de status do pedido em tempo real.
⭐ Feedback e NPS: Sistema de avaliação de qualidade de entrega pós-compra.
Gestão Administrativa (B2B):

📊 Dashboard Analítico: Gráficos interativos com receita por produto e mapa de vendas.
🏭 Esteira Logística (Kanban): Funil de operação de pedidos (Aguardando Produção > Em Produção > Em Rota > Entregue).
🥑 Hub de Catálogo: Atualização em tempo real de preços, estoque físico e tags nutricionais.
🔥 Motor de Promoções: Agendamento de ofertas com data de validade automática.
📑 Exportação de Dados: Geração de relatórios financeiros detalhados em Excel (.xlsx).
🛠️ Tecnologias Utilizadas
Front-end: React, Next.js, Tailwind CSS, Recharts
Back-end: Node.js, NestJS
Banco de Dados: PostgreSQL (Neon DB)
Integrações: ViaCEP API
🚀 Como rodar localmente
Clone este repositório.
Instale as dependências com npm install.
Crie um arquivo .env na raiz da API usando o .env.example como base e insira sua URL do PostgreSQL.
Rode as migrações com npx prisma db push.
Inicie o ambiente de desenvolvimento com npm run dev.
Desenvolvido com foco em escalabilidade, segurança e experiência do usuário.
