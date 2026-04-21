'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import { useCart } from './context/CartContext';
import Link from 'next/link';

interface Product {
  id: string; name: string; price: number; promotionalPrice?: number; promoEndDate?: string;
  isGlutenFree: boolean; isLactoseFree: boolean; isOrganic: boolean; isVegan: boolean; image: string;
}

export default function HomePage() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal } = useCart();
  
  const [activeFilter, setActiveFilter] = useState('todos');
  const [products, setProducts] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<'welcome' | 'login' | 'register'>('welcome'); 
  const [isEditingProfile, setIsEditingProfile] = useState(false); 
  const [loggedCustomer, setLoggedCustomer] = useState<any>(null); 
  const [userOrders, setUserOrders] = useState<any[]>([]); 
  
  const [npsOrder, setNpsOrder] = useState<any>(null);
  const [npsScore, setNpsScore] = useState<number>(5);
  const [npsComment, setNpsComment] = useState<string>('');

  const [customerForm, setCustomerForm] = useState({ 
    name: '', email: '', password: '', phone: '', zipCode: '', 
    state: '', city: '', address: '', number: '', neighborhood: '' 
  });

  const filters = [
    { id: 'todos', label: 'Todos', icon: '🍃' }, { id: 'gluten', label: 'Sem Glúten', icon: '🚫' },
    { id: 'lactose', label: 'Sem Lactose', icon: '🥛' }, { id: 'organico', label: 'Orgânicos', icon: '🥑' },
  ];

  useEffect(() => {
    fetch('http://localhost:3333/products').then(res => res.json()).then(data => setProducts(data));
    const savedCustomer = localStorage.getItem('naturalFoodCustomer');
    if (savedCustomer) setLoggedCustomer(JSON.parse(savedCustomer));
  }, []);

  const refreshOrders = () => {
    if (loggedCustomer?.email) {
      fetch(`http://localhost:3333/orders/customer/${loggedCustomer.email}`)
        .then(res => res.json())
        .then(data => setUserOrders(data))
        .catch(err => console.error("Erro ao buscar pedidos", err));
    }
  };

  useEffect(() => {
    if (isAuthOpen) refreshOrders();
  }, [loggedCustomer, isAuthOpen]);

  // A CORREÇÃO: Garante que ofertas expiradas sejam tratadas como inexistentes
  const isActivePromo = (p: Product) => {
    if (!p.promotionalPrice || p.promotionalPrice <= 0) return false;
    if (!p.promoEndDate) return true; 
    return new Date(p.promoEndDate) >= new Date();
  };

  const promotionalProducts = products.filter(isActivePromo);
  const filteredProducts = products.filter(p => activeFilter === 'todos' || (activeFilter === 'gluten' && p.isGlutenFree) || (activeFilter === 'lactose' && p.isLactoseFree) || (activeFilter === 'organico' && p.isOrganic));

  const buildTags = (product: Product) => {
    const tags = [];
    if (product.isGlutenFree) tags.push('Sem Glúten');
    if (product.isLactoseFree) tags.push('Sem Lactose');
    if (product.isOrganic) tags.push('Orgânico');
    if (product.isVegan) tags.push('Vegano');
    return tags;
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    const priceToUse = isActivePromo(product) ? product.promotionalPrice! : product.price;
    addToCart({ ...product, price: priceToUse }, quantity);
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) setCustomerForm({ ...customerForm, zipCode: cep, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf });
      } catch (err) {}
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3333/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerForm) });
      if (res.ok) { 
        setLoggedCustomer(customerForm);
        localStorage.setItem('naturalFoodCustomer', JSON.stringify(customerForm));
        setIsAuthOpen(false); 
      }
    } catch (err) {}
  };

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const existingData = localStorage.getItem('naturalFoodCustomer');
    let customerDataToLogin = null;
    if (existingData) {
      const parsedData = JSON.parse(existingData);
      if (parsedData.email === customerForm.email) customerDataToLogin = parsedData;
    }
    if (!customerDataToLogin) {
      const rawName = customerForm.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
      const formattedName = rawName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      customerDataToLogin = { name: formattedName || 'Visitante', email: customerForm.email, phone: '(11) 99999-9999', address: 'Avenida Paulista', number: '1000', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zipCode: '01310-100' };
    }
    setLoggedCustomer(customerDataToLogin);
    localStorage.setItem('naturalFoodCustomer', JSON.stringify(customerDataToLogin));
    setIsAuthOpen(false);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedCustomer(customerForm);
    localStorage.setItem('naturalFoodCustomer', JSON.stringify(customerForm));
    setIsEditingProfile(false);
    alert('✅ Seus dados foram atualizados com sucesso!');
  };

  const handleLogout = () => {
    setLoggedCustomer(null);
    setUserOrders([]);
    localStorage.removeItem('naturalFoodCustomer');
    setIsAuthOpen(false);
  };

  const openEditMode = () => {
    setCustomerForm(loggedCustomer);
    setIsEditingProfile(true);
  };

  const submitNps = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3333/orders/${npsOrder.id}/nps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npsScore, npsComment })
      });
      alert('Obrigado pela sua avaliação! 💚');
      setNpsOrder(null);
      refreshOrders(); 
    } catch (err) {
      alert('Erro ao enviar avaliação.');
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-12 relative">
      <div className="fixed top-0 left-0 w-full p-6 z-40 flex justify-between items-center pointer-events-none">
        <Link href="/" className="pointer-events-auto text-2xl md:text-3xl font-black text-[#2D5A27] tracking-tighter bg-white/90 px-6 py-2 rounded-2xl backdrop-blur-sm shadow-md hover:scale-105 transition-transform">Natural FOOD</Link>
        <div className="flex gap-4">
          <Link href="/admin" className="pointer-events-auto bg-white/90 backdrop-blur text-[#2D5A27] w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-gray-100"><span className="text-2xl">⚙️</span></Link>
          <button onClick={() => { setIsAuthOpen(true); setAuthStep('welcome'); setIsEditingProfile(false); setNpsOrder(null); }} className="pointer-events-auto bg-white/90 backdrop-blur text-[#2D5A27] w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-gray-100"><span className="text-2xl">👤</span></button>
        </div>
      </div>

      <button onClick={() => setIsCartOpen(true)} className="fixed top-24 right-6 z-40 bg-[#E67E22] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-white">
        <span className="text-2xl">🛒</span>
        {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">{totalItems}</span>}
      </button>

      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-in">
            <button onClick={() => { setIsAuthOpen(false); setIsEditingProfile(false); setNpsOrder(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl">X</button>
            
            {loggedCustomer ? (
              npsOrder ? (
                <div className="text-center py-6">
                  <h2 className="text-3xl font-black text-[#2D5A27] mb-2">Avaliar Entrega 📦</h2>
                  <p className="text-gray-500 mb-8">O que você achou do seu pedido do dia {new Date(npsOrder.createdAt).toLocaleDateString()}?</p>
                  <form onSubmit={submitNps} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4">Dê sua nota (1 a 5):</label>
                      <div className="flex justify-center gap-2 text-4xl cursor-pointer">
                        {[1, 2, 3, 4, 5].map(num => (
                          <span key={num} onClick={() => setNpsScore(num)} className={num <= npsScore ? "text-yellow-500" : "text-gray-200"}>★</span>
                        ))}
                      </div>
                    </div>
                    <textarea placeholder="Deixe um comentário (Opcional)..." className="w-full p-4 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A] h-28 resize-none" value={npsComment} onChange={e => setNpsComment(e.target.value)}></textarea>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setNpsOrder(null)} className="w-1/2 bg-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-300">Voltar</button>
                      <button type="submit" className="w-1/2 bg-[#E67E22] text-white font-bold py-3 rounded-xl hover:bg-[#D35400] shadow-lg">Enviar Avaliação</button>
                    </div>
                  </form>
                </div>
              ) : isEditingProfile ? (
                <div>
                  <h2 className="text-2xl font-bold text-[#2D5A27] mb-6 text-center">Editar Dados ✏️</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <input required type="text" placeholder="Nome Completo" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                    <input required type="text" placeholder="Telefone" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4"><input required type="text" placeholder="CEP" className="w-full p-3 border rounded-xl border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white" value={customerForm.zipCode} onChange={e => setCustomerForm({...customerForm, zipCode: e.target.value})} onBlur={handleCepBlur} /><input required type="text" placeholder="Estado (UF)" className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" value={customerForm.state} readOnly /></div>
                    <input required type="text" placeholder="Cidade" className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" value={customerForm.city} readOnly />
                    <input required type="text" placeholder="Endereço (Rua)" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4"><input required type="text" placeholder="Bairro" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.neighborhood} onChange={e => setCustomerForm({...customerForm, neighborhood: e.target.value})} /><input required type="text" placeholder="Número" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.number} onChange={e => setCustomerForm({...customerForm, number: e.target.value})} /></div>
                    <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsEditingProfile(false)} className="w-1/2 bg-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors">Cancelar</button><button type="submit" className="w-1/2 bg-[#2D5A27] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#1E3F1A] transition-colors">Salvar</button></div>
                  </form>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-black text-[#2D5A27] mb-6 text-center">Olá, {loggedCustomer.name.split(' ')[0]} 🍃</h2>
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">📦 Meus Pedidos</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {userOrders.length === 0 ? (
                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-dashed">Você ainda não realizou nenhum pedido conosco.</p>
                      ) : (
                        userOrders.map((order: any) => {
                          const isDelivered = order.status.toLowerCase() === 'entregue';
                          return (
                            <div key={order.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center w-full">
                                <div>
                                  <p className="text-xs text-gray-400 font-bold mb-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                  <p className="font-extrabold text-[#2D5A27]">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border
                                    ${(order.status === 'Aguardando Produção' || order.status === 'aguardando') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                      order.status === 'Pedido em produção' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      (order.status === 'Em rota de entrega' || order.status === 'enviado') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                    {order.status === 'aguardando' ? 'Aguardando Produção' : order.status === 'enviado' ? 'Em rota de entrega' : order.status === 'entregue' ? 'Entregue' : order.status}
                                  </span>
                                </div>
                              </div>
                              {isDelivered && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                  {order.npsScore ? (
                                    <span className="text-xs font-bold text-gray-500">Sua Avaliação: <span className="text-yellow-500">{"★".repeat(order.npsScore)}</span></span>
                                  ) : (
                                    <button onClick={() => { setNpsOrder(order); setNpsScore(5); setNpsComment(''); }} className="text-xs font-bold bg-[#E67E22] text-white px-3 py-1 rounded-md hover:bg-[#D35400] transition-colors">⭐ Avaliar Pedido</button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-600 bg-gray-50 p-6 rounded-2xl border border-gray-100 relative">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Endereço Principal</p>
                      <button onClick={openEditMode} className="text-[#E67E22] font-bold text-sm hover:underline">✏️ Editar</button>
                    </div>
                    <p className="text-lg font-medium text-gray-800">{loggedCustomer.address}, {loggedCustomer.number}</p>
                    <p className="text-sm">{loggedCustomer.neighborhood} - {loggedCustomer.city} / {loggedCustomer.state}</p>
                    <p className="text-sm">CEP: {loggedCustomer.zipCode}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl mt-6 hover:bg-red-100 transition-colors border border-red-100">Sair da minha conta</button>
                </div>
              )
            ) : authStep === 'welcome' ? (
              <div className="text-center px-4 py-6">
                <div className="text-6xl mb-6 animate-bounce">🍃</div>
                <h2 className="text-3xl font-black text-[#2D5A27] mb-3 tracking-tight">Bem-vindo à Natural FOOD!</h2>
                <p className="text-gray-500 mb-10 text-sm md:text-base leading-relaxed">Faça parte do nosso clube de vida saudável e tenha acesso a um menu completo de produtos, para atender a sua dieta.</p>
                <div className="flex flex-col gap-4">
                  <button onClick={() => setAuthStep('register')} className="w-full bg-[#E67E22] text-white font-extrabold py-4 rounded-xl shadow-lg hover:bg-[#D35400] transition-colors text-lg">Quero me Cadastrar</button>
                  <button onClick={() => setAuthStep('login')} className="w-full bg-white text-[#2D5A27] border-2 border-[#2D5A27] font-extrabold py-4 rounded-xl shadow-sm hover:bg-green-50 transition-colors text-lg">Já sou do Clube (Entrar)</button>
                </div>
              </div>
            ) : authStep === 'login' ? (
              <div>
                <h2 className="text-2xl font-bold text-[#2D5A27] mb-6 text-center">Bem-vindo de volta! 🍃</h2>
                <form onSubmit={handleCustomerLogin} className="space-y-4">
                  <input required type="email" placeholder="Seu E-mail" className="w-full p-4 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                  <input required type="password" placeholder="Sua Senha" className="w-full p-4 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" />
                  <button type="submit" className="w-full bg-[#E67E22] text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-[#D35400] transition-colors">Entrar na Conta</button>
                </form>
                <p className="text-center mt-6 text-sm text-gray-500">Ainda não tem conta? <button type="button" onClick={() => setAuthStep('register')} className="text-[#2D5A27] font-bold hover:underline">Cadastre-se aqui</button></p>
                <button type="button" onClick={() => setAuthStep('welcome')} className="block mx-auto mt-4 text-xs text-gray-400 hover:underline">← Voltar</button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-[#2D5A27] mb-6 text-center">Junte-se ao Clube 🍃</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <input required type="text" placeholder="Nome Completo" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4"><input required type="email" placeholder="E-mail fictício" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={e => setCustomerForm({...customerForm, email: e.target.value})} /><input required type="password" placeholder="Senha" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" /></div>
                  <div className="grid grid-cols-2 gap-4"><input required type="text" placeholder="CEP (Autocompleta)" className="w-full p-3 border rounded-xl border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white" value={customerForm.zipCode} onChange={e => setCustomerForm({...customerForm, zipCode: e.target.value})} onBlur={handleCepBlur} /><input required type="text" placeholder="Estado (UF)" className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" value={customerForm.state} readOnly /></div>
                  <input required type="text" placeholder="Cidade" className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" value={customerForm.city} readOnly />
                  <input required type="text" placeholder="Endereço (Rua)" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4"><input required type="text" placeholder="Bairro" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={customerForm.neighborhood} onChange={e => setCustomerForm({...customerForm, neighborhood: e.target.value})} /><input required type="text" placeholder="Número" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={e => setCustomerForm({...customerForm, number: e.target.value})} /></div>
                  <input required type="text" placeholder="Telefone" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                  <button type="submit" className="w-full bg-[#E67E22] text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-[#D35400] transition-colors">Criar Conta</button>
                </form>
                <p className="text-center mt-6 text-sm text-gray-500">Já possui uma conta? <button type="button" onClick={() => setIsLoginMode(true)} className="text-[#2D5A27] font-bold hover:underline">Faça login aqui</button></p>
                <button type="button" onClick={() => setAuthStep('welcome')} className="block mx-auto mt-4 text-xs text-gray-400 hover:underline">← Voltar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="w-full max-w-md bg-white h-full relative z-10 flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-[#2D5A27] text-white"><h2 className="text-2xl font-bold">Sua Sacola 🛍️</h2><button onClick={() => setIsCartOpen(false)} className="text-white hover:text-gray-300 font-bold">X</button></div>
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (<p className="text-center text-gray-500 mt-10">Sua sacola está vazia.</p>) : (
                cart.map((item) => {
                  const itemPrice = Number(item.price ?? item.product?.price ?? 0);
                  return (
                    <div key={item.product.id} className="flex gap-4 border-b pb-4">
                      <img src={item.product.image || ''} className="w-20 h-20 object-cover rounded-lg" />
                      <div className="flex flex-col flex-grow">
                        <h4 className="font-bold text-gray-800">{item.product.name}</h4>
                        <p className="text-[#2D5A27] font-extrabold mb-2">R$ {itemPrice.toFixed(2).replace('.', ',')}</p>
                        <div className="flex justify-between items-center mt-auto">
                          <div className="flex items-center bg-gray-100 rounded-md"><button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 font-bold">-</button><span className="w-6 text-center text-sm font-medium">{item.quantity}</span><button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 font-bold">+</button></div>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 text-sm">Remover</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between mb-4 text-xl"><span className="font-bold text-gray-600">Total:</span><span className="font-extrabold text-[#2D5A27]">R$ {cartTotal.toFixed(2).replace('.', ',')}</span></div>
                <button onClick={() => router.push('/checkout')} className="w-full bg-[#8BC34A] hover:bg-[#7CB342] transition-colors text-white font-bold py-4 rounded-xl shadow-lg">Finalizar Compra</button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="relative pt-32 pb-20 px-6 md:px-16 rounded-b-[3rem] shadow-2xl overflow-hidden flex flex-col justify-center items-start text-left mt-4">
        <div className="absolute inset-0 z-0 bg-[#2D5A27]"><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1920&auto=format&fit=crop" alt="Fundo" className="w-full h-full object-cover opacity-40 mix-blend-overlay" /></div>
        <div className="relative z-10 max-w-3xl mt-8"><span className="bg-[#E67E22] text-white text-xs md:text-sm font-bold px-4 py-2 rounded-full uppercase tracking-wider mb-6 inline-block shadow-md">Novidade: Linha Sem Glúten</span><h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">Alimentação inteligente para uma vida saudável.</h1></div>
      </header>

      {promotionalProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mt-12 mb-8">
          <div className="flex items-center gap-4 mb-6"><h2 className="text-3xl font-black text-red-600 uppercase tracking-tight flex items-center gap-2">🔥 Ofertas Imperdíveis</h2><div className="h-1 flex-grow bg-gradient-to-r from-red-500 to-transparent rounded-full"></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {promotionalProducts.map((product) => (
              // AQUI MORA A CORREÇÃO (Passamos a validação de data direto para o Card)
              <ProductCard 
                key={product.id} 
                id={product.id} 
                name={product.name} 
                price={product.price.toString()} 
                promotionalPrice={isActivePromo(product) ? product.promotionalPrice?.toString() : undefined} 
                tags={buildTags(product)} 
                image={product.image} 
                onAddToCart={(qty) => handleAddToCart(product, qty)} 
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex justify-start md:justify-center gap-3 p-6 relative z-20 overflow-x-auto snap-x mt-8">{filters.map((f) => (<button key={f.id} onClick={() => setActiveFilter(f.id)} className={`snap-center shrink-0 px-6 py-3 rounded-full font-medium transition-all shadow-md flex items-center gap-2 ${activeFilter === f.id ? 'bg-[#2D5A27] text-white ring-4 ring-[#2D5A27]/30' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><span className="text-xl">{f.icon}</span> {f.label}</button>))}</section>

      <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 mt-8">
        {filteredProducts.length === 0 ? (<p className="text-center text-gray-500 col-span-full mt-8 font-medium">Nenhum produto encontrado nesta categoria.</p>) : (
          filteredProducts.map((product) => (
            // AQUI MORA A CORREÇÃO (Passamos a validação de data direto para o Card)
            <ProductCard 
              key={product.id} 
              id={product.id} 
              name={product.name} 
              price={product.price.toString()} 
              promotionalPrice={isActivePromo(product) ? product.promotionalPrice?.toString() : undefined} 
              tags={buildTags(product)} 
              image={product.image} 
              onAddToCart={(qty) => handleAddToCart(product, qty)} 
            />
          ))
        )}
      </section>

      <footer className="mt-20 bg-[#2D5A27] text-white rounded-t-[2rem] shadow-2xl pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div><h4 className="text-2xl font-bold mb-4 text-[#E8F5E9]">Natural Food</h4><ul className="space-y-3 text-[#C8E6C9] font-light"><li className="hover:text-white cursor-pointer transition-colors">Quem somos</li><li className="hover:text-white cursor-pointer transition-colors">Seja um representante</li><li className="hover:text-white cursor-pointer transition-colors">Rastreie o seu pedido</li></ul></div>
          <div><h4 className="text-2xl font-bold mb-4 text-[#E8F5E9]">Atendimento</h4><p className="text-[#C8E6C9] font-light leading-relaxed mb-3">Segunda à Sexta das 10:00 às 12:00 e das 13:30 às 19:00<br />exceto feriados</p><p className="text-white font-bold text-lg">Telefone: (00) 0000-0000</p></div>
          <div><h4 className="text-2xl font-bold mb-4 text-[#E8F5E9]">Redes Sociais</h4><div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-[#E67E22] transition-colors"><span className="text-xl">📷</span></div><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-[#E67E22] transition-colors"><span className="text-xl">👍</span></div><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-[#E67E22] transition-colors"><span className="text-xl">▶️</span></div></div></div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/20 pt-8 text-center text-[#C8E6C9] text-sm font-light">&copy; {new Date().getFullYear()} Natural Food. Todos os direitos reservados.</div>
      </footer>
    </main>
  );
}