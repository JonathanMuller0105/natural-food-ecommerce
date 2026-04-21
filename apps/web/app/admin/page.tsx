'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatDateTimeForInput = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const prevStatusMap: Record<string, string> = {
  'Pedido em produção': 'Aguardando Produção',
  'Em rota de entrega': 'Pedido em produção',
  'enviado': 'Pedido em produção',
  'Entregue': 'Em rota de entrega',
  'entregue': 'Em rota de entrega',
};

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('pedidos');

  const [catalogView, setCatalogView] = useState<'menu' | 'produtos' | 'estoque' | 'promocoes' | 'indicadores'>('menu');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusInput, setStatusInput] = useState('todos');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [productFilter, setProductFilter] = useState('todos'); 

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', promotionalPrice: '', stock: '100', image: '',
    isGlutenFree: false, isLactoseFree: false, isOrganic: false, isVegan: false
  });

  useEffect(() => {
    const sessionExpiry = localStorage.getItem('adminSessionExpiry');
    if (sessionExpiry && Date.now() < Number(sessionExpiry)) {
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('adminSessionExpiry');
    }
  }, []);

  const fetchData = () => {
    fetch('http://localhost:3333/orders').then(res => res.json()).then(data => Array.isArray(data) && setOrders(data));
    fetch('http://localhost:3333/products').then(res => res.json()).then(data => Array.isArray(data) && setProducts(data));
    setLoading(false);
  };

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Jonathan' && password === '1234') {
      setIsLoggedIn(true);
      localStorage.setItem('adminSessionExpiry', (Date.now() + 30 * 60 * 1000).toString());
    } else { alert('Credenciais Inválidas!'); }
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminSessionExpiry');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`http://localhost:3333/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    if (res.ok) fetchData();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    // Proteção contra vírgula no cadastro
    const safePrice = typeof newProduct.price === 'string' ? Number(newProduct.price.replace(',', '.')) : Number(newProduct.price);
    
    try {
      const res = await fetch('http://localhost:3333/products', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...newProduct, price: safePrice }) 
      });
      if (res.ok) {
        alert('Produto cadastrado com sucesso!');
        setNewProduct({ name: '', price: '', promotionalPrice: '', stock: '100', image: '', isGlutenFree: false, isLactoseFree: false, isOrganic: false, isVegan: false });
        setIsAddProductOpen(false);
        fetchData();
      }
    } catch (error) {}
  };

  const handleFullUpdate = async (id: string, payload: any) => {
    const res = await fetch(`http://localhost:3333/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Falha ao atualizar');
    fetchData();
  };

  // CORREÇÃO MÁGICA DA EDIÇÃO (Tratando o Preço e garantindo a resposta)
  const handleSaveEditedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Troca a vírgula pelo ponto antes de enviar para o banco
    const rawPrice = editingProduct.price.toString().replace(',', '.');
    const safePrice = Number(rawPrice);

    try {
      await handleFullUpdate(editingProduct.id, {
        name: editingProduct.name,
        price: safePrice,
        image: editingProduct.image,
        isGlutenFree: Boolean(editingProduct.isGlutenFree),
        isLactoseFree: Boolean(editingProduct.isLactoseFree),
        isOrganic: Boolean(editingProduct.isOrganic),
        isVegan: Boolean(editingProduct.isVegan),
      });
      alert('✅ Produto atualizado e salvo com sucesso!');
      setEditingProduct(null);
    } catch (error) {
      alert('❌ Erro ao atualizar o produto.');
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleFullUpdate(editingPromo.id, {
        promotionalPrice: editingPromo.promotionalPrice ? Number(editingPromo.promotionalPrice.toString().replace(',', '.')) : null,
        promoEndDate: editingPromo.promoEndDate ? new Date(editingPromo.promoEndDate) : null
      });
      alert('✅ Oferta ativada com sucesso!');
      setEditingPromo(null);
    } catch (error) {
      alert('❌ Erro ao ativar oferta.');
    }
  };

  const handleRemovePromo = async (id: string) => {
    try {
      await handleFullUpdate(id, { promotionalPrice: null, promoEndDate: null });
      alert('🗑️ Oferta removida.');
      setEditingPromo(null);
    } catch (err) {}
  };

  const handleInlineStockUpdate = async (id: string, value: string) => {
    await fetch(`http://localhost:3333/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: Number(value) }) });
    fetchData(); 
  };

  const applyFilters = () => {
    setFilterStatus(statusInput);
    setFilterStartDate(startDateInput);
    setFilterEndDate(endDateInput);
  };

  const clearFilters = () => {
    setStatusInput('todos');
    setStartDateInput('');
    setEndDateInput('');
    setFilterStatus('todos');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'todos' || order.status === filterStatus;
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);

    let matchesStartDate = true;
    let matchesEndDate = true;

    if (filterStartDate) {
      const [y, m, d] = filterStartDate.split('-');
      const start = new Date(Number(y), Number(m) - 1, Number(d));
      start.setHours(0, 0, 0, 0);
      matchesStartDate = orderDate >= start;
    }

    if (filterEndDate) {
      const [y, m, d] = filterEndDate.split('-');
      const end = new Date(Number(y), Number(m) - 1, Number(d));
      end.setHours(0, 0, 0, 0);
      matchesEndDate = orderDate <= end;
    }

    return matchesStatus && matchesStartDate && matchesEndDate;
  });

  const stats = {
    aguardando: orders.filter(o => o.status === 'Aguardando Produção' || o.status === 'aguardando').length,
    producao: orders.filter(o => o.status === 'Pedido em produção').length,
    rota: orders.filter(o => o.status === 'Em rota de entrega' || o.status === 'enviado').length,
    entregue: orders.filter(o => o.status === 'Entregue' || o.status === 'entregue').length,
  };

  const criticalStockProducts = products.filter(p => p.stock <= 10);
  const normalStockProducts = products.filter(p => p.stock > 10);

  const productSales: Record<string, number> = {};
  filteredOrders.forEach(order => {
    if (order.items) order.items.forEach((item: any) => {
      const pName = item.product?.name || 'Produto Excluído';
      productSales[pName] = (productSales[pName] || 0) + item.quantity;
    });
  });
  const chartDataProducts = Object.keys(productSales).map(key => ({ name: key, quantidade: productSales[key] })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

  const neighborhoodSales: Record<string, number> = {};
  filteredOrders.forEach(order => {
    const b = order.neighborhood || 'Não informado';
    neighborhoodSales[b] = (neighborhoodSales[b] || 0) + 1;
  });
  const chartDataNeighborhood = Object.keys(neighborhoodSales).map(key => ({ name: key, pedidos: neighborhoodSales[key] }));
  const COLORS = ['#2D5A27', '#8BC34A', '#E67E22', '#F1C40F', '#16A085'];

  const exportToExcel = () => {
    if (filteredOrders.length === 0) return alert('Nenhum dado para exportar neste filtro.');
    const dataToExport = filteredOrders.map(o => ({
      'ID do Pedido': o.id, 'Status': o.status.toUpperCase(), 'Data do Pedido': new Date(o.createdAt).toLocaleString('pt-BR'),
      'Nome do Comprador': o.customerName, 'E-mail': o.customerEmail || 'Não informado', 'Telefone': o.phone, 
      'Nota (NPS)': o.npsScore || 'Sem avaliação', 'Feedback': o.npsComment || '-', 'Total (R$)': o.total
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Filtrado");
    XLSX.writeFile(workbook, "Relatorio_Vendas_NaturalFood.xlsx");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2D5A27] p-6 relative">
        <Link href="/" className="absolute top-8 left-8 text-white font-bold hover:underline flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm transition-colors hover:bg-black/40">← Voltar à Loja</Link>
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <h2 className="text-3xl font-bold text-[#2D5A27] mb-6 text-center">Login Admin</h2>
          <input type="text" placeholder="Usuário" className="w-full p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Senha" className="w-full p-4 border rounded-xl mb-6 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-[#E67E22] text-white font-bold py-4 rounded-xl hover:bg-[#D35400] transition-colors">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div><Link href="/" className="text-gray-400 text-sm hover:underline mb-2 inline-block">← Voltar à Loja</Link><h1 className="text-3xl font-extrabold text-[#2D5A27]">Painel Administrativo</h1></div>
          <div className="flex gap-4 mt-4 md:mt-0 items-center">
            <button onClick={handleAdminLogout} className="text-red-500 font-bold text-sm hover:underline mr-2">Sair (Admin)</button>
            <button onClick={() => { setActiveTab('pedidos'); setCatalogView('menu'); }} className={`px-6 py-3 rounded-lg font-bold transition-colors ${activeTab === 'pedidos' ? 'bg-[#2D5A27] text-white' : 'bg-gray-100 text-gray-600'}`}>📦 Gestão de Pedidos</button>
            <button onClick={() => { setActiveTab('produtos'); setCatalogView('menu'); }} className={`px-6 py-3 rounded-lg font-bold transition-colors ${activeTab === 'produtos' ? 'bg-[#2D5A27] text-white' : 'bg-gray-100 text-gray-600'}`}>🥑 Catálogo & Estoque</button>
          </div>
        </div>

        {activeTab === 'pedidos' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-yellow-500"><p className="text-gray-500 font-medium text-sm">⏳ Aguardando Produção</p><h2 className="text-3xl font-bold">{stats.aguardando}</h2></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-orange-500"><p className="text-gray-500 font-medium text-sm">🧑‍🍳 Em Produção</p><h2 className="text-3xl font-bold">{stats.producao}</h2></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-500"><p className="text-gray-500 font-medium text-sm">🚚 Em Rota</p><h2 className="text-3xl font-bold">{stats.rota}</h2></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-green-500"><p className="text-gray-500 font-medium text-sm">✅ Entregues</p><h2 className="text-3xl font-bold">{stats.entregue}</h2></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">Esteira Logística Operacional</h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded">Apenas pedidos ativos</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-400"><tr><th className="p-4">Cliente / Local</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Ação na Esteira</th></tr></thead>
                  <tbody className="text-sm">
                    {orders.filter(o => o.status !== 'Entregue' && o.status !== 'entregue').map((order) => {
                      const prevStatus = prevStatusMap[order.status]; 
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <strong>{order.customerName}</strong><br/>
                            <span className="text-xs text-gray-500">{order.neighborhood}</span><br/>
                            <span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()} às {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="p-4 font-bold text-[#2D5A27]">R$ {order.total.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                              ${(order.status === 'Aguardando Produção' || order.status === 'aguardando') ? 'bg-yellow-100 text-yellow-700' : 
                                order.status === 'Pedido em produção' ? 'bg-orange-100 text-orange-700' :
                                (order.status === 'Em rota de entrega' || order.status === 'enviado') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {order.status === 'aguardando' ? 'Aguardando Produção' : order.status === 'enviado' ? 'Em rota de entrega' : order.status === 'entregue' ? 'Entregue' : order.status}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2 flex-wrap items-center">
                            {prevStatus && <button onClick={() => updateStatus(order.id, prevStatus)} className="bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors">⬅️ Voltar</button>}
                            {(order.status === 'Aguardando Produção' || order.status === 'aguardando') && <button onClick={() => updateStatus(order.id, 'Pedido em produção')} className="bg-orange-500 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-orange-600 shadow-sm">🧑‍🍳 Produzir</button>}
                            {order.status === 'Pedido em produção' && <button onClick={() => updateStatus(order.id, 'Em rota de entrega')} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-600 shadow-sm">🚚 Enviar</button>}
                            {(order.status === 'Em rota de entrega' || order.status === 'enviado') && <button onClick={() => updateStatus(order.id, 'Entregue')} className="bg-green-500 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-green-600 shadow-sm">✅ Entregue</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {orders.filter(o => o.status !== 'Entregue' && o.status !== 'entregue').length === 0 && (
                   <p className="text-center py-10 text-gray-500 font-medium">Nenhum pedido ativo na esteira no momento.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'produtos' && (
          <div className="bg-white rounded-3xl shadow-sm border p-8 min-h-[600px] relative">
            {catalogView !== 'menu' && (
              <div className="mb-6 border-b pb-4">
                <button onClick={() => setCatalogView('menu')} className="bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  ← Voltar ao Menu
                </button>
              </div>
            )}

            {catalogView === 'menu' && (
              <div>
                <h2 className="text-2xl font-bold text-center text-[#2D5A27] mb-10">O que você deseja gerenciar?</h2>
                {criticalStockProducts.length > 0 && (
                  <div className="mb-8 max-w-2xl mx-auto bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="text-red-700 font-bold">Estoque Crítico Detectado</h4>
                        <p className="text-red-600 text-sm">{criticalStockProducts.length} produto(s) com 10 unidades ou menos.</p>
                      </div>
                    </div>
                    <button onClick={() => setCatalogView('estoque')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-700">Ver Estoque</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <div onClick={() => setCatalogView('produtos')} className="bg-gray-50 border-2 border-transparent hover:border-[#8BC34A] p-8 rounded-3xl cursor-pointer transition-all hover:shadow-lg group flex flex-col items-center text-center">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">🥑</span>
                    <h3 className="text-xl font-bold text-gray-800">Editar Produtos</h3>
                    <p className="text-gray-500 text-sm mt-2">Alterar nomes, preços base, fotos e categorias.</p>
                  </div>
                  <div onClick={() => setCatalogView('estoque')} className="bg-gray-50 border-2 border-transparent hover:border-[#2D5A27] p-8 rounded-3xl cursor-pointer transition-all hover:shadow-lg group flex flex-col items-center text-center">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📦</span>
                    <h3 className="text-xl font-bold text-gray-800">Editar Estoque</h3>
                    <p className="text-gray-500 text-sm mt-2">Monitoramento e entrada/saída de produtos.</p>
                  </div>
                  <div onClick={() => setCatalogView('promocoes')} className="bg-gray-50 border-2 border-transparent hover:border-[#E67E22] p-8 rounded-3xl cursor-pointer transition-all hover:shadow-lg group flex flex-col items-center text-center">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔥</span>
                    <h3 className="text-xl font-bold text-gray-800">Editar Promoções</h3>
                    <p className="text-gray-500 text-sm mt-2">Ofertas temporárias e preços promocionais.</p>
                  </div>
                  <div onClick={() => setCatalogView('indicadores')} className="bg-gray-50 border-2 border-transparent hover:border-blue-500 p-8 rounded-3xl cursor-pointer transition-all hover:shadow-lg group flex flex-col items-center text-center">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📊</span>
                    <h3 className="text-xl font-bold text-gray-800">Indicadores & Vendas</h3>
                    <p className="text-gray-500 text-sm mt-2">Relatórios, gráficos e análise de satisfação (NPS).</p>
                  </div>
                </div>
              </div>
            )}

            {catalogView === 'produtos' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#2D5A27]">Gestão de Produtos</h2>
                    <p className="text-sm text-gray-500">Dê um duplo clique na linha para editar as informações do produto.</p>
                  </div>
                  <button onClick={() => setIsAddProductOpen(true)} className="bg-[#8BC34A] text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-[#7CB342]">➕ Novo Produto</button>
                </div>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b"><tr><th className="p-4">Produto</th><th className="p-4">Preço Base</th><th className="p-4">Tags</th></tr></thead>
                    <tbody className="text-sm">
                      {products.map(p => (
                        <tr key={p.id} onDoubleClick={() => setEditingProduct(p)} className="border-b hover:bg-gray-100 cursor-pointer transition-colors">
                          <td className="p-4 flex items-center gap-3"><img src={p.image || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-md object-cover" /><strong>{p.name}</strong></td>
                          <td className="p-4 font-bold text-gray-700">R$ {p.price.toFixed(2)}</td>
                          <td className="p-4 text-xs text-gray-400">
                            {p.isGlutenFree && <span className="mr-2">Sem Glúten</span>} {p.isLactoseFree && <span className="mr-2">Sem Lactose</span>} {p.isOrganic && <span className="mr-2">Orgânico</span>} {p.isVegan && <span>Vegano</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {catalogView === 'estoque' && (
              <div>
                <h2 className="text-2xl font-bold text-[#2D5A27] mb-2">Controle de Estoque</h2>
                <p className="text-sm text-gray-500 mb-8">Altere os números diretamente na tabela e clique fora para salvar.</p>
                {criticalStockProducts.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">⚠️ Atenção: Estoque Crítico</h3>
                    <div className="overflow-x-auto border border-red-200 rounded-xl">
                      <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-red-50 text-xs uppercase text-red-600 border-b border-red-200"><tr><th className="p-4">Produto</th><th className="p-4 w-40">Quantidade Física</th></tr></thead>
                        <tbody className="text-sm bg-white">
                          {criticalStockProducts.map(p => (
                            <tr key={p.id} className="border-b border-red-100 hover:bg-red-50 transition-colors">
                              <td className="p-4 font-bold text-gray-800">{p.name}</td>
                              <td className="p-4"><input type="number" defaultValue={p.stock} onBlur={(e) => handleInlineStockUpdate(p.id, e.target.value)} className="w-20 bg-transparent border-b border-dashed border-red-400 outline-none focus:border-red-600 text-red-600 font-black py-1 px-2" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-4">Estoque Seguro</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b"><tr><th className="p-4">Produto</th><th className="p-4 w-40">Quantidade Física</th></tr></thead>
                      <tbody className="text-sm bg-white">
                        {normalStockProducts.map(p => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-bold text-gray-700">{p.name}</td>
                            <td className="p-4"><input type="number" defaultValue={p.stock} onBlur={(e) => handleInlineStockUpdate(p.id, e.target.value)} className="w-20 bg-transparent border-b border-dashed border-gray-300 outline-none focus:border-[#2D5A27] text-[#2D5A27] font-bold py-1 px-2" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {catalogView === 'promocoes' && (
              <div>
                <h2 className="text-2xl font-bold text-[#E67E22] mb-2">Central de Ofertas</h2>
                <p className="text-sm text-gray-500 mb-8">Dê um duplo clique no produto para configurar um preço promocional com data de validade.</p>
                <div className="overflow-x-auto border border-orange-100 rounded-xl">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-orange-50 text-xs uppercase text-orange-600 border-b border-orange-100"><tr><th className="p-4">Produto</th><th className="p-4">Preço Original</th><th className="p-4">Preço Promo</th><th className="p-4">Validade da Oferta</th><th className="p-4">Status</th></tr></thead>
                    <tbody className="text-sm bg-white">
                      {products.map(p => {
                        const isPromoActive = p.promotionalPrice && p.promotionalPrice > 0 && (!p.promoEndDate || new Date(p.promoEndDate) >= new Date());
                        const isPromoExpired = p.promotionalPrice && p.promotionalPrice > 0 && p.promoEndDate && new Date(p.promoEndDate) < new Date();
                        return (
                          <tr key={p.id} onDoubleClick={() => setEditingPromo(p)} className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer transition-colors">
                            <td className="p-4 font-bold text-gray-800">{p.name}</td>
                            <td className="p-4 text-gray-500 line-through">R$ {p.price.toFixed(2)}</td>
                            <td className="p-4 font-black text-[#E67E22]">{p.promotionalPrice ? `R$ ${p.promotionalPrice.toFixed(2)}` : '-'}</td>
                            <td className="p-4 text-xs text-gray-500">{p.promoEndDate ? new Date(p.promoEndDate).toLocaleString('pt-BR') : '-'}</td>
                            <td className="p-4">
                              {isPromoActive ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Ativa na Loja</span> : 
                               isPromoExpired ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Expirada</span> : 
                               <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">Sem Promoção</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {catalogView === 'indicadores' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Relatórios & Performance</h2>
                  <button onClick={exportToExcel} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 flex items-center gap-2">📊 Baixar Excel ({filteredOrders.length})</button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">STATUS DO PEDIDO</label>
                    <select className="p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-400" value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
                      <option value="todos">Todos</option>
                      <option value="Entregue">Entregues</option>
                      <option value="Aguardando Produção">Aguardando Produção</option>
                      <option value="Pedido em produção">Pedido em produção</option>
                      <option value="Em rota de entrega">Em rota de entrega</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">DATA INICIAL</label>
                    <input type="date" className="p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-400" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">DATA FINAL</label>
                    <input type="date" className="p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-400" value={endDateInput} onChange={(e) => setEndDateInput(e.target.value)} />
                  </div>
                  
                  <button onClick={applyFilters} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                    🔍 Filtrar
                  </button>

                  {(statusInput !== 'todos' || startDateInput !== '' || endDateInput !== '' || filterStatus !== 'todos' || filterStartDate !== '' || filterEndDate !== '') && (
                    <button onClick={clearFilters} className="mb-3 text-sm text-red-500 hover:text-red-700 font-bold underline transition-colors">Limpar Filtros</button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-lg font-bold text-gray-800 mb-6">Receita por Produto</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartDataProducts}><XAxis dataKey="name" tick={{ fontSize: 10 }}/><YAxis/><Tooltip cursor={{ fill: '#f3f4f6' }}/><Bar dataKey="quantidade" fill="#3B82F6" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div></div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-lg font-bold text-gray-800 mb-6">Mapa de Vendas</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartDataNeighborhood} dataKey="pedidos" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{chartDataNeighborhood.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Análise de Satisfação (NPS) e Histórico</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl mb-10">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b"><tr><th className="p-4">Cliente / Pedido</th><th className="p-4">Data</th><th className="p-4">Status</th><th className="p-4">Avaliação (NPS)</th><th className="p-4">Ação</th></tr></thead>
                    <tbody className="text-sm bg-white">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-4"><strong>{order.customerName}</strong><br/><span className="text-xs text-gray-400">{order.customerEmail}</span></td>
                          <td className="p-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'Entregue' || order.status === 'entregue' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{order.status}</span></td>
                          <td className="p-4">
                            {order.npsScore ? (
                              <div>
                                <span className="text-yellow-500 font-bold text-sm">{"⭐".repeat(order.npsScore)}</span>
                                {order.npsComment && <p className="text-[10px] text-gray-500 italic mt-1 w-48 truncate">"{order.npsComment}"</p>}
                              </div>
                            ) : ( <span className="text-xs text-gray-300">Sem avaliação</span> )}
                          </td>
                          <td className="p-4">
                            {order.npsScore && order.npsScore <= 3 ? (
                              <a href={`https://wa.me/55${order.phone.replace(/\D/g, '')}?text=Olá ${order.customerName}, vimos que sua experiência não foi ideal. Como podemos ajudar?`} target="_blank" rel="noopener noreferrer" className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-100 transition-colors inline-block">💬 Contatar</a>
                            ) : order.npsScore && order.npsScore >= 4 ? (
                              <span className="text-green-500 text-xs font-bold px-2">Satisfeito 😊</span>
                            ) : ( <span className="text-gray-300 text-xs px-2">-</span> )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrders.length === 0 && (
                     <p className="text-center py-10 text-gray-500 font-medium">Nenhum pedido encontrado para o período/status selecionado.</p>
                  )}
                </div>
              </div>
            )}

            {/* Modais... */}
            {isAddProductOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
                  <button onClick={() => setIsAddProductOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl">X</button>
                  <h2 className="text-2xl font-bold text-[#2D5A27] mb-6">Novo Produto</h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div><label className="text-xs font-bold text-gray-500">Nome do Produto</label><input required type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500">Preço (R$)</label><input required type="number" step="0.01" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}/></div>
                      <div><label className="text-xs font-bold text-gray-500">Estoque Inicial</label><input required type="number" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})}/></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500">Link da Imagem (URL)</label><input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" placeholder="https://..." value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})}/></div>
                    <div className="pt-2">
                      <label className="text-xs font-bold text-gray-500 mb-2 block">Restrições (Tags)</label>
                      <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4 rounded-xl border">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={newProduct.isGlutenFree} onChange={e => setNewProduct({...newProduct, isGlutenFree: e.target.checked})} /> Sem Glúten</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={newProduct.isLactoseFree} onChange={e => setNewProduct({...newProduct, isLactoseFree: e.target.checked})} /> Sem Lactose</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={newProduct.isOrganic} onChange={e => setNewProduct({...newProduct, isOrganic: e.target.checked})} /> Orgânico</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={newProduct.isVegan} onChange={e => setNewProduct({...newProduct, isVegan: e.target.checked})} /> Vegano</label>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#8BC34A] text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-[#7CB342]">Salvar Produto</button>
                  </form>
                </div>
              </div>
            )}

            {editingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
                  <button onClick={() => setEditingProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl">X</button>
                  <h2 className="text-2xl font-bold text-[#2D5A27] mb-6 flex items-center gap-2">✏️ Editar {editingProduct.name}</h2>
                  <form onSubmit={handleSaveEditedProduct} className="space-y-4">
                    <div><label className="text-xs font-bold text-gray-500">Nome do Produto</label><input required type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}/></div>
                    <div><label className="text-xs font-bold text-gray-500">Preço Base (R$)</label><input required type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}/></div>
                    <div><label className="text-xs font-bold text-gray-500">Link da Imagem (URL)</label><input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={editingProduct.image || ''} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}/></div>
                    <div className="pt-2">
                      <label className="text-xs font-bold text-gray-500 mb-2 block">Restrições (Tags)</label>
                      <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4 rounded-xl border">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editingProduct.isGlutenFree} onChange={e => setEditingProduct({...editingProduct, isGlutenFree: e.target.checked})} /> Sem Glúten</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editingProduct.isLactoseFree} onChange={e => setEditingProduct({...editingProduct, isLactoseFree: e.target.checked})} /> Sem Lactose</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editingProduct.isOrganic} onChange={e => setEditingProduct({...editingProduct, isOrganic: e.target.checked})} /> Orgânico</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editingProduct.isVegan} onChange={e => setEditingProduct({...editingProduct, isVegan: e.target.checked})} /> Vegano</label>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 bg-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-300">Cancelar</button>
                      <button type="submit" className="w-1/2 bg-[#2D5A27] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#1E3F1A]">Salvar Alterações</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {editingPromo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border-t-8 border-[#E67E22]">
                  <button onClick={() => setEditingPromo(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl">X</button>
                  <h2 className="text-2xl font-bold text-[#E67E22] mb-1">🔥 Oferta</h2>
                  <p className="text-gray-500 font-bold mb-6">{editingPromo.name} (Base: R$ {Number(editingPromo.price).toFixed(2)})</p>
                  <form onSubmit={handleSavePromo} className="space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Novo Preço Promocional (R$)</label><input required type="text" className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-[#E67E22] font-bold text-[#E67E22]" value={editingPromo.promotionalPrice || ''} onChange={e => setEditingPromo({...editingPromo, promotionalPrice: e.target.value})}/></div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">A promoção acaba em:</label>
                      <input required type="datetime-local" className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-[#E67E22] bg-gray-50" value={formatDateTimeForInput(editingPromo.promoEndDate)} onChange={e => setEditingPromo({...editingPromo, promoEndDate: e.target.value})}/>
                      <p className="text-xs text-gray-400 mt-2">O produto voltará ao preço normal automaticamente após essa data.</p>
                    </div>
                    <div className="flex flex-col gap-2 pt-4">
                      <button type="submit" className="w-full bg-[#E67E22] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#D35400]">Ativar Oferta</button>
                      {editingPromo.promotionalPrice && (
                        <button type="button" onClick={() => handleRemovePromo(editingPromo.id)} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-100">Excluir Oferta e Voltar Normal</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}